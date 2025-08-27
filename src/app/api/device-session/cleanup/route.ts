import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, sessionToken } = body;

    console.log(`🧹 Session cleanup API called for device: ${deviceId}`);

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Clean up device session by resetting status and clearing session data
    const { error: updateError } = await supabase
      .from('devices')
      .update({
        status: 'offline',
        session_token: null,
        session_created_at: null,
        last_seen: new Date().toISOString()
      })
      .eq('id', deviceId)
      .eq('session_token', sessionToken); // Only clean up if session token matches

    if (updateError) {
      console.error('❌ Error cleaning up device session:', updateError);
      return NextResponse.json(
        { error: 'Failed to cleanup device session' },
        { status: 500 }
      );
    }

    console.log(`✅ Device ${deviceId} session cleaned up successfully`);

    return NextResponse.json({
      success: true,
      message: 'Device session cleaned up successfully',
      deviceId
    });

  } catch (error) {
    console.error('❌ Error in session cleanup API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
