import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleChatRoute } from './_handlers/chatHandler.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleChatRoute(req, res);
}
