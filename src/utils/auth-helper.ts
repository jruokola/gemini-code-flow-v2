/**
 * Authentication Helper for Gemini CLI Integration
 * Handles authentication flow and API key management
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { Logger } from './logger';

const execAsync = promisify(exec);

export interface AuthConfig {
  authMethod: 'google-account' | 'api-key';
  apiKey?: string;
  refreshTokens: boolean;
  checkInterval: number;
}

export class AuthHelper {
  private logger: Logger;
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
    this.logger = new Logger('AuthHelper');
  }

  /**
   * Check if Gemini CLI is installed and accessible
   */
  async checkGeminiCLI(): Promise<boolean> {
    try {
      await execAsync('gemini --version');
      return true;
    } catch (error) {
      this.logger.warn('Gemini CLI not found in PATH');
      return false;
    }
  }

  /**
   * Check current authentication status
   */
  async checkAuthStatus(): Promise<{
    authenticated: boolean;
    method: 'google-account' | 'api-key' | 'none';
    details?: any;
  }> {
    // Check for API key first
    if (process.env.GEMINI_API_KEY) {
      return {
        authenticated: true,
        method: 'api-key',
        details: { source: 'environment' }
      };
    }

    if (this.config.apiKey) {
      return {
        authenticated: true,
        method: 'api-key',
        details: { source: 'config' }
      };
    }

    // Check Google account authentication via Gemini CLI
    try {
      const { stdout } = await execAsync('gemini auth status');
      if (stdout.includes('authenticated') || stdout.includes('logged in')) {
        return {
          authenticated: true,
          method: 'google-account',
          details: { output: stdout.trim() }
        };
      }
    } catch (error) {
      this.logger.debug('Error checking Gemini CLI auth status:', error);
    }

    return {
      authenticated: false,
      method: 'none'
    };
  }

  /**
   * Initiate authentication flow
   */
  async authenticate(): Promise<boolean> {
    const cliAvailable = await this.checkGeminiCLI();

    if (!cliAvailable) {
      console.log(chalk.red('❌ Gemini CLI not found!'));
      console.log(chalk.yellow('\nPlease install Gemini CLI first:'));
      console.log(chalk.cyan('npm install -g @google-ai/generativelanguage'));
      console.log(chalk.gray('or'));
      console.log(chalk.cyan('https://ai.google.dev/gemini-api/docs/quickstart'));
      return false;
    }

    const authStatus = await this.checkAuthStatus();

    if (authStatus.authenticated) {
      this.logger.info(`Already authenticated via ${authStatus.method}`);
      return true;
    }

    // Prompt user for authentication method
    const { method } = await inquirer.prompt([
      {
        type: 'list',
        name: 'method',
        message: 'Choose authentication method:',
        choices: [
          {
            name: '🔑 Google Account (Recommended)',
            value: 'google-account',
            short: 'Google Account'
          },
          {
            name: '🗝️  API Key',
            value: 'api-key',
            short: 'API Key'
          }
        ],
        default: 'google-account'
      }
    ]);

    if (method === 'api-key') {
      return await this.setupApiKey();
    } else {
      return await this.setupGoogleAccount();
    }
  }

  /**
   * Setup Google Account authentication
   */
  private async setupGoogleAccount(): Promise<boolean> {
    console.log(chalk.cyan('\n🚀 Setting up Google Account authentication...'));
    console.log(chalk.yellow('This will open your web browser to complete authentication.'));

    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Continue with Google Account setup?',
        default: true
      }
    ]);

    if (!proceed) {
      return false;
    }

    try {
      // Launch Gemini CLI auth flow
      console.log(chalk.blue('Launching authentication flow...'));

      await new Promise<void>((resolve, reject) => {
        const authProcess = spawn('gemini', ['auth', 'login'], {
          stdio: 'inherit'
        });

        authProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Authentication failed with exit code ${code}`));
          }
        });

        authProcess.on('error', (error) => {
          reject(error);
        });
      });

      // Verify authentication worked
      const authStatus = await this.checkAuthStatus();
      if (authStatus.authenticated) {
        console.log(chalk.green('✅ Authentication successful!'));
        return true;
      } else {
        console.log(chalk.red('❌ Authentication verification failed'));
        return false;
      }

    } catch (error) {
      this.logger.error('Google Account authentication failed:', error);
      console.log(chalk.red('❌ Authentication failed'));
      console.log(chalk.yellow('\nTry these alternatives:'));
      console.log(chalk.cyan('1. Run: gemini auth login'));
      console.log(chalk.cyan('2. Use API key authentication instead'));
      return false;
    }
  }

  /**
   * Setup API Key authentication
   */
  private async setupApiKey(): Promise<boolean> {
    console.log(chalk.cyan('\n🔑 Setting up API Key authentication...'));
    console.log(chalk.yellow('Get your API key from: https://makersuite.google.com/app/apikey'));

    const { apiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your Gemini API key:',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'API key cannot be empty';
          }
          if (!input.startsWith('AIza')) {
            return 'Gemini API keys typically start with "AIza"';
          }
          return true;
        }
      }
    ]);

    // Test the API key
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      console.log(chalk.blue('Testing API key...'));
      await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        generationConfig: { maxOutputTokens: 10 }
      });

      console.log(chalk.green('✅ API key is valid!'));

      // Offer to save to environment
      const { saveToEnv } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'saveToEnv',
          message: 'Save API key to GEMINI_API_KEY environment variable?',
          default: true
        }
      ]);

      if (saveToEnv) {
        console.log(chalk.yellow('\nAdd this to your shell profile (.bashrc, .zshrc, etc.):'));
        console.log(chalk.cyan(`export GEMINI_API_KEY="${apiKey.trim()}"`));
        console.log(chalk.gray('Then restart your terminal or run: source ~/.bashrc'));
      }

      // Temporarily set for current session
      process.env.GEMINI_API_KEY = apiKey.trim();
      return true;

    } catch (error) {
      this.logger.error('API key validation failed:', error);
      console.log(chalk.red('❌ Invalid API key or network error'));
      console.log(chalk.yellow('Please check your API key and try again'));
      return false;
    }
  }

  /**
   * Get authentication info for display
   */
  async getAuthInfo(): Promise<string> {
    const status = await this.checkAuthStatus();

    if (!status.authenticated) {
      return chalk.red('❌ Not authenticated');
    }

    switch (status.method) {
      case 'google-account':
        return chalk.green('✅ Google Account');
      case 'api-key':
        const source = status.details?.source || 'unknown';
        return chalk.green(`✅ API Key (${source})`);
      default:
        return chalk.yellow('⚠️  Unknown auth method');
    }
  }

  /**
   * Check if authentication is required and prompt if needed
   */
  async ensureAuthenticated(): Promise<boolean> {
    const status = await this.checkAuthStatus();

    if (status.authenticated) {
      return true;
    }

    console.log(chalk.yellow('⚠️  Authentication required to use Gemini Code Flow'));

    const { authenticate } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'authenticate',
        message: 'Would you like to authenticate now?',
        default: true
      }
    ]);

    if (!authenticate) {
      console.log(chalk.red('Authentication cancelled. Gemini Code Flow requires authentication to function.'));
      return false;
    }

    return await this.authenticate();
  }

  /**
   * Refresh authentication if needed
   */
  async refreshAuth(): Promise<boolean> {
    if (!this.config.refreshTokens) {
      return true;
    }

    try {
      // For Google Account, try to refresh tokens
      if (this.config.authMethod === 'google-account') {
        await execAsync('gemini auth refresh');
        this.logger.debug('Authentication refreshed');
      }
      return true;
    } catch (error) {
      this.logger.warn('Failed to refresh authentication:', error);
      return false;
    }
  }
}

/**
 * Global auth helper instance
 */
let globalAuthHelper: AuthHelper | null = null;

export function getAuthHelper(config?: AuthConfig): AuthHelper {
  if (!globalAuthHelper && config) {
    globalAuthHelper = new AuthHelper(config);
  }

  if (!globalAuthHelper) {
    throw new Error('AuthHelper not initialized. Call getAuthHelper with config first.');
  }

  return globalAuthHelper;
}

/**
 * Quick authentication check
 */
export async function quickAuthCheck(): Promise<boolean> {
  try {
    const helper = new AuthHelper({
      authMethod: 'google-account',
      refreshTokens: false,
      checkInterval: 0
    });

    const status = await helper.checkAuthStatus();
    return status.authenticated;
  } catch (error) {
    return false;
  }
}
