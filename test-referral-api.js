/**
 * Test script for Referral API endpoints
 * Run with: node test-referral-api.js
 * 
 * Make sure to:
 * 1. Start your backend server on http://localhost:3001
 * 2. Have a valid JWT token (login first)
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001/api/v1';
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

// Create axios instance with auth
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Test functions
async function testReferralStats() {
  console.log('\n🧪 Testing GET /referrals/stats...');
  try {
    const response = await api.get('/referrals/stats');
    console.log('✅ Success:', response.data);
    console.log('Expected structure:');
    console.log('  - total_referrals: number');
    console.log('  - active_referrals: number');
    console.log('  - total_rewards: number');
    console.log('  - pending_rewards: number');
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
    return null;
  }
}

async function testGetReferrals() {
  console.log('\n🧪 Testing GET /referrals...');
  try {
    const response = await api.get('/referrals');
    console.log('✅ Success:', response.data);
    console.log('Number of referrals:', response.data.data?.length || 0);
    
    if (response.data.data?.length > 0) {
      console.log('\nFirst referral structure:');
      console.log(JSON.stringify(response.data.data[0], null, 2));
      
      // Check for tier_level
      const hasThreeTiers = response.data.data.some(ref => ref.tier_level);
      if (hasThreeTiers) {
        console.log('\n✅ Tiers are present in the data!');
        const tier1 = response.data.data.filter(ref => ref.tier_level === 'tier_1').length;
        const tier2 = response.data.data.filter(ref => ref.tier_level === 'tier_2').length;
        const tier3 = response.data.data.filter(ref => ref.tier_level === 'tier_3').length;
        console.log(`Tier 1: ${tier1} referrals`);
        console.log(`Tier 2: ${tier2} referrals`);
        console.log(`Tier 3: ${tier3} referrals`);
      } else {
        console.log('\n⚠️  WARNING: tier_level field is missing!');
        console.log('Backend should return tier_level for each referral.');
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
    return null;
  }
}

async function testVerifyReferralCode() {
  console.log('\n🧪 Testing POST /referrals/verify...');
  const testCode = 'TEST123'; // Replace with an actual code
  
  try {
    const response = await api.post('/referrals/verify', {
      referral_code: testCode
    });
    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
    return null;
  }
}

// Run all tests
async function runTests() {
  console.log('='.repeat(60));
  console.log('🚀 REFERRAL API TEST SUITE');
  console.log('='.repeat(60));
  
  if (JWT_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.error('\n❌ ERROR: Please set your JWT_TOKEN in the script first!');
    console.log('\nHow to get your JWT token:');
    console.log('1. Open browser DevTools (F12)');
    console.log('2. Go to Application > Local Storage');
    console.log('3. Find the "token" key and copy its value');
    console.log('4. Replace JWT_TOKEN in this script');
    return;
  }
  
  await testReferralStats();
  await testGetReferrals();
  await testVerifyReferralCode();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test suite complete!');
  console.log('='.repeat(60));
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
