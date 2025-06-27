#!/usr/bin/env node

/**
 * Verification Script for Gemini Code Flow Comprehensive Configuration
 * Tests all SPARC modes and configuration options
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk').default;

console.log(chalk.cyan('🔍 Gemini Code Flow Configuration Verification\n'));

let passed = 0;
let total = 0;

function test(description, testFn) {
  total++;
  process.stdout.write(`${description}... `);
  try {
    testFn();
    console.log(chalk.green('✅ PASS'));
    passed++;
  } catch (error) {
    console.log(chalk.red('❌ FAIL'));
    console.log(chalk.red(`   Error: ${error.message}`));
  }
}

// Test 1: Verify template file exists and is valid JSON
test('Template file exists and valid', () => {
  const templatePath = path.join(__dirname, 'templates', 'default-config.json');
  if (!fs.existsSync(templatePath)) {
    throw new Error('Template file not found');
  }

  const content = fs.readFileSync(templatePath, 'utf8');
  const config = JSON.parse(content);

  if (!config.modes || !config.defaultWorkflow) {
    throw new Error('Template missing required sections');
  }
});

// Test 2: Verify all 17 SPARC modes are present
test('All 17 SPARC modes configured', () => {
  const templatePath = path.join(__dirname, 'templates', 'default-config.json');
  const config = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

  const expectedModes = [
    'architect', 'coder', 'tester', 'debugger', 'security', 'documentation',
    'integrator', 'monitor', 'optimizer', 'ask', 'devops', 'tutorial',
    'database', 'specification', 'mcp', 'orchestrator', 'designer'
  ];

  const configuredModes = Object.keys(config.modes);

  if (configuredModes.length !== 17) {
    throw new Error(`Expected 17 modes, found ${configuredModes.length}`);
  }

  for (const mode of expectedModes) {
    if (!configuredModes.includes(mode)) {
      throw new Error(`Missing mode: ${mode}`);
    }
  }
});

// Test 3: Verify each mode has required properties
test('All modes have required properties', () => {
  const templatePath = path.join(__dirname, 'templates', 'default-config.json');
  const config = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

  const requiredProps = ['name', 'icon', 'description', 'temperature', 'maxTokens', 'systemPrompt'];

  for (const [modeName, modeConfig] of Object.entries(config.modes)) {
    for (const prop of requiredProps) {
      if (!(prop in modeConfig)) {
        throw new Error(`Mode ${modeName} missing property: ${prop}`);
      }
    }

    // Validate temperature is between 0 and 1
    if (modeConfig.temperature < 0 || modeConfig.temperature > 1) {
      throw new Error(`Mode ${modeName} has invalid temperature: ${modeConfig.temperature}`);
    }

    // Validate maxTokens is reasonable
    if (modeConfig.maxTokens < 1000 || modeConfig.maxTokens > 8192) {
      throw new Error(`Mode ${modeName} has invalid maxTokens: ${modeConfig.maxTokens}`);
    }
  }
});

// Test 4: Verify default workflow is comprehensive
test('Default workflow includes multiple agents', () => {
  const templatePath = path.join(__dirname, 'templates', 'default-config.json');
  const config = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

  const workflow = config.defaultWorkflow;

  if (!workflow.enabled) {
    throw new Error('Default workflow not enabled');
  }

  if (!workflow.tasks || workflow.tasks.length < 5) {
    throw new Error('Default workflow should have at least 5 tasks');
  }

  // Check that orchestrator is first
  if (workflow.tasks[0].mode !== 'orchestrator') {
    throw new Error('First task should be orchestrator');
  }

  // Check for key modes
  const taskModes = workflow.tasks.map(t => t.mode);
  const keyModes = ['orchestrator', 'architect', 'coder', 'tester', 'documentation'];

  for (const mode of keyModes) {
    if (!taskModes.includes(mode)) {
      throw new Error(`Workflow missing key mode: ${mode}`);
    }
  }
});

// Test 5: Verify alternative workflows exist
test('Alternative workflows configured', () => {
  const templatePath = path.join(__dirname, 'templates', 'default-config.json');
  const config = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

  if (!config.alternativeWorkflows) {
    throw new Error('Alternative workflows not found');
  }

  const expectedWorkflows = ['rapid', 'security-first'];

  for (const workflow of expectedWorkflows) {
    if (!config.alternativeWorkflows[workflow]) {
      throw new Error(`Missing alternative workflow: ${workflow}`);
    }

    if (!config.alternativeWorkflows[workflow].tasks || config.alternativeWorkflows[workflow].tasks.length === 0) {
      throw new Error(`Workflow ${workflow} has no tasks`);
    }
  }
});

// Test 6: Verify authentication options
test('Authentication configuration valid', () => {
  const templatePath = path.join(__dirname, 'templates', 'default-config.json');
  const config = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

  if (!config.authentication) {
    throw new Error('Authentication configuration missing');
  }

  const auth = config.authentication;
  const requiredProps = ['checkInterval', 'refreshTokens', 'fallbackToApiKey'];

  for (const prop of requiredProps) {
    if (!(prop in auth)) {
      throw new Error(`Authentication missing property: ${prop}`);
    }
  }
});

// Test 7: Verify system settings are reasonable
test('System settings are reasonable', () => {
  const templatePath = path.join(__dirname, 'templates', 'default-config.json');
  const config = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

  // Check maxAgents
  if (config.maxAgents < 1 || config.maxAgents > 20) {
    throw new Error(`maxAgents should be between 1-20, got ${config.maxAgents}`);
  }

  // Check required sections exist
  const requiredSections = ['execution', 'memory', 'output', 'logging', 'features'];

  for (const section of requiredSections) {
    if (!config[section]) {
      throw new Error(`Missing configuration section: ${section}`);
    }
  }

  // Check version info
  if (!config.version || !config.schemaVersion) {
    throw new Error('Version information missing');
  }
});

// Test 8: Verify icons are unique and appropriate
test('Mode icons are unique and valid', () => {
  const templatePath = path.join(__dirname, 'templates', 'default-config.json');
  const config = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

  const icons = [];

  for (const [modeName, modeConfig] of Object.entries(config.modes)) {
    if (!modeConfig.icon) {
      throw new Error(`Mode ${modeName} missing icon`);
    }

    if (icons.includes(modeConfig.icon)) {
      throw new Error(`Duplicate icon found: ${modeConfig.icon}`);
    }

    icons.push(modeConfig.icon);

    // Check icon is emoji (basic check)
    if (modeConfig.icon.length < 1 || modeConfig.icon.length > 4) {
      throw new Error(`Invalid icon for ${modeName}: ${modeConfig.icon}`);
    }
  }
});

// Test 9: Test CLI integration with template
test('CLI can load template configuration', () => {
  try {
    // Test that the built CLI file references the template correctly
    const cliPath = path.join(__dirname, 'dist', 'cli.js');
    if (!fs.existsSync(cliPath)) {
      throw new Error('Built CLI file not found');
    }

    const cliContent = fs.readFileSync(cliPath, 'utf8');
    if (!cliContent.includes('default-config.json')) {
      throw new Error('CLI does not reference template file');
    }

  } catch (error) {
    throw new Error(`CLI integration test failed: ${error.message}`);
  }
});

// Test 10: Verify mode descriptions are helpful
test('Mode descriptions are comprehensive', () => {
  const templatePath = path.join(__dirname, 'templates', 'default-config.json');
  const config = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

  for (const [modeName, modeConfig] of Object.entries(config.modes)) {
    if (modeConfig.description.length < 20) {
      throw new Error(`Mode ${modeName} description too short: ${modeConfig.description}`);
    }

    if (modeConfig.systemPrompt.length < 50) {
      throw new Error(`Mode ${modeName} system prompt too short`);
    }
  }
});

// Summary
console.log(chalk.cyan('\n📊 Configuration Verification Results:'));
console.log(chalk.green(`✅ Passed: ${passed}/${total}`));
console.log(chalk.red(`❌ Failed: ${total - passed}/${total}`));

if (passed === total) {
  console.log(chalk.green('\n🎉 All configuration tests passed!'));
  console.log(chalk.yellow('\nConfiguration Summary:'));

  // Load and display summary
  const templatePath = path.join(__dirname, 'templates', 'default-config.json');
  const config = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

  console.log(`   • ${Object.keys(config.modes).length} SPARC modes configured`);
  console.log(`   • ${config.defaultWorkflow.tasks.length} tasks in default workflow`);
  console.log(`   • ${Object.keys(config.alternativeWorkflows).length} alternative workflows available`);
  console.log(`   • Maximum ${config.maxAgents} concurrent agents`);
  console.log(`   • Authentication: ${config.authMethod} (with fallback)`);
  console.log(`   • Features: ${Object.entries(config.features).filter(([k,v]) => v).length} enabled`);

  console.log(chalk.cyan('\nReady for multi-agent development! 🚀'));
  console.log('Try: gemini-flow start --task "Build something amazing"');

} else {
  console.log(chalk.red('\n⚠️  Some configuration tests failed.'));
  console.log('Please check the errors above and fix the configuration.');
  process.exit(1);
}
