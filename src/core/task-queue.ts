/**
 * Task Queue for Gemini Code Flow
 * Adapted from Claude Code Flow by ruvnet
 */

import { Task, AgentStatus } from '../types';

export class TaskQueue {
  private tasks: Map<string, Task> = new Map();
  private priorityQueue: Task[] = [];

  /**
   * Add a task to the queue
   */
  add(task: Task): void {
    this.tasks.set(task.id, task);
    this.priorityQueue.push(task);
    this.sortByPriority();
  }

  /**
   * Get the next available task
   */
  async getNext(): Promise<Task | null> {
    // Find the highest priority task with met dependencies
    for (let i = 0; i < this.priorityQueue.length; i++) {
      const task = this.priorityQueue[i];
      
      if (task.status === 'pending' && this.areDependenciesMet(task)) {
        // Remove from queue and return
        this.priorityQueue.splice(i, 1);
        task.status = 'running' as AgentStatus;
        return task;
      }
    }
    
    return null;
  }

  /**
   * Get task by ID
   */
  getById(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.priorityQueue.filter(t => t.status === 'pending').length;
  }

  /**
   * Check if dependencies are met
   */
  private areDependenciesMet(task: Task): boolean {
    return task.dependencies.every(depId => {
      const depTask = this.tasks.get(depId);
      return depTask && depTask.status === 'completed';
    });
  }

  /**
   * Sort queue by priority
   */
  private sortByPriority(): void {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    this.priorityQueue.sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Remove completed tasks older than specified time
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    
    for (const [id, task] of this.tasks.entries()) {
      if (task.status === 'completed' && task.createdAt.getTime() < cutoff) {
        this.tasks.delete(id);
        const index = this.priorityQueue.findIndex(t => t.id === id);
        if (index !== -1) {
          this.priorityQueue.splice(index, 1);
        }
      }
    }
  }
}