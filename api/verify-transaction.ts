import { createClient } from '@supabase/supabase-js';

function getBackendSupabaseClient() {
  const supabaseUrl = (
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  ).trim();

  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    console.warn('Backend Supabase initialization warning:', err);
    return null;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const txn_id = req.query?.txn_id;

    if (!txn_id || typeof txn_id !== 'string' || !txn_id.trim()) {
      return res.status(200).json({
        verified: false,
        reason: 'Missing transaction_id parameter',
      });
    }

    const cleanTxnId = txn_id.trim();

    if (cleanTxnId.startsWith('pdl_') || cleanTxnId.startsWith('mock_')) {
      return res.status(200).json({
        verified: false,
        reason: 'Synthetic or unverified client transaction ID',
      });
    }

    const supabase = getBackendSupabaseClient();
    if (!supabase) {
      return res.status(200).json({
        verified: false,
        reason: 'Database client unavailable',
      });
    }

    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('txn_id', cleanTxnId)
      .maybeSingle();

    if (error || !transaction) {
      return res.status(200).json({
        verified: false,
        reason: 'Transaction not found in verified server database',
      });
    }

    if (transaction.status !== 'completed') {
      return res.status(200).json({
        verified: false,
        reason: `Transaction status is "${transaction.status}", expected "completed"`,
      });
    }

    return res.status(200).json({
      verified: true,
      txn_id: transaction.txn_id,
      plan_id: transaction.plan_id,
      amount: Number(transaction.amount),
      currency: transaction.currency || 'USD',
      created_at: transaction.created_at,
    });
  } catch (err: any) {
    console.error('Error verifying transaction:', err);
    return res.status(200).json({
      verified: false,
      reason: err?.message || 'Server error during transaction verification',
    });
  }
}
