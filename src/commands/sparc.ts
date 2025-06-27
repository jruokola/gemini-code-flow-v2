/**
 * SPARC Command for Gemini Code Flow
 * Adapted from Claude Code Flow by ruvnet
 */

import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import { GeminiClient } from "../core/gemini-client";
import { GeminiCLIClient, GeminiCLIResult } from "../core/gemini-cli-client";
import { Logger, LogLevel } from "../utils/logger";
import { AgentMode } from "../types";

export class SparcCommand {
  async execute(mode: AgentMode, task: string, options: any): Promise<void> {
    // Setup logger based on options
    const logLevel = Logger.getVerbosityFromFlags({
      quiet: options.quiet,
      verbose: options.verbose,
      debug: options.debug,
    });
    Logger.setGlobalLevel(logLevel);

    const logger = new Logger("SPARC");

    if (!mode || !task) {
      logger.error("Usage: gemini-flow sparc <mode> <task>");
      logger.info('Example: gemini-flow sparc architect "Design a REST API"');
      return;
    }

    const validModes: AgentMode[] = [
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

    if (!validModes.includes(mode)) {
      logger.error(`Invalid mode: ${mode}`);
      logger.info('Run "gemini-flow list" to see available modes');
      return;
    }

    const useCLI = options.cli !== false; // Default true, false only with --no-cli
    const spinner = ora(
      `${this.getModeIcon(mode)} Running ${mode} mode${useCLI ? " (CLI)" : ""}...`,
    ).start();

    try {
      if (useCLI) {
        // Use Gemini CLI for actual file operations
        const cliClient = new GeminiCLIClient({
          model: "gemini-2.5-pro",
          debug: options.debug || false,
          allFiles: true,
          yolo: options.yolo !== false, // Default true, false only with --no-yolo
          checkpointing: true,
          workingDirectory: process.cwd(),
        });

        const prompt = this.buildSparcPrompt(mode, task);
        const cliResult: GeminiCLIResult = await cliClient.execute(
          prompt,
          mode,
        );

        if (!cliResult.success) {
          throw new Error(cliResult.error || "Gemini CLI execution failed");
        }

        spinner.succeed(
          `${this.getModeIcon(mode)} ${mode} completed successfully (CLI)`,
        );

        logger.minimal(`📋 ${mode.toUpperCase()} CLI Result Generated`);

        // Log file operations
        if (cliResult.filesCreated.length > 0) {
          logger.info(`📁 Created files: ${cliResult.filesCreated.join(", ")}`);
        }
        if (cliResult.filesModified.length > 0) {
          logger.info(
            `📝 Modified files: ${cliResult.filesModified.length} files`,
          );
        }

        logger.verbose("\n📋 CLI Output:\n");
        logger.verbose(cliResult.output);

        // Save result to file
        const outputPath = `.gemini-flow/${mode}-cli-${Date.now()}.md`;
        await fs.ensureDir(".gemini-flow");
        await fs.writeFile(
          outputPath,
          `# ${mode.toUpperCase()} CLI Mode Result\n\n## Files Created\n${cliResult.filesCreated.map((f) => `- ${f}`).join("\n")}\n\n## Files Modified\n${cliResult.filesModified.map((f) => `- ${f}`).join("\n")}\n\n## Output\n${cliResult.output}`,
        );

        logger.verbose(`💾 Result saved to: ${outputPath}`);
      } else {
        // Use SDK for text generation only (when --no-cli is specified)
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error(
            "GEMINI_API_KEY environment variable is required for text-only mode",
          );
        }

        const client = new GeminiClient({ apiKey });
        const prompt = this.buildSparcPrompt(mode, task);

        let result: string;
        if (options.file) {
          // Multimodal processing
          const fileBuffer = await fs.readFile(options.file);
          const mimeType = this.getMimeType(options.file);
          result = await client.executeMultimodal(
            prompt,
            [{ mimeType, data: fileBuffer }],
            mode,
          );
        } else {
          result = await client.execute(prompt, mode);
        }

        spinner.succeed(
          `${this.getModeIcon(mode)} ${mode} completed successfully`,
        );

        logger.minimal(`📋 ${mode.toUpperCase()} Result Generated`);
        logger.info("\n📋 Result:\n");
        logger.info(result);

        // Save result to file
        const outputPath = `.gemini-flow/${mode}-${Date.now()}.md`;
        await fs.ensureDir(".gemini-flow");
        await fs.writeFile(
          outputPath,
          `# ${mode.toUpperCase()} Mode Result\n\n${result}`,
        );

        logger.verbose(`💾 Result saved to: ${outputPath}`);
      }
    } catch (error) {
      spinner.fail(`${mode} mode failed`);
      logger.error(
        "SPARC execution failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private buildSparcPrompt(mode: AgentMode, task: string): string {
    const modePrompts: Record<AgentMode, string> = {
      architect: `You are an expert system architect. Design scalable, maintainable solutions using best practices and design patterns.`,
      coder: `You are an expert programmer. Write clean, efficient, and well-documented code following best practices.`,
      tester: `You are a testing specialist. Create comprehensive test cases and implement test-driven development practices.`,
      debugger: `You are a debugging expert. Identify and fix issues systematically, considering root causes and edge cases.`,
      security: `You are a security specialist. Identify vulnerabilities and implement secure coding practices.`,
      documentation: `You are a technical writer. Create clear, comprehensive documentation for developers and users.`,
      integrator: `You are a system integration expert. Connect components and ensure seamless interoperability.`,
      monitor: `You are a monitoring specialist. Implement observability and performance tracking solutions.`,
      optimizer: `You are a performance optimization expert. Improve efficiency and resource utilization.`,
      ask: `You are a task formulation expert. Help clarify requirements and break down complex problems.`,
      devops: `You are a DevOps engineer. Implement deployment, infrastructure, and automation solutions.`,
      tutorial: `You are an educational expert. Create step-by-step learning materials and tutorials.`,
      database: `You are a database administrator. Design and optimize data storage and retrieval systems.`,
      specification: `You are a requirements analyst. Write clear specifications and pseudocode.`,
      mcp: `You are an integration specialist. Connect external services and APIs using MCP protocols.`,
      orchestrator: `You are a workflow orchestrator. Coordinate complex multi-step processes.`,
      designer: `You are a UI/UX designer. Create intuitive and visually appealing user interfaces.`,
      product: `You are a product management expert. Define product requirements, prioritize features, and manage stakeholder expectations.`,
      qa: `You are a quality assurance specialist. Design comprehensive QA processes and ensure end-to-end quality.`,
      reviewer: `You are a code review specialist. Analyze code quality, identify technical debt, and enforce coding standards.`,
      research: `You are a research and development specialist. Explore new technologies and conduct feasibility studies.`,
      cloud: `You are a cloud architecture specialist. Design cloud-native solutions and serverless architectures.`,
      sre: `You are a site reliability engineering specialist. Design reliable systems and implement incident response procedures.`,
      ai: `You are an AI and machine learning specialist. Design ML pipelines and implement AI solutions.`,
      ux: `You are a UX research specialist. Conduct user research and optimize user experiences.`,
      mobile: `You are a mobile development specialist. Design and implement mobile applications for iOS and Android.`,
      api: `You are an API design and integration specialist. Create efficient REST APIs and real-time connections.`,
      performance: `You are a performance optimization specialist. Analyze and optimize application performance.`,
      release: `You are a release management specialist. Plan and coordinate software releases and deployments.`,
    };

    const basePrompt = modePrompts[mode] || modePrompts.coder;

    return `${basePrompt}

## Task Description
${task}

## SPARC Methodology
Please follow the SPARC methodology in your response:

1. **Specification**: Define what needs to be done
2. **Pseudocode**: Outline the approach
3. **Architecture**: Design the solution
4. **Refinement**: Iterate and improve
5. **Completion**: Deliver the final result

Be thorough, systematic, and consider edge cases. Provide practical, actionable solutions.`;
  }

  private getModeIcon(mode: AgentMode): string {
    const icons: Record<AgentMode, string> = {
      architect: "🏗️",
      coder: "🧠",
      tester: "🧪",
      debugger: "🪲",
      security: "🛡️",
      documentation: "📚",
      integrator: "🔗",
      monitor: "📈",
      optimizer: "🧹",
      ask: "❓",
      devops: "🚀",
      tutorial: "📘",
      database: "🔐",
      specification: "📋",
      mcp: "♾️",
      orchestrator: "⚡",
      designer: "🎨",
      product: "📊",
      qa: "🔍",
      reviewer: "👁️",
      research: "🔬",
      cloud: "☁️",
      sre: "🚨",
      ai: "🤖",
      ux: "👥",
      mobile: "📱",
      api: "🌐",
      performance: "🏃",
      release: "📦",
    };

    return icons[mode] || "🤖";
  }

  private getMimeType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      pdf: "application/pdf",
      txt: "text/plain",
      md: "text/markdown",
    };

    return mimeTypes[ext || ""] || "application/octet-stream";
  }
}
