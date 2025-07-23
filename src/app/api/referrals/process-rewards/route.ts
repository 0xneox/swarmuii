import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// POST - Process referral rewards
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
    const { referred_user_id, earning_amount } = body;

    if (!referred_user_id) {
      return NextResponse.json(
        { error: 'Referred user ID is required' },
        { status: 400 }
      );
    }

    if (earning_amount === undefined || earning_amount < 0) {
      return NextResponse.json(
        { error: 'Valid earning amount is required' },
        { status: 400 }
      );
    }

    // Call the RPC function server-side with correct parameters
    const { error } = await supabase.rpc('process_referral_rewards', {
      p_user_id: referred_user_id,
      p_earning_amount: earning_amount
    });

    if (error) {
      console.error('Error processing referral rewards:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to process referral rewards' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Referral rewards processed successfully'
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache',
        },
      }
    );
    
  } catch (error) {
    console.error('Process rewards API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 