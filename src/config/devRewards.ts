/**
 * Dev Rewards Configuration
 * Special rewards for testing, promotions, and special events
 * 
 * Usage: Add custom rewards here for testing or promotional campaigns
 * These can be manually awarded to users via admin panel or special endpoints
 */

export type RewardType = 'sp_bonus' | 'premium_access' | 'plan_upgrade' | 'custom';

export interface DevReward {
  id: string;
  name: string;
  description: string;
  type: RewardType;
  value: number | string; // Number for SP, string for plan names or custom values
  icon?: string;
  color?: string;
  metadata?: Record<string, any>;
}

/**
 * Predefined Dev Rewards
 * Add your custom rewards here for easy testing
 */
export const DEV_REWARDS: DevReward[] = [
  // SP Bonuses
  {
    id: 'bonus_999',
    name: '999 SP Bonus',
    description: 'Special bonus reward for testing',
    type: 'sp_bonus',
    value: 999,
    icon: '💰',
    color: '#fbbf24',
    metadata: {
      reason: 'test_bonus',
      category: 'promotional',
    },
  },
  {
    id: 'bonus_5000',
    name: '5000 SP Mega Bonus',
    description: 'Mega reward for special achievements',
    type: 'sp_bonus',
    value: 5000,
    icon: '🎁',
    color: '#10b981',
    metadata: {
      reason: 'mega_bonus',
      category: 'achievement',
    },
  },
  {
    id: 'bonus_10000',
    name: '10000 SP Ultimate Bonus',
    description: 'Ultimate reward for exceptional users',
    type: 'sp_bonus',
    value: 10000,
    icon: '🏆',
    color: '#8b5cf6',
    metadata: {
      reason: 'ultimate_bonus',
      category: 'vip',
    },
  },

  // Premium Model Access
  {
    id: 'premium_2day',
    name: 'Premium Model Access (2 Days)',
    description: 'Access premium AI models for 2 days',
    type: 'premium_access',
    value: '2_days',
    icon: '🤖',
    color: '#3b82f6',
    metadata: {
      duration_days: 2,
      models: ['gpt-4', 'claude-3-opus', 'gemini-pro'],
      feature: 'premium_models',
    },
  },
  {
    id: 'premium_7day',
    name: 'Premium Model Access (1 Week)',
    description: 'Access premium AI models for 7 days',
    type: 'premium_access',
    value: '7_days',
    icon: '🌟',
    color: '#3b82f6',
    metadata: {
      duration_days: 7,
      models: ['gpt-4', 'claude-3-opus', 'gemini-pro'],
      feature: 'premium_models',
    },
  },
  {
    id: 'premium_30day',
    name: 'Premium Model Access (1 Month)',
    description: 'Access premium AI models for 30 days',
    type: 'premium_access',
    value: '30_days',
    icon: '⭐',
    color: '#3b82f6',
    metadata: {
      duration_days: 30,
      models: ['gpt-4', 'claude-3-opus', 'gemini-pro', 'dall-e-3'],
      feature: 'premium_models',
    },
  },

  // Plan Upgrades
  {
    id: 'pro_1week',
    name: 'Pro Plan (1 Week)',
    description: 'Upgrade to Pro plan for 1 week',
    type: 'plan_upgrade',
    value: 'basic',
    icon: '🚀',
    color: '#f59e0b',
    metadata: {
      duration_days: 7,
      plan: 'basic',
      features: ['faster_processing', 'more_concurrent_tasks', 'priority_support'],
    },
  },
  {
    id: 'ultimate_1week',
    name: 'Ultimate Plan (1 Week)',
    description: 'Upgrade to Ultimate plan for 1 week',
    type: 'plan_upgrade',
    value: 'ultimate',
    icon: '💎',
    color: '#8b5cf6',
    metadata: {
      duration_days: 7,
      plan: 'ultimate',
      features: ['fastest_processing', 'max_concurrent_tasks', 'priority_support', 'exclusive_models'],
    },
  },
  {
    id: 'enterprise_3day',
    name: 'Enterprise Trial (3 Days)',
    description: 'Try Enterprise features for 3 days',
    type: 'plan_upgrade',
    value: 'enterprise',
    icon: '👑',
    color: '#ec4899',
    metadata: {
      duration_days: 3,
      plan: 'enterprise',
      features: ['enterprise_processing', 'unlimited_tasks', '24/7_support', 'all_premium_models', 'api_access'],
    },
  },

  // Custom Rewards
  {
    id: 'custom_early_access',
    name: 'Early Access Pass',
    description: 'Get early access to new features',
    type: 'custom',
    value: 'early_access_badge',
    icon: '🎫',
    color: '#06b6d4',
    metadata: {
      badge: 'early_adopter',
      features: ['beta_features', 'new_models_first', 'feedback_priority'],
    },
  },
  {
    id: 'custom_referral_boost',
    name: 'Referral Boost (2x)',
    description: '2x referral earnings for 7 days',
    type: 'custom',
    value: 'referral_boost_2x',
    icon: '📈',
    color: '#10b981',
    metadata: {
      multiplier: 2,
      duration_days: 7,
      applies_to: 'referral_earnings',
    },
  },
  {
    id: 'custom_vip_badge',
    name: 'VIP Badge',
    description: 'Exclusive VIP community badge',
    type: 'custom',
    value: 'vip_badge',
    icon: '⚡',
    color: '#fbbf24',
    metadata: {
      badge: 'vip',
      perks: ['priority_queue', 'exclusive_chat', 'special_events'],
    },
  },
];

/**
 * Helper function to get reward by ID
 */
export const getRewardById = (id: string): DevReward | undefined => {
  return DEV_REWARDS.find(reward => reward.id === id);
};

/**
 * Helper function to get rewards by type
 */
export const getRewardsByType = (type: RewardType): DevReward[] => {
  return DEV_REWARDS.filter(reward => reward.type === type);
};

/**
 * SQL Generator for awarding dev rewards
 * Use this to generate SQL statements for testing
 */
export const generateRewardSQL = (
  userId: string,
  rewardId: string,
  userEmail?: string
): string => {
  const reward = getRewardById(rewardId);
  
  if (!reward) {
    throw new Error(`Reward with ID ${rewardId} not found`);
  }

  const userIdentifier = userEmail 
    ? `(SELECT id FROM users WHERE email = '${userEmail}')`
    : `'${userId}'`;

  switch (reward.type) {
    case 'sp_bonus':
      return `
-- Award ${reward.name} to user
INSERT INTO earnings (id, user_id, amount, earning_type, reward_type, is_claimed, description, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  ${userIdentifier},
  ${reward.value},
  'other',
  'bonus',
  false,
  '${reward.description}',
  '${JSON.stringify(reward.metadata)}'::jsonb,
  NOW(),
  NOW()
);
`;

    case 'premium_access':
    case 'plan_upgrade':
    case 'custom':
      return `
-- Award ${reward.name} to user
-- Note: Premium access and plan upgrades require backend implementation
-- This creates a special earning record that the backend should process
INSERT INTO earnings (id, user_id, amount, earning_type, reward_type, is_claimed, description, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  ${userIdentifier},
  0,
  'other',
  'special_reward',
  false,
  '${reward.description}',
  '${JSON.stringify({ ...reward.metadata, reward_type: reward.type, reward_value: reward.value })}'::jsonb,
  NOW(),
  NOW()
);

-- TODO: Backend should process this and apply the appropriate upgrade/access
`;

    default:
      throw new Error(`Unknown reward type: ${reward.type}`);
  }
};

/**
 * Bulk SQL Generator
 * Generate SQL to award multiple rewards at once
 */
export const generateBulkRewardSQL = (
  userId: string,
  rewardIds: string[],
  userEmail?: string
): string => {
  return rewardIds
    .map(id => generateRewardSQL(userId, id, userEmail))
    .join('\n\n');
};

/**
 * Example usage in comments:
 * 
 * // Award 999 SP bonus to user
 * const sql = generateRewardSQL('user-id', 'bonus_999', 'user@example.com');
 * 
 * // Award multiple rewards
 * const bulkSql = generateBulkRewardSQL('user-id', ['bonus_999', 'premium_2day', 'pro_1week'], 'user@example.com');
 */
