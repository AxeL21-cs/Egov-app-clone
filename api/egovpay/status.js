import { getDemoTransaction, publicPaymentError } from '../_lib/egovpay.js';

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
    const result = publicPaymentError(error);
    return res.status(result.status).json(result.body);
  }
}
