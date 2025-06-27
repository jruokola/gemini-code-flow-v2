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
import { GeminiClient } from "./gemini-client";
import { MemoryManager } from "./memory-manager";
import { TaskQueue } from "./task-queue";
import { Logger } from "../utils/logger";

export class Orchestrator extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private geminiClient: GeminiClient;
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

    // Initialize components
    this.geminiClient = new GeminiClient({
      apiKey: config.apiKey || process.env.GEMINI_API_KEY,
      authMethod: (config as any).authMethod || "google-account",
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

    this.logger.info("Starting Gemini Code Flow Orchestrator...");

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
    this.logger.info("Stopping orchestrator...");
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
      console.log(
        `🔄 ${task.mode.toUpperCase()} AGENT: Analyzing requirements...`,
      );

      // Get context from memory
      const context = await this.memoryManager.getContext(task.mode);
      console.log(
        `📚 ${task.mode.toUpperCase()} AGENT: Loaded ${context.length} context entries`,
      );

      // Build prompt with SPARC methodology
      const prompt = this.buildSparcPrompt(task, context);
      console.log(
        `📝 ${task.mode.toUpperCase()} AGENT: Built SPARC-compliant prompt`,
      );

      // Execute with Gemini
      console.log(
        `🧠 ${task.mode.toUpperCase()} AGENT: Processing with Gemini API...`,
      );
      const result = await this.geminiClient.execute(prompt, task.mode);

      // Store result in memory
      await this.memoryManager.store({
        agentId: agent.id,
        type: "result",
        content: result,
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

      console.log(
        `✅ ${task.mode.toUpperCase()} AGENT: Completed successfully!`,
      );

      // Display full agent output with enhanced formatting
      console.log(`\n${"=".repeat(100)}`);
      console.log(`🤖 ${task.mode.toUpperCase()} AGENT COMPLETE OUTPUT`);
      console.log(`📋 Task: ${task.description.substring(0, 80)}...`);
      console.log(`⏱️  Duration: ${Date.now() - agent.startTime.getTime()}ms`);
      console.log(`${"=".repeat(100)}`);
      console.log(result);
      console.log(`${"=".repeat(100)}`);
      console.log(`✅ END OF ${task.mode.toUpperCase()} AGENT OUTPUT\n`);

      this.emit("agentCompleted", agent);
    } catch (error) {
      this.logger.error(`Agent ${agent.id} failed:`, error);
      console.log(
        `❌ ${task.mode.toUpperCase()} AGENT: Failed - ${error instanceof Error ? error.message : "Unknown error"}`,
      );

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

    if (delegationRequests.length > 0) {
      console.log(
        `🔄 ${task.mode.toUpperCase()} AGENT: Found ${delegationRequests.length} delegation requests`,
      );

      for (const request of delegationRequests) {
        await this.createDelegatedTask(request, task, agent);
      }
    }
  }

  /**
   * Parse delegation requests from agent output
   */
  private parseDelegationRequests(result: string): DelegationRequest[] {
    const requests: DelegationRequest[] = [];

    // Look for delegation patterns in the output
    const delegationPatterns = [
      /DELEGATE_TO:\s*(\w+)\s*-\s*(.+?)(?=DELEGATE_TO:|$)/gs,
      /REQUEST_AGENT:\s*(\w+)\s*-\s*(.+?)(?=REQUEST_AGENT:|$)/gs,
      /NEEDS_REVIEW:\s*(\w+)\s*-\s*(.+?)(?=NEEDS_REVIEW:|$)/gs,
      /ITERATE_WITH:\s*(\w+)\s*-\s*(.+?)(?=ITERATE_WITH:|$)/gs,
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
   * Create a delegated task from agent request
   */
  private async createDelegatedTask(
    request: DelegationRequest,
    parentTask: Task,
    delegatingAgent: Agent,
  ): Promise<void> {
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: `${request.description} (Delegated by ${parentTask.mode})`,
      mode: request.targetMode,
      priority: request.priority,
      dependencies: [parentTask.id], // Depend on the delegating task
      status: "pending",
      createdAt: new Date(),
      delegatedBy: delegatingAgent.id,
      delegationType: request.delegationType,
    };

    this.taskQueue.add(task);
    this.emit("taskAdded", task);

    console.log(
      `📤 ${parentTask.mode.toUpperCase()} AGENT: Delegated task to ${request.targetMode.toUpperCase()}`,
    );
    console.log(`   Task: ${request.description}`);
    console.log(`   Type: ${request.delegationType}`);

    // Store delegation in memory for context
    await this.memoryManager.store({
      agentId: delegatingAgent.id,
      type: "delegation",
      content: {
        delegatedTo: request.targetMode,
        taskDescription: request.description,
        delegationType: request.delegationType,
      },
      tags: [parentTask.mode, request.targetMode, "delegation"],
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
   * Check Gemini API health
   */
  private async checkGeminiHealth(): Promise<void> {
    const isHealthy = await this.geminiClient.checkHealth();
    if (!isHealthy) {
      throw new Error(
        "Gemini API is not accessible. Please check your API key.",
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

    // Create tasks based on the default workflow
    const workflow = this.config.defaultWorkflow;
    if (!workflow?.enabled || !workflow.tasks) {
      this.logger.warn(
        "No default workflow configured, using minimal task set",
      );
      await this.createMinimalTaskSet(userTask);
      return;
    }

    // Create tasks from the workflow (skip orchestrator since it's already done)
    const tasksToCreate = workflow.tasks.filter(
      (t) => t.mode !== "orchestrator",
    );

    const createdTaskIds = new Map<string, string>(); // mode -> task ID mapping

    // Create tasks in parallel-friendly groups
    const parallelGroups = this.groupTasksForParallelExecution(tasksToCreate);

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
      `🚀 Orchestrator analysis complete! Spawning ${tasksToCreate.length} specialist agents...`,
    );
    console.log(`📋 Task queue now has ${this.taskQueue.size()} pending tasks`);
    console.log(
      `⚡ Parallel execution enabled - up to ${this.maxConcurrentAgents} concurrent agents`,
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
