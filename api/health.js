import { CAPABILITIES, capabilityStatus } from './_lib/config.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const env = req.env || process.env;
  const names = Object.keys(CAPABILITIES);
  const capabilities = Object.fromEntries(names.map((name) => [name, capabilityStatus(env, name)]));
  const liveCount = Object.values(capabilities).filter((value) => value === 'live').length;

  return res.status(200).json({ capabilities, liveCount, total: names.length });
}
