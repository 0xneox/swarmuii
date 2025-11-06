/**
 * Referral System API Service
 * Handles referral verification, stats, and rewards
 */

import apiClient, { getErrorMessage } from './client';

export interface VerifyReferralPayload {
  referralCode: string;
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
  claimed_rewards: number;
  pending_rewards: number;
  tier1: {
    count: number;
    earnings: number;
  };
  tier2: {
    count: number;
    earnings: number;
  };
  tier3: {
    count: number;
    earnings: number;
  };
}

export interface TierOneUser {
  username: string;
  earnings: number;
  joinedAt: string;
}

export interface ReferralBreakdown {
  tier1: TierOneUser[];
  tier2: {
    count: number;
    earnings: number;
  };
  tier3: {
    count: number;
    earnings: number;
  };
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
   * Get user's referrals (people they referred)
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
   * Get who referred the current user
   */
  async getMyReferrer(): Promise<{ referred: boolean; referrer?: { id: string; username: string } }> {
    try {
      const { data } = await apiClient.get<{ 
        success: boolean; 
        data: { referred: boolean; referrer?: { id: string; username: string } }
      }>('/referrals/my-referrer');
      return data.data;
    } catch (error) {
      // If endpoint doesn't exist, return not referred
      return { referred: false };
    }
  }

  /**
   * Get referral statistics
   */
  async getStats(): Promise<ReferralStats> {
    const { data } = await apiClient.get<{ success: boolean; data: ReferralStats }>(
      '/referrals/stats'
    );
    return data.data;
  }

  /**
   * Get detailed referral breakdown with Tier 1 names
   */
  async getBreakdown(): Promise<ReferralBreakdown> {
    const { data } = await apiClient.get<{ success: boolean; data: ReferralBreakdown }>(
      '/referrals/breakdown'
    );
    return data.data;
  }

  /**
   * Use a referral code after signup (for users who didn't use one during registration)
   * @param referralCode - The referral code to use
   */
  async useReferralCode(referralCode: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post<{ 
      success: boolean; 
      message: string;
      data: { success: boolean; message: string }
    }>('/referrals/use-code', {
      referralCode
    });
    return data.data;
  }

  /**
   * Claim pending referral rewards
   * @param earningType - Type of earning to claim (e.g., 'referral', 'task', 'bonus')
   */
  async claimRewards(earningType: string = 'referral'): Promise<{ success: boolean; claimed_amount: number }> {
    try {
      const { data } = await apiClient.post<{ 
        success: boolean; 
        data: { claimed_amount: number } 
      }>('/referrals/claim', {
        earning_type: earningType
      });
      return { success: true, claimed_amount: data.data.claimed_amount };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

export const referralService = new ReferralService();
