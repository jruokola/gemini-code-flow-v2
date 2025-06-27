/**
 * SPARC Command for Gemini Code Flow
 * Adapted from Claude Code Flow by ruvnet
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import { GeminiClient } from '../core/gemini-client';
import { AgentMode } from '../types';

export class SparcCommand {
  async execute(mode: AgentMode, task: string, options: any): Promise<void> {
    if (!mode || !task) {
      console.log(chalk.red('Usage: gemini-flow sparc <mode> <task>'));
      console.log(chalk.yellow('Example: gemini-flow sparc architect "Design a REST API"'));
      return;
    }

    const validModes: AgentMode[] = [
      'architect', 'coder', 'tester', 'debugger', 'security',
      'documentation', 'integrator', 'monitor', 'optimizer',
      'ask', 'devops', 'tutorial', 'database', 'specification',
      'mcp', 'orchestrator', 'designer'
    ];

    if (!validModes.includes(mode)) {
      console.log(chalk.red(`Invalid mode: ${mode}`));
      console.log(chalk.yellow('Run "gemini-flow list" to see available modes'));
      return;
    }

    const spinner = ora(`${this.getModeIcon(mode)} Running ${mode} mode...`).start();

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is required');
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
          mode
        );
      } else {
        result = await client.execute(prompt, mode);
      }

      spinner.succeed(`${this.getModeIcon(mode)} ${mode} completed successfully`);

      console.log(chalk.cyan('\n📋 Result:\n'));
      console.log(result);

      // Save result to file
      const outputPath = `.gemini-flow/${mode}-${Date.now()}.md`;
      await fs.ensureDir('.gemini-flow');
      await fs.writeFile(outputPath, `# ${mode.toUpperCase()} Mode Result\n\n${result}`);

      console.log(chalk.gray(`\n💾 Result saved to: ${outputPath}`));

    } catch (error) {
      spinner.fail(`${mode} mode failed`);
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
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
      architect: '🏗️',
      coder: '🧠',
      tester: '🧪',
      debugger: '🪲',
      security: '🛡️',
      documentation: '📚',
      integrator: '🔗',
      monitor: '📈',
      optimizer: '🧹',
      ask: '❓',
      devops: '🚀',
      tutorial: '📘',
      database: '🔐',
      specification: '📋',
      mcp: '♾️',
      orchestrator: '⚡',
      designer: '🎨',
    };

    return icons[mode] || '🤖';
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
      txt: 'text/plain',
      md: 'text/markdown',
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}
