import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleV1Route } from '../_handlers/v1Handler.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const routeParam = req.query.route;
  const subRoute = Array.isArray(routeParam) ? routeParam.join('/') : (routeParam || 'health');
  return handleV1Route(req, res, subRoute);
}
