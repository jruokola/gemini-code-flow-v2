/**
 * Gemini Code Flow Orchestrator
 * Adapted from Claude Code Flow by ruvnet
 */

import { EventEmitter } from "events";
import {
  Agent,
  AgentMode,
  AgentStatus,
  Task,
  OrchestratorConfig,
} from "../types";
import { GeminiCLIClient, GeminiCLIResult } from "./gemini-cli-client";
import { MemoryManager } from "./memory-manager";
import { TaskQueue } from "./task-queue";
import { Logger } from "../utils/logger";

export class Orchestrator extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private geminiClient: GeminiCLIClient;
  private memoryManager: MemoryManager;
  private taskQueue: TaskQueue;
  private config: OrchestratorConfig;
  private logger: Logger;
  private isRunning: boolean = false;
  private maxConcurrentAgents: number;

  constructor(config: OrchestratorConfig) {
    super();
    this.config = config;
    this.maxConcurrentAgents = config.maxAgents || 10;
    this.logger = new Logger("Orchestrator");

    // Initialize components - CLI mode with YOLO enabled by default
    this.geminiClient = new GeminiCLIClient({
      model: config.model || "gemini-2.5-pro",
      debug: config.debug || false,
      allFiles: true,
      yolo: config.yolo !== false, // Default true, false only with explicit config
      checkpointing: true,
      workingDirectory: config.workingDirectory || process.cwd(),
    });

    this.memoryManager = new MemoryManager(config.memoryPath);
    this.taskQueue = new TaskQueue();
  }

  /**
   * Start the orchestrator
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error("Orchestrator is already running");
    }

    this.logger.minimal("Starting Gemini Code Flow Orchestrator...");

    // Initialize components
    await this.memoryManager.initialize();
    await this.checkGeminiHealth();

    this.isRunning = true;
    this.emit("started");

    // Start task processing loop
    this.processTaskQueue();
  }

  /**
   * Stop the orchestrator
   */
  async stop(): Promise<void> {
    this.logger.minimal("Stopping orchestrator...");
    this.isRunning = false;

    // Wait for all agents to complete
    await this.waitForAgentsToComplete();

    // Save state
    await this.memoryManager.flush();

    this.emit("stopped");
  }

  /**
   * Add a task to the queue
   */
  async addTask(task: Task): Promise<void> {
    this.taskQueue.add(task);
    this.emit("taskAdded", task);

    // Wake up the processor if idle
    if (this.isRunning) {
      this.processTaskQueue();
    }
  }

  /**
   * Process tasks from the queue with intelligent parallel execution
   */
  private async processTaskQueue(): Promise<void> {
    while (this.isRunning) {
      const activeAgents = Array.from(this.agents.values()).filter(
        (agent) => agent.status === "running",
      ).length;

      const pendingTasks = this.taskQueue.size();

      // Show status every few seconds
      this.logger.info(
        `Queue status: ${activeAgents} active agents, ${pendingTasks} pending tasks`,
      );

      // Get all available tasks that can run in parallel
      const availableTasks = await this.getParallelizableTasks();

      if (availableTasks.length === 0) {
        if (activeAgents === 0 && pendingTasks === 0) {
          this.logger.info(
            "No more tasks and no active agents - workflow complete",
          );
          break;
        }
        // No tasks available, wait
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      // Start multiple tasks in parallel up to the limit
      const tasksToStart = availableTasks.slice(
        0,
        this.maxConcurrentAgents - activeAgents,
      );

      if (tasksToStart.length > 1) {
        console.log(
          `\n🚀 PARALLEL EXECUTION: Starting ${tasksToStart.length} agents simultaneously`,
        );
        console.log(
          `   Modes: ${tasksToStart.map((t) => t.mode.toUpperCase()).join(", ")}`,
        );
      }

      // Start all selected tasks
      for (const task of tasksToStart) {
        console.log(`\n${"=".repeat(100)}`);
        console.log(
          `🚀 STARTING ${task.mode.toUpperCase()} AGENT ${tasksToStart.length > 1 ? "(PARALLEL)" : ""}`,
        );
        console.log(`📋 Task: ${task.description}`);
        console.log(`⚡ Priority: ${task.priority}`);
        console.log(`🔗 Dependencies: ${task.dependencies.length} tasks`);
        console.log(
          `🔄 Parallelizable: ${this.isParallelizable(task) ? "Yes" : "No"}`,
        );
        console.log(`${"=".repeat(100)}`);

        // Start task without waiting (parallel execution)
        this.spawnAgent(task).catch((error) => {
          console.error(`Error in parallel task ${task.mode}:`, error);
        });
      }

      // Brief pause before checking for more tasks
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  /**
   * Spawn an agent to handle a task
   */
  private async spawnAgent(task: Task): Promise<void> {
    const agent: Agent = {
      id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      mode: task.mode,
      status: "running",
      task: task.description,
      startTime: new Date(),
    };

    this.agents.set(agent.id, agent);
    this.emit("agentSpawned", agent);

    try {
      this.logger.verbose(
        `🔄 ${task.mode.toUpperCase()} AGENT: Analyzing requirements...`,
      );

      // Get context from memory
      const context = await this.memoryManager.getContext(task.mode);
      this.logger.debug(
        `📚 ${task.mode.toUpperCase()} AGENT: Loaded ${context.length} context entries`,
      );

      // Build prompt with SPARC methodology
      const prompt = this.buildSparcPrompt(task, context);
      this.logger.debug(
        `📝 ${task.mode.toUpperCase()} AGENT: Built SPARC-compliant prompt`,
      );

      // Execute with Gemini CLI
      this.logger.verbose(
        `🧠 ${task.mode.toUpperCase()} AGENT: Processing with Gemini CLI...`,
      );
      const cliResult: GeminiCLIResult = await this.geminiClient.execute(
        prompt,
        task.mode,
      );

      if (!cliResult.success) {
        throw new Error(cliResult.error || "Gemini CLI execution failed");
      }

      const result = cliResult.output;

      // Store result in memory
      await this.memoryManager.store({
        agentId: agent.id,
        type: "result",
        content: {
          output: result,
          filesCreated: cliResult.filesCreated,
          filesModified: cliResult.filesModified,
          duration: cliResult.duration,
        },
        tags: [task.mode, "completed"],
      });

      // Update agent status
      agent.status = "completed";
      agent.result = result;
      agent.endTime = new Date();

      // Check for task delegation from any agent
      await this.processDelegationRequests(task, result, agent);

      // If this was an orchestrator agent, create follow-up tasks
      if (task.mode === "orchestrator") {
        await this.createFollowUpTasks(task, result);
      }

      this.logger.verbose(
        `✅ ${task.mode.toUpperCase()} AGENT: Completed successfully!`,
      );

      // Log file operations
      if (cliResult.filesCreated.length > 0) {
        this.logger.info(
          `📁 Created ${cliResult.filesCreated.length} files: ${cliResult.filesCreated.join(", ")}`,
        );
      }
      if (cliResult.filesModified.length > 0) {
        this.logger.info(
          `📝 Modified ${cliResult.filesModified.length} files: ${cliResult.filesModified.join(", ")}`,
        );
      }

      // Display full agent output with enhanced formatting
      this.logger.debug(`\n${"=".repeat(100)}`);
      this.logger.debug(`🤖 ${task.mode.toUpperCase()} AGENT COMPLETE OUTPUT`);
      this.logger.debug(`📋 Task: ${task.description.substring(0, 80)}...`);
      this.logger.debug(
        `⏱️  Duration: ${Date.now() - agent.startTime.getTime()}ms`,
      );
      this.logger.debug(`${"=".repeat(100)}`);
      this.logger.debug(result);
      this.logger.debug(`${"=".repeat(100)}`);
      this.logger.debug(`✅ END OF ${task.mode.toUpperCase()} AGENT OUTPUT\n`);

      this.emit("agentCompleted", agent);
    } catch (error) {
      this.logger.error(`Agent ${agent.id} failed:`, error);

      agent.status = "failed";
      agent.error = error instanceof Error ? error.message : "Unknown error";
      agent.endTime = new Date();

      // Store error in memory
      await this.memoryManager.store({
        agentId: agent.id,
        type: "error",
        content: error instanceof Error ? error.message : "Unknown error",
        tags: [task.mode, "failed"],
      });

      this.emit("agentFailed", agent);
    }

    // Mark task as complete
    task.status = agent.status;
    this.emit("taskCompleted", task);
  }

  /**
   * Process delegation requests from agent outputs
   */
  private async processDelegationRequests(
    task: Task,
    result: string,
    agent: Agent,
  ): Promise<void> {
    // Parse agent output for delegation requests
    const delegationRequests = this.parseDelegationRequests(result);

    // Auto-create follow-up tasks based on agent type and output analysis
    const autoTasks = this.generateAutoTasks(task, result, agent);

    const allRequests = [...delegationRequests, ...autoTasks];

    if (allRequests.length > 0) {
      this.logger.verbose(
        `🔄 ${task.mode.toUpperCase()} AGENT: Found ${allRequests.length} delegation requests`,
      );

      for (const request of allRequests) {
        await this.createDelegatedTask(request, task, agent);
      }
    }
  }

  /**
   * Parse delegation requests from agent output
   */
  private parseDelegationRequests(result: string): DelegationRequest[] {
    const requests: DelegationRequest[] = [];

    // Enhanced delegation patterns for CLI output
    const delegationPatterns = [
      /DELEGATE_TO:\s*(\w+)\s*[-:]\s*(.+?)(?=DELEGATE_TO:|REQUEST_|NEEDS_|$)/gs,
      /REQUEST_AGENT:\s*(\w+)\s*[-:]\s*(.+?)(?=DELEGATE_TO:|REQUEST_|NEEDS_|$)/gs,
      /NEEDS_REVIEW:\s*(\w+)\s*[-:]\s*(.+?)(?=DELEGATE_TO:|REQUEST_|NEEDS_|$)/gs,
      /ITERATE_WITH:\s*(\w+)\s*[-:]\s*(.+?)(?=DELEGATE_TO:|REQUEST_|NEEDS_|$)/gs,
      /NEXT_STEP:\s*(\w+)\s*[-:]\s*(.+?)(?=NEXT_STEP:|DELEGATE_|REQUEST_|$)/gs,
      /TODO:\s*(\w+)\s*[-:]\s*(.+?)(?=TODO:|DELEGATE_|REQUEST_|$)/gs,
    ];

    for (const pattern of delegationPatterns) {
      let match;
      while ((match = pattern.exec(result)) !== null) {
        const targetAgent = match[1].toLowerCase();
        const taskDescription = match[2].trim();

        // Validate target agent mode
        if (this.isValidAgentMode(targetAgent)) {
          requests.push({
            targetMode: targetAgent as AgentMode,
            description: taskDescription,
            priority: "medium",
            delegationType: this.getDelegationType(pattern.source),
          });
        }
      }
    }

    return requests;
  }

  /**
   * Generate automatic follow-up tasks based on agent output and file operations
   */
  private generateAutoTasks(
    task: Task,
    result: string,
    agent: Agent,
  ): DelegationRequest[] {
    const autoTasks: DelegationRequest[] = [];

    // Get file operations from CLI result if available
    const fileOps = this.extractFileOperations(result);

    // Generate follow-up tasks based on agent type and what was accomplished
    switch (task.mode) {
      case "architect":
        // After architecture, need implementation
        if (fileOps.created.length > 0) {
          autoTasks.push({
            targetMode: "coder",
            description: `Implement functionality for created files: ${fileOps.created.slice(0, 3).join(", ")}`,
            priority: "high",
            delegationType: "delegation",
          });
        }
        // After architecture, need tests
        if (
          result.includes("component") ||
          result.includes("module") ||
          result.includes("service")
        ) {
          autoTasks.push({
            targetMode: "tester",
            description:
              "Create test structure and initial test cases for new architecture",
            priority: "medium",
            delegationType: "delegation",
          });
        }
        break;

      case "coder":
        // After coding, need tests
        if (
          fileOps.created.some(
            (f) => f.endsWith(".js") || f.endsWith(".ts") || f.endsWith(".py"),
          )
        ) {
          autoTasks.push({
            targetMode: "tester",
            description: `Create unit tests for implemented code: ${fileOps.created
              .filter((f) => f.includes("src") || f.includes("lib"))
              .slice(0, 2)
              .join(", ")}`,
            priority: "high",
            delegationType: "delegation",
          });
        }
        // After coding, need security review
        if (
          result.includes("auth") ||
          result.includes("password") ||
          result.includes("token") ||
          result.includes("security")
        ) {
          autoTasks.push({
            targetMode: "security",
            description:
              "Review security implementation in authentication/authorization code",
            priority: "high",
            delegationType: "review",
          });
        }
        // After API creation, need documentation
        if (
          result.includes("api") ||
          result.includes("endpoint") ||
          result.includes("route")
        ) {
          autoTasks.push({
            targetMode: "documentation",
            description: "Document API endpoints and usage examples",
            priority: "medium",
            delegationType: "delegation",
          });
        }
        break;

      case "tester":
        // After tests, need security review if security-related
        if (
          result.includes("auth") ||
          result.includes("security") ||
          result.includes("validation")
        ) {
          autoTasks.push({
            targetMode: "security",
            description:
              "Review test coverage for security-critical functionality",
            priority: "medium",
            delegationType: "review",
          });
        }
        break;

      case "security":
        // After security review, might need code fixes
        if (
          result.includes("vulnerability") ||
          result.includes("issue") ||
          result.includes("risk")
        ) {
          autoTasks.push({
            targetMode: "coder",
            description: "Fix security issues identified in security review",
            priority: "high",
            delegationType: "iteration",
          });
        }
        break;

      case "orchestrator":
        // Orchestrator creates the main workflow - this is handled separately
        break;

      default:
        // For other agents, check for common patterns
        if (fileOps.created.length > 0 && !task.mode.includes("test")) {
          // If files were created and it's not a test agent, suggest testing
          autoTasks.push({
            targetMode: "tester",
            description: `Add tests for newly created functionality: ${fileOps.created.slice(0, 2).join(", ")}`,
            priority: "medium",
            delegationType: "delegation",
          });
        }
        break;
    }

    // Global checks across all agent types

    // If package.json was modified, suggest dependency security check
    if (
      fileOps.modified.includes("package.json") ||
      fileOps.created.includes("package.json")
    ) {
      autoTasks.push({
        targetMode: "security",
        description: "Review new dependencies for security vulnerabilities",
        priority: "medium",
        delegationType: "review",
      });
    }

    // If config files were created, suggest documentation
    if (
      fileOps.created.some(
        (f) =>
          f.includes("config") ||
          f.endsWith(".env") ||
          f.endsWith(".yml") ||
          f.endsWith(".yaml"),
      )
    ) {
      autoTasks.push({
        targetMode: "documentation",
        description: "Document configuration options and setup instructions",
        priority: "low",
        delegationType: "delegation",
      });
    }

    // If database-related files, suggest database agent
    if (
      result.includes("database") ||
      result.includes("schema") ||
      result.includes("migration")
    ) {
      autoTasks.push({
        targetMode: "database",
        description: "Review and optimize database schema and queries",
        priority: "medium",
        delegationType: "review",
      });
    }

    this.logger.debug(
      `Generated ${autoTasks.length} automatic follow-up tasks for ${task.mode}`,
    );

    return autoTasks;
  }

  /**
   * Extract file operations from CLI output
   */
  private extractFileOperations(result: string): {
    created: string[];
    modified: string[];
  } {
    const created: string[] = [];
    const modified: string[] = [];

    // Parse CLI output for file operations
    const lines = result.split("\n");

    for (const line of lines) {
      // Common patterns for file creation
      if (
        line.includes("Created") ||
        line.includes("Writing") ||
        line.includes("Creating")
      ) {
        const fileMatch = line.match(
          /(?:Created|Writing|Creating)\s+[\w\s]*?(\S+\.\w+)/,
        );
        if (fileMatch && fileMatch[1]) {
          created.push(fileMatch[1]);
        }
      }

      // Common patterns for file modification
      if (
        line.includes("Modified") ||
        line.includes("Updating") ||
        line.includes("Changed")
      ) {
        const fileMatch = line.match(
          /(?:Modified|Updating|Changed)\s+[\w\s]*?(\S+\.\w+)/,
        );
        if (fileMatch && fileMatch[1]) {
          modified.push(fileMatch[1]);
        }
      }

      // File paths in output (often indicate operations)
      const pathMatch = line.match(
        /^\s*([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+\s*$/,
      );
      if (pathMatch) {
        // If it's just a file path mentioned, assume it was worked on
        modified.push(pathMatch[0].trim());
      }
    }

    return {
      created: [...new Set(created)], // Remove duplicates
      modified: [...new Set(modified)],
    };
  }

  /**
   * Create a delegated task from agent request
   */
  private async createDelegatedTask(
    request: DelegationRequest,
    task: Task,
    agent: Agent,
  ): Promise<void> {
    const delegatedTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: `${request.description} (Delegated by ${task.mode})`,
      mode: request.targetMode,
      priority: request.priority,
      dependencies: [task.id], // Depend on the delegating task
      status: "pending",
      createdAt: new Date(),
      delegatedBy: agent.id,
      delegationType: request.delegationType,
    };

    this.taskQueue.add(delegatedTask);
    this.emit("taskAdded", delegatedTask);

    this.logger.delegation(agent.mode, request.targetMode, request.description);
    this.logger.debug(`   Task: ${request.description}`);
    this.logger.debug(`   Type: ${request.delegationType}`);

    // Store delegation in memory for context
    await this.memoryManager.store({
      agentId: agent.id,
      type: "delegation",
      content: {
        delegatedTo: request.targetMode,
        taskDescription: request.description,
        delegationType: request.delegationType,
      },
      tags: [task.mode, request.targetMode, "delegation"],
    });
  }

  /**
   * Check if agent mode is valid
   */
  private isValidAgentMode(mode: string): boolean {
    const validModes = [
      "architect",
      "coder",
      "tester",
      "debugger",
      "security",
      "documentation",
      "integrator",
      "monitor",
      "optimizer",
      "ask",
      "devops",
      "tutorial",
      "database",
      "specification",
      "mcp",
      "orchestrator",
      "designer",
      "product",
      "qa",
      "reviewer",
      "research",
      "cloud",
      "sre",
      "ai",
      "ux",
      "mobile",
      "api",
      "performance",
      "release",
    ];
    return validModes.includes(mode);
  }

  /**
   * Get delegation type from pattern
   */
  private getDelegationType(pattern: string): DelegationType {
    if (pattern.includes("DELEGATE_TO")) return "delegation";
    if (pattern.includes("REQUEST_AGENT")) return "request";
    if (pattern.includes("NEEDS_REVIEW")) return "review";
    if (pattern.includes("ITERATE_WITH")) return "iteration";
    return "delegation";
  }

  /**
   * Build SPARC-compliant prompt
   */
  private buildSparcPrompt(task: Task, context: any[]): string {
    const modePrompts = this.getSparcModePrompts();
    const basePrompt = modePrompts[task.mode] || modePrompts.default;

    // Add delegation information if this task was delegated
    const delegationContext = task.delegatedBy
      ? `
## Delegation Context
This task was delegated by another agent. Previous work and context should be considered.
Delegation Type: ${task.delegationType || "standard"}
`
      : "";

    return `
${basePrompt}

## Task Description
${task.description}

## Context from Previous Agents
${context.map((c) => `- ${c.type}: ${c.summary}`).join("\n")}

${delegationContext}

## Expected Deliverables
Please provide your response following the SPARC methodology:
1. Specification: Define what needs to be done
2. Pseudocode: Outline the approach
3. Architecture: Design the solution
4. Refinement: Iterate and improve
5. Completion: Deliver the final result

## Agent Delegation Instructions
If you need other agents to work on specific aspects, use these formats:
- DELEGATE_TO: [agent_mode] - [specific task description]
- REQUEST_AGENT: [agent_mode] - [request for additional work]
- NEEDS_REVIEW: [agent_mode] - [request for review/feedback]
- ITERATE_WITH: [agent_mode] - [request for iterative improvement]

Valid agent modes: architect, coder, tester, debugger, security, documentation, integrator, monitor, optimizer, ask, devops, tutorial, database, specification, mcp, designer, product, qa, reviewer, research, cloud, sre, ai, ux, mobile, api, performance, release

Remember to be thorough, systematic, and consider edge cases.
`;
  }

  /**
   * Get SPARC mode-specific prompts
   */
  private getSparcModePrompts(): Record<string, string> {
    return {
      architect: `You are an expert system architect. Design scalable, maintainable solutions using best practices and design patterns.`,
      coder: `You are an expert programmer. Write clean, efficient, and well-documented code following best practices.`,
      tester: `You are a testing specialist. Create comprehensive test cases and implement test-driven development practices.`,
      debugger: `You are a debugging expert. Identify and fix issues systematically, considering root causes and edge cases.`,
      security: `You are a security specialist. Identify vulnerabilities and implement secure coding practices.`,
      documentation: `You are a technical writer. Create clear, comprehensive documentation for developers and users.`,
      default: `You are an AI assistant following the SPARC methodology for systematic development.`,
    };
  }

  /**
   * Check if task dependencies are met
   */
  private async areDependenciesMet(task: Task): Promise<boolean> {
    for (const depId of task.dependencies) {
      const depTask = this.taskQueue.getById(depId);
      if (!depTask || depTask.status !== "completed") {
        return false;
      }
    }
    return true;
  }

  /**
   * Get tasks that can run in parallel
   */
  private async getParallelizableTasks(): Promise<Task[]> {
    const allTasks = this.taskQueue
      .getAllTasks()
      .filter((t) => t.status === "pending");
    const availableTasks: Task[] = [];
    const runningModes = Array.from(this.agents.values())
      .filter((a) => a.status === "running")
      .map((a) => a.mode);

    for (const task of allTasks) {
      // Check if dependencies are met
      if (!(await this.areDependenciesMet(task))) {
        continue;
      }

      // Check if this task type can run in parallel with currently running tasks
      if (await this.canRunInParallel(task.mode, runningModes)) {
        availableTasks.push(task);
      }
    }

    // Sort by priority and parallelizability
    return availableTasks.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];

      if (priorityDiff !== 0) return priorityDiff;

      // Prefer parallelizable tasks
      const aParallel = this.isParallelizable(a) ? 1 : 0;
      const bParallel = this.isParallelizable(b) ? 1 : 0;
      return bParallel - aParallel;
    });
  }

  /**
   * Check if a task can run in parallel with other running tasks
   */
  private canRunInParallel(
    taskMode: AgentMode,
    runningModes: AgentMode[],
  ): Promise<boolean> {
    // Sequential tasks that should not run in parallel
    const sequentialTasks = ["orchestrator"];

    if (sequentialTasks.includes(taskMode)) {
      return Promise.resolve(runningModes.length === 0);
    }

    // Tasks that conflict with each other (should not run simultaneously)
    const conflictGroups = [
      ["coder", "integrator"], // Code modification conflicts
      ["architect", "designer"], // Design coordination needed
    ];

    for (const group of conflictGroups) {
      if (group.includes(taskMode)) {
        const hasConflict = runningModes.some(
          (mode) => group.includes(mode) && mode !== taskMode,
        );
        if (hasConflict) return Promise.resolve(false);
      }
    }

    // Independent tasks that can always run in parallel
    const independentTasks = [
      "documentation",
      "tutorial",
      "specification",
      "ask",
      "security",
      "monitor",
      "optimizer",
      "devops",
      "qa",
      "reviewer",
      "research",
      "ux",
      "performance",
      "release",
    ];

    if (independentTasks.includes(taskMode)) {
      return Promise.resolve(true);
    }

    // Default: allow parallel execution unless specifically restricted
    return Promise.resolve(true);
  }

  /**
   * Check if a task is naturally parallelizable
   */
  private isParallelizable(task: Task): boolean {
    const parallelizableTypes = [
      "documentation",
      "tutorial",
      "specification",
      "ask",
      "security",
      "monitor",
      "optimizer",
      "devops",
      "tester",
      "qa",
      "reviewer",
      "research",
      "ux",
      "performance",
      "release",
      "api",
      "mobile",
    ];

    return parallelizableTypes.includes(task.mode);
  }

  /**
   * Wait for an agent slot to become available
   */
  private async waitForAgentSlot(): Promise<void> {
    return new Promise((resolve) => {
      const checkSlot = () => {
        const activeCount = Array.from(this.agents.values()).filter(
          (a) => a.status === "running",
        ).length;

        if (activeCount < this.maxConcurrentAgents) {
          resolve();
        } else {
          setTimeout(checkSlot, 100);
        }
      };
      checkSlot();
    });
  }

  /**
   * Wait for all agents to complete
   */
  private async waitForAgentsToComplete(): Promise<void> {
    const activeAgents = Array.from(this.agents.values()).filter(
      (a) => a.status === "running",
    );

    if (activeAgents.length === 0) return;

    await Promise.all(
      activeAgents.map(
        (agent) =>
          new Promise((resolve) => {
            const checkComplete = () => {
              const a = this.agents.get(agent.id);
              if (a && a.status !== "running") {
                resolve(undefined);
              } else {
                setTimeout(checkComplete, 100);
              }
            };
            checkComplete();
          }),
      ),
    );
  }

  /**
   * Check Gemini CLI availability
   */
  private async checkGeminiHealth(): Promise<void> {
    const isAvailable = await this.geminiClient.checkAvailability();
    if (!isAvailable) {
      throw new Error(
        "Gemini CLI is not available. Please install Gemini CLI and ensure it's in your PATH.",
      );
    }
  }

  /**
   * Get orchestrator status
   */
  getStatus(): {
    isRunning: boolean;
    activeAgents: number;
    completedAgents: number;
    failedAgents: number;
    pendingTasks: number;
  } {
    const agents = Array.from(this.agents.values());

    return {
      isRunning: this.isRunning,
      activeAgents: agents.filter((a) => a.status === "running").length,
      completedAgents: agents.filter((a) => a.status === "completed").length,
      failedAgents: agents.filter((a) => a.status === "failed").length,
      pendingTasks: this.taskQueue.size(),
    };
  }

  /**
   * Create follow-up tasks when orchestrator completes
   */
  private async createFollowUpTasks(
    originalTask: Task,
    orchestratorResult: string,
  ): Promise<void> {
    this.logger.info("Orchestrator completed, creating follow-up tasks...");

    // Extract the original user task from the orchestrator description
    const userTask = originalTask.description.replace(
      "Orchestrate multi-agent development for: ",
      "",
    );

    // Intelligently select workflow based on project complexity
    const selectedWorkflow = this.selectWorkflowByComplexity(
      userTask,
      orchestratorResult,
    );

    console.log(
      `🧠 INTELLIGENT WORKFLOW SELECTION: Using '${selectedWorkflow.name}' workflow`,
    );
    console.log(`📋 Rationale: ${selectedWorkflow.description}`);

    const workflow = selectedWorkflow;
    if (!workflow?.tasks) {
      this.logger.warn(
        "Selected workflow has no tasks, using minimal task set",
      );
      await this.createMinimalTaskSet(userTask);
      return;
    }

    // Create tasks from the selected workflow (skip orchestrator since it's already done)
    const tasksToCreate = workflow.tasks.filter(
      (t: any) => t.mode !== "orchestrator",
    );

    // Create tasks in parallel-friendly groups
    const parallelGroups = this.groupTasksForParallelExecution(tasksToCreate);
    const createdTaskIds = new Map<string, string>(); // mode -> task ID mapping

    for (const group of parallelGroups) {
      for (const taskConfig of group) {
        const task: Task = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          description: `${taskConfig.description} for: ${userTask}`,
          mode: taskConfig.mode,
          priority: taskConfig.priority || "medium",
          dependencies: [], // Start with no dependencies - we'll resolve them below
          status: "pending",
          createdAt: new Date(),
        };

        // Map dependencies to actual task IDs (only for critical dependencies)
        if (taskConfig.dependencies && taskConfig.dependencies.length > 0) {
          for (const depMode of taskConfig.dependencies) {
            if (depMode === "orchestrator") {
              // Skip orchestrator dependency - it's already complete
              continue;
            }

            // Only add dependency if it's a critical sequential dependency
            if (this.isCriticalDependency(taskConfig.mode, depMode)) {
              if (createdTaskIds.has(depMode)) {
                task.dependencies.push(createdTaskIds.get(depMode)!);
              }
            }
          }
        }

        createdTaskIds.set(taskConfig.mode, task.id);
        this.taskQueue.add(task);
        this.emit("taskAdded", task);
        this.logger.info(
          `Created ${task.mode} task: ${task.id} (deps: ${task.dependencies.length}, parallelizable: ${this.isParallelizable(task)})`,
        );
      }
    }

    console.log(
      `🚀 Orchestrator analysis complete! Selected ${tasksToCreate.length} essential agents`,
    );
    console.log(`📋 Task queue now has ${this.taskQueue.size()} pending tasks`);
    console.log(
      `⚡ Agents can dynamically delegate to ${this.getAvailableAgentCount()} additional specialists as needed`,
    );

    // Force immediate processing of the queue
    this.processTaskQueue();
  }

  /**
   * Group tasks for optimal parallel execution
   */
  private groupTasksForParallelExecution(tasks: any[]): any[][] {
    const groups: any[][] = [];
    const independentTasks = tasks.filter((t) =>
      [
        "documentation",
        "tutorial",
        "specification",
        "ask",
        "security",
        "monitor",
        "qa",
        "reviewer",
        "research",
        "ux",
        "performance",
        "release",
        "api",
      ].includes(t.mode),
    );
    const dependentTasks = tasks.filter((t) => !independentTasks.includes(t));

    // First group: Independent tasks that can all run in parallel
    if (independentTasks.length > 0) {
      groups.push(independentTasks);
    }

    // Subsequent groups: Dependent tasks in logical order
    if (dependentTasks.length > 0) {
      groups.push(dependentTasks);
    }

    return groups;
  }

  /**
   * Check if a dependency is critical for sequential execution
   */
  private isCriticalDependency(taskMode: string, depMode: string): boolean {
    const criticalDependencies: Record<string, string[]> = {
      coder: ["architect", "specification"],
      integrator: ["coder"],
      tester: ["coder", "integrator"],
      devops: ["tester"],
      optimizer: ["coder"],
      mobile: ["designer", "api"],
      cloud: ["architect"],
      sre: ["devops", "monitor"],
      ai: ["research", "coder"],
      performance: ["coder"],
      release: ["tester", "devops"],
    };

    return criticalDependencies[taskMode]?.includes(depMode) || false;
  }

  /**
   * Intelligently select workflow based on project complexity
   */
  private selectWorkflowByComplexity(
    userTask: string,
    orchestratorResult: string,
  ): any {
    const taskLower = userTask.toLowerCase();
    const resultLower = orchestratorResult.toLowerCase();

    // Indicators for different complexity levels
    const enterpriseIndicators = [
      "enterprise",
      "microservices",
      "distributed",
      "scalable",
      "cloud-native",
      "multi-tenant",
      "high availability",
      "load balancing",
      "kubernetes",
      "compliance",
      "audit",
      "enterprise-grade",
      "production-ready",
    ];

    const complexityIndicators = [
      "api",
      "database",
      "authentication",
      "real-time",
      "websocket",
      "sse",
      "integration",
      "backend",
      "frontend",
      "mobile",
      "responsive",
      "security",
      "performance",
      "optimization",
    ];

    const simpleIndicators = [
      "simple",
      "basic",
      "calculator",
      "todo",
      "prototype",
      "poc",
      "demo",
      "example",
      "tutorial",
      "learning",
      "practice",
      "quick",
    ];

    // Count indicators in task and result
    const enterpriseScore = enterpriseIndicators.filter(
      (ind) => taskLower.includes(ind) || resultLower.includes(ind),
    ).length;

    const complexityScore = complexityIndicators.filter(
      (ind) => taskLower.includes(ind) || resultLower.includes(ind),
    ).length;

    const simpleScore = simpleIndicators.filter(
      (ind) => taskLower.includes(ind) || resultLower.includes(ind),
    ).length;

    // Decision logic
    if (simpleScore > 0 && complexityScore <= 1) {
      return (
        this.config.alternativeWorkflows?.minimal || this.getMinimalWorkflow()
      );
    } else if (enterpriseScore >= 2 || complexityScore >= 4) {
      return (
        this.config.alternativeWorkflows?.comprehensive ||
        this.config.defaultWorkflow
      );
    } else if (complexityScore >= 1 || taskLower.length > 200) {
      return this.config.defaultWorkflow; // Standard workflow
    } else {
      return this.config.alternativeWorkflows?.rapid || this.getRapidWorkflow();
    }
  }

  /**
   * Get minimal workflow fallback
   */
  private getMinimalWorkflow(): any {
    return {
      name: "Minimal Development",
      description: "Essential agents only for simple projects",
      tasks: [
        {
          mode: "coder",
          description: "Direct implementation",
          priority: "high",
          dependencies: [],
        },
      ],
    };
  }

  /**
   * Get rapid workflow fallback
   */
  private getRapidWorkflow(): any {
    return {
      name: "Rapid Development",
      description: "Fast development for prototypes and MVPs",
      tasks: [
        {
          mode: "architect",
          description: "Basic architecture",
          priority: "high",
          dependencies: [],
        },
        {
          mode: "coder",
          description: "Core implementation",
          priority: "high",
          dependencies: ["architect"],
        },
        {
          mode: "tester",
          description: "Basic testing",
          priority: "medium",
          dependencies: ["coder"],
        },
      ],
    };
  }

  /**
   * Get count of available agents for delegation
   */
  private getAvailableAgentCount(): number {
    return Object.keys(this.config.modes || {}).length;
  }

  /**
   * Create minimal task set when no workflow is configured
   */
  private async createMinimalTaskSet(userTask: string): Promise<void> {
    const minimalTasks = [
      {
        mode: "architect" as AgentMode,
        description: "Design system architecture",
        priority: "high" as const,
      },
      {
        mode: "coder" as AgentMode,
        description: "Implement core functionality",
        priority: "medium" as const,
      },
      {
        mode: "tester" as AgentMode,
        description: "Create comprehensive tests",
        priority: "medium" as const,
      },
      {
        mode: "documentation" as AgentMode,
        description: "Create project documentation",
        priority: "low" as const,
      },
    ];

    for (const taskConfig of minimalTasks) {
      const task: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: `${taskConfig.description} for: ${userTask}`,
        mode: taskConfig.mode,
        priority: taskConfig.priority,
        dependencies: [],
        status: "pending",
        createdAt: new Date(),
      };

      this.taskQueue.add(task);
      this.emit("taskAdded", task);
    }

    console.log(
      `🚀 Created minimal task set with ${minimalTasks.length} agents`,
    );
  }
}

// Types for delegation system
interface DelegationRequest {
  targetMode: AgentMode;
  description: string;
  priority: "low" | "medium" | "high";
  delegationType: DelegationType;
}

type DelegationType = "delegation" | "request" | "review" | "iteration";
