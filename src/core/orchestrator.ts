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
   * Process tasks from the queue
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

      if (activeAgents >= this.maxConcurrentAgents) {
        // Wait for an agent to complete
        await this.waitForAgentSlot();
        continue;
      }

      const task = await this.taskQueue.getNext();
      if (!task) {
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

      // Check dependencies
      if (!(await this.areDependenciesMet(task))) {
        // Re-queue the task
        this.taskQueue.add(task);
        this.logger.info(
          `Task ${task.mode} re-queued due to unmet dependencies`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      // Spawn agent for the task
      console.log(`\n${"=".repeat(100)}`);
      console.log(`🚀 STARTING ${task.mode.toUpperCase()} AGENT`);
      console.log(`📋 Task: ${task.description}`);
      console.log(`⚡ Priority: ${task.priority}`);
      console.log(`🔗 Dependencies: ${task.dependencies.length} tasks`);
      console.log(`${"=".repeat(100)}`);
      await this.spawnAgent(task);
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
   * Build SPARC-compliant prompt
   */
  private buildSparcPrompt(task: Task, context: any[]): string {
    const modePrompts = this.getSparcModePrompts();
    const basePrompt = modePrompts[task.mode] || modePrompts.default;

    return `
${basePrompt}

## Task Description
${task.description}

## Context from Previous Agents
${context.map((c) => `- ${c.type}: ${c.summary}`).join("\n")}

## Expected Deliverables
Please provide your response following the SPARC methodology:
1. Specification: Define what needs to be done
2. Pseudocode: Outline the approach
3. Architecture: Design the solution
4. Refinement: Iterate and improve
5. Completion: Deliver the final result

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

    for (const taskConfig of tasksToCreate) {
      const task: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: `${taskConfig.description} for: ${userTask}`,
        mode: taskConfig.mode,
        priority: taskConfig.priority || "medium",
        dependencies: [], // Start with no dependencies - we'll resolve them below
        status: "pending",
        createdAt: new Date(),
      };

      // Map dependencies to actual task IDs
      if (taskConfig.dependencies && taskConfig.dependencies.length > 0) {
        for (const depMode of taskConfig.dependencies) {
          if (depMode === "orchestrator") {
            // Skip orchestrator dependency - it's already complete
            continue;
          }
          if (createdTaskIds.has(depMode)) {
            task.dependencies.push(createdTaskIds.get(depMode)!);
          }
        }
      }

      createdTaskIds.set(taskConfig.mode, task.id);
      this.taskQueue.add(task);
      this.emit("taskAdded", task);
      this.logger.info(
        `Created ${task.mode} task: ${task.id} (deps: ${task.dependencies.length})`,
      );
    }

    console.log(
      `🚀 Orchestrator analysis complete! Spawning ${tasksToCreate.length} specialist agents...`,
    );
    console.log(`📋 Task queue now has ${this.taskQueue.size()} pending tasks`);

    // Force immediate processing of the queue
    this.processTaskQueue();
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
