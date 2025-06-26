/**
 * Memory Manager for Gemini Code Flow
 * Adapted from Claude Code Flow by ruvnet
 */

import fs from 'fs-extra';
import path from 'path';
import { MemoryEntry, AgentMode } from '../types';

export class MemoryManager {
  private memoryPath: string;
  private cache: Map<string, MemoryEntry[]> = new Map();
  private initialized: boolean = false;
  private readonly maxEntries: number = 1000; // Limit total entries
  private readonly maxAge: number = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(memoryPath: string) {
    this.memoryPath = memoryPath;
  }

  /**
   * Initialize the memory manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Ensure directory exists
    await fs.ensureDir(path.dirname(this.memoryPath));

    // Load existing memory (eliminate TOCTOU race condition)
    try {
      const data = await fs.readJson(this.memoryPath);
      Object.entries(data).forEach(([key, entries]) => {
        // Properly deserialize dates from JSON
        const deserializedEntries = (entries as any[]).map(entry => ({
          ...entry,
          timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date()
        }));
        this.cache.set(key, deserializedEntries as MemoryEntry[]);
      });
    } catch (error) {
      // File doesn't exist or is corrupted - start with empty cache
      if ((error as any).code !== 'ENOENT') {
        console.warn('Failed to load memory:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    this.initialized = true;
    
    // Clean up old entries after initialization
    this.cleanup();
  }

  /**
   * Store a memory entry
   */
  async store(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<void> {
    const memoryEntry: MemoryEntry = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date(),
      ...entry,
    };

    const key = entry.agentId || 'global';
    const entries = this.cache.get(key) || [];
    entries.push(memoryEntry);
    this.cache.set(key, entries);

    // Clean up old entries if we're over the limit
    this.cleanup();

    // Auto-save periodically
    this.scheduleSave();
  }

  /**
   * Get context for a specific mode
   */
  async getContext(mode: AgentMode): Promise<any[]> {
    const allEntries = Array.from(this.cache.values()).flat();
    
    return allEntries
      .filter(entry => entry.tags.includes(mode))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10) // Last 10 relevant entries
      .map(entry => ({
        type: entry.type,
        summary: typeof entry.content === 'string' 
          ? entry.content.substring(0, 200) + '...'
          : JSON.stringify(entry.content).substring(0, 200) + '...',
        timestamp: entry.timestamp,
      }));
  }

  /**
   * Search memory entries
   */
  async search(query: string, tags?: string[]): Promise<MemoryEntry[]> {
    const allEntries = Array.from(this.cache.values()).flat();
    
    return allEntries.filter(entry => {
      const contentMatch = JSON.stringify(entry.content).toLowerCase().includes(query.toLowerCase());
      const tagsMatch = !tags || tags.some(tag => entry.tags.includes(tag));
      return contentMatch && tagsMatch;
    });
  }

  /**
   * Flush memory to disk
   */
  async flush(): Promise<void> {
    const data = Object.fromEntries(this.cache.entries());
    await fs.writeJson(this.memoryPath, data, { spaces: 2 });
  }

  /**
   * Schedule periodic saves
   */
  private scheduleSave(): void {
    if (this.saveTimeout) return;
    
    this.saveTimeout = setTimeout(async () => {
      await this.flush();
      this.saveTimeout = null;
    }, 5000); // Save every 5 seconds
  }

  private saveTimeout: NodeJS.Timeout | null = null;

  /**
   * Clean up old entries to prevent memory growth
   */
  private cleanup(): void {
    const now = Date.now();
    let totalEntries = 0;
    
    // Remove old entries
    for (const [key, entries] of this.cache.entries()) {
      const validEntries = entries.filter(entry => {
        const age = now - entry.timestamp.getTime();
        return age < this.maxAge;
      });
      
      if (validEntries.length === 0) {
        this.cache.delete(key);
      } else {
        this.cache.set(key, validEntries);
      }
      
      totalEntries += validEntries.length;
    }
    
    // If still over limit, remove oldest entries
    if (totalEntries > this.maxEntries) {
      const allEntries: Array<{ key: string; entry: MemoryEntry; index: number }> = [];
      
      for (const [key, entries] of this.cache.entries()) {
        entries.forEach((entry, index) => {
          allEntries.push({ key, entry, index });
        });
      }
      
      // Sort by timestamp (oldest first)
      allEntries.sort((a, b) => a.entry.timestamp.getTime() - b.entry.timestamp.getTime());
      
      // Remove oldest entries
      const toRemove = totalEntries - this.maxEntries;
      for (let i = 0; i < toRemove; i++) {
        const { key, index } = allEntries[i];
        const entries = this.cache.get(key);
        if (entries) {
          entries.splice(index, 1);
          if (entries.length === 0) {
            this.cache.delete(key);
          }
        }
      }
    }
  }
}