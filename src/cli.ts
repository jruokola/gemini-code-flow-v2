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

// Start command
program
  .command('start')
  .description('Start the orchestrator in interactive mode')
  .option('-c, --config <file>', 'Configuration file', '.gemini-flow.json')
  .action(async (options) => {
    console.log(chalk.cyan('Starting Gemini Code Flow Orchestrator...'));
    
    try {
      // Safely load configuration with proper error handling and path validation
      let config = {};
      if (options.config) {
        try {
          const fs = require('fs');
          const path = require('path');
          
          // Validate config file path to prevent directory traversal
          const resolvedConfigPath = path.resolve(options.config);
          const workingDir = process.cwd();
          
          if (!resolvedConfigPath.startsWith(workingDir)) {
            console.warn(chalk.yellow(`⚠ Config file must be within working directory, using defaults`));
          } else if (fs.existsSync(resolvedConfigPath)) {
            const configContent = fs.readFileSync(resolvedConfigPath, 'utf8');
            config = JSON.parse(configContent);
          } else {
            console.warn(chalk.yellow(`⚠ Config file not found: ${options.config}, using defaults`));
          }
        } catch (configError) {
          console.warn(chalk.yellow(`⚠ Error loading config: ${configError instanceof Error ? configError.message : 'Unknown error'}, using defaults`));
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
      
      await orchestrator.start();
      
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
  .description('Show orchestrator status')
  .action(() => {
    console.log(chalk.yellow('Status command not yet implemented'));
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}