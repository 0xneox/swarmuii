/**
 * Task Warmup Service
 * Handles proper task pipeline initialization with warmup phase
 */

import { NODE_LIMITS } from "@/config/nodeLimits";
import type { AppDispatch } from "@/lib/store";
import { generateTasks, startProcessingTasks } from "@/lib/store/slices/taskSlice";
import { startTaskEngine, stopTaskEngine } from "@/lib/store/taskEngine";

interface WarmupConfig {
  nodeId: string;
  hardwareTier: string;
  dispatch: AppDispatch;
}

export class TaskWarmupService {
  private static instance: TaskWarmupService;
  private warmupTimeout: NodeJS.Timeout | null = null;
  private isWarming: boolean = false;

  private constructor() {}

  static getInstance(): TaskWarmupService {
    if (!TaskWarmupService.instance) {
      TaskWarmupService.instance = new TaskWarmupService();
    }
    return TaskWarmupService.instance;
  }

  /**
   * Start task pipeline with warmup phase
   * 1. Set subscription plan for rate limiting
   * 2. Generate initial batch of tasks
   * 3. Wait for warmup delay
   * 4. Start task processing engine
   */
  async startWithWarmup(config: WarmupConfig & { plan?: string }): Promise<void> {
    // Cancel any existing warmup
    this.cancelWarmup();

    this.isWarming = true;
    
    const { nodeId, hardwareTier, dispatch, plan = 'free' } = config;
    
    // ✅ PLAN-BASED: Set user's subscription plan for rate limiting
    const engine = await import('@/lib/store/taskEngine');
    const taskEngine = engine.getTaskEngine();
    if (taskEngine) {
      taskEngine.setPlan(plan);
    }

    dispatch(generateTasks({
      nodeId,
      hardwareTier,
      plan, // ✅ CRITICAL FIX: Pass plan to generateTasks
    }));

    // Phase 2: Wait for warmup delay before starting processing
    this.warmupTimeout = setTimeout(() => {
      dispatch(startProcessingTasks({ 
        hardwareTier,
        plan // ✅ CRITICAL FIX: Pass plan to startProcessingTasks
      }));
      
      // ✅ FIXED: Start task engine here (single control point)
      startTaskEngine(dispatch);
      
      this.isWarming = false;
      this.warmupTimeout = null;
    }, NODE_LIMITS.TASK_SETTINGS.WARMUP_DELAY);
  }

  /**
   * Cancel warmup and stop engine
   */
  cancelWarmup(): void {
    if (this.warmupTimeout) {
      clearTimeout(this.warmupTimeout);
      this.warmupTimeout = null;
    }
    this.isWarming = false;
    
    // ✅ FIXED: Stop engine when warmup cancelled
    stopTaskEngine();
  }

  /**
   * Check if warmup is active
   */
  isWarmingUp(): boolean {
    return this.isWarming;
  }

  /**
   * Get warmup status
   */
  getStatus(): {
    isWarming: boolean;
    warmupDelay: number;
  } {
    return {
      isWarming: this.isWarming,
      warmupDelay: NODE_LIMITS.TASK_SETTINGS.WARMUP_DELAY,
    };
  }
}

// Export singleton instance
export const taskWarmupService = TaskWarmupService.getInstance();
