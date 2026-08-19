import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCrmRoute } from '../_handlers/crmHandler.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const routeParam = req.query.route;
  const subRoute = Array.isArray(routeParam) ? routeParam.join('/') : (routeParam || 'leads');
  return handleCrmRoute(req, res, subRoute);
}
