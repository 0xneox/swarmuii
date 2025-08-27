import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, userId, action, timestamp } = body;

    console.log(`🔄 Tab close API called for device: ${deviceId}, user: ${userId}`);

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Reset device status from busy to offline and clear session data
    const { error: updateError } = await supabase
      .from('devices')
      .update({
        status: 'offline',
        session_token: null,
        session_created_at: null,
        last_seen: new Date().toISOString()
      })
      .eq('id', deviceId)
      .eq('owner', userId);

    if (updateError) {
      console.error('❌ Error updating device status on tab close:', updateError);
      return NextResponse.json(
        { error: 'Failed to update device status' },
        { status: 500 }
      );
    }

    console.log(`✅ Device ${deviceId} status reset to offline on tab close`);

    return NextResponse.json({
      success: true,
      message: 'Device status reset successfully',
      deviceId,
      timestamp
    });

  } catch (error) {
    console.error('❌ Error in tab close API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
