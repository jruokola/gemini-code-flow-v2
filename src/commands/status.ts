/**
 * Status Command for Gemini Code Flow
 * Shows orchestrator and system status
 */

import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

export class StatusCommand {
  async execute(): Promise<void> {
    console.log(chalk.cyan('\n📊 Gemini Code Flow Status\n'));

    try {
      // Check configuration
      const configPath = path.join(process.cwd(), '.gemini-flow.json');
      const hasConfig = await fs.pathExists(configPath);
      
      if (hasConfig) {
        const config = await fs.readJson(configPath);
        console.log(chalk.green('✓ Configuration found'));
        console.log(chalk.gray(`  Max Agents: ${config.maxAgents || 10}`));
        console.log(chalk.gray(`  Memory Path: ${config.memoryPath || './gemini-memory.json'}`));
        console.log(chalk.gray(`  Auth Method: ${config.authMethod || 'google-account'}`));
      } else {
        console.log(chalk.yellow('⚠ No configuration file found'));
        console.log(chalk.gray('  Run "gemini-flow init" to create one'));
      }

      // Check API key
      const hasApiKey = !!process.env.GEMINI_API_KEY;
      console.log(hasApiKey 
        ? chalk.green('\n✓ GEMINI_API_KEY is set')
        : chalk.yellow('\n⚠ GEMINI_API_KEY not found in environment')
      );

      // Check memory
      const memoryPath = path.join(process.cwd(), '.gemini-flow/memory.json');
      const hasMemory = await fs.pathExists(memoryPath);
      
      if (hasMemory) {
        const memoryData = await fs.readJson(memoryPath);
        const entryCount = Object.values(memoryData)
          .reduce((sum: number, entries: unknown) => {
            return sum + (Array.isArray(entries) ? entries.length : 0);
          }, 0);
        
        console.log(chalk.green(`\n✓ Memory bank found`));
        console.log(chalk.gray(`  Entries: ${entryCount}`));
      } else {
        console.log(chalk.gray('\n○ No memory bank initialized yet'));
      }

      // Check for recent SPARC outputs
      const sparcDir = path.join(process.cwd(), '.gemini-flow');
      if (await fs.pathExists(sparcDir)) {
        const files = await fs.readdir(sparcDir);
        const sparcFiles = files.filter(f => f.endsWith('.md'));
        
        if (sparcFiles.length > 0) {
          console.log(chalk.green(`\n✓ SPARC outputs found`));
          console.log(chalk.gray(`  Files: ${sparcFiles.length}`));
          
          // Show recent files
          const recentFiles = await Promise.all(
            sparcFiles.slice(-3).map(async (file) => {
              const stats = await fs.stat(path.join(sparcDir, file));
              return { file, time: stats.mtime };
            })
          );
          
          recentFiles.sort((a, b) => b.time.getTime() - a.time.getTime());
          console.log(chalk.gray('\n  Recent outputs:'));
          recentFiles.forEach(({ file, time }) => {
            console.log(chalk.gray(`    - ${file} (${time.toLocaleString()})`));
          });
        }
      }

      // System info
      console.log(chalk.cyan('\n📦 System Information'));
      console.log(chalk.gray(`  Node.js: ${process.version}`));
      console.log(chalk.gray(`  Platform: ${process.platform}`));
      console.log(chalk.gray(`  Working Directory: ${process.cwd()}`));

      console.log(chalk.green('\n✨ Ready to use Gemini Code Flow!\n'));

    } catch (error) {
      console.error(chalk.red('Error checking status:'), error instanceof Error ? error.message : 'Unknown error');
    }
  }
}