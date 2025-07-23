import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - Fetch user profile
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

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { profile },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
    
  } catch (error) {
    console.error('Profile GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const updates = await request.json();

    // Remove id and other protected fields from updates
    const { id, ...safeUpdates } = updates;

    const { data: updatedProfile, error } = await supabase
      .from('user_profiles')
      .update(safeUpdates)
      .eq('id', session.user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user profile:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { profile: updatedProfile },
      {
        headers: {
          'Cache-Control': 'private, no-cache',
        },
      }
    );
    
  } catch (error) {
    console.error('Profile PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create user profile
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

    const profileData = await request.json();

    // Generate referral code if not provided
    const generateReferralCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const newProfileData = {
      id: session.user.id,
      email: session.user.email,
      user_name: profileData.user_name || session.user.email?.split('@')[0],
      joined_at: new Date().toISOString(),
      referral_code: generateReferralCode(),
      freedom_ai_credits: 10000,
      music_video_credits: 0,
      deepfake_credits: 0,
      video_generator_credits: 0,
      plan: 'free',
      reputation_score: 0,
      ...profileData
    };

    const { data: newProfile, error } = await supabase
      .from('user_profiles')
      .insert(newProfileData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user profile:', error);
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { profile: newProfile },
      {
        headers: {
          'Cache-Control': 'private, no-cache',
        },
      }
    );
    
  } catch (error) {
    console.error('Profile POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 