/**
 * Session Manager - Prevents multi-tab exploitation
 * Ensures only one browser tab can run a node session at a time
 */

export interface ActiveSession {
  tabId: string;
  sessionToken: string;
  startTime: string;
  deviceId: string;
  timestamp: number;
}

const SESSION_KEY = 'active_node_session';
const TAB_ID_KEY = 'current_tab_id';

export class SessionManager {
  private static currentTabId: string;

  /**
   * Initialize tab with unique ID
   */
  static initializeTab(): string {
    if (!this.currentTabId) {
      this.currentTabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(TAB_ID_KEY, this.currentTabId);
    }
    return this.currentTabId;
  }

  /**
   * Get current tab ID
   */
  static getCurrentTabId(): string {
    if (!this.currentTabId) {
      this.currentTabId = sessionStorage.getItem(TAB_ID_KEY) || this.initializeTab();
    }
    return this.currentTabId;
  }

  /**
   * Check if another tab has an active session for this device
   */
  static hasActiveSessionInOtherTab(deviceId: string): ActiveSession | null {
    const stored = localStorage.getItem(`${SESSION_KEY}_${deviceId}`);
    if (!stored) return null;

    try {
      const session: ActiveSession = JSON.parse(stored);
      
      // Check if session is from a different tab
      if (session.tabId !== this.getCurrentTabId()) {
        // Check if session is still valid (within last 5 minutes)
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        if (session.timestamp > fiveMinutesAgo) {
          return session;
        }
      }
    } catch (error) {
      console.error('Error parsing active session:', error);
    }

    return null;
  }

  /**
   * Register an active session for current tab
   */
  static registerSession(deviceId: string, sessionToken: string, startTime: string): void {
    const session: ActiveSession = {
      tabId: this.getCurrentTabId(),
      sessionToken,
      startTime,
      deviceId,
      timestamp: Date.now(),
    };

    localStorage.setItem(`${SESSION_KEY}_${deviceId}`, JSON.stringify(session));
    console.log('✅ Session registered for tab:', this.getCurrentTabId());
  }

  /**
   * Clear session for a device
   */
  static clearSession(deviceId: string): void {
    localStorage.removeItem(`${SESSION_KEY}_${deviceId}`);
    console.log('🗑️ Session cleared for device:', deviceId);
  }

  /**
   * Update session timestamp (keep-alive)
   */
  static updateSessionTimestamp(deviceId: string): void {
    const stored = localStorage.getItem(`${SESSION_KEY}_${deviceId}`);
    if (!stored) return;

    try {
      const session: ActiveSession = JSON.parse(stored);
      if (session.tabId === this.getCurrentTabId()) {
        session.timestamp = Date.now();
        localStorage.setItem(`${SESSION_KEY}_${deviceId}`, JSON.stringify(session));
      }
    } catch (error) {
      console.error('Error updating session timestamp:', error);
    }
  }

  /**
   * Take over session from another tab
   */
  static takeOverSession(deviceId: string, sessionToken: string, startTime: string): void {
    const currentTabId = this.getCurrentTabId();
    
    // Clear old session
    this.clearSession(deviceId);
    
    // Register new session with current tab
    this.registerSession(deviceId, sessionToken, startTime);
    
    // 🔥 BROADCAST takeover event to all other tabs
    localStorage.setItem(
      `${SESSION_KEY}_takeover_${deviceId}`,
      JSON.stringify({
        newOwner: currentTabId,
        timestamp: Date.now(),
        deviceId,
      })
    );
    
    // Clean up broadcast message after 1 second
    setTimeout(() => {
      localStorage.removeItem(`${SESSION_KEY}_takeover_${deviceId}`);
    }, 1000);
    
    console.log('🔄 Session taken over by tab:', currentTabId);
  }

  /**
   * Check if current tab owns the session
   */
  static isSessionOwner(deviceId: string): boolean {
    const stored = localStorage.getItem(`${SESSION_KEY}_${deviceId}`);
    if (!stored) return false;

    try {
      const session: ActiveSession = JSON.parse(stored);
      return session.tabId === this.getCurrentTabId();
    } catch {
      return false;
    }
  }

  /**
   * Setup listener for session takeover events from other tabs
   * This allows Tab 1 to immediately know when Tab 2 takes over
   */
  static setupTakeoverListener(deviceId: string, onTakeoverDetected: () => void): () => void {
    const currentTabId = this.getCurrentTabId();
    
    const handleStorageChange = (e: StorageEvent) => {
      // Check if this is a takeover event for our device
      if (e.key === `${SESSION_KEY}_takeover_${deviceId}` && e.newValue) {
        try {
          const takeover = JSON.parse(e.newValue);
          
          // If someone else took over, notify this tab
          if (takeover.newOwner !== currentTabId) {
            console.log(`🚨 Session takeover detected! New owner: ${takeover.newOwner}`);
            onTakeoverDetected();
          }
        } catch (err) {
          console.error('Failed to parse takeover event:', err);
        }
      }
    };

    // Listen for localStorage changes from other tabs
    window.addEventListener('storage', handleStorageChange);

    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
}
