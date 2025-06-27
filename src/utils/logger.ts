/**
 * Logger utility for Gemini Code Flow
 * Adapted from Claude Code Flow by ruvnet
 */

import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private context: string;
  private level: LogLevel = LogLevel.INFO;

  constructor(context: string) {
    this.context = context;
    
    // Set log level from environment
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (envLevel && envLevel in LogLevel) {
      this.level = LogLevel[envLevel as keyof typeof LogLevel];
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(chalk.gray(`[DEBUG] [${this.context}] ${message}`), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(chalk.blue(`[INFO] [${this.context}] ${message}`), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(chalk.yellow(`[WARN] [${this.context}] ${message}`), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(chalk.red(`[ERROR] [${this.context}] ${message}`), ...args);
    }
  }
}