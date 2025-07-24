import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || 'daily';
    
    let dateRange: string;
    let dateFormat: string;
    
    switch (timeRange) {
      case 'weekly':
        dateRange = '7 days';
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'monthly':
        dateRange = '30 days';
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'all-time':
        dateRange = '365 days';
        dateFormat = 'YYYY-MM-DD';
        break;
      default: // daily
        dateRange = '24 hours';
        dateFormat = 'YYYY-MM-DD HH24:00:00';
        break;
    }

    // Get earnings data for chart
    const { data: chartData, error } = await supabase
      .from('earnings_history')
      .select(`
        total_amount,
        timestamp,
        created_at
      `)
      .eq('user_id', user.id)
      .gte('timestamp', new Date(Date.now() - (timeRange === 'all-time' ? 365 : timeRange === 'monthly' ? 30 : timeRange === 'weekly' ? 7 : 1) * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: true });
    
    if (error) {
      console.error('Error loading chart data:', error);
      return NextResponse.json(
        { error: 'Failed to load chart data' },
        { status: 500 }
      );
    }

    // Process data into chart points
    const processedData = chartData.map((item, index) => {
      // Calculate earnings as difference from previous total
      const currentTotal = Number(item.total_amount);
      const previousTotal = index > 0 ? Number(chartData[index - 1].total_amount) : 0;
      const earnings = Math.max(currentTotal - previousTotal, 0);
      
      return {
        date: new Date(item.timestamp || item.created_at).toISOString(),
        earnings,
        totalEarnings: currentTotal,
        highlight: index === chartData.length - 1, // Highlight the latest point
        timestamp: new Date(item.timestamp || item.created_at).getTime()
      };
    });

    // Get summary stats
    const totalEarnings = chartData.length > 0 ? Number(chartData[chartData.length - 1]?.total_amount) || 0 : 0;
    const periodEarnings = processedData.reduce((sum, item) => sum + item.earnings, 0);
    const avgDaily = timeRange === 'daily' ? periodEarnings : periodEarnings / (timeRange === 'weekly' ? 7 : timeRange === 'monthly' ? 30 : 365);
    
    return NextResponse.json(
      { 
        chartData: processedData,
        summary: {
          totalEarnings,
          periodEarnings,
          avgDaily,
          dataPoints: chartData.length
        }
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache',
        },
      }
    );
    
  } catch (error) {
    console.error('Chart data GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
