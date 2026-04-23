/**
 * zalo-worker-queue.ts — A simple task queue for managing Zalo reconnection tasks.
 * Ensures we don't hammer the Zalo servers with simultaneous reconnection attempts.
 * Supports retries with exponential backoff.
 */
import { logger } from '../../shared/utils/logger.js';

type TaskFn = () => Promise<void>;

interface QueueTask {
  id: string;
  fn: TaskFn;
  retries: number;
  maxRetries: number;
  delay: number;
}

class ZaloWorkerQueue {
  private queue: QueueTask[] = [];
  private processing = false;
  private activeCount = 0;
  private maxConcurrency = 2; // Process 2 reconnections at most simultaneously

  /**
   * Add a reconnection task to the queue.
   * If a task for the same accountId already exists, it will be ignored.
   */
  enqueue(accountId: string, taskFn: TaskFn, options: { maxRetries?: number; delay?: number } = {}): void {
    if (this.queue.some(t => t.id === accountId)) {
      logger.debug(`[zalo-queue] Task for ${accountId} already in queue. Skipping.`);
      return;
    }

    const task: QueueTask = {
      id: accountId,
      fn: taskFn,
      retries: 0,
      maxRetries: options.maxRetries ?? 5,
      delay: options.delay ?? 0
    };

    this.queue.push(task);
    logger.info(`[zalo-queue] Enqueued task for ${accountId}. Total queue size: ${this.queue.length}`);
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    const task = this.queue.shift();
    if (!task) {
      this.processing = false;
      return;
    }

    this.activeCount++;
    this.processing = false;

    // Start processing in background
    this.runTask(task);
    
    // Check if we can process another one
    this.processNext();
  }

  private async runTask(task: QueueTask): Promise<void> {
    if (task.delay > 0) {
      await new Promise(r => setTimeout(r, task.delay));
    }

    try {
      logger.info(`[zalo-queue] Executing task for ${task.id} (Attempt ${task.retries + 1}/${task.maxRetries + 1})`);
      await task.fn();
      logger.info(`[zalo-queue] Task for ${task.id} completed successfully.`);
    } catch (err) {
      logger.error(`[zalo-queue] Task for ${task.id} failed:`, err);
      
      if (task.retries < task.maxRetries) {
        task.retries++;
        // Exponential backoff: 30s, 60s, 120s, 240s, 480s
        task.delay = Math.pow(2, task.retries) * 15_000;
        logger.warn(`[zalo-queue] Retrying task for ${task.id} in ${task.delay / 1000}s...`);
        this.queue.push(task);
      } else {
        logger.error(`[zalo-queue] Task for ${task.id} reached max retries. Dropping.`);
      }
    } finally {
      this.activeCount--;
      this.processNext();
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

export const zaloReconnectQueue = new ZaloWorkerQueue();
