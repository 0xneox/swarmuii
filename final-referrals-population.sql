-- ============================================
-- FINAL REFERRALS POPULATION
-- Using EXISTING user IDs from your database
-- Main User: KNIGHTISH (8f5d39d6-021e-4790-967e-b80b78c13d47)
-- ============================================

-- ============================================
-- STEP 1: Populate REFERRALS table
-- ============================================

-- TIER 1: Direct referrals of KNIGHTISH (5 users)
INSERT INTO referrals (referrer_id, referred_id, created_at)
VALUES
  ('8f5d39d6-021e-4790-967e-b80b78c13d47', '4b4b4ff6-ff6d-4ed5-ab13-09444dd97d8d', NOW() - INTERVAL '30 days'), -- tier1_alice
  ('8f5d39d6-021e-4790-967e-b80b78c13d47', 'f949cee1-9d7b-4c36-802d-fd7eda74114c', NOW() - INTERVAL '29 days'), -- tier1_bob
  ('8f5d39d6-021e-4790-967e-b80b78c13d47', '54b040f8-98e8-41a0-8e33-cbe61aac0e76', NOW() - INTERVAL '28 days'), -- tier1_carol
  ('8f5d39d6-021e-4790-967e-b80b78c13d47', 'fc35eaf9-0bb0-4bf8-9fbe-88de05680964', NOW() - INTERVAL '27 days'), -- tier1_dave
  ('8f5d39d6-021e-4790-967e-b80b78c13d47', 'adf70b35-2926-4b2d-851e-8dccd9b9a8e4', NOW() - INTERVAL '26 days')  -- tier1_eve
ON CONFLICT DO NOTHING;

-- TIER 2: Referrals of Tier 1 users (10 users, 2 per Tier 1)
INSERT INTO referrals (referrer_id, referred_id, created_at)
VALUES
  -- Alice's referrals (2)
  ('4b4b4ff6-ff6d-4ed5-ab13-09444dd97d8d', 'c3ae8a1b-e4fd-4439-b18c-7a81bf12905b', NOW() - INTERVAL '25 days'), -- tier2_frank
  ('4b4b4ff6-ff6d-4ed5-ab13-09444dd97d8d', 'c355ddf7-45f7-4f4a-8dac-8c1dcc9fdc49', NOW() - INTERVAL '24 days'), -- tier2_grace
  
  -- Bob's referrals (2)
  ('f949cee1-9d7b-4c36-802d-fd7eda74114c', '9d847724-198d-49a6-8ad6-d43a2ab40a94', NOW() - INTERVAL '23 days'), -- tier2_henry
  ('f949cee1-9d7b-4c36-802d-fd7eda74114c', '24551522-cea1-46f0-aa9c-a8baf9cd60ef', NOW() - INTERVAL '22 days'), -- tier2_iris
  
  -- Carol's referrals (2)
  ('54b040f8-98e8-41a0-8e33-cbe61aac0e76', '777e641a-ad2a-43ec-be0d-c15b8f47017c', NOW() - INTERVAL '21 days'), -- tier2_jack
  ('54b040f8-98e8-41a0-8e33-cbe61aac0e76', '6163b11a-51ec-4a1b-80fb-cf2bf4443dd9', NOW() - INTERVAL '20 days'), -- tier2_kate
  
  -- Dave's referrals (2)
  ('fc35eaf9-0bb0-4bf8-9fbe-88de05680964', 'd85e499d-1080-4b47-9e6d-2b57e98ee41f', NOW() - INTERVAL '19 days'), -- tier2_leo
  ('fc35eaf9-0bb0-4bf8-9fbe-88de05680964', '8102b74c-9cb7-4b91-b81c-838345f09c04', NOW() - INTERVAL '18 days'), -- tier2_mia
  
  -- Eve's referrals (2)
  ('adf70b35-2926-4b2d-851e-8dccd9b9a8e4', '82089c4d-80d5-4d36-ac74-43632786e40c', NOW() - INTERVAL '17 days'), -- tier2_noah
  ('adf70b35-2926-4b2d-851e-8dccd9b9a8e4', '0bfde271-d7c3-4d54-b146-a2f2f79d299d', NOW() - INTERVAL '16 days')  -- tier2_olivia
ON CONFLICT DO NOTHING;

-- TIER 3: Referrals of Tier 2 users (20 users, 2 per Tier 2)
INSERT INTO referrals (referrer_id, referred_id, created_at)
VALUES
  -- tier2_frank's referrals (2)
  ('c3ae8a1b-e4fd-4439-b18c-7a81bf12905b', 'aafd96a5-3cd9-4a5f-b56a-3226003b743b', NOW() - INTERVAL '15 days'), -- tier3_paul
  ('c3ae8a1b-e4fd-4439-b18c-7a81bf12905b', '9538bc18-c769-46c6-a770-12a921586d8e', NOW() - INTERVAL '14 days'), -- tier3_quinn
  
  -- tier2_grace's referrals (2)
  ('c355ddf7-45f7-4f4a-8dac-8c1dcc9fdc49', 'fa6349ee-5f34-46ab-ace6-df088708f74f', NOW() - INTERVAL '13 days'), -- tier3_rose
  ('c355ddf7-45f7-4f4a-8dac-8c1dcc9fdc49', '6f9686c1-63d1-4204-a7dd-73be80fecdc5', NOW() - INTERVAL '12 days'), -- tier3_sam
  
  -- tier2_henry's referrals (2)
  ('9d847724-198d-49a6-8ad6-d43a2ab40a94', '97f48250-00ea-4097-84b7-acbb670c9099', NOW() - INTERVAL '11 days'), -- tier3_tina
  ('9d847724-198d-49a6-8ad6-d43a2ab40a94', '60566182-004c-4200-921b-70b22593d89d', NOW() - INTERVAL '10 days'), -- tier3_uma
  
  -- tier2_iris's referrals (2)
  ('24551522-cea1-46f0-aa9c-a8baf9cd60ef', 'f711a0c9-7e68-4730-9441-345280c465da', NOW() - INTERVAL '9 days'),  -- tier3_vince
  ('24551522-cea1-46f0-aa9c-a8baf9cd60ef', '95fabbb3-e9c5-4b8e-8db8-2ebf3e203d8e', NOW() - INTERVAL '8 days'),  -- tier3_wendy
  
  -- tier2_jack's referrals (2)
  ('777e641a-ad2a-43ec-be0d-c15b8f47017c', '7e84c7b6-aab5-4c3f-9eeb-39ee973889d9', NOW() - INTERVAL '7 days'),  -- tier3_xander
  ('777e641a-ad2a-43ec-be0d-c15b8f47017c', '1c59f66f-ac51-4310-a835-ae68559abb62', NOW() - INTERVAL '6 days'),  -- tier3_yara
  
  -- tier2_kate's referrals (2)
  ('6163b11a-51ec-4a1b-80fb-cf2bf4443dd9', '54a2074c-5769-4c7f-836e-1032651dfcfe', NOW() - INTERVAL '5 days'),  -- tier3_zara
  ('6163b11a-51ec-4a1b-80fb-cf2bf4443dd9', 'dcebcc70-e2a5-4cb3-9c7e-b36fce22258d', NOW() - INTERVAL '4 days'),  -- tier3_adam
  
  -- tier2_leo's referrals (2)
  ('d85e499d-1080-4b47-9e6d-2b57e98ee41f', '1201cbfe-63fc-4890-8990-66650120190f', NOW() - INTERVAL '3 days'),  -- tier3_bella
  ('d85e499d-1080-4b47-9e6d-2b57e98ee41f', '1c59f66f-ac51-4310-a835-ae68559abb62', NOW() - INTERVAL '2 days'),  -- tier3_charlie
  
  -- tier2_mia's referrals (2)
  ('8102b74c-9cb7-4b91-b81c-838345f09c04', '47ecceaf-9e68-4979-976d-adf424b19417', NOW() - INTERVAL '2 days'),  -- tier3_diana
  ('8102b74c-9cb7-4b91-b81c-838345f09c04', '0b396c33-ac15-4d9d-a8a3-686b23a86d7c', NOW() - INTERVAL '1 day'),   -- tier3_ethan
  
  -- tier2_noah's referrals (2)
  ('82089c4d-80d5-4d36-ac74-43632786e40c', '806abdc0-f9de-4f01-af91-27236648f80a', NOW() - INTERVAL '1 day'),   -- tier3_fiona
  ('82089c4d-80d5-4d36-ac74-43632786e40c', '34969eb5-6e33-4387-8d57-782acea9fd88', NOW() - INTERVAL '1 day'),   -- tier3_george
  
  -- tier2_olivia's referrals (2)
  ('0bfde271-d7c3-4d54-b146-a2f2f79d299d', 'e38c6407-d2f3-4946-921a-9cd9ba8fc8c0', NOW() - INTERVAL '1 day'),   -- tier3_hannah
  ('0bfde271-d7c3-4d54-b146-a2f2f79d299d', '3ff1dc2e-0b19-40de-ada8-81c99b17287f', NOW() - INTERVAL '1 day')    -- tier3_ivan
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 2: Populate REFERRAL_REWARDS table
-- ============================================
-- Note: referral_rewards table links to referrals.id (auto-generated UUIDs)
-- If you need to populate this, you'll need to query the referrals table first
-- to get the actual referral IDs, then insert rewards referencing those IDs.
-- 
-- For now, just populate referrals table. Backend will handle rewards.

-- ============================================
-- STEP 3: Verify Results
-- ============================================

-- Check total referrals for KNIGHTISH
SELECT 
  'Total Direct (Tier 1)' as metric,
  COUNT(*) as count
FROM referrals
WHERE referrer_id = '8f5d39d6-021e-4790-967e-b80b78c13d47'

UNION ALL

-- Check Tier 2
SELECT 
  'Total Tier 2',
  COUNT(*)
FROM referrals r1
JOIN referrals r2 ON r2.referrer_id = r1.referred_id
WHERE r1.referrer_id = '8f5d39d6-021e-4790-967e-b80b78c13d47'

UNION ALL

-- Check Tier 3
SELECT 
  'Total Tier 3',
  COUNT(*)
FROM referrals r1
JOIN referrals r2 ON r2.referrer_id = r1.referred_id
JOIN referrals r3 ON r3.referrer_id = r2.referred_id
WHERE r1.referrer_id = '8f5d39d6-021e-4790-967e-b80b78c13d47';

-- ============================================
-- Show Tier 1 usernames (for frontend display)
-- ============================================
SELECT 
  up.user_name,
  up.email,
  r.created_at as referred_at
FROM referrals r
JOIN user_profiles up ON up.id = r.referred_id
WHERE r.referrer_id = '8f5d39d6-021e-4790-967e-b80b78c13d47'
ORDER BY r.created_at DESC;

-- ============================================
-- Done! ✅
-- ============================================
