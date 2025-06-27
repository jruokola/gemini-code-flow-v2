/**
 * Memory Manager for Gemini Code Flow
 * Adapted from Claude Code Flow by ruvnet
 */

import fs from "fs-extra";
import path from "path";
import { MemoryEntry, AgentMode } from "../types";

export class MemoryManager {
  private memoryPath: string;
  private cache: Map<string, MemoryEntry[]> = new Map();
  private initialized: boolean = false;

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

    // Load existing memory
    if (await fs.pathExists(this.memoryPath)) {
      try {
        const data = await fs.readJson(this.memoryPath);
        Object.entries(data).forEach(([key, entries]) => {
          // Convert timestamp strings back to Date objects
          const processedEntries = (entries as any[]).map((entry) => ({
            ...entry,
            timestamp: new Date(entry.timestamp),
          }));
          this.cache.set(key, processedEntries as MemoryEntry[]);
        });
      } catch (error) {
        console.warn(
          "Failed to load memory:",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }

    this.initialized = true;
  }

  /**
   * Store a memory entry
   */
  async store(entry: Omit<MemoryEntry, "id" | "timestamp">): Promise<void> {
    const memoryEntry: MemoryEntry = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...entry,
    };

    const key = entry.agentId || "global";
    const entries = this.cache.get(key) || [];
    entries.push(memoryEntry);
    this.cache.set(key, entries);

    // Auto-save periodically
    this.scheduleSave();
  }

  /**
   * Get context for a specific mode
   */
  async getContext(mode: AgentMode): Promise<any[]> {
    const allEntries = Array.from(this.cache.values()).flat();

    return allEntries
      .filter((entry) => entry.tags.includes(mode))
      .sort((a, b) => {
        // Handle both Date objects and string timestamps
        const aTime =
          a.timestamp instanceof Date
            ? a.timestamp.getTime()
            : new Date(a.timestamp).getTime();
        const bTime =
          b.timestamp instanceof Date
            ? b.timestamp.getTime()
            : new Date(b.timestamp).getTime();
        return bTime - aTime;
      })
      .slice(0, 10) // Last 10 relevant entries
      .map((entry) => ({
        type: entry.type,
        summary:
          typeof entry.content === "string"
            ? entry.content.substring(0, 200) + "..."
            : JSON.stringify(entry.content).substring(0, 200) + "...",
        timestamp:
          entry.timestamp instanceof Date
            ? entry.timestamp
            : new Date(entry.timestamp),
      }));
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
}
