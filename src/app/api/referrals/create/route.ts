import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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
    const { referrer_code } = body;

    if (!referrer_code) {
      return NextResponse.json(
        { error: 'Referrer code is required' },
        { status: 400 }
      );
    }

    // Call the RPC function server-side
    const { data, error } = await supabase.rpc('create_referral_relationship', {
      p_referrer_code: referrer_code,
      p_referred_id: session.user.id
    });

    if (error) {
      console.error('Error creating referral relationship:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create referral relationship' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        data,
        message: 'Referral relationship created successfully'
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache',
        },
      }
    );
    
  } catch (error) {
    console.error('Create referral API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 