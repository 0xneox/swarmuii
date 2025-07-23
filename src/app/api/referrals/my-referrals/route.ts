import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - Get user's referrals
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

    // Call the RPC function server-side
    const { data, error } = await supabase.rpc('get_my_referrals', {
      p_user_id: session.user.id
    });

    if (error) {
      console.error('Error fetching referrals:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch referrals' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        data: data || { has_referrals: false, total_referrals: 0, referrals: [] }
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
    
  } catch (error) {
    console.error('My referrals API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 