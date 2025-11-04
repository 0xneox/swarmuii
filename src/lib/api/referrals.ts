/**
 * Referral System API Service
 * Handles referral verification, stats, and rewards
 */

import apiClient, { getErrorMessage } from './client';

export interface VerifyReferralPayload {
  referral_code: string;
}

export interface VerifyReferralResponse {
  valid: boolean;
  referrer?: {
    id: string;
    username: string;
  };
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  reward_claimed: boolean;
  created_at: string;
  tier_level?: 'tier_1' | 'tier_2' | 'tier_3';
  user_name?: string;
  user_id?: string;
  referred_at?: string;
}

export interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  total_rewards: number;
  pending_rewards: number;
}

class ReferralService {
  /**
   * Verify a referral code (public endpoint)
   */
  async verifyCode(payload: VerifyReferralPayload): Promise<VerifyReferralResponse> {
    try {
      const { data } = await apiClient.post<{ success: boolean; data: VerifyReferralResponse }>(
        '/referrals/verify',
        payload
      );
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get user's referrals
   */
  async getReferrals(): Promise<Referral[]> {
    try {
      const { data } = await apiClient.get<{ success: boolean; data: Referral[] }>(
        '/referrals'
      );
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get referral statistics
   */
  async getStats(): Promise<ReferralStats> {
    try {
      const { data } = await apiClient.get<{ success: boolean; data: ReferralStats }>(
        '/referrals/stats'
      );
      return data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

export const referralService = new ReferralService();
