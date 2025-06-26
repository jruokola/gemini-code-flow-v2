/**
 * Gemini Code Flow Orchestrator
 * Adapted from Claude Code Flow by ruvnet
 */

import { EventEmitter } from 'events';
import { Agent, AgentMode, AgentStatus, Task, OrchestratorConfig } from '../types';
import { GeminiClient } from './gemini-client';
import { MemoryManager } from './memory-manager';
import { TaskQueue } from './task-queue';
import { Logger } from '../utils/logger';

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
    this.logger = new Logger('Orchestrator');
    
    // Initialize components
    this.geminiClient = new GeminiClient({
      apiKey: config.apiKey || process.env.GEMINI_API_KEY,
      authMethod: (config as any).authMethod || 'google-account',
    });
    
    this.memoryManager = new MemoryManager(config.memoryPath);
    this.taskQueue = new TaskQueue();
  }

  /**
   * Start the orchestrator
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Orchestrator is already running');
    }

    this.logger.info('Starting Gemini Code Flow Orchestrator...');
    
    // Initialize components
    await this.memoryManager.initialize();
    await this.checkGeminiHealth();
    
    this.isRunning = true;
    this.emit('started');
    
    // Start task processing loop
    this.processTaskQueue();
  }

  /**
   * Stop the orchestrator
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping orchestrator...');
    this.isRunning = false;
    
    // Wait for all agents to complete
    await this.waitForAgentsToComplete();
    
    // Save state
    await this.memoryManager.flush();
    
    this.emit('stopped');
  }

  /**
   * Add a task to the queue
   */
  async addTask(task: Task): Promise<void> {
    this.taskQueue.add(task);
    this.emit('taskAdded', task);
    
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
        agent => agent.status === 'running'
      ).length;

      if (activeAgents >= this.maxConcurrentAgents) {
        // Wait for an agent to complete
        await this.waitForAgentSlot();
        continue;
      }

      const task = await this.taskQueue.getNext();
      if (!task) {
        // No tasks available, wait
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      // Check dependencies
      if (!(await this.areDependenciesMet(task))) {
        // Re-queue the task
        this.taskQueue.add(task);
        continue;
      }

      // Spawn agent for the task
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
      status: 'running',
      task: task.description,
      startTime: new Date(),
    };

    this.agents.set(agent.id, agent);
    this.emit('agentSpawned', agent);

    try {
      // Get context from memory
      const context = await this.memoryManager.getContext(task.mode);
      
      // Build prompt with SPARC methodology
      const prompt = this.buildSparcPrompt(task, context);
      
      // Execute with Gemini
      const result = await this.geminiClient.execute(prompt, task.mode);
      
      // Store result in memory
      await this.memoryManager.store({
        agentId: agent.id,
        type: 'result',
        content: result,
        tags: [task.mode, 'completed'],
      });

      // Update agent status
      agent.status = 'completed';
      agent.result = result;
      agent.endTime = new Date();
      
      this.emit('agentCompleted', agent);
    } catch (error) {
      this.logger.error(`Agent ${agent.id} failed:`, error);
      
      agent.status = 'failed';
      agent.error = error.message;
      agent.endTime = new Date();
      
      // Store error in memory
      await this.memoryManager.store({
        agentId: agent.id,
        type: 'error',
        content: error.message,
        tags: [task.mode, 'failed'],
      });
      
      this.emit('agentFailed', agent);
    }

    // Mark task as complete
    task.status = agent.status;
    this.emit('taskCompleted', task);
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
${context.map(c => `- ${c.type}: ${c.summary}`).join('\n')}

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
      if (!depTask || depTask.status !== 'completed') {
        return false;
      }
    }
    return true;
  }

  /**
   * Wait for an agent slot to become available
   */
  private async waitForAgentSlot(): Promise<void> {
    return new Promise(resolve => {
      const checkSlot = () => {
        const activeCount = Array.from(this.agents.values()).filter(
          a => a.status === 'running'
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
      a => a.status === 'running'
    );

    if (activeAgents.length === 0) return;

    await Promise.all(
      activeAgents.map(agent => 
        new Promise(resolve => {
          const checkComplete = () => {
            const a = this.agents.get(agent.id);
            if (a && a.status !== 'running') {
              resolve(undefined);
            } else {
              setTimeout(checkComplete, 100);
            }
          };
          checkComplete();
        })
      )
    );
  }

  /**
   * Check Gemini API health
   */
  private async checkGeminiHealth(): Promise<void> {
    const isHealthy = await this.geminiClient.checkHealth();
    if (!isHealthy) {
      throw new Error('Gemini API is not accessible. Please check your API key.');
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
      activeAgents: agents.filter(a => a.status === 'running').length,
      completedAgents: agents.filter(a => a.status === 'completed').length,
      failedAgents: agents.filter(a => a.status === 'failed').length,
      pendingTasks: this.taskQueue.size(),
    };
  }
}