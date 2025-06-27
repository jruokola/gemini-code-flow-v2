/**
 * Gemini CLI Client Integration
 * Proper integration with Gemini CLI for automated coding operations
 */

import { spawn, exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs-extra";
import * as path from "path";
import { AgentMode } from "../types";
import { Logger } from "../utils/logger";

const execAsync = promisify(exec);

export interface GeminiCLIConfig {
  model?: string;
  sandbox?: boolean;
  sandboxImage?: string;
  debug?: boolean;
  allFiles?: boolean;
  yolo?: boolean;
  checkpointing?: boolean;
  workingDirectory?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface GeminiCLIResult {
  success: boolean;
  output: string;
  error?: string;
  filesModified: string[];
  filesCreated: string[];
  duration: number;
}

export class GeminiCLIClient {
  private config: GeminiCLIConfig;
  private logger: Logger;
  private workingDirectory: string;

  constructor(config: GeminiCLIConfig = {}) {
    this.config = {
      model: config.model || "gemini-2.5-pro",
      sandbox: config.sandbox || false,
      debug: config.debug || false,
      allFiles: config.allFiles || true,
      yolo: config.yolo !== false, // Default true, false only with explicit config
      checkpointing: config.checkpointing || true,
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 300000, // 5 minutes
      ...config,
    };

    this.logger = new Logger("GeminiCLI");
    this.workingDirectory = config.workingDirectory || process.cwd();

    // Ensure working directory exists
    fs.ensureDirSync(this.workingDirectory);
  }

  /**
   * Execute a coding task with Gemini CLI
   */
  async execute(prompt: string, mode: AgentMode): Promise<GeminiCLIResult> {
    const startTime = Date.now();

    try {
      // Pre-execution file tracking
      const filesBefore = await this.getFileList();

      // Build enhanced prompt with mode-specific instructions
      const enhancedPrompt = this.buildModePrompt(prompt, mode);

      // Execute Gemini CLI
      const result = await this.runGeminiCLI(enhancedPrompt);

      // Post-execution file tracking
      const filesAfter = await this.getFileList();
      const { created, modified } = this.compareFileLists(
        filesBefore,
        filesAfter,
      );

      const duration = Date.now() - startTime;

      this.logger.verbose(`Gemini CLI completed in ${duration}ms`);
      this.logger.debug(
        `Files created: ${created.length}, modified: ${modified.length}`,
      );

      return {
        success: true,
        output: result.output,
        filesModified: modified,
        filesCreated: created,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.logger.error(`Gemini CLI failed after ${duration}ms:`, errorMessage);

      return {
        success: false,
        output: "",
        error: errorMessage,
        filesModified: [],
        filesCreated: [],
        duration,
      };
    }
  }

  /**
   * Execute with streaming output
   */
  async *executeStream(
    prompt: string,
    mode: AgentMode,
  ): AsyncGenerator<string> {
    const enhancedPrompt = this.buildModePrompt(prompt, mode);

    yield* this.runGeminiCLIStream(enhancedPrompt);
  }

  /**
   * Check if Gemini CLI is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      await execAsync("gemini --version");
      return true;
    } catch (error) {
      this.logger.warn("Gemini CLI not found in PATH");
      return false;
    }
  }

  /**
   * Set working directory for operations
   */
  setWorkingDirectory(directory: string): void {
    if (!fs.existsSync(directory)) {
      throw new Error(`Working directory does not exist: ${directory}`);
    }
    this.workingDirectory = directory;
    this.logger.debug(`Working directory set to: ${directory}`);
  }

  /**
   * Get current working directory
   */
  getWorkingDirectory(): string {
    return this.workingDirectory;
  }

  /**
   * Build mode-specific prompt
   */
  private buildModePrompt(prompt: string, mode: AgentMode): string {
    const modeInstructions = this.getModeInstructions(mode);
    const contextInfo = this.getContextInfo();

    return `${modeInstructions}

## Current Context
${contextInfo}

## Task Request
${prompt}

## Instructions
- Work in the current directory: ${this.workingDirectory}
- Create, modify, or delete files as needed
- Follow best practices for ${mode} operations
- Provide clear explanations for your changes
- Test your changes when applicable

Please proceed with the implementation.`;
  }

  /**
   * Get mode-specific instructions
   */
  private getModeInstructions(mode: AgentMode): string {
    const instructions: Record<AgentMode, string> = {
      architect: `You are a system architect. Design and create architectural documents, diagrams, and structure files. Focus on:
- System design and component architecture
- Creating project structure and configuration files
- Documenting architectural decisions
- Setting up development environments`,

      coder: `You are a software developer. Write, modify, and refactor code files. Focus on:
- Writing clean, maintainable code
- Following language-specific conventions
- Implementing features and functionality
- Refactoring existing code for better structure`,

      tester: `You are a testing specialist. Create and maintain test files and testing infrastructure. Focus on:
- Writing unit, integration, and end-to-end tests
- Creating testing utilities and fixtures
- Setting up testing frameworks and configurations
- Ensuring comprehensive test coverage`,

      debugger: `You are a debug specialist. Identify and fix bugs in existing code. Focus on:
- Analyzing error logs and stack traces
- Fixing bugs and issues in code
- Adding debugging utilities and logging
- Improving error handling`,

      security: `You are a security specialist. Review and improve code security. Focus on:
- Identifying security vulnerabilities
- Implementing security best practices
- Adding security-related configuration
- Creating security documentation`,

      documentation: `You are a technical writer. Create and maintain documentation files. Focus on:
- Writing clear, comprehensive documentation
- Creating README files and guides
- Documenting APIs and code functionality
- Maintaining project documentation`,

      integrator: `You are an integration specialist. Connect systems and components. Focus on:
- Creating integration points between components
- Setting up API connections and configurations
- Managing data flow between systems
- Creating integration tests`,

      monitor: `You are a monitoring specialist. Implement observability and monitoring. Focus on:
- Adding logging and monitoring code
- Creating monitoring dashboards and alerts
- Implementing performance tracking
- Setting up health checks`,

      optimizer: `You are a performance optimizer. Improve code and system performance. Focus on:
- Identifying performance bottlenecks
- Optimizing algorithms and data structures
- Improving resource utilization
- Adding performance monitoring`,

      ask: `You are a requirements analyst. Help clarify and document requirements. Focus on:
- Creating specification documents
- Breaking down complex requirements
- Documenting user stories and acceptance criteria
- Creating project planning documents`,

      devops: `You are a DevOps engineer. Manage deployment and infrastructure. Focus on:
- Creating deployment scripts and configurations
- Setting up CI/CD pipelines
- Managing containerization and orchestration
- Creating infrastructure as code`,

      tutorial: `You are an educational content creator. Create learning materials. Focus on:
- Writing step-by-step tutorials
- Creating example code and demos
- Documenting learning paths
- Creating educational content`,

      database: `You are a database administrator. Manage data storage and retrieval. Focus on:
- Creating database schemas and migrations
- Writing database queries and procedures
- Setting up database configurations
- Managing data relationships`,

      specification: `You are a specification writer. Create detailed technical specifications. Focus on:
- Writing technical specifications
- Creating API documentation
- Documenting system requirements
- Creating design documents`,

      mcp: `You are an MCP integration specialist. Connect external services. Focus on:
- Creating MCP server configurations
- Implementing external API integrations
- Managing service connections
- Creating integration documentation`,

      orchestrator: `You are a workflow orchestrator. Coordinate complex processes. Focus on:
- Creating workflow definitions
- Managing process coordination
- Setting up automation scripts
- Creating orchestration documentation`,

      designer: `You are a UI/UX designer. Create user interface designs. Focus on:
- Creating UI component files
- Implementing design systems
- Creating styling and theme files
- Documenting design decisions`,

      product: `You are a product manager. Define product requirements. Focus on:
- Creating product requirement documents
- Managing feature specifications
- Creating user story documentation
- Planning product roadmaps`,

      qa: `You are a quality assurance specialist. Ensure product quality. Focus on:
- Creating QA test plans and procedures
- Setting up quality gates and checks
- Creating quality metrics and reports
- Documenting quality processes`,

      reviewer: `You are a code reviewer. Analyze and improve code quality. Focus on:
- Reviewing code for quality and standards
- Creating code review guidelines
- Identifying technical debt
- Documenting review processes`,

      research: `You are a research specialist. Explore and document new technologies. Focus on:
- Creating research documentation
- Prototyping new technologies
- Documenting feasibility studies
- Creating proof of concepts`,

      cloud: `You are a cloud specialist. Design cloud-native solutions. Focus on:
- Creating cloud infrastructure configurations
- Implementing serverless architectures
- Managing cloud services integration
- Creating cloud deployment scripts`,

      sre: `You are a site reliability engineer. Ensure system reliability. Focus on:
- Creating monitoring and alerting systems
- Implementing incident response procedures
- Managing system reliability metrics
- Creating operational documentation`,

      ai: `You are an AI specialist. Implement AI and ML solutions. Focus on:
- Creating AI/ML model implementations
- Setting up training and inference pipelines
- Implementing AI service integrations
- Creating AI-related documentation`,

      ux: `You are a UX researcher. Optimize user experience. Focus on:
- Creating user research documentation
- Implementing user feedback systems
- Creating UX testing procedures
- Documenting user journey maps`,

      mobile: `You are a mobile developer. Create mobile applications. Focus on:
- Creating mobile app code and configurations
- Implementing mobile-specific features
- Managing mobile platform integrations
- Creating mobile deployment scripts`,

      api: `You are an API specialist. Design and implement APIs. Focus on:
- Creating API implementations and documentation
- Setting up API gateways and configurations
- Managing API versioning and schemas
- Creating API testing suites`,

      performance: `You are a performance engineer. Optimize application performance. Focus on:
- Implementing performance monitoring
- Creating performance testing suites
- Optimizing critical performance paths
- Creating performance documentation`,

      release: `You are a release manager. Coordinate software releases. Focus on:
- Creating release planning documentation
- Managing release pipelines and scripts
- Creating deployment procedures
- Managing release coordination`,
    };

    return instructions[mode] || instructions.coder;
  }

  /**
   * Get context information about current project
   */
  private getContextInfo(): string {
    try {
      const packageJsonPath = path.join(this.workingDirectory, "package.json");
      let projectInfo = "";

      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8"),
        );
        projectInfo = `Project: ${packageJson.name || "Unknown"}
Version: ${packageJson.version || "Unknown"}
Description: ${packageJson.description || "No description"}`;
      }

      const fileCount = this.getFileCount();

      return `Working Directory: ${this.workingDirectory}
${projectInfo}
Files in project: ${fileCount}

Key files and directories:
${this.getProjectStructure()}`;
    } catch (error) {
      return `Working Directory: ${this.workingDirectory}
Error reading project context: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }

  /**
   * Run Gemini CLI command
   */
  private async runGeminiCLI(prompt: string): Promise<{ output: string }> {
    return new Promise((resolve, reject) => {
      const args = this.buildGeminiArgs(prompt);

      this.logger.debug(`Running: gemini ${args.join(" ")}`);

      const geminiProcess = spawn("gemini", args, {
        cwd: this.workingDirectory,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let output = "";
      let errorOutput = "";

      geminiProcess.stdout.on("data", (data) => {
        const chunk = data.toString();
        output += chunk;
        this.logger.debug(`STDOUT: ${chunk.trim()}`);
      });

      geminiProcess.stderr.on("data", (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        this.logger.debug(`STDERR: ${chunk.trim()}`);
      });

      geminiProcess.on("close", (code) => {
        if (code === 0) {
          resolve({ output });
        } else {
          reject(
            new Error(`Gemini CLI exited with code ${code}: ${errorOutput}`),
          );
        }
      });

      geminiProcess.on("error", (error) => {
        reject(new Error(`Failed to spawn Gemini CLI: ${error.message}`));
      });

      // Set timeout
      const timeout = setTimeout(() => {
        geminiProcess.kill("SIGTERM");
        reject(new Error(`Gemini CLI timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);

      geminiProcess.on("close", () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * Run Gemini CLI with streaming output
   */
  private async *runGeminiCLIStream(prompt: string): AsyncGenerator<string> {
    const args = this.buildGeminiArgs(prompt);

    const geminiProcess = spawn("gemini", args, {
      cwd: this.workingDirectory,
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Yield output chunks as they arrive
    for await (const chunk of geminiProcess.stdout) {
      yield chunk.toString();
    }
  }

  /**
   * Build Gemini CLI arguments
   */
  private buildGeminiArgs(prompt?: string): string[] {
    const args: string[] = [];

    if (this.config.model) {
      args.push("--model", this.config.model);
    }

    if (prompt) {
      args.push("--prompt", prompt);
    }

    if (this.config.sandbox) {
      args.push("--sandbox");
      if (this.config.sandboxImage) {
        args.push("--sandbox-image", this.config.sandboxImage);
      }
    }

    if (this.config.debug) {
      args.push("--debug");
    }

    if (this.config.allFiles) {
      args.push("--all_files");
    }

    if (this.config.yolo) {
      args.push("--yolo");
    }

    if (this.config.checkpointing) {
      args.push("--checkpointing");
    }

    return args;
  }

  /**
   * Get list of files in working directory
   */
  private async getFileList(): Promise<
    Map<string, { size: number; mtime: Date }>
  > {
    const files = new Map<string, { size: number; mtime: Date }>();

    const scanDirectory = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(this.workingDirectory, fullPath);

          // Skip node_modules, .git, and other common ignore patterns
          if (this.shouldIgnoreFile(relativePath)) {
            continue;
          }

          if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            files.set(relativePath, {
              size: stats.size,
              mtime: stats.mtime,
            });
          } else if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          }
        }
      } catch (error) {
        this.logger.debug(`Error scanning directory ${dir}:`, error);
      }
    };

    await scanDirectory(this.workingDirectory);
    return files;
  }

  /**
   * Compare file lists to find created/modified files
   */
  private compareFileLists(
    before: Map<string, { size: number; mtime: Date }>,
    after: Map<string, { size: number; mtime: Date }>,
  ): { created: string[]; modified: string[] } {
    const created: string[] = [];
    const modified: string[] = [];

    for (const [filePath, afterStats] of after) {
      const beforeStats = before.get(filePath);

      if (!beforeStats) {
        created.push(filePath);
      } else if (
        beforeStats.size !== afterStats.size ||
        beforeStats.mtime.getTime() !== afterStats.mtime.getTime()
      ) {
        modified.push(filePath);
      }
    }

    return { created, modified };
  }

  /**
   * Check if file should be ignored
   */
  private shouldIgnoreFile(filePath: string): boolean {
    const ignorePatterns = [
      "node_modules",
      ".git",
      ".DS_Store",
      "dist",
      "build",
      ".next",
      "coverage",
      ".nyc_output",
      "tmp",
      "temp",
      "*.log",
      ".env",
      ".env.local",
    ];

    return ignorePatterns.some((pattern) => {
      if (pattern.includes("*")) {
        const regex = new RegExp(pattern.replace("*", ".*"));
        return regex.test(filePath);
      }
      return filePath.includes(pattern);
    });
  }

  /**
   * Get file count in project
   */
  private getFileCount(): number {
    try {
      const countFiles = (dir: string): number => {
        let count = 0;
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(this.workingDirectory, fullPath);

          if (this.shouldIgnoreFile(relativePath)) {
            continue;
          }

          if (entry.isFile()) {
            count++;
          } else if (entry.isDirectory()) {
            count += countFiles(fullPath);
          }
        }

        return count;
      };

      return countFiles(this.workingDirectory);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get project structure overview
   */
  private getProjectStructure(): string {
    try {
      const structure: string[] = [];
      const maxDepth = 2;

      const scanDirectory = (dir: string, depth: number = 0): void => {
        if (depth > maxDepth) return;

        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const indent = "  ".repeat(depth);

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(this.workingDirectory, fullPath);

          if (this.shouldIgnoreFile(relativePath)) {
            continue;
          }

          if (entry.isDirectory()) {
            structure.push(`${indent}${entry.name}/`);
            scanDirectory(fullPath, depth + 1);
          } else if (depth < maxDepth) {
            structure.push(`${indent}${entry.name}`);
          }
        }
      };

      scanDirectory(this.workingDirectory);
      return (
        structure.slice(0, 20).join("\n") +
        (structure.length > 20 ? "\n  ..." : "")
      );
    } catch (error) {
      return "Error reading project structure";
    }
  }
}
