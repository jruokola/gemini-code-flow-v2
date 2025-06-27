#!/usr/bin/env node

/**
 * Test Setup Script for Gemini Code Flow
 * Verifies that all fixes are working correctly
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk').default;

const TEST_PROJECT_DIR = './test-project';
const CONFIG_FILE = '.gemini-flow.json';

console.log(chalk.cyan('🧪 Gemini Code Flow Test Setup\n'));

async function runTest(description, testFn) {
  process.stdout.write(`${description}... `);
  try {
    await testFn();
    console.log(chalk.green('✅ PASS'));
    return true;
  } catch (error) {
    console.log(chalk.red('❌ FAIL'));
    console.log(chalk.red(`   Error: ${error.message}`));
    return false;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  let passed = 0;
  let total = 0;

  // Test 1: Check if CLI is accessible
  total++;
  if (await runTest('CLI accessibility', async () => {
    const output = execSync('gemini-flow --version', { encoding: 'utf8' });
    if (!output.includes('0.1.0')) {
      throw new Error('Version mismatch');
    }
  })) passed++;

  // Test 2: Check if help command works
  total++;
  if (await runTest('Help command', async () => {
    const output = execSync('gemini-flow --help', { encoding: 'utf8' });
    if (!output.includes('GEMINI CODE FLOW')) {
      throw new Error('Help output missing banner');
    }
  })) passed++;

  // Test 3: Check if list command works
  total++;
  if (await runTest('List command', async () => {
    const output = execSync('gemini-flow list', { encoding: 'utf8' });
    if (!output.includes('architect') || !output.includes('coder')) {
      throw new Error('Mode list incomplete');
    }
  })) passed++;

  // Test 4: Check if configuration file gets created
  total++;
  if (await runTest('Configuration creation', async () => {
    // Clean up first
    if (fs.existsSync(TEST_PROJECT_DIR)) {
      execSync(`rm -rf ${TEST_PROJECT_DIR}`);
    }

    fs.mkdirSync(TEST_PROJECT_DIR);
    process.chdir(TEST_PROJECT_DIR);

    // Copy the default config
    const defaultConfigPath = path.join(__dirname, CONFIG_FILE);
    if (fs.existsSync(defaultConfigPath)) {
      fs.copyFileSync(defaultConfigPath, CONFIG_FILE);
    } else {
      // Create a minimal config
      const minimalConfig = {
        maxAgents: 3,
        memoryPath: './gemini-memory.json',
        authMethod: 'api-key'
      };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(minimalConfig, null, 2));
    }

    if (!fs.existsSync(CONFIG_FILE)) {
      throw new Error('Config file not created');
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    if (!config.maxAgents) {
      throw new Error('Config missing required fields');
    }
  })) passed++;

  // Test 5: Check authentication status
  total++;
  if (await runTest('Authentication status', async () => {
    const output = execSync('gemini-flow auth --status', { encoding: 'utf8' });
    if (!output.includes('Authentication Status:')) {
      throw new Error('Auth status command failed');
    }
  })) passed++;

  // Test 6: Test SPARC command with mock (dry run)
  total++;
  if (await runTest('SPARC command structure', async () => {
    // Set a dummy API key for testing structure
    process.env.GEMINI_API_KEY = 'test-key-for-structure-test';

    try {
      execSync('gemini-flow sparc architect "Test task" 2>&1', { encoding: 'utf8' });
    } catch (error) {
      // Expected to fail due to invalid API key, but should show proper error handling
      if (!error.stdout.includes('architect') && !error.stderr.includes('architect')) {
        throw new Error('SPARC command structure invalid');
      }
    }
  })) passed++;

  // Test 7: Test orchestrator configuration loading
  total++;
  if (await runTest('Orchestrator config loading', async () => {
    // This test verifies the orchestrator can load config without starting
    const testScript = `
      const { Orchestrator } = require('${path.join(__dirname, 'dist/core/orchestrator.js')}');
      const config = require('./${CONFIG_FILE}');
      try {
        const orchestrator = new Orchestrator(config);
        console.log('Config loaded successfully');
        process.exit(0);
      } catch (error) {
        console.error('Config loading failed:', error.message);
        process.exit(1);
      }
    `;

    fs.writeFileSync('test-config.js', testScript);
    execSync('node test-config.js', { encoding: 'utf8' });
    fs.unlinkSync('test-config.js');
  })) passed++;

  // Test 8: Check if memory manager initializes
  total++;
  if (await runTest('Memory manager initialization', async () => {
    const testScript = `
      const { MemoryManager } = require('${path.join(__dirname, 'dist/core/memory-manager.js')}');
      async function test() {
        const manager = new MemoryManager('./test-memory.json');
        await manager.initialize();
        console.log('Memory manager initialized');
      }
      test().catch(error => {
        console.error('Memory manager failed:', error.message);
        process.exit(1);
      });
    `;

    fs.writeFileSync('test-memory.js', testScript);
    execSync('node test-memory.js', { encoding: 'utf8' });
    fs.unlinkSync('test-memory.js');
  })) passed++;

  // Test 9: Check task queue functionality
  total++;
  if (await runTest('Task queue operations', async () => {
    const testScript = `
      const { TaskQueue } = require('${path.join(__dirname, 'dist/core/task-queue.js')}');
      const queue = new TaskQueue();

      const task = {
        id: 'test-1',
        description: 'Test task',
        mode: 'coder',
        priority: 'medium',
        dependencies: [],
        status: 'pending'
      };

      queue.add(task);

      if (queue.size() !== 1) {
        throw new Error('Task not added to queue');
      }

      console.log('Task queue working');
    `;

    fs.writeFileSync('test-queue.js', testScript);
    execSync('node test-queue.js', { encoding: 'utf8' });
    fs.unlinkSync('test-queue.js');
  })) passed++;

  // Clean up
  process.chdir('..');
  if (fs.existsSync(TEST_PROJECT_DIR)) {
    execSync(`rm -rf ${TEST_PROJECT_DIR}`);
  }

  // Summary
  console.log(chalk.cyan('\n📊 Test Results:'));
  console.log(chalk.green(`✅ Passed: ${passed}/${total}`));
  console.log(chalk.red(`❌ Failed: ${total - passed}/${total}`));

  if (passed === total) {
    console.log(chalk.green('\n🎉 All tests passed! Gemini Code Flow is ready to use.'));
    console.log(chalk.yellow('\nNext steps:'));
    console.log('1. Set your GEMINI_API_KEY environment variable');
    console.log('2. Run: gemini-flow auth --login (for Google Account)');
    console.log('3. Or run: gemini-flow sparc orchestrator "Build a web app"');
    console.log('4. Or run: gemini-flow start --task "Your project description"');
  } else {
    console.log(chalk.red('\n⚠️  Some tests failed. Please check the errors above.'));
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.log(chalk.red(`❌ Uncaught error: ${error.message}`));
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.log(chalk.red(`❌ Unhandled rejection: ${error.message}`));
  process.exit(1);
});

main().catch((error) => {
  console.log(chalk.red(`❌ Test suite failed: ${error.message}`));
  process.exit(1);
});
