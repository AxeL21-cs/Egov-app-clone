import { createDemoTransaction } from '../_lib/egovpay.js';
import { publicError } from '../_lib/errors.js';

function requestOrigin(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const transaction = await createDemoTransaction({ env: process.env, origin: requestOrigin(req) });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(201).json({ transaction });
  } catch (error) {
    const result = publicError(error);
    return res.status(result.status).json(result.body);
  }
}
