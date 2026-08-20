import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleEvolutionWebhookRoute } from '../../api/_handlers/evolutionWebhookHandler.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleEvolutionWebhookRoute(req, res);
}
