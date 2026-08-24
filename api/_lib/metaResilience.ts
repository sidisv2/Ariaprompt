/**
 * Centralized Meta Graph API Error Classifier and Resilience Engine
 */

export interface MetaErrorDetails {
  httpStatus?: number;
  code?: number;
  subcode?: number;
  message: string;
  errorType?: string;
  fbtraceId?: string;
  isRetryable: boolean;
  action: 'retry' | 'throttle_and_retry' | 'spam_restriction_halt' | 'template_required' | 'fatal';
  retryAfterSeconds?: number;
}

export function classifyMetaError(error: any, httpStatus?: number): MetaErrorDetails {
  const errObj = error?.error || error;
  const code = errObj?.code || error?.code;
  const subcode = errObj?.error_subcode || error?.error_subcode;
  const message = errObj?.message || error?.message || String(error);
  const fbtraceId = errObj?.fbtrace_id;
  const errorType = errObj?.type;

  // 1. Rate Limits & Throughput Exceeded (429 / 130429)
  if (httpStatus === 429 || code === 429 || code === 130429 || code === 80007) {
    return {
      httpStatus: httpStatus || 429,
      code: code || 130429,
      subcode,
      message,
      errorType,
      fbtraceId,
      isRetryable: true,
      action: 'throttle_and_retry',
      retryAfterSeconds: 5,
    };
  }

  // 2. Spam-rate restriction / Quality degradations (131048)
  if (code === 131048 || code === 131056) {
    return {
      httpStatus,
      code,
      subcode,
      message: `Meta Quality/Spam restriction detected: ${message}`,
      errorType,
      fbtraceId,
      isRetryable: false,
      action: 'spam_restriction_halt', // NO retry agresivo, no regenerar IA, no flood
    };
  }

  // 3. Conversation Window Expired (131047) -> Requires Approved Template
  if (code === 131047) {
    return {
      httpStatus,
      code,
      subcode,
      message: '24h Conversation Window Expired. Requires Approved Meta Template.',
      errorType,
      fbtraceId,
      isRetryable: false,
      action: 'template_required',
    };
  }

  // 4. Temporary Meta Server Flakes (500, 502, 503, 504)
  if (httpStatus && httpStatus >= 500) {
    return {
      httpStatus,
      code,
      subcode,
      message,
      errorType,
      fbtraceId,
      isRetryable: true,
      action: 'retry',
      retryAfterSeconds: 3,
    };
  }

  // 5. Fatal / Policy / Auth Errors (190, 100, etc.)
  return {
    httpStatus,
    code,
    subcode,
    message,
    errorType,
    fbtraceId,
    isRetryable: false,
    action: 'fatal',
  };
}

/**
 * Mark an incoming WhatsApp message as read using official Meta Graph API v20.0
 */
export async function markWhatsAppMessageAsRead(options: {
  wamid: string;
  phoneNumberId: string;
  accessToken: string;
}): Promise<boolean> {
  const { wamid, phoneNumberId, accessToken } = options;
  if (!wamid || !phoneNumberId || !accessToken) return false;

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: wamid,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
