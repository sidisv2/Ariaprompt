import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBackendSupabaseClient } from '../src/lib/backendSupabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { txn_id } = req.query;

  if (!txn_id || typeof txn_id !== 'string' || !txn_id.trim()) {
    return res.status(200).json({
      verified: false,
      reason: 'Missing transaction_id parameter',
    });
  }

  const cleanTxnId = txn_id.trim();

  // Reject mock or generated fallback IDs (e.g. pdl_1234567) from triggering server-side verification
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

  try {
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
      reason: 'Server error during transaction verification',
    });
  }
}
