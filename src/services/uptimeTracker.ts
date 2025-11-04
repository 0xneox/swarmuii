/**
 * Uptime Tracker Service
 * Monitors node uptime with plan-based limits and auto-stop functionality
 */

import { NODE_LIMITS, getPlanLimits } from "@/config/nodeLimits";
import { taskService } from "@/lib/api/tasks";

interface UptimeSession {
  deviceId: string;
  startUptime: number;
  maxUptime: number;
  planName: string;
  warningShown: boolean;
  checkInterval: NodeJS.Timeout | null;
}

export class UptimeTracker {
  private static instance: UptimeTracker;
  private activeSession: UptimeSession | null = null;
  private onUptimeLimitReached: ((deviceId: string) => void) | null = null;
  private onUptimeWarning: ((remaining: number) => void) | null = null;

  private constructor() {}

  static getInstance(): UptimeTracker {
    if (!UptimeTracker.instance) {
      UptimeTracker.instance = new UptimeTracker();
    }
    return UptimeTracker.instance;
  }

  /**
   * Start tracking uptime for a device with plan-based limits
   */
  startTracking(
    deviceId: string,
    currentUptime: number,
    planName: string = 'free'
  ): void {
    // Stop any existing tracking
    this.stopTracking();

    // Get plan limits
    const limits = getPlanLimits(planName);

    console.log(`⏱️ Starting uptime tracker for ${planName} plan:`);
    console.log(`   Current uptime: ${this.formatUptime(currentUptime)}`);
    console.log(`   Max uptime: ${this.formatUptime(limits.maxUptime)}`);

    // Initialize session
    this.activeSession = {
      deviceId,
      startUptime: currentUptime,
      maxUptime: limits.maxUptime,
      planName,
      warningShown: false,
      checkInterval: null,
    };

    // Check immediately
    this.checkUptimeLimit(currentUptime);

    // Set up interval check every 10 seconds
    this.activeSession.checkInterval = setInterval(() => {
      this.checkUptimeLimit(currentUptime);
    }, 10000);
  }

  /**
   * Stop tracking uptime
   */
  stopTracking(): void {
    if (this.activeSession?.checkInterval) {
      clearInterval(this.activeSession.checkInterval);
    }
    this.activeSession = null;
    console.log("⏱️ Uptime tracking stopped");
  }

  /**
   * Check if uptime limit is reached
   */
  private checkUptimeLimit(currentUptime: number): void {
    if (!this.activeSession) return;

    const { maxUptime, warningShown, deviceId } = this.activeSession;
    const remaining = maxUptime - currentUptime;
    const percentUsed = (currentUptime / maxUptime) * 100;

    // Limit reached - auto stop
    if (currentUptime >= maxUptime) {
      console.warn("🛑 Uptime limit reached! Auto-stopping node...");
      this.stopTracking();
      
      if (this.onUptimeLimitReached && NODE_LIMITS.UPTIME_SYNC.AUTO_STOP_ENABLED) {
        this.onUptimeLimitReached(deviceId);
      }
      return;
    }

    // Warning at 90%
    if (percentUsed >= (NODE_LIMITS.UPTIME_SYNC.WARNING_THRESHOLD * 100) && !warningShown) {
      console.warn(`⚠️ Uptime warning: ${this.formatUptime(remaining)} remaining`);
      this.activeSession.warningShown = true;
      
      if (this.onUptimeWarning) {
        this.onUptimeWarning(remaining);
      }
    }
  }

  /**
   * Update current uptime (called from Redux)
   */
  updateUptime(currentUptime: number): void {
    if (!this.activeSession) return;
    this.checkUptimeLimit(currentUptime);
  }

  /**
   * Get remaining uptime
   */
  getRemainingUptime(currentUptime: number): number {
    if (!this.activeSession) return 0;
    return Math.max(0, this.activeSession.maxUptime - currentUptime);
  }

  /**
   * Check if uptime limit reached
   */
  isLimitReached(currentUptime: number): boolean {
    if (!this.activeSession) return false;
    return currentUptime >= this.activeSession.maxUptime;
  }

  /**
   * Get uptime percentage used
   */
  getUptimePercentage(currentUptime: number): number {
    if (!this.activeSession) return 0;
    return Math.min(100, (currentUptime / this.activeSession.maxUptime) * 100);
  }

  /**
   * Set callback for when limit is reached
   */
  onLimitReached(callback: (deviceId: string) => void): void {
    this.onUptimeLimitReached = callback;
  }

  /**
   * Set callback for warning
   */
  onWarning(callback: (remaining: number) => void): void {
    this.onUptimeWarning = callback;
  }

  /**
   * Get active session info
   */
  getSession(): UptimeSession | null {
    return this.activeSession;
  }

  /**
   * Fetch current uptime from backend on node start
   */
  async fetchUptimeFromBackend(deviceId: string): Promise<number> {
    try {
      console.log(`📡 Fetching uptime from backend for device: ${deviceId}`);
      const uptime = await taskService.getUptime(deviceId);
      console.log(`✅ Uptime fetched: ${this.formatUptime(uptime)}`);
      return uptime;
    } catch (error) {
      console.error('❌ Failed to fetch uptime from backend:', error);
      return 0;
    }
  }

  /**
   * Sync current uptime to backend
   */
  async syncUptimeToBackend(deviceId: string, uptimeSeconds: number): Promise<void> {
    try {
      console.log(`📤 Syncing uptime to backend: ${this.formatUptime(uptimeSeconds)}`);
      await taskService.syncUptime({
        device_id: deviceId,
        uptime_seconds: uptimeSeconds,
      });
      console.log(`✅ Uptime synced successfully`);
    } catch (error) {
      console.warn('⚠️ Failed to sync uptime to backend:', error);
    }
  }

  /**
   * Format uptime for display
   */
  private formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  }

  /**
   * Validate uptime against plan limits
   */
  validateUptime(currentUptime: number, planName: string): {
    isValid: boolean;
    remaining: number;
    maxUptime: number;
  } {
    const limits = getPlanLimits(planName);
    const remaining = Math.max(0, limits.maxUptime - currentUptime);

    return {
      isValid: currentUptime < limits.maxUptime,
      remaining,
      maxUptime: limits.maxUptime,
    };
  }
}

// Export singleton instance
export const uptimeTracker = UptimeTracker.getInstance();
