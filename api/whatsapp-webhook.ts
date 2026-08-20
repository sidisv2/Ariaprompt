import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleWhatsAppRoute } from './_handlers/whatsappHandler.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleWhatsAppRoute(req, res, 'webhook');
}
