import { handleOgPropertyRoute } from '../og-property.js';

export default async function handler(req: any, res: any) {
  return handleOgPropertyRoute(req, res);
}
