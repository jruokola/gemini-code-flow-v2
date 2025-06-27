#!/usr/bin/env node

/**
 * Gemini Code Flow CLI
 * Adapted from Claude Code Flow by ruvnet
 */

import { Command } from "commander";
import chalk from "chalk";
import { Orchestrator } from "./core/orchestrator";
import { SparcCommand } from "./commands/sparc";
import { InitCommand } from "./commands/init";
import { AgentCommand } from "./commands/agent";
import { AuthHelper } from "./utils/auth-helper";
import { Logger, LogLevel, OutputFormat } from "./utils/logger";
import { Task } from "./types";
import * as fs from "fs";
import * as path from "path";
const packageJson = require("../package.json");
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
  .name("gemini-flow")
  .description("AI-powered development orchestration for Gemini CLI")
  .version(version)
  .addHelpText("before", banner)
  .option("-q, --quiet", "Silent mode - only show errors")
  .option(
    "-v, --verbose",
    "Verbose output (use -vv for debug)",
    (_, prev) => prev + 1,
    0,
  )
  .option("--debug", "Enable debug logging")
  .option("--compact", "Use compact output format")
  .option("--progress", "Show progress bars")
  .option(
    "--filter <agents>",
    "Filter output to specific agents (comma-separated)",
  )
  .addHelpText(
    "after",
    `
${chalk.cyan("Verbosity Control:")}
  ${chalk.yellow("-q, --quiet")}          Silent mode - only errors and critical events
  ${chalk.yellow("-v, --verbose")}        Detailed progress (agent delegations, context)
  ${chalk.yellow("-vv")}                  Debug mode (full API calls, memory operations)
  ${chalk.yellow("--debug")}              Same as -vv, full debug information
  ${chalk.yellow("--compact")}            Single-line status updates
  ${chalk.yellow("--progress")}           Progress bars for large workflows
  ${chalk.yellow("--filter architect,coder")} Show only specific agent types

${chalk.cyan("Examples:")}
  ${chalk.gray("# Minimal output for large workflows")}
  gemini-flow start --task "Build API" --compact

  ${chalk.gray("# Debug mode with full details")}
  gemini-flow start --task "Build API" --debug

  ${chalk.gray("# Monitor only specific agents")}
  gemini-flow start --task "Build API" --filter architect,coder,tester

  ${chalk.gray("# Progress bar for CI/CD environments")}
  gemini-flow start --task "Build API" --progress --quiet

  ${chalk.gray("# Generate actual code files with Gemini CLI")}
  gemini-flow sparc coder "Create a REST API" --cli

  ${chalk.gray("# Auto-accept all file operations")}
  gemini-flow sparc architect "Design app structure" --code --yolo

${chalk.cyan("Code Generation:")}
  ${chalk.yellow("--cli, --code")}         Use Gemini CLI for file operations (default: enabled)
  ${chalk.yellow("--no-cli")}             Disable file operations, text generation only
  ${chalk.yellow("--yolo")}               Auto-accept all file changes (default: enabled)
  ${chalk.yellow("--no-yolo")}            Require manual confirmation for file operations
  ${chalk.gray("Note: CLI mode with YOLO is enabled by default for seamless operation")}

${chalk.cyan("Log Levels:")}
  ${chalk.green("SILENT")}     Only errors and critical milestones
  ${chalk.blue("MINIMAL")}     Agent start/complete, major progress
  ${chalk.white("NORMAL")}      Standard development output (default)
  ${chalk.gray("VERBOSE")}     Detailed delegation and context info
  ${chalk.dim("DEBUG")}       Full API calls and internal operations
`,
  );

// Init command
program
  .command("init")
  .description("Initialize a new Gemini Code Flow project")
  .option("--sparc", "Initialize with SPARC methodology")
  .option("--path <path>", "Project path", ".")
  .action(async (options) => {
    const init = new InitCommand();
    await init.execute(options);
  });

// SPARC command
program
  .command("sparc [mode] [task]")
  .description("Run SPARC development mode")
  .option("-f, --file <file>", "Input file for multimodal processing")
  .option("-p, --parallel <number>", "Number of parallel agents", "3")
  .option("-m, --memory <path>", "Memory bank path", "./gemini-memory.json")
  .option("--cli", "Use Gemini CLI for file operations (default)")
  .option("--no-cli", "Disable CLI mode, use text generation only")
  .option("--yolo", "Auto-accept all file changes (default)")
  .option("--no-yolo", "Require manual confirmation for file operations")
  .action(async (mode, task, options, cmd) => {
    // Setup logging based on global options
    const globalOpts = cmd.parent?.opts() || {};
    const logLevel = Logger.getVerbosityFromFlags({
      quiet: globalOpts.quiet,
      verbose: globalOpts.verbose,
      debug: globalOpts.debug,
    });

    Logger.setGlobalLevel(logLevel);

    if (globalOpts.compact) {
      Logger.setGlobalFormat(OutputFormat.COMPACT);
    }

    if (globalOpts.filter) {
      const agents = globalOpts.filter
        .split(",")
        .map((a: string) => a.trim().toLowerCase());
      Logger.setAgentFilter(agents);
    }

    const sparc = new SparcCommand();
    await sparc.execute(mode, task, { ...options, ...globalOpts });
  });

// Agent command
program
  .command("agent <task>")
  .description("Run a single agent task")
  .option("-m, --mode <mode>", "Agent mode", "coder")
  .option("-s, --stream", "Stream output in real-time")
  .action(async (task, options) => {
    const agent = new AgentCommand();
    await agent.execute(task, options);
  });

// Authentication command
program
  .command("auth")
  .description("Manage authentication for Gemini API")
  .option("--status", "Check authentication status")
  .option("--login", "Start authentication flow")
  .action(async (options) => {
    const authHelper = new AuthHelper({
      authMethod: "google-account",
      refreshTokens: true,
      checkInterval: 300000,
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
      console.log(chalk.green("✅ Authentication successful!"));
    } else {
      console.log(chalk.red("❌ Authentication failed"));
      process.exit(1);
    }
  });

// Start command
program
  .command("start")
  .description("Start the orchestrator in interactive mode")
  .option("-c, --config <file>", "Configuration file", ".gemini-flow.json")
  .option("-t, --task <task>", "Initial task for multi-agent development")
  .option("--no-auth", "Skip authentication check")
  .option("--cli", "Use Gemini CLI for file operations (default)")
  .option("--no-cli", "Disable CLI mode, use text generation only")
  .option("--yolo", "Auto-accept all file changes (default)")
  .option("--no-yolo", "Require manual confirmation for file operations")
  .action(async (options, cmd) => {
    // Setup logging based on global options
    const globalOpts = cmd.parent?.opts() || {};
    const logLevel = Logger.getVerbosityFromFlags({
      quiet: globalOpts.quiet,
      verbose: globalOpts.verbose,
      debug: globalOpts.debug,
    });

    Logger.setGlobalLevel(logLevel);

    if (globalOpts.compact) {
      Logger.setGlobalFormat(OutputFormat.COMPACT);
    } else if (globalOpts.progress) {
      Logger.setGlobalFormat(OutputFormat.PROGRESS);
      Logger.enableProgress(true);
    }

    if (globalOpts.filter) {
      const agents = globalOpts.filter
        .split(",")
        .map((a: string) => a.trim().toLowerCase());
      Logger.setAgentFilter(agents);
    }
    console.log(chalk.cyan("Starting Gemini Code Flow Orchestrator..."));

    try {
      // Check authentication first
      if (!options.noAuth) {
        const authHelper = new AuthHelper({
          authMethod: "google-account",
          refreshTokens: true,
          checkInterval: 300000,
        });

        const authenticated = await authHelper.ensureAuthenticated();
        if (!authenticated) {
          console.log(
            chalk.red("❌ Authentication required to start orchestrator"),
          );
          process.exit(1);
        }
      }

      // Load configuration
      let config;
      try {
        config = require(options.config);
      } catch (error) {
        console.log(
          chalk.yellow(`⚠️  Configuration file ${options.config} not found`),
        );
        console.log(
          chalk.blue("Creating comprehensive default configuration..."),
        );

        // Load comprehensive default config template
        try {
          const templatePath = path.join(
            __dirname,
            "..",
            "templates",
            "default-config.json",
          );
          const templateContent = fs.readFileSync(templatePath, "utf8");
          config = JSON.parse(templateContent);

          // Save the config file for future use
          fs.writeFileSync(options.config, JSON.stringify(config, null, 2));
          console.log(
            chalk.green(
              `✓ Created ${options.config} with all SPARC modes configured`,
            ),
          );
        } catch (templateError) {
          console.log(
            chalk.yellow("⚠️  Could not load template, using minimal config"),
          );
          // Fallback to minimal config
          config = {
            maxAgents: 5,
            memoryPath: "./gemini-memory.json",
            authMethod: "google-account",
            modes: {},
          };
        }
      }

      // Apply CLI and YOLO defaults and overrides
      const finalConfig = {
        ...config,
        useCLI: options.cli !== false, // Default true, false only with --no-cli
        yolo: options.yolo !== false, // Default true, false only with --no-yolo
        debug: globalOpts.debug || config.debug || false,
        workingDirectory: process.cwd(),
      };

      const orchestrator = new Orchestrator(finalConfig);

      const logger = new Logger("CLI");

      orchestrator.on("started", () => {
        logger.critical("✓ Orchestrator started successfully");
      });

      orchestrator.on("agentSpawned", (agent) => {
        logger.agentStarted(agent.id, agent.mode, agent.task);
      });

      orchestrator.on("agentCompleted", (agent) => {
        const duration = agent.endTime
          ? agent.endTime.getTime() - agent.startTime.getTime()
          : 0;
        logger.agentCompleted(agent.id, agent.mode, duration);
      });

      orchestrator.on("agentFailed", (agent) => {
        const error = agent.error || "Unknown error";
        logger.agentFailed(agent.id, agent.mode, error);
      });

      orchestrator.on("taskCompleted", (task) => {
        logger.verbose(`📋 TASK COMPLETED: ${task.mode.toUpperCase()}`);
        logger.debug(`   Status: ${task.status}`);
        logger.debug(`   Description: ${task.description}`);
      });

      orchestrator.on("taskAdded", (task) => {
        logger.taskQueued(task.mode, task.priority, task.dependencies.length);
        logger.debug(`   Description: ${task.description}`);
      });

      await orchestrator.start();

      // Add initial task if provided
      if (options.task) {
        logger.info(`📝 Adding initial task: ${options.task}`);

        // Create orchestrator task to break down the work
        const initialTask: Task = {
          id: `task-${Date.now()}`,
          description: `Orchestrate multi-agent development for: ${options.task}`,
          mode: "orchestrator",
          priority: "high",
          dependencies: [],
          status: "pending",
        };

        await orchestrator.addTask(initialTask);
      } else if (config.defaultWorkflow?.enabled) {
        logger.info("📋 Loading default workflow tasks...");

        // Add default workflow tasks
        for (const taskConfig of config.defaultWorkflow.tasks) {
          const task: Task = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            description: taskConfig.description,
            mode: taskConfig.mode,
            priority: taskConfig.priority || "medium",
            dependencies: taskConfig.dependencies || [],
            status: "pending",
          };

          await orchestrator.addTask(task);
        }
      } else {
        logger.minimal(
          "💡 No initial tasks provided. Use -t option or add tasks via the API",
        );
      }

      // Monitor orchestrator status
      const statusInterval = setInterval(
        () => {
          const status = orchestrator.getStatus();
          if (status.activeAgents > 0 || status.pendingTasks > 0) {
            logger.progressUpdate(
              status.activeAgents,
              status.pendingTasks,
              status.completedAgents,
              status.failedAgents,
            );
          } else if (status.completedAgents > 0) {
            logger.critical(
              `🎉 All agents completed! Total: ${status.completedAgents} agents`,
            );
            clearInterval(statusInterval);
            process.exit(0);
          }
        },
        globalOpts.progress ? 2000 : 10000,
      ); // Faster updates for progress mode

      // Keep process alive and handle graceful shutdown
      let shutdownRequested = false;
      process.on("SIGINT", async () => {
        if (shutdownRequested) {
          console.log(chalk.red("\nForced shutdown..."));
          process.exit(1);
        }
        shutdownRequested = true;
        logger.warn(
          "\n🛑 Graceful shutdown requested... (Press Ctrl+C again to force)",
        );
        clearInterval(statusInterval);
        await orchestrator.stop();
        process.exit(0);
      });

      // Prevent early exit - keep alive until no more work
      const keepAlive = setInterval(() => {
        const status = orchestrator.getStatus();
        if (
          status.activeAgents === 0 &&
          status.pendingTasks === 0 &&
          status.completedAgents > 0
        ) {
          clearInterval(keepAlive);
          clearInterval(statusInterval);
          logger.critical(`\n🎉 Multi-agent workflow completed successfully!`);
          logger.info(
            `📈 Final stats: ${status.completedAgents} agents completed, ${status.failedAgents} failed`,
          );
          process.exit(0);
        }
      }, 2000);
    } catch (error) {
      console.error(
        chalk.red("Error starting orchestrator:"),
        error instanceof Error ? error.message : "Unknown error",
      );
      process.exit(1);
    }
  });

// List command
program
  .command("list")
  .description("List available SPARC modes")
  .action(() => {
    console.log(chalk.cyan("\nAvailable SPARC Development Modes:\n"));

    const modes = [
      { icon: "🏗️", name: "architect", desc: "System design and architecture" },
      { icon: "🧠", name: "coder", desc: "Clean, modular implementation" },
      { icon: "🧪", name: "tester", desc: "Test-driven development" },
      { icon: "🪲", name: "debugger", desc: "Troubleshooting and bug fixes" },
      { icon: "🛡️", name: "security", desc: "Security audits and reviews" },
      {
        icon: "📚",
        name: "documentation",
        desc: "Comprehensive documentation",
      },
      { icon: "🔗", name: "integrator", desc: "Component integration" },
      { icon: "📈", name: "monitor", desc: "Performance monitoring" },
      { icon: "🧹", name: "optimizer", desc: "Code optimization" },
      { icon: "❓", name: "ask", desc: "Task formulation guide" },
      { icon: "🚀", name: "devops", desc: "Deployment and infrastructure" },
      { icon: "📘", name: "tutorial", desc: "Interactive learning" },
      { icon: "🔐", name: "database", desc: "Database management" },
      {
        icon: "📋",
        name: "specification",
        desc: "Requirements and pseudocode",
      },
      { icon: "♾️", name: "mcp", desc: "External service integration" },
      { icon: "⚡", name: "orchestrator", desc: "Complex workflows" },
      { icon: "🎨", name: "designer", desc: "UI/UX with multimodal" },
      {
        icon: "📊",
        name: "product",
        desc: "Product requirements and feature management",
      },
      {
        icon: "🔍",
        name: "qa",
        desc: "Quality assurance and process optimization",
      },
      {
        icon: "👁️",
        name: "reviewer",
        desc: "Code quality and technical debt management",
      },
      {
        icon: "🔬",
        name: "research",
        desc: "Technology exploration and feasibility analysis",
      },
      {
        icon: "☁️",
        name: "cloud",
        desc: "Cloud-native architectures and infrastructure",
      },
      {
        icon: "🚨",
        name: "sre",
        desc: "System reliability and incident response",
      },
      { icon: "🤖", name: "ai", desc: "Machine learning and AI integration" },
      {
        icon: "👥",
        name: "ux",
        desc: "User research and experience optimization",
      },
      { icon: "📱", name: "mobile", desc: "Mobile application development" },
      { icon: "🌐", name: "api", desc: "API design and integration" },
      {
        icon: "🏃",
        name: "performance",
        desc: "Application performance optimization",
      },
      {
        icon: "📦",
        name: "release",
        desc: "Release planning and deployment coordination",
      },
    ];

    modes.forEach((mode) => {
      console.log(
        `  ${mode.icon} ${chalk.yellow(mode.name.padEnd(15))} ${mode.desc}`,
      );
    });

    console.log(
      chalk.gray('\nExample: gemini-flow sparc architect "Design a REST API"'),
    );
  });

// Status command
program
  .command("status")
  .description("Show orchestrator and authentication status")
  .action(async (options, cmd) => {
    const globalOpts = cmd.parent?.opts() || {};
    const logLevel = Logger.getVerbosityFromFlags({
      quiet: globalOpts.quiet,
      verbose: globalOpts.verbose,
      debug: globalOpts.debug,
    });

    Logger.setGlobalLevel(logLevel);
    const logger = new Logger("Status");

    logger.critical("🔍 Gemini Code Flow Status");

    // Check authentication
    const authHelper = new AuthHelper({
      authMethod: "google-account",
      refreshTokens: true,
      checkInterval: 300000,
    });

    const authInfo = await authHelper.getAuthInfo();
    logger.info(`Authentication: ${authInfo}`);

    // Check Gemini CLI
    const cliAvailable = await authHelper.checkGeminiCLI();
    const cliStatus = cliAvailable
      ? chalk.green("✅ Available")
      : chalk.red("❌ Not found");
    logger.info(`Gemini CLI: ${cliStatus}`);

    // TODO: Add orchestrator status when implemented
    logger.warn(`Orchestrator: ⚠️ Status checking not yet implemented`);
  });

// Progress command
program
  .command("progress")
  .description("Monitor running workflow progress")
  .option("-w, --watch", "Watch mode - continuous updates")
  .option("-i, --interval <seconds>", "Update interval for watch mode", "5")
  .action(async (options, cmd) => {
    const globalOpts = cmd.parent?.opts() || {};
    const logLevel = Logger.getVerbosityFromFlags({
      quiet: globalOpts.quiet,
      verbose: globalOpts.verbose,
      debug: globalOpts.debug,
    });

    Logger.setGlobalLevel(logLevel);
    if (globalOpts.compact) {
      Logger.setGlobalFormat(OutputFormat.COMPACT);
    }

    const logger = new Logger("Progress");

    try {
      // Check for running memory file
      const memoryPath = "./gemini-memory.json";
      if (!fs.existsSync(memoryPath)) {
        logger.error("No active workflow found");
        logger.info(
          "Start a workflow with: gemini-flow start --task 'your task'",
        );
        return;
      }

      const displayProgress = () => {
        try {
          const memory = JSON.parse(fs.readFileSync(memoryPath, "utf8"));
          const entries = memory.entries || [];

          // Count agent activities
          const agentResults = entries.filter(
            (e: any) => e.type === "result",
          ).length;
          const agentErrors = entries.filter(
            (e: any) => e.type === "error",
          ).length;
          const delegations = entries.filter(
            (e: any) => e.type === "delegation",
          ).length;

          // Group by agent types
          const agentTypes: Record<string, number> = {};
          entries.forEach((entry: any) => {
            if (entry.tags && entry.tags.length > 0) {
              const mode = entry.tags[0];
              agentTypes[mode] = (agentTypes[mode] || 0) + 1;
            }
          });

          logger.critical("📊 Workflow Progress Summary");
          logger.info(`✅ Completed Agents: ${agentResults}`);
          logger.info(`❌ Failed Agents: ${agentErrors}`);
          logger.info(`🔄 Delegations: ${delegations}`);

          if (Object.keys(agentTypes).length > 0) {
            logger.info("\n🤖 Agent Activity:");
            Object.entries(agentTypes)
              .sort(([, a], [, b]) => b - a)
              .forEach(([mode, count]) => {
                logger.info(`   ${mode}: ${count} operations`);
              });
          }

          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            const timeSince =
              Date.now() - new Date(lastEntry.timestamp).getTime();
            logger.verbose(
              `🕐 Last activity: ${Math.round(timeSince / 1000)}s ago`,
            );
          }
        } catch (error) {
          logger.error(
            "Failed to read workflow progress:",
            error instanceof Error ? error.message : "Unknown error",
          );
        }
      };

      if (options.watch) {
        logger.info(
          `👁️  Watching workflow progress (${options.interval}s intervals)`,
        );
        logger.info("Press Ctrl+C to stop watching\n");

        displayProgress();

        const interval = setInterval(
          displayProgress,
          parseInt(options.interval) * 1000,
        );

        process.on("SIGINT", () => {
          clearInterval(interval);
          logger.info("\n👋 Stopped watching workflow progress");
          process.exit(0);
        });

        // Keep process alive
        process.stdin.resume();
      } else {
        displayProgress();
      }
    } catch (error) {
      logger.error(
        "Progress monitoring failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
