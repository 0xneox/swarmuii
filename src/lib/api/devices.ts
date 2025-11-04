/**
 * Device Management API Service
 * Handles device registration, updates, and management
 */

import apiClient, { getErrorMessage } from './client';

export interface Device {
  id: string;
  owner: string;
  device_name: string;
  hardware_fingerprint: string;
  hardware_tier: 'webgpu' | 'wasm' | 'webgl' | 'cpu'; // ✅ FIXED: All 4 tiers
  device_type?: 'desktop' | 'laptop' | 'tablet' | 'mobile';
  cpu_info?: Record<string, any>;
  gpu_info?: Record<string, any>;
  memory_gb?: number;
  status?: 'active' | 'inactive';
  uptime?: number;
  last_seen?: string;
  created_at?: string;
}

export interface RegisterDevicePayload {
  device_name: string;
  hardware_fingerprint: string;
  hardware_tier: 'webgpu' | 'wasm' | 'webgl' | 'cpu'; // ✅ FIXED: All 4 tiers
  device_type?: 'desktop' | 'laptop' | 'tablet' | 'mobile';
  cpu_info?: Record<string, any>;
  gpu_info?: Record<string, any>;
  memory_gb?: number;
}

export interface UpdateDevicePayload {
  device_name?: string;
  status?: 'active' | 'inactive';
  uptime?: number;
}

class DeviceService {
  /**
   * Register a new device
   */
  async registerDevice(payload: RegisterDevicePayload): Promise<Device> {
    try {
      const { data } = await apiClient.post<{ success: boolean; data: Device }>(
        '/devices',
        payload
      );
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get all user devices
   */
  async getDevices(): Promise<Device[]> {
    try {
      const { data } = await apiClient.get<{ success: boolean; data: Device[] }>(
        '/devices'
      );
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get specific device by ID
   */
  async getDevice(deviceId: string): Promise<Device> {
    try {
      const { data } = await apiClient.get<{ success: boolean; data: Device }>(
        `/devices/${deviceId}`
      );
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Update device
   */
  async updateDevice(deviceId: string, payload: UpdateDevicePayload): Promise<Device> {
    try {
      const { data } = await apiClient.put<{ success: boolean; data: Device }>(
        `/devices/${deviceId}`,
        payload
      );
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Delete device
   */
  async deleteDevice(deviceId: string): Promise<void> {
    try {
      await apiClient.delete(`/devices/${deviceId}`);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

export const deviceService = new DeviceService();
