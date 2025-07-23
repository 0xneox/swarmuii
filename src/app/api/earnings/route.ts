import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - Load user earnings
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

    const { data, error } = await supabase
      .from('earnings_history')
      .select('total_amount')
      .eq('user_id', session.user.id)
      .order('timestamp', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error loading earnings:', error);
      return NextResponse.json(
        { error: 'Failed to load earnings' },
        { status: 500 }
      );
    }
    
    const totalEarnings = data && data.length > 0 ? Number(data[0].total_amount) : 0;
    
    return NextResponse.json(
      { totalEarnings },
      {
        headers: {
          'Cache-Control': 'private, no-cache',
        },
      }
    );
    
  } catch (error) {
    console.error('Earnings GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Claim rewards
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
    const { reward_type, amount, user_id } = body;

    // Validate input
    if (!reward_type || !amount || amount <= 0 || !user_id) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Verify user_id matches session user
    if (user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Make the external API call server-side
    const response = await fetch(
      'https://phpaoasgtqsnwohtevwf.supabase.co/functions/v1/add_earnings',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reward_type,
          amount,
          user_id,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to process earnings' },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'private, no-cache',
      },
    });
    
  } catch (error) {
    console.error('Earnings POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 