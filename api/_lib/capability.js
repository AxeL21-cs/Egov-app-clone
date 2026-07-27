import { capabilityStatus, capabilityConfig } from './config.js';
import { publicError } from './errors.js';

export function withCapability(name, { method = 'POST', timeout = 12_000, live, mock } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== method) {
      res.setHeader('Allow', method);
      return res.status(405).json({ error: 'Method not allowed.' });
    }

    const env = req.env || process.env;
    const send = (data, source) => res.status(200).json({ data, source, capability: name });

    const sendPublicError = (error) => {
      const result = publicError(error);
      return res.status(result.status).json(result.body);
    };

    // Runs mock() defensively: a throwing mock must still yield a clean
    // response instead of an unhandled rejection, since mocks exist
    // precisely to keep the app responding when live calls can't be made.
    const runMock = async () => {
      try {
        return send(await mock({ req }), 'mock');
      } catch (error) {
        console.error(`[${name}] mock call failed:`, error?.message);
        return sendPublicError(error);
      }
    };

    if (capabilityStatus(env, name) !== 'live') {
      if (!mock) {
        return res.status(503).json({ error: 'This service is not configured.' });
      }
      return runMock();
    }

    try {
      const config = capabilityConfig(env, name);
      return send(await live({ env, req, config, timeout }), 'live');
    } catch (error) {
      console.error(`[${name}] live call failed:`, error?.message);
      if (mock) return runMock();
      return sendPublicError(error);
    }
  };
}
