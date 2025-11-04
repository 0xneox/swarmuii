/**
 * Central API Services Export
 * Import all services from a single location
 */

// Core API client
export { default as apiClient, getErrorMessage } from './client';

// Authentication
export { authService } from './auth';
export type { User, AuthResponse, LoginCredentials, SignupCredentials } from './auth';

// Devices
export { deviceService } from './devices';
export type { Device, RegisterDevicePayload, UpdateDevicePayload } from './devices';

// Sessions
export { sessionService } from './sessions';
export type {
  DeviceSession,
  StartSessionPayload,
  StopSessionPayload,
  VerifySessionPayload,
} from './sessions';

// Tasks
export { taskService } from './tasks';
export type { CompleteTaskPayload, CompleteTaskResponse, SyncUptimePayload } from './tasks';

// Earnings
export { earningsService } from './earnings';
export type {
  Earnings,
  EarningHistory,
  LeaderboardEntry,
  ChartDataPoint,
  Transaction,
} from './earnings';

// Support
export { supportService } from './support';
export type { SupportTicket, SubmitTicketResponse } from './support';

// Referrals
export { referralService } from './referrals';
export type {
  VerifyReferralPayload,
  VerifyReferralResponse,
  Referral,
  ReferralStats,
} from './referrals';

// Analytics
export { analyticsService } from './analytics';
export type { DashboardStats, GlobalStats, LeaderboardEntry as AnalyticsLeaderboardEntry } from './analytics';
