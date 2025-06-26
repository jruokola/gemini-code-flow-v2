/**
 * Gemini Client Integration
 * Adapted from Claude Code Flow by ruvnet
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AgentMode } from '../types';

export interface GeminiConfig {
  apiKey?: string;
  authMethod?: 'google-account' | 'api-key';
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = config;
    
    // Handle authentication method
    const authMethod = config.authMethod || 'google-account';
    
    if (authMethod === 'api-key') {
      if (!config.apiKey) {
        throw new Error('API key is required when using api-key authentication method');
      }
      this.genAI = new GoogleGenerativeAI(config.apiKey);
    } else {
      // For google-account method, let Gemini CLI handle authentication
      // This assumes the user has already authenticated via `gemini` command
      const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
      
      if (!apiKey && config.authMethod === 'api-key') {
        throw new Error('API key is required when using api-key authentication method. Set GEMINI_API_KEY environment variable.');
      }
      
      if (!apiKey && config.authMethod !== 'google-account') {
        console.warn('No API key provided. Ensure you are authenticated via Google account or set GEMINI_API_KEY');
      }
      
      this.genAI = new GoogleGenerativeAI(apiKey || '');
    }
    
    this.model = this.genAI.getGenerativeModel({
      model: config.model || 'gemini-1.5-pro',
    });
  }

  /**
   * Execute a prompt with the Gemini model
   */
  async execute(prompt: string, mode: AgentMode): Promise<string> {
    try {
      const generationConfig = {
        temperature: this.getModeTemperature(mode),
        maxOutputTokens: this.config.maxOutputTokens || 8192,
      };

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error(`Gemini execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute with multimodal input (images, PDFs, etc.)
   */
  async executeMultimodal(
    prompt: string,
    files: Array<{ mimeType: string; data: Buffer }>,
    mode: AgentMode
  ): Promise<string> {
    try {
      const parts = [{ text: prompt }];
      
      // Add file parts
      for (const file of files) {
        parts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.data.toString('base64'),
          },
        } as any);
      }

      const generationConfig = {
        temperature: this.getModeTemperature(mode),
        maxOutputTokens: this.config.maxOutputTokens || 8192,
      };

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig,
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error(`Gemini multimodal execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream response for real-time output
   */
  async *streamExecute(prompt: string, mode: AgentMode): AsyncGenerator<string> {
    try {
      const generationConfig = {
        temperature: this.getModeTemperature(mode),
        maxOutputTokens: this.config.maxOutputTokens || 8192,
      };

      const result = await this.model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield chunkText;
        }
      }
    } catch (error) {
      throw new Error(`Gemini stream execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get temperature setting for specific mode
   */
  private getModeTemperature(mode: AgentMode): number {
    const modeTemperatures: Partial<Record<AgentMode, number>> = {
      architect: 0.7,
      coder: 0.3,
      tester: 0.2,
      debugger: 0.1,
      security: 0.2,
      documentation: 0.5,
      integrator: 0.4,
      monitor: 0.2,
      optimizer: 0.3,
      ask: 0.8,
      devops: 0.3,
      tutorial: 0.6,
      database: 0.2,
      specification: 0.4,
      mcp: 0.3,
      orchestrator: 0.5,
      designer: 0.8,
    };

    return modeTemperatures[mode] ?? this.config.temperature ?? 0.5;
  }

  /**
   * Check model availability and quota
   */
  async checkHealth(): Promise<boolean> {
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        generationConfig: { maxOutputTokens: 10 },
      });
      
      return !!result.response;
    } catch (error) {
      return false;
    }
  }
}