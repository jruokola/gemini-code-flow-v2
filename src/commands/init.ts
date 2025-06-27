/**
 * Init Command for Gemini Code Flow
 * Adapted from Claude Code Flow by ruvnet
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';

export class InitCommand {
  async execute(options: { sparc?: boolean; path?: string }): Promise<void> {
    const projectPath = path.resolve(options.path || '.');
    
    console.log(chalk.cyan('🚀 Initializing Gemini Code Flow project...'));
    
    // Create project structure
    await this.createProjectStructure(projectPath);
    
    // Create configuration
    const config = await this.createConfiguration(options.sparc);
    await fs.writeJson(path.join(projectPath, '.gemini-flow.json'), config, { spaces: 2 });
    
    // Create README if doesn't exist
    const readmePath = path.join(projectPath, 'README.md');
    if (!(await fs.pathExists(readmePath))) {
      await this.createReadme(readmePath);
    }
    
    console.log(chalk.green('✓ Project initialized successfully!'));
    console.log(chalk.yellow('\nNext steps:'));
    console.log('  1. Set your GEMINI_API_KEY environment variable');
    console.log('  2. Run: gemini-flow sparc architect "Design my system"');
    console.log('  3. Or run: gemini-flow start (for interactive mode)');
  }

  private async createProjectStructure(projectPath: string): Promise<void> {
    const dirs = [
      'src',
      'tests',
      'docs',
      '.gemini-flow',
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectPath, dir));
    }
  }

  private async createConfiguration(sparc?: boolean): Promise<Record<string, unknown>> {
    const questions = [
      {
        type: 'input',
        name: 'maxAgents',
        message: 'Maximum concurrent agents:',
        default: '5',
        validate: (input: string) => {
          const num = parseInt(input);
          return num > 0 && num <= 10 ? true : 'Please enter a number between 1 and 10';
        },
      },
      {
        type: 'list',
        name: 'defaultMode',
        message: 'Default agent mode:',
        choices: [
          'architect',
          'coder',
          'tester',
          'debugger',
          'documentation',
        ],
        default: 'coder',
      },
    ];

    interface InitAnswers {
      maxAgents: string;
      defaultMode: string;
    }

    const answers: InitAnswers = await inquirer.prompt(questions);

    return {
      maxAgents: parseInt(answers.maxAgents),
      memoryPath: './.gemini-flow/memory.json',
      defaultMode: answers.defaultMode,
      modes: {
        architect: {
          temperature: 0.7,
          maxTokens: 8000,
        },
        coder: {
          temperature: 0.3,
          maxTokens: 4000,
        },
        tester: {
          temperature: 0.2,
          maxTokens: 4000,
        },
      },
      ...(sparc && {
        sparc: {
          enabled: true,
          methodology: 'systematic',
          parallelExecution: true,
        },
      }),
    };
  }

  private async createReadme(readmePath: string): Promise<void> {
    const content = `# Gemini Code Flow Project

This project uses Gemini Code Flow for AI-powered development orchestration.

## Getting Started

\`\`\`bash
# Set your API key
export GEMINI_API_KEY="your-api-key-here"

# Run SPARC modes
gemini-flow sparc architect "Design system architecture"
gemini-flow sparc coder "Implement the core features"
gemini-flow sparc tester "Create comprehensive tests"

# Or start interactive mode
gemini-flow start
\`\`\`

## Available Commands

- \`gemini-flow list\` - Show available SPARC modes
- \`gemini-flow agent <task>\` - Run single agent task
- \`gemini-flow sparc <mode> <task>\` - Run SPARC development mode
- \`gemini-flow start\` - Start interactive orchestrator

## Configuration

Edit \`.gemini-flow.json\` to customize your setup.

Built with Gemini Code Flow - adapted from Claude Code Flow by ruvnet.
`;

    await fs.writeFile(readmePath, content);
  }
}