import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleEvolutionQrRoute } from './_handlers/evolutionQrHandler.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleEvolutionQrRoute(req, res);
}
