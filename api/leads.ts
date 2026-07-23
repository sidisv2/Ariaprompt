import type { VercelRequest, VercelResponse } from '@vercel/node';
import { INITIAL_LEADS } from '../src/data/mockData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: INITIAL_LEADS });
  }

  return res.status(200).json({ success: true, data: INITIAL_LEADS[0] });
}
