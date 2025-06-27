/**
 * Logger utility for Gemini Code Flow
 * Adapted from Claude Code Flow by ruvnet
 */

import chalk from "chalk";

export enum LogLevel {
  SILENT = 0, // No output except errors
  MINIMAL = 1, // Only critical events (agent start/complete, major milestones)
  NORMAL = 2, // Standard output (default)
  VERBOSE = 3, // Detailed progress and delegation info
  DEBUG = 4, // Full debug information
}

export enum OutputFormat {
  COMPACT = "compact", // Single line updates
  DETAILED = "detailed", // Full output blocks
  PROGRESS = "progress", // Progress bars and counters
}

export class Logger {
  private context: string;
  private level: LogLevel = LogLevel.NORMAL;
  private format: OutputFormat = OutputFormat.DETAILED;
  private static globalLevel: LogLevel = LogLevel.NORMAL;
  private static globalFormat: OutputFormat = OutputFormat.DETAILED;
  private static agentFilter: string[] = [];
  private static enableProgressTracking: boolean = false;

  constructor(context: string) {
    this.context = context;

    // Use global settings if set, otherwise environment
    this.level = Logger.globalLevel;
    this.format = Logger.globalFormat;

    // Set log level from environment if not set globally
    if (Logger.globalLevel === LogLevel.NORMAL) {
      const envLevel = process.env.LOG_LEVEL?.toUpperCase();
      if (envLevel && envLevel in LogLevel) {
        this.level = LogLevel[envLevel as keyof typeof LogLevel];
      }
    }
  }

  static setGlobalLevel(level: LogLevel): void {
    Logger.globalLevel = level;
  }

  static setGlobalFormat(format: OutputFormat): void {
    Logger.globalFormat = format;
  }

  static setAgentFilter(agents: string[]): void {
    Logger.agentFilter = agents;
  }

  static enableProgress(enable: boolean): void {
    Logger.enableProgressTracking = enable;
  }

  static getVerbosityFromFlags(flags: {
    quiet?: boolean;
    verbose?: number;
    debug?: boolean;
  }): LogLevel {
    if (flags.quiet) return LogLevel.SILENT;
    if (flags.debug) return LogLevel.DEBUG;
    if (flags.verbose) {
      switch (flags.verbose) {
        case 1:
          return LogLevel.VERBOSE;
        case 2:
          return LogLevel.DEBUG;
        default:
          return LogLevel.VERBOSE;
      }
    }
    return LogLevel.NORMAL;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.level === LogLevel.SILENT && level !== LogLevel.SILENT)
      return false;
    if (
      Logger.agentFilter.length > 0 &&
      !Logger.agentFilter.includes(this.context.toLowerCase())
    )
      return false;
    return this.level >= level;
  }

  private formatMessage(
    level: string,
    message: string,
    isCompact: boolean = false,
  ): string {
    const timestamp = new Date().toLocaleTimeString();

    if (isCompact || this.format === OutputFormat.COMPACT) {
      return `[${level}] ${this.context}: ${message}`;
    }

    return `[${timestamp}] [${level}] [${this.context}] ${message}`;
  }

  // Critical events - always shown unless SILENT
  critical(message: string, ...args: any[]): void {
    if (this.level > LogLevel.SILENT) {
      console.log(
        chalk.green.bold(this.formatMessage("CRITICAL", message)),
        ...args,
      );
    }
  }

  // Minimal logging - major milestones only
  minimal(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.MINIMAL)) {
      console.log(
        chalk.cyan(this.formatMessage("INFO", message, true)),
        ...args,
      );
    }
  }

  // Normal logging - standard events
  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.NORMAL)) {
      const formatted = this.formatMessage("INFO", message);
      console.log(chalk.blue(formatted), ...args);
    }
  }

  // Verbose logging - detailed progress
  verbose(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.VERBOSE)) {
      console.log(chalk.gray(this.formatMessage("VERBOSE", message)), ...args);
    }
  }

  // Debug logging - full details
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(chalk.gray(this.formatMessage("DEBUG", message)), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.MINIMAL)) {
      console.warn(chalk.yellow(this.formatMessage("WARN", message)), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    // Errors always shown unless SILENT
    if (this.level > LogLevel.SILENT) {
      console.error(chalk.red(this.formatMessage("ERROR", message)), ...args);
    }
  }

  // Agent-specific logging methods
  agentStarted(agentId: string, mode: string, task: string): void {
    if (this.format === OutputFormat.COMPACT) {
      this.minimal(`🤖 ${mode.toUpperCase()}: Started`);
    } else {
      this.minimal(`🤖 AGENT STARTED: ${mode.toUpperCase()}`);
      this.verbose(`   ID: ${agentId}`);
      this.verbose(
        `   Task: ${task.substring(0, 100)}${task.length > 100 ? "..." : ""}`,
      );
    }
  }

  agentCompleted(agentId: string, mode: string, duration: number): void {
    if (this.format === OutputFormat.COMPACT) {
      this.minimal(`✅ ${mode.toUpperCase()}: Done (${duration}ms)`);
    } else {
      this.minimal(`✅ AGENT COMPLETED: ${mode.toUpperCase()}`);
      this.verbose(`   Duration: ${duration}ms`);
    }
  }

  agentFailed(agentId: string, mode: string, error: string): void {
    if (this.format === OutputFormat.COMPACT) {
      this.error(`❌ ${mode.toUpperCase()}: Failed - ${error}`);
    } else {
      this.error(`❌ AGENT FAILED: ${mode.toUpperCase()}`);
      this.error(`   Error: ${error}`);
    }
  }

  taskQueued(mode: string, priority: string, dependencyCount: number): void {
    if (this.format === OutputFormat.COMPACT) {
      this.verbose(`📝 ${mode.toUpperCase()}: Queued (${priority})`);
    } else {
      this.verbose(
        `📝 TASK QUEUED: ${mode.toUpperCase()} (Priority: ${priority})`,
      );
      this.debug(`   Dependencies: ${dependencyCount} tasks`);
    }
  }

  delegation(fromMode: string, toMode: string, taskDescription: string): void {
    if (this.format === OutputFormat.COMPACT) {
      this.verbose(`🔄 ${fromMode.toUpperCase()} → ${toMode.toUpperCase()}`);
    } else {
      this.verbose(
        `🔄 DELEGATION: ${fromMode.toUpperCase()} → ${toMode.toUpperCase()}`,
      );
      this.debug(`   Task: ${taskDescription.substring(0, 80)}...`);
    }
  }

  // Progress tracking
  progressUpdate(
    activeAgents: number,
    pendingTasks: number,
    completedAgents: number,
    failedAgents: number,
  ): void {
    if (Logger.enableProgressTracking && this.shouldLog(LogLevel.MINIMAL)) {
      const total = completedAgents + failedAgents + activeAgents;
      const progress =
        total > 0 ? Math.round((completedAgents / total) * 100) : 0;

      if (this.format === OutputFormat.PROGRESS) {
        // Clear line and show progress bar
        process.stdout.write("\r\x1b[K");
        const bar =
          "█".repeat(Math.floor(progress / 5)) +
          "░".repeat(20 - Math.floor(progress / 5));
        process.stdout.write(
          chalk.cyan(
            `📊 [${bar}] ${progress}% | Active: ${activeAgents} | Pending: ${pendingTasks} | Done: ${completedAgents}`,
          ),
        );
      } else {
        this.minimal(
          `📊 Progress: ${completedAgents}/${total} agents | ${pendingTasks} tasks pending`,
        );
      }
    }
  }
}
