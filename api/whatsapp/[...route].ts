import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleWhatsAppRoute } from '../_handlers/whatsappHandler.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const routeParam = req.query.route;
  const subRoute = Array.isArray(routeParam) ? routeParam.join('/') : (routeParam || 'webhook');
  return handleWhatsAppRoute(req, res, subRoute);
}
