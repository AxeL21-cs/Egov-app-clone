import { getDemoTransaction } from '../_lib/egovpay.js';
import { publicError } from '../_lib/errors.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const transaction = await getDemoTransaction({ env: process.env, uuid: req.query.uuid });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ transaction });
  } catch (error) {
    const result = publicError(error);
    return res.status(result.status).json(result.body);
  }
}
