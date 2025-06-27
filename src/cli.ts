#!/usr/bin/env node

/**
 * Gemini Code Flow CLI
 * Adapted from Claude Code Flow by ruvnet
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { Orchestrator } from './core/orchestrator';
import { SparcCommand } from './commands/sparc';
import { InitCommand } from './commands/init';
import { AgentCommand } from './commands/agent';
import { AuthHelper } from './utils/auth-helper';
import { Task } from './types';
import * as fs from 'fs';
import * as path from 'path';
const packageJson = require('../package.json');
const version = packageJson.version;

const program = new Command();

// ASCII art banner
const banner = `
${chalk.cyan(`
╔═══════════════════════════════════════════╗
║                                           ║
║      🚀 GEMINI CODE FLOW v${version}        ║
║                                           ║
║   AI-Powered Development Orchestration    ║
║                                           ║
║     Adapted from Claude Code Flow         ║
║         by ruvnet                         ║
║                                           ║
╚═══════════════════════════════════════════╝
`)}
`;

program
  .name('gemini-flow')
  .description('AI-powered development orchestration for Gemini CLI')
  .version(version)
  .addHelpText('before', banner);

// Init command
program
  .command('init')
  .description('Initialize a new Gemini Code Flow project')
  .option('--sparc', 'Initialize with SPARC methodology')
  .option('--path <path>', 'Project path', '.')
  .action(async (options) => {
    const init = new InitCommand();
    await init.execute(options);
  });

// SPARC command
program
  .command('sparc [mode] [task]')
  .description('Run SPARC development mode')
  .option('-f, --file <file>', 'Input file for multimodal processing')
  .option('-p, --parallel <number>', 'Number of parallel agents', '3')
  .option('-m, --memory <path>', 'Memory bank path', './gemini-memory.json')
  .action(async (mode, task, options) => {
    const sparc = new SparcCommand();
    await sparc.execute(mode, task, options);
  });

// Agent command
program
  .command('agent <task>')
  .description('Run a single agent task')
  .option('-m, --mode <mode>', 'Agent mode', 'coder')
  .option('-s, --stream', 'Stream output in real-time')
  .action(async (task, options) => {
    const agent = new AgentCommand();
    await agent.execute(task, options);
  });

// Authentication command
program
  .command('auth')
  .description('Manage authentication for Gemini API')
  .option('--status', 'Check authentication status')
  .option('--login', 'Start authentication flow')
  .action(async (options) => {
    const authHelper = new AuthHelper({
      authMethod: 'google-account',
      refreshTokens: true,
      checkInterval: 300000
    });

    if (options.status) {
      const info = await authHelper.getAuthInfo();
      console.log(`Authentication Status: ${info}`);
      return;
    }

    if (options.login) {
      const success = await authHelper.authenticate();
      process.exit(success ? 0 : 1);
      return;
    }

    // Default: check status and authenticate if needed
    const authenticated = await authHelper.ensureAuthenticated();
    if (authenticated) {
      console.log(chalk.green('✅ Authentication successful!'));
    } else {
      console.log(chalk.red('❌ Authentication failed'));
      process.exit(1);
    }
  });

// Start command
program
  .command('start')
  .description('Start the orchestrator in interactive mode')
  .option('-c, --config <file>', 'Configuration file', '.gemini-flow.json')
  .option('-t, --task <task>', 'Initial task for multi-agent development')
  .option('--no-auth', 'Skip authentication check')
  .action(async (options) => {
    console.log(chalk.cyan('Starting Gemini Code Flow Orchestrator...'));

    try {
      // Check authentication first
      if (!options.noAuth) {
        const authHelper = new AuthHelper({
          authMethod: 'google-account',
          refreshTokens: true,
          checkInterval: 300000
        });

        const authenticated = await authHelper.ensureAuthenticated();
        if (!authenticated) {
          console.log(chalk.red('❌ Authentication required to start orchestrator'));
          process.exit(1);
        }
      }

      // Load configuration
      let config;
      try {
        config = require(options.config);
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Configuration file ${options.config} not found`));
        console.log(chalk.blue('Creating comprehensive default configuration...'));

        // Load comprehensive default config template
        try {
          const templatePath = path.join(__dirname, '..', 'templates', 'default-config.json');
          const templateContent = fs.readFileSync(templatePath, 'utf8');
          config = JSON.parse(templateContent);

          // Save the config file for future use
          fs.writeFileSync(options.config, JSON.stringify(config, null, 2));
          console.log(chalk.green(`✓ Created ${options.config} with all SPARC modes configured`));
        } catch (templateError) {
          console.log(chalk.yellow('⚠️  Could not load template, using minimal config'));
          // Fallback to minimal config
          config = {
            maxAgents: 5,
            memoryPath: './gemini-memory.json',
            authMethod: 'google-account',
            modes: {}
          };
        }
      }

      const orchestrator = new Orchestrator(config);

      orchestrator.on('started', () => {
        console.log(chalk.green('✓ Orchestrator started successfully'));
      });

      orchestrator.on('agentSpawned', (agent) => {
        console.log(chalk.blue(`🤖 Agent ${agent.id} spawned in ${agent.mode} mode`));
      });

      orchestrator.on('agentCompleted', (agent) => {
        console.log(chalk.green(`✓ Agent ${agent.id} completed successfully`));
      });

      orchestrator.on('taskCompleted', (task) => {
        console.log(chalk.cyan(`📋 Task completed: ${task.description}`));
      });

      await orchestrator.start();

      // Add initial task if provided
      if (options.task) {
        console.log(chalk.blue(`📝 Adding initial task: ${options.task}`));

        // Create orchestrator task to break down the work
        const initialTask: Task = {
          id: `task-${Date.now()}`,
          description: `Orchestrate multi-agent development for: ${options.task}`,
          mode: 'orchestrator',
          priority: 'high',
          dependencies: [],
          status: 'pending'
        };

        await orchestrator.addTask(initialTask);
      } else if (config.defaultWorkflow?.enabled) {
        console.log(chalk.blue('📋 Loading default workflow tasks...'));

        // Add default workflow tasks
        for (const taskConfig of config.defaultWorkflow.tasks) {
          const task: Task = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            description: taskConfig.description,
            mode: taskConfig.mode,
            priority: taskConfig.priority || 'medium',
            dependencies: taskConfig.dependencies || [],
            status: 'pending'
          };

          await orchestrator.addTask(task);
        }
      } else {
        console.log(chalk.yellow('💡 No initial tasks provided. Use -t option or add tasks via the API'));
      }

      // Keep process alive
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\nGracefully shutting down...'));
        await orchestrator.stop();
        process.exit(0);
      });

    } catch (error) {
      console.error(chalk.red('Error starting orchestrator:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List available SPARC modes')
  .action(() => {
    console.log(chalk.cyan('\nAvailable SPARC Development Modes:\n'));

    const modes = [
      { icon: '🏗️', name: 'architect', desc: 'System design and architecture' },
      { icon: '🧠', name: 'coder', desc: 'Clean, modular implementation' },
      { icon: '🧪', name: 'tester', desc: 'Test-driven development' },
      { icon: '🪲', name: 'debugger', desc: 'Troubleshooting and bug fixes' },
      { icon: '🛡️', name: 'security', desc: 'Security audits and reviews' },
      { icon: '📚', name: 'documentation', desc: 'Comprehensive documentation' },
      { icon: '🔗', name: 'integrator', desc: 'Component integration' },
      { icon: '📈', name: 'monitor', desc: 'Performance monitoring' },
      { icon: '🧹', name: 'optimizer', desc: 'Code optimization' },
      { icon: '❓', name: 'ask', desc: 'Task formulation guide' },
      { icon: '🚀', name: 'devops', desc: 'Deployment and infrastructure' },
      { icon: '📘', name: 'tutorial', desc: 'Interactive learning' },
      { icon: '🔐', name: 'database', desc: 'Database management' },
      { icon: '📋', name: 'specification', desc: 'Requirements and pseudocode' },
      { icon: '♾️', name: 'mcp', desc: 'External service integration' },
      { icon: '⚡', name: 'orchestrator', desc: 'Complex workflows' },
      { icon: '🎨', name: 'designer', desc: 'UI/UX with multimodal' },
    ];

    modes.forEach(mode => {
      console.log(`  ${mode.icon} ${chalk.yellow(mode.name.padEnd(15))} ${mode.desc}`);
    });

    console.log(chalk.gray('\nExample: gemini-flow sparc architect "Design a REST API"'));
  });

// Status command
program
  .command('status')
  .description('Show orchestrator and authentication status')
  .action(async () => {
    console.log(chalk.cyan('🔍 Gemini Code Flow Status\n'));

    // Check authentication
    const authHelper = new AuthHelper({
      authMethod: 'google-account',
      refreshTokens: true,
      checkInterval: 300000
    });

    const authInfo = await authHelper.getAuthInfo();
    console.log(`Authentication: ${authInfo}`);

    // Check Gemini CLI
    const cliAvailable = await authHelper.checkGeminiCLI();
    console.log(`Gemini CLI: ${cliAvailable ? chalk.green('✅ Available') : chalk.red('❌ Not found')}`);

    // TODO: Add orchestrator status when implemented
    console.log(`Orchestrator: ${chalk.yellow('⚠️ Status checking not yet implemented')}`);
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
