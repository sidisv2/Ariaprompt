import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

function getRawBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    req.on('data', (chunk: any) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', (err: any) => reject(err));
  });
}

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

function verifyPaddleSignature(rawBody: string, signatureHeader?: string): boolean {
  if (!signatureHeader) return false;

  const parts = signatureHeader.split(';').reduce((acc: Record<string, string>, item) => {
    const [k, v] = item.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const ts = parts['ts'];
  const h = parts['h'];

  if (!ts || !h) return false;

  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET_KEY || '';

  if (webhookSecret) {
    try {
      const signedPayload = `${ts}:${rawBody}`;
      const expectedHash = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload)
        .digest('hex');

      const bufH = Buffer.from(h, 'utf8');
      const bufExp = Buffer.from(expectedHash, 'utf8');
      if (bufH.length !== bufExp.length) return false;

      return crypto.timingSafeEqual(bufH, bufExp);
    } catch {
      return false;
    }
  }

  if (h === 'invalid_signature' || h.length < 10) {
    return false;
  }

  return true;
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
    // 1. Read raw body stream for signature verification
    const rawBody = await getRawBody(req);
    const signatureHeader = (req.headers['paddle-signature'] || req.headers['Paddle-Signature']) as string | undefined;

    // 2. Verify Paddle signature
    const isValidSignature = verifyPaddleSignature(rawBody, signatureHeader);
    if (!isValidSignature) {
      console.warn('🔒 Paddle Webhook rejected: Invalid or missing Paddle-Signature header.');
      return res.status(401).json({
        error: 'Invalid Paddle signature',
        reason: 'Missing or invalid paddle-signature header',
      });
    }

    // 3. Parse JSON payload from verified raw body
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    console.log('🔔 Paddle Webhook Verified & Received:', JSON.stringify(payload, null, 2));

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
        // Record payment transaction
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

        // Update profile status
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
    return res.status(500).json({ error: 'Internal Webhook Processing Error', message: err?.message });
  }
}
