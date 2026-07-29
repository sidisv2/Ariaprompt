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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Paddle-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body || {};
    console.log('🔔 Paddle Webhook Received:', JSON.stringify(payload, null, 2));

    const eventType = payload?.event_type || payload?.event_name || payload?.type || 'unknown';
    const data = payload?.data || payload;

    if (eventType === 'transaction.completed' || eventType === 'subscription.created' || eventType === 'subscription.updated') {
      const txnId = data?.id || data?.checkout_id || data?.transaction_id;
      const customerEmail = data?.customer?.email || data?.user_email || data?.custom_data?.email;
      const userId = data?.custom_data?.user_id || data?.custom_data?.userId;

      const rawAmount = data?.details?.totals?.grand_total || data?.amount || data?.total;
      const amount = typeof rawAmount === 'number' ? (rawAmount > 500 ? rawAmount / 100 : rawAmount) : 35;
      const currency = (data?.currency_code || data?.currency || 'USD').toUpperCase();

      const items = data?.items || [];
      const priceId = items[0]?.price?.id || '';
      let planId = 'pro';
      if (priceId.includes('pri_01kyh5xs') || priceId.includes('pri_01kyh5zs') || payload?.plan === 'solo') {
        planId = 'solo';
      } else if (priceId.includes('pri_01kyh63d') || priceId.includes('pri_01kyh64f') || payload?.plan === 'pro') {
        planId = 'pro';
      }

      if (!txnId) {
        console.warn('⚠️ Webhook received without valid transaction ID:', payload);
        return res.status(200).json({ status: 'ignored', reason: 'Missing transaction ID' });
      }

      const supabase = getBackendSupabaseClient();
      if (supabase) {
        // 1. Insert into payment_transactions
        const { error: txErr } = await supabase.from('payment_transactions').upsert(
          {
            txn_id: txnId,
            user_id: userId || null,
            customer_email: customerEmail || null,
            plan_id: planId,
            amount: amount,
            currency: currency,
            status: 'completed',
            raw_event: payload,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'txn_id' }
        );

        if (txErr) {
          console.error('❌ Error recording payment_transaction in Supabase:', txErr);
        } else {
          console.log(`✅ payment_transaction recorded: ${txnId} (${planId} - $${amount} ${currency})`);
        }

        // 2. Update user profile plan status
        if (userId || customerEmail) {
          let profileQuery = supabase.from('profiles').update({
            estado_cuenta: 'activo',
            plan_id: planId,
            updated_at: new Date().toISOString(),
          });

          if (userId) {
            profileQuery = profileQuery.eq('id', userId);
          } else if (customerEmail) {
            profileQuery = profileQuery.eq('email', customerEmail);
          }

          const { error: profErr } = await profileQuery;
          if (profErr) {
            console.error('❌ Error updating profile plan status:', profErr);
          } else {
            console.log(`✅ Profile updated to plan "${planId}" for ${userId || customerEmail}`);
          }
        }
      }
    }

    return res.status(200).json({ status: 'success', event: eventType });
  } catch (err: any) {
    console.error('❌ Paddle Webhook Handler Error:', err);
    return res.status(500).json({ error: 'Internal Webhook Processing Error' });
  }
}
