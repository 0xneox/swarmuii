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
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user transactions from earnings_history with pagination
    const { data: transactions, error } = await supabase
      .from('earnings_history')
      .select(`
        id,
        total_amount,
        timestamp,
        created_at
      `)
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error loading transactions:', error);
      return NextResponse.json(
        { error: 'Failed to load transactions' },
        { status: 500 }
      );
    }

    // Transform data for frontend
    const formattedTransactions = transactions.map((tx, index) => {
      // Calculate transaction amount as difference from previous total
      const currentTotal = Number(tx.total_amount);
      const previousTotal = index < transactions.length - 1 ? Number(transactions[index + 1].total_amount) : 0;
      const transactionAmount = currentTotal - previousTotal;
      
      return {
        id: tx.id,
        amount: Math.max(transactionAmount, 0), // Ensure positive amount
        created_at: tx.created_at || tx.timestamp,
        earning_type: 'task', // Default to task since we don't have transaction_type
        transaction_hash: `tx_${tx.id.toString().substring(0, 8)}`,
        totalAmount: currentTotal
      };
    });
    
    return NextResponse.json(
      { 
        transactions: formattedTransactions,
        hasMore: transactions.length === limit 
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache',
        },
      }
    );
    
  } catch (error) {
    console.error('Transactions GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
