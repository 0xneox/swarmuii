-- Quick Reward Award Script
-- Replace USER_EMAIL with the actual user email
-- Replace REWARD_AMOUNT with the desired SP amount

-- ============================================
-- QUICK SP BONUS (Change amount as needed)
-- ============================================

INSERT INTO earnings (id, user_id, amount, earning_type, reward_type, is_claimed, description, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'USER_EMAIL'),
  999, -- Change this amount
  'other',
  'bonus',
  false,
  '999 SP Special Bonus',
  '{"reason":"test_bonus","category":"promotional"}'::jsonb,
  NOW(),
  NOW()
);

-- ============================================
-- PREMIUM MODEL ACCESS (2 DAYS)
-- ============================================

INSERT INTO earnings (id, user_id, amount, earning_type, reward_type, is_claimed, description, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'USER_EMAIL'),
  0,
  'other',
  'special_reward',
  false,
  'Premium AI model access for 2 days',
  '{"duration_days":2,"models":["gpt-4","claude-3-opus","gemini-pro"],"feature":"premium_models","reward_type":"premium_access","reward_value":"2_days"}'::jsonb,
  NOW(),
  NOW()
);

-- ============================================
-- PRO PLAN UPGRADE (1 WEEK)
-- ============================================

INSERT INTO earnings (id, user_id, amount, earning_type, reward_type, is_claimed, description, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'USER_EMAIL'),
  0,
  'other',
  'special_reward',
  false,
  'Pro Plan upgrade for 1 week',
  '{"duration_days":7,"plan":"basic","features":["faster_processing","more_concurrent_tasks","priority_support"],"reward_type":"plan_upgrade","reward_value":"basic"}'::jsonb,
  NOW(),
  NOW()
);

-- ============================================
-- VIP BADGE
-- ============================================

INSERT INTO earnings (id, user_id, amount, earning_type, reward_type, is_claimed, description, metadata, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'USER_EMAIL'),
  0,
  'other',
  'special_reward',
  false,
  'VIP Badge awarded',
  '{"badge":"vip","perks":["priority_queue","exclusive_chat","special_events"],"reward_type":"custom","reward_value":"vip_badge"}'::jsonb,
  NOW(),
  NOW()
);

-- ============================================
-- BULK AWARD (Multiple Rewards at Once)
-- ============================================

-- Award 5000 SP + Premium Access + Pro Plan
WITH rewards AS (
  SELECT 
    (SELECT id FROM users WHERE email = 'USER_EMAIL') as user_id
)
INSERT INTO earnings (id, user_id, amount, earning_type, reward_type, is_claimed, description, metadata, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  user_id,
  amount,
  earning_type,
  reward_type,
  false,
  description,
  metadata::jsonb,
  NOW(),
  NOW()
FROM rewards, (
  VALUES
    (5000, 'other', 'bonus', '5000 SP Mega Bonus', '{"reason":"mega_bonus","category":"achievement"}'),
    (0, 'other', 'special_reward', 'Premium AI models for 7 days', '{"duration_days":7,"models":["gpt-4","claude-3-opus","gemini-pro"],"feature":"premium_models","reward_type":"premium_access","reward_value":"7_days"}'),
    (0, 'other', 'special_reward', 'Pro Plan for 1 week', '{"duration_days":7,"plan":"basic","features":["faster_processing","more_concurrent_tasks","priority_support"],"reward_type":"plan_upgrade","reward_value":"basic"}')
) AS r(amount, earning_type, reward_type, description, metadata);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check total unclaimed rewards
SELECT 
  SUM(amount) as total_unclaimed,
  COUNT(*) as unclaimed_count
FROM earnings 
WHERE user_id = (SELECT id FROM users WHERE email = 'USER_EMAIL')
AND is_claimed = false;

-- List all rewards for user
SELECT 
  amount,
  reward_type,
  description,
  metadata,
  is_claimed,
  created_at
FROM earnings 
WHERE user_id = (SELECT id FROM users WHERE email = 'USER_EMAIL')
ORDER BY created_at DESC
LIMIT 20;
