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

    // Create comprehensive configuration
    const config = await this.createConfiguration(options.sparc);
    await fs.writeJson(path.join(projectPath, '.gemini-flow.json'), config, { spaces: 2 });

    // Create README if doesn't exist
    const readmePath = path.join(projectPath, 'README.md');
    if (!(await fs.pathExists(readmePath))) {
      await this.createReadme(readmePath);
    }

    console.log(chalk.green('✓ Project initialized successfully!'));
    console.log(chalk.green('✓ Configuration includes all 17 SPARC agent modes'));
    console.log(chalk.yellow('\nNext steps:'));
    console.log('  1. Set your GEMINI_API_KEY environment variable');
    console.log('  2. Run: gemini-flow auth --login (for Google Account auth)');
    console.log('  3. Run: gemini-flow sparc orchestrator "Plan my project"');
    console.log('  4. Or run: gemini-flow start --task "Your project description"');
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

  private async createConfiguration(sparc?: boolean): Promise<any> {
    // Load comprehensive default configuration template
    try {
      const templatePath = path.join(__dirname, '..', '..', 'templates', 'default-config.json');
      const templateContent = await fs.readFile(templatePath, 'utf8');
      let config = JSON.parse(templateContent);

      // Ask user for customization options
      const questions = [
        {
          type: 'input',
          name: 'maxAgents',
          message: 'Maximum concurrent agents:',
          default: config.maxAgents.toString(),
          validate: (input: string) => {
            const num = parseInt(input);
            return num > 0 && num <= 15 ? true : 'Please enter a number between 1 and 15';
          },
        },
        {
          type: 'list',
          name: 'workflow',
          message: 'Choose default workflow:',
          choices: [
            { name: 'Standard - Comprehensive development workflow', value: 'standard' },
            { name: 'Rapid - Fast prototyping and MVP development', value: 'rapid' },
            { name: 'Security-First - Security-focused development', value: 'security-first' },
            { name: 'Custom - I will configure workflows later', value: 'custom' }
          ],
          default: 'standard',
        },
        {
          type: 'list',
          name: 'authMethod',
          message: 'Preferred authentication method:',
          choices: [
            { name: 'Google Account (Recommended)', value: 'google-account' },
            { name: 'API Key', value: 'api-key' }
          ],
          default: 'google-account',
        }
      ];

      const answers = await inquirer.prompt(questions);

      // Update config with user choices
      config.maxAgents = parseInt(answers.maxAgents);
      config.authMethod = answers.authMethod;

      // Set workflow based on choice
      if (answers.workflow === 'rapid') {
        config.defaultWorkflow = config.alternativeWorkflows.rapid;
        config.defaultWorkflow.enabled = true;
      } else if (answers.workflow === 'security-first') {
        config.defaultWorkflow = config.alternativeWorkflows['security-first'];
        config.defaultWorkflow.enabled = true;
      } else if (answers.workflow === 'custom') {
        config.defaultWorkflow.enabled = false;
      }

      // Remove alternative workflows from final config to keep it clean
      delete config.alternativeWorkflows;

      // Add SPARC-specific settings if requested
      if (sparc) {
        config.features.sparkMethodology = true;
        config.execution.parallelExecution = true;
      }

      return config;

    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not load comprehensive template, using basic configuration'));

      // Fallback to basic configuration
      const basicQuestions = [
        {
          type: 'input',
          name: 'maxAgents',
          message: 'Maximum concurrent agents:',
          default: '5',
          validate: (input: string) => {
            const num = parseInt(input);
            return num > 0 && num <= 10 ? true : 'Please enter a number between 1 and 10';
          },
        }
      ];

      const answers = await inquirer.prompt(basicQuestions);

      return {
        maxAgents: parseInt(answers.maxAgents),
        memoryPath: './.gemini-flow/memory.json',
        authMethod: 'google-account',
        modes: {
          architect: { temperature: 0.7, maxTokens: 4096 },
          coder: { temperature: 0.3, maxTokens: 4096 },
          tester: { temperature: 0.2, maxTokens: 3072 },
          orchestrator: { temperature: 0.5, maxTokens: 4096 }
        },
        defaultWorkflow: {
          enabled: true,
          tasks: [
            { mode: 'orchestrator', description: 'Plan the project', priority: 'high' },
            { mode: 'architect', description: 'Design architecture', priority: 'high', dependencies: ['orchestrator'] },
            { mode: 'coder', description: 'Implement solution', priority: 'medium', dependencies: ['architect'] }
          ]
        }
      };
    }
  }

  private async createReadme(readmePath: string): Promise<void> {
    const content = `# Gemini Code Flow Project
# Gemini Code Flow Project

This project uses Gemini Code Flow for AI-powered development orchestration with full SPARC methodology support.

## Getting Started

\`\`\`bash
# Authenticate (choose one method)
gemini-flow auth --login              # Google Account (recommended)
export GEMINI_API_KEY="your-key"      # API Key method

# Multi-agent development workflow
gemini-flow start --task "Build a web application with user authentication"

# Individual SPARC modes (all 17 modes available)
gemini-flow sparc orchestrator "Plan my project architecture"
gemini-flow sparc architect "Design system architecture"
gemini-flow sparc coder "Implement the core features"
gemini-flow sparc tester "Create comprehensive tests"
gemini-flow sparc security "Review security requirements"
gemini-flow sparc documentation "Create user documentation"
\`\`\`

## Available Commands

- \`gemini-flow list\` - Show all 17 available SPARC modes
- \`gemini-flow status\` - Check authentication and system status
- \`gemini-flow auth --login\` - Authenticate with Google Account
- \`gemini-flow start --task "description"\` - Multi-agent development
- \`gemini-flow sparc <mode> <task>\` - Run specific SPARC mode
- \`gemini-flow agent <task>\` - Run single agent task

## SPARC Modes Available

All 17 specialized agents are configured and ready:
🏗️ architect, 🧠 coder, 🧪 tester, 🪲 debugger, 🛡️ security, 📚 documentation,
🔗 integrator, 📈 monitor, 🧹 optimizer, ❓ ask, 🚀 devops, 📘 tutorial,
🔐 database, 📋 specification, ♾️ mcp, ⚡ orchestrator, 🎨 designer

## Configuration

Your \`.gemini-flow.json\` includes comprehensive settings for all modes, workflows, and features.
Customize agent behavior, workflows, and system settings as needed.

Built with Gemini Code Flow - adapted from Claude Code Flow by ruvnet.
`;

    await fs.writeFile(readmePath, content);
  }
}
