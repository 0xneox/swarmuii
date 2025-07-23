import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - Fetch user referral data
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch all referral data in parallel for better performance
    const [
      { data: referrals, error: referralsError },
      { data: allRewards, error: allRewardsError },
      { data: claimedEarnings, error: claimedEarningsError }
    ] = await Promise.all([
      // Get user's referrals
      supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false }),
      
      // Get all referral rewards (both claimed and unclaimed)
      supabase
        .from('referral_rewards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      
      // Get total claimed earnings from earnings table
      supabase
        .from('earnings_history')
        .select('total_amount')
        .eq('user_id', userId)
        .eq('earning_type', 'referral')
        .order('timestamp', { ascending: false })
        .limit(1)
    ]);

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
      return NextResponse.json(
        { error: 'Failed to fetch referrals' },
        { status: 500 }
      );
    }

    if (allRewardsError) {
      console.error('Error fetching referral rewards:', allRewardsError);
      return NextResponse.json(
        { error: 'Failed to fetch referral rewards' },
        { status: 500 }
      );
    }

    // Calculate totals
    const pendingRewards = (allRewards || [])
      .filter(reward => !reward.claimed)
      .reduce((sum, reward) => sum + reward.reward_amount, 0);
    
    const claimedFromRewards = (allRewards || [])
      .filter(reward => reward.claimed)
      .reduce((sum, reward) => sum + reward.reward_amount, 0);
    
    const claimedFromEarnings = claimedEarnings && claimedEarnings.length > 0 
      ? Number(claimedEarnings[0].total_amount) 
      : 0;
    
    const totalClaimedRewards = Math.max(claimedFromRewards, claimedFromEarnings);
    const totalReferralEarnings = pendingRewards + totalClaimedRewards;

    return NextResponse.json(
      { 
        referrals: referrals || [],
        rewards: (allRewards || []).filter(reward => !reward.claimed), // Only return pending rewards
        totalReferralEarnings,
        pendingRewards,
        claimedRewards: totalClaimedRewards
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
    
  } catch (error) {
    console.error('Referrals GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create referral relationship
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { referrer_id, tier_level = 'tier_1' } = body;

    if (!referrer_id) {
      return NextResponse.json(
        { error: 'Referrer ID is required' },
        { status: 400 }
      );
    }

    // Check if user is already referred
    const { data: existingReferral, error: checkError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', session.user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing referral:', checkError);
      return NextResponse.json(
        { error: 'Failed to verify referral status' },
        { status: 500 }
      );
    }

    if (existingReferral) {
      return NextResponse.json(
        { error: 'User is already referred' },
        { status: 400 }
      );
    }

    // Create referral relationship
    const { data, error } = await supabase
      .from('referrals')
      .insert({
        referrer_id,
        referred_id: session.user.id,
        tier_level,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating referral:', error);
      return NextResponse.json(
        { error: 'Failed to create referral relationship' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        referral: data,
        message: 'Referral relationship created successfully'
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache',
        },
      }
    );
    
  } catch (error) {
    console.error('Referrals POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 