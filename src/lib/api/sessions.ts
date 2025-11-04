/**
 * Device Session Management API Service
 * Handles session start, stop, verify, and cleanup
 */

import apiClient, { getErrorMessage } from './client';

export interface DeviceSession {
  id: string;
  device_id: string;
  session_token: string;
  start_time: string;
  end_time?: string;
  status: 'active' | 'stopped';
}

export interface StartSessionPayload {
  device_id: string;
  force_takeover?: boolean; // NEW: Allow force takeover from backend
}

export interface StopSessionPayload {
  device_id: string;
  session_token?: string;
}

export interface VerifySessionPayload {
  device_id: string;
  session_token: string;
}

class SessionService {
  /**
   * Start a new device session
   */
  async startSession(payload: StartSessionPayload): Promise<DeviceSession> {
    try {
      const { data } = await apiClient.post<{ success: boolean; data: DeviceSession }>(
        '/device-session/register',
        payload
      );
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Stop an active session
   */
  async stopSession(payload: StopSessionPayload): Promise<void> {
    try {
      await apiClient.post('/device-session/stop', payload);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Verify session status (GET)
   */
  async verifySession(deviceId: string): Promise<{ valid: boolean; session?: DeviceSession }> {
    try {
      const { data } = await apiClient.get<{ success: boolean; data: any }>(
        `/device-session/verify?device_id=${deviceId}`
      );
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Verify session with token (POST)
   */
  async verifySessionWithToken(payload: VerifySessionPayload): Promise<{ valid: boolean }> {
    try {
      const { data } = await apiClient.post<{ success: boolean; data: { valid: boolean } }>(
        '/device-session/verify',
        payload
      );
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Cleanup stale sessions
   */
  async cleanupSessions(): Promise<{ cleaned: number }> {
    try {
      const { data } = await apiClient.post<{ success: boolean; data: { cleaned: number } }>(
        '/device-session/cleanup'
      );
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

export const sessionService = new SessionService();
