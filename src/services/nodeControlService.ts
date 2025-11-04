/**
 * Node Control Service
 * Handles session validation, uptime tracking, and node lifecycle
 */

import { sessionService } from "@/lib/api/sessions";
import { taskService } from "@/lib/api/tasks";
import { NODE_LIMITS, getPlanLimits } from "@/config/nodeLimits";

interface SessionData {
  deviceId: string;
  sessionToken: string;
  tabId: string;
  startTime: number;
}

export class NodeControlService {
  private static instance: NodeControlService;
  private activeSession: SessionData | null = null;

  private constructor() {}

  static getInstance(): NodeControlService {
    if (!NodeControlService.instance) {
      NodeControlService.instance = new NodeControlService();
    }
    return NodeControlService.instance;
  }

  /**
   * Start device session with validation
   */
  async startSession(deviceId: string, tabId: string, forceTakeover: boolean = false): Promise<string> {
    try {
      // Clear any existing localStorage session first
      this.clearLocalSession(deviceId);

      // Start session via API with force_takeover parameter
      const session = await sessionService.startSession({ 
        device_id: deviceId,
        force_takeover: forceTakeover 
      });
      
      console.log("🔍 Backend session response:", JSON.stringify(session));
      
      // Extract session token (backend might return different field names)
      const sessionToken = session.session_token || (session as any).sessionToken || (session as any).token;
      
      if (!sessionToken) {
        console.error("❌ Backend did not return session_token! Response:", session);
        throw new Error("Backend failed to return session token");
      }
      
      // Store session data
      this.activeSession = {
        deviceId,
        sessionToken: sessionToken,
        tabId,
        startTime: Date.now(),
      };

      // Store in localStorage
      localStorage.setItem(`device_session_${deviceId}`, JSON.stringify({
        tabId,
        timestamp: Date.now(),
        sessionToken: sessionToken,
      }));

      console.log("✅ Session started and validated:", sessionToken);
      return sessionToken;
    } catch (error: any) {
      console.error("❌ Failed to start session:", error);
      
      // If session already exists and not forcing takeover, throw
      if (error.message?.includes("already has an active session")) {
        if (!forceTakeover) {
          // Don't clear localStorage - we need it for takeover
          throw error;
        }
      }
      
      throw error;
    }
  }

  /**
   * Stop device session with DB cleanup validation
   */
  async stopSession(deviceId: string, sessionToken: string | null): Promise<void> {
    console.log(`🛑 stopSession called with deviceId: ${deviceId}, sessionToken: ${sessionToken ? 'EXISTS' : 'NULL'}`);
    
    try {
      // Always call backend even if sessionToken is null (backend can clean by device_id)
      console.log("📡 Calling backend /device-session/stop...");
      await sessionService.stopSession({
        device_id: deviceId,
        session_token: sessionToken || undefined,
      });
      console.log("✅ Backend confirmed session stopped and removed from DB");
    } catch (error) {
      console.error("⚠️ Failed to stop session on backend:", error);
      console.error("Error details:", error);
      // Don't throw - we still want to clean up locally
    } finally {
      // ALWAYS clear local state
      this.activeSession = null;
      this.clearLocalSession(deviceId);
      console.log("✅ Local session cleared from localStorage");
    }
  }

  /**
   * Sync uptime to backend
   */
  async syncUptime(deviceId: string, uptimeSeconds: number): Promise<void> {
    try {
      await taskService.syncUptime({
        device_id: deviceId,
        uptime_seconds: uptimeSeconds,
      });
    } catch (error) {
      // Non-critical, just log
      console.warn("⚠️ Uptime sync failed:", error);
    }
  }

  /**
   * Validate session exists in localStorage
   */
  validateLocalSession(deviceId: string, currentTabId: string): boolean {
    const stored = localStorage.getItem(`device_session_${deviceId}`);
    if (!stored) return false;

    try {
      const session = JSON.parse(stored);
      
      // Check if session is from this tab
      if (session.tabId === currentTabId) {
        return true;
      }

      // Check if session is recent (within 5 minutes)
      const isRecent = Date.now() - session.timestamp < NODE_LIMITS.SESSION.TIMEOUT;
      if (!isRecent) {
        // Stale session, clear it
        this.clearLocalSession(deviceId);
        return false;
      }

      // Session exists in another tab
      return false;
    } catch (e) {
      this.clearLocalSession(deviceId);
      return false;
    }
  }

  /**
   * Clear localStorage session
   */
  clearLocalSession(deviceId: string): void {
    localStorage.removeItem(`device_session_${deviceId}`);
  }

  /**
   * Get active session data
   */
  getActiveSession(): SessionData | null {
    return this.activeSession;
  }

  /**
   * Check if device can start (not in another tab)
   */
  canStartDevice(deviceId: string, currentTabId: string): { canStart: boolean; reason?: string } {
    const stored = localStorage.getItem(`device_session_${deviceId}`);
    if (!stored) {
      return { canStart: true };
    }

    try {
      const session = JSON.parse(stored);
      
      // If same tab, can start
      if (session.tabId === currentTabId) {
        return { canStart: true };
      }

      // Check if session is recent
      const isRecent = Date.now() - session.timestamp < NODE_LIMITS.SESSION.TIMEOUT;
      if (isRecent) {
        return {
          canStart: false,
          reason: "Device is running in another tab",
        };
      }

      // Stale session, can start
      this.clearLocalSession(deviceId);
      return { canStart: true };
    } catch (e) {
      this.clearLocalSession(deviceId);
      return { canStart: true };
    }
  }
}

// Export singleton instance
export const nodeControlService = NodeControlService.getInstance();
