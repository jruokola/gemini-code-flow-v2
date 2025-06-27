/**
 * Gemini Code Flow - Main Entry Point
 * Adapted from Claude Code Flow by ruvnet
 */

export { Orchestrator } from './core/orchestrator';
export { GeminiClient } from './core/gemini-client';
export { MemoryManager } from './core/memory-manager';
export { TaskQueue } from './core/task-queue';

export { SparcCommand } from './commands/sparc';
export { InitCommand } from './commands/init';
export { AgentCommand } from './commands/agent';

export { Logger } from './utils/logger';

export * from './types';

// Version
export const version = require('../package.json').version;