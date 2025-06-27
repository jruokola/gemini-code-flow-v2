/**
 * Type definitions for Gemini Code Flow
 * Adapted from Claude Code Flow by ruvnet
 */

export interface Agent {
  id: string;
  mode: AgentMode;
  status: AgentStatus;
  task: string;
  result?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

export type AgentMode =
  | 'architect'
  | 'coder'
  | 'tester'
  | 'debugger'
  | 'security'
  | 'documentation'
  | 'integrator'
  | 'monitor'
  | 'optimizer'
  | 'ask'
  | 'devops'
  | 'tutorial'
  | 'database'
  | 'specification'
  | 'mcp'
  | 'orchestrator'
  | 'designer';

export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface SparcMode {
  name: string;
  icon: string;
  description: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt: string;
}

export interface MemoryEntry {
  id: string;
  agentId: string;
  timestamp: Date;
  type: 'knowledge' | 'decision' | 'error' | 'result';
  content: any;
  tags: string[];
  summary?: string;
}

export interface TaskQueue {
  id: string;
  tasks: Task[];
  status: 'active' | 'paused' | 'completed';
}

export interface Task {
  id: string;
  description: string;
  mode: AgentMode;
  priority: 'low' | 'medium' | 'high';
  dependencies: string[];
  status: AgentStatus;
  assignedAgent?: string;
  createdAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface OrchestratorConfig {
  maxAgents: number;
  memoryPath: string;
  apiKey?: string;
  authMethod?: 'google-account' | 'api-key';
  modes: Partial<Record<AgentMode, Partial<SparcMode>>>;
  defaultWorkflow?: {
    enabled: boolean;
    tasks: Array<{
      mode: AgentMode;
      description: string;
      priority?: 'low' | 'medium' | 'high';
      dependencies?: string[];
    }>;
  };
  authentication?: {
    checkInterval: number;
    refreshTokens: boolean;
    fallbackToApiKey: boolean;
  };
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    file?: string;
    console: boolean;
  };
}

export interface GeminiConfig {
  apiKey?: string;
  authMethod?: 'google-account' | 'api-key';
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface AuthConfig {
  authMethod: 'google-account' | 'api-key';
  apiKey?: string;
  refreshTokens: boolean;
  checkInterval: number;
}

export interface AuthStatus {
  authenticated: boolean;
  method: 'google-account' | 'api-key' | 'none';
  details?: any;
}

export interface SparcWorkflow {
  specification: {
    requirements: string[];
    constraints: string[];
    objectives: string[];
  };
  pseudocode: {
    steps: string[];
    algorithms: string[];
    dataStructures: string[];
  };
  architecture: {
    components: string[];
    interfaces: string[];
    dependencies: string[];
  };
  refinement: {
    iterations: number;
    improvements: string[];
    optimizations: string[];
  };
  completion: {
    deliverables: string[];
    tests: string[];
    documentation: string[];
  };
}

export interface MultimodalFile {
  mimeType: string;
  data: Buffer;
  filename?: string;
  size?: number;
}

export interface StreamChunk {
  text: string;
  finished: boolean;
  metadata?: any;
}

export interface ProjectStructure {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: ProjectStructure[];
  content?: string;
}

export interface CodeAnalysis {
  language: string;
  complexity: number;
  dependencies: string[];
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    line?: number;
    column?: number;
  }>;
  suggestions: string[];
}

export interface TaskDependency {
  taskId: string;
  dependsOn: string[];
  blockedBy: string[];
  prerequisites: string[];
}

export interface AgentCapabilities {
  modes: AgentMode[];
  multimodal: boolean;
  streaming: boolean;
  maxTokens: number;
  supportedLanguages: string[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  mode: AgentMode;
  description: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  estimatedDuration?: number;
  priority: 'low' | 'medium' | 'high';
}

export interface ExecutionContext {
  projectPath: string;
  configPath: string;
  memoryPath: string;
  outputPath: string;
  tempPath: string;
  environment: 'development' | 'production' | 'test';
}

// Event types for orchestrator
export interface OrchestratorEvents {
  started: () => void;
  stopped: () => void;
  agentSpawned: (agent: Agent) => void;
  agentCompleted: (agent: Agent) => void;
  agentFailed: (agent: Agent) => void;
  taskAdded: (task: Task) => void;
  taskCompleted: (task: Task) => void;
  taskFailed: (task: Task) => void;
  workflowStarted: (workflow: string) => void;
  workflowCompleted: (workflow: string) => void;
  error: (error: Error) => void;
}

// Command interfaces
export interface CommandOptions {
  config?: string;
  verbose?: boolean;
  dryRun?: boolean;
  output?: string;
}

export interface SparcCommandOptions extends CommandOptions {
  file?: string;
  parallel?: string;
  memory?: string;
  stream?: boolean;
}

export interface StartCommandOptions extends CommandOptions {
  task?: string;
  noAuth?: boolean;
  interactive?: boolean;
}

export interface AgentCommandOptions extends CommandOptions {
  mode?: string;
  stream?: boolean;
  timeout?: number;
}

export interface InitCommandOptions extends CommandOptions {
  sparc?: boolean;
  path?: string;
  template?: string;
}

// Error types
export class GeminiFlowError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'GeminiFlowError';
  }
}

export class AuthenticationError extends GeminiFlowError {
  constructor(message: string, context?: any) {
    super(message, 'AUTHENTICATION_ERROR', context);
    this.name = 'AuthenticationError';
  }
}

export class ConfigurationError extends GeminiFlowError {
  constructor(message: string, context?: any) {
    super(message, 'CONFIGURATION_ERROR', context);
    this.name = 'ConfigurationError';
  }
}

export class TaskExecutionError extends GeminiFlowError {
  constructor(message: string, public taskId: string, context?: any) {
    super(message, 'TASK_EXECUTION_ERROR', context);
    this.name = 'TaskExecutionError';
  }
}

export class AgentError extends GeminiFlowError {
  constructor(message: string, public agentId: string, context?: any) {
    super(message, 'AGENT_ERROR', context);
    this.name = 'AgentError';
  }
}
