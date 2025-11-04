import { AppDispatch, store } from './index';
import { generateTasks, startProcessingTasks, updateProcessingTasks, resetTasks } from './slices/taskSlice';
import { updateUptime } from './slices/nodeSlice';
import { addReward } from './slices/earningsSlice';
import { TASK_CONFIG, generateTaskId, logger } from './config';
import { ProxyTask, RewardTransaction } from './types';

class TaskProcessingEngine {
  private intervalId: NodeJS.Timeout | null = null;
  private dispatch: AppDispatch;
  private isRunning = false;
  private currentPlan: 'free' | 'basic' | 'ultimate' | 'enterprise' = 'free';

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  // ✅ Set user's subscription plan for rate limiting
  setPlan(plan: string) {
    const planLower = plan.toLowerCase();
    if (planLower in TASK_CONFIG.GENERATION) {
      this.currentPlan = planLower as 'free' | 'basic' | 'ultimate' | 'enterprise';
      logger.log(`📋 Task engine plan set to: ${this.currentPlan}`);
      
      // Restart engine with new interval if running
      if (this.isRunning) {
        this.stop();
        this.start();
      }
    }
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    const config = TASK_CONFIG.GENERATION[this.currentPlan];
    logger.log(`Task processing engine started (${this.currentPlan} plan, ${config.PROCESSING_INTERVAL}ms interval)`);
    
    // Main processing loop - interval based on subscription plan
    this.intervalId = setInterval(() => {
      this.processTaskCycle();
    }, config.PROCESSING_INTERVAL);
  }

  stop() {
    if (!this.isRunning) return; // Prevent multiple stops
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    
    // Clear all proxy tasks when engine stops (but only once)
    this.dispatch(resetTasks());
    logger.log('Task processing engine stopped and all tasks cleared');
  }

  private processTaskCycle() {
    const state = store.getState();
    const { node, tasks } = state;

    // Only process if node is active
    if (!node.isActive || !node.nodeId || !node.hardwareInfo) {
      return;
    }

    // Update node uptime
    this.dispatch(updateUptime());

    const hardwareTier = node.hardwareInfo.rewardTier;
    const config = TASK_CONFIG.GENERATION[this.currentPlan];

    // 1. Generate new tasks if needed (auto mode and low pending count)
    // ✅ PLAN-BASED: Use plan-specific pending queue size
    const totalActiveTasks = tasks.stats.pending + tasks.stats.processing;
    if (tasks.autoMode && totalActiveTasks < config.PENDING_QUEUE_SIZE && !tasks.isGenerating) {
      this.dispatch(generateTasks({ 
        nodeId: node.nodeId, 
        hardwareTier 
      }));
    }

    // 2. Start processing pending tasks
    // ✅ PLAN-BASED: Use plan-specific concurrent limit
    if (tasks.stats.pending > 0 && tasks.stats.processing < config.MAX_CONCURRENT_PROCESSING) {
      this.dispatch(startProcessingTasks(hardwareTier));
    }

    // 3. Update processing tasks and complete them
    this.updateAndCompleteProcessingTasks(hardwareTier);

    // 4. DO NOT auto-cleanup completed tasks - they are unclaimed rewards!
    // Completed tasks should only be cleared when user manually claims rewards
    // or when the node is stopped.
  }

  private updateAndCompleteProcessingTasks(hardwareTier: 'webgpu' | 'wasm' | 'webgl' | 'cpu') {
    const state = store.getState();
    const { tasks } = state;
    const now = Date.now();

    const processingTasks = tasks.tasks.filter(task => task.status === 'processing');
    
    // Process tasks sequentially to avoid overwhelming the API
    const processTasksSequentially = async () => {
      for (const task of processingTasks) {
        if (!task.processing_start) continue;

        const processingStart = new Date(task.processing_start).getTime();
        const elapsed = now - processingStart;
        const completionTime = TASK_CONFIG.COMPLETION_TIMES[hardwareTier][task.type] * 1000;

        // Complete task if enough time has passed
        if (elapsed >= completionTime) {
          try {
            await this.completeTask(task, hardwareTier);
          } catch (error) {
            // ✅ FIXED: Mark task as failed if backend call fails
            logger.error(`❌ Task failed: ${error}`);
            const { markTaskAsFailed } = await import('./slices/taskSlice');
            this.dispatch(markTaskAsFailed(task.id));
          }
        }
      }
      
      // Update processing tasks in store after all completions are processed
      this.dispatch(updateProcessingTasks(hardwareTier));
    };
    
    // Start sequential processing but don't block the main thread
    processTasksSequentially().catch(error => {
      logger.error(`Error in task processing sequence: ${error}`);
    });
  }

  private async completeTask(task: ProxyTask, hardwareTier: 'webgpu' | 'wasm' | 'webgl' | 'cpu') {
    const baseReward = TASK_CONFIG.BASE_REWARDS[task.type];
    const multiplier = TASK_CONFIG.HARDWARE_MULTIPLIERS[hardwareTier];
    // Backend expects INTEGER, not float - use Math.round() only
    const rewardAmount = Math.round(baseReward * multiplier);

    // Create reward transaction
    const reward: RewardTransaction = {
      id: generateTaskId(),
      amount: rewardAmount,
      type: 'task_completion',
      task_id: task.id,
      task_type: task.type,
      hardware_tier: hardwareTier,
      multiplier,
      timestamp: new Date().toISOString()
    };

    try {
      // Call Express backend using taskService
      const { taskService } = await import('@/lib/api');
      const result = await taskService.completeTask({
        task_id: task.id,
        task_type: task.type as 'text' | 'image' | 'video' | '3d',
        reward_amount: rewardAmount,
      });

      logger.log(`✅ Task completed via backend: ${task.type} - Reward: ${rewardAmount} SP`);
      
      // ✅ FIXED: Only update Redux on API SUCCESS
      this.dispatch(addReward(reward));
      
      logger.log(`💰 Unclaimed rewards: ${result.total_unclaimed_reward} SP`);
    } catch (error) {
      // ✅ FIXED: Don't give rewards if backend fails
      logger.error(`❌ Backend failed to record task: ${error}`);
      // Task will be marked as failed by updateProcessingTasks
      throw error; // Re-throw so calling code knows it failed
    }
  }

  // Manual task generation trigger
  generateTasksManually() {
    const state = store.getState();
    const { node } = state;

    if (!node.isActive || !node.nodeId || !node.hardwareInfo) {
      logger.error('Cannot generate tasks: Node not active');
      return;
    }

    this.dispatch(generateTasks({ 
      nodeId: node.nodeId, 
      hardwareTier: node.hardwareInfo.rewardTier 
    }));
  }
}

// Singleton instance
let taskEngine: TaskProcessingEngine | null = null;

export const initializeTaskEngine = (dispatch: AppDispatch) => {
  if (!taskEngine) {
    taskEngine = new TaskProcessingEngine(dispatch);
  }
  return taskEngine;
};

export const getTaskEngine = () => {
  return taskEngine;
};

export const startTaskEngine = (dispatch: AppDispatch) => {
  const engine = initializeTaskEngine(dispatch);
  engine.start();
  return engine;
};

export const stopTaskEngine = () => {
  if (taskEngine) {
    taskEngine.stop();
    taskEngine = null; // Clear reference after stopping
  }
};
