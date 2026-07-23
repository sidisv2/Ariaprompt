import type { VercelRequest, VercelResponse } from '@vercel/node';
import { INITIAL_PROPERTIES } from '../src/data/mockData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: INITIAL_PROPERTIES });
  }

  if (req.method === 'POST') {
    const newProperty = {
      id: `prop-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      documents: [],
      featured: false,
      status: 'available' as const,
      ...req.body,
    };
    return res.status(200).json({ success: true, data: newProperty });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
