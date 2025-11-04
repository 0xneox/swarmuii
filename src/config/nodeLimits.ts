/**
 * Node Control Configuration
 * Plan-based limits for uptime, devices, and other node operations
 */

export const NODE_LIMITS = {
  // Uptime limits in seconds (matches backend)
  UPTIME_LIMITS: {
    free: 4 * 60 * 60,          // 4 hours = 14400s
    basic: 10 * 60 * 60,        // 10 hours = 36000s
    ultimate: 18 * 60 * 60,     // 18 hours = 64800s
    enterprise: 24 * 60 * 60,   // 24 hours = 86400s
  },

  // Device limits per plan (matches backend)
  DEVICE_LIMITS: {
    free: 1,
    basic: 1,
    ultimate: 2,
    enterprise: 6,
  },

  // Task generation settings
  TASK_SETTINGS: {
    WARMUP_DELAY: 3000,           // 3 seconds before first task
    INITIAL_BATCH_SIZE: 5,        // Number of tasks to generate initially
    GENERATION_INTERVAL: 30000,   // 30 seconds between task batches
    MIN_TASKS_BUFFER: 2,          // Min tasks before generating more
  },

  // Uptime sync settings
  UPTIME_SYNC: {
    INTERVAL: 60000,              // Sync every 60 seconds
    WARNING_THRESHOLD: 0.9,       // Warn at 90% of limit
    AUTO_STOP_ENABLED: true,      // Auto-stop when limit reached
  },

  // Session settings
  SESSION: {
    TIMEOUT: 300000,              // 5 minutes session timeout
    CHECK_INTERVAL: 3000,         // Check cross-tab every 3 seconds
  },
} as const;

// Helper to get plan limits
export const getPlanLimits = (planName?: string) => {
  const plan = (planName?.toLowerCase() || 'free') as keyof typeof NODE_LIMITS.UPTIME_LIMITS;
  
  return {
    maxUptime: NODE_LIMITS.UPTIME_LIMITS[plan] || NODE_LIMITS.UPTIME_LIMITS.free,
    maxDevices: NODE_LIMITS.DEVICE_LIMITS[plan] || NODE_LIMITS.DEVICE_LIMITS.free,
  };
};
