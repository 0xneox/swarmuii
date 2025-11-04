/**
 * Task Completion and Node Uptime API Service
 */

import apiClient, { getErrorMessage } from './client';

export interface CompleteTaskPayload {
  task_id: string;
  task_type: 'text' | 'image' | 'video' | '3d';
  reward_amount?: number; // Optional, max 100 per task
}

export interface CompleteTaskResponse {
  unclaimed_reward: number;
  total_unclaimed_reward: number;
  task_count: number;
}

export interface SyncUptimePayload {
  device_id: string;
  uptime_seconds: number;
}

class TaskService {
  /**
   * Complete a task and earn rewards
   * Security: Max 100 SP per task enforced by backend
   * Backend expects: { task_id, task_type, reward_amount? }
   */
  async completeTask(payload: CompleteTaskPayload): Promise<CompleteTaskResponse> {
    try {
      // Ensure reward_amount is an INTEGER and doesn't exceed 100
      const safePayload = {
        ...payload,
        reward_amount: payload.reward_amount 
          ? Math.min(Math.floor(payload.reward_amount), 100)  // Force integer
          : undefined,
      };

      console.log('📤 Completing task:', JSON.stringify(safePayload));

      const { data } = await apiClient.post<{ success: boolean; data: CompleteTaskResponse }>(
        '/complete-task',
        safePayload
      );
      
      console.log('✅ Task completed:', data.data);
      return data.data;
    } catch (error: any) {
      console.error('❌ Task completion failed:', error.response?.data || error.message);
      console.error('Payload sent:', payload);
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Sync node uptime to backend
   */
  async syncUptime(payload: SyncUptimePayload): Promise<{ uptime_seconds: number }> {
    try {
      const { data } = await apiClient.post<{ success: boolean; data: { uptime_seconds: number } }>(
        '/node-uptime',
        payload
      );
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get current uptime from backend for a device
   */
  async getUptime(deviceId: string): Promise<number> {
    try {
      const { data } = await apiClient.get<{ success: boolean; data: { uptime_seconds: number } }>(
        `/node-uptime/${deviceId}`
      );
      return data.data.uptime_seconds || 0;
    } catch (error) {
      console.warn('Failed to fetch uptime:', error);
      return 0;
    }
  }
}

export const taskService = new TaskService();
