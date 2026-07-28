import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createDemoTransaction, getDemoTransaction } from './api/_lib/egovpay.js';
import { publicError } from './api/_lib/errors.js';

function localEgovPayApi(env) {
  return {
    name: 'local-egovpay-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        if (!url.pathname.startsWith('/api/egovpay/')) return next();

        const send = (status, payload) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify(payload));
        };

        try {
          if (url.pathname === '/api/egovpay/create' && req.method === 'POST') {
            const origin = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
            const transaction = await createDemoTransaction({ env, origin });
            return send(201, { transaction });
          }

          if (url.pathname === '/api/egovpay/status' && req.method === 'GET') {
            const transaction = await getDemoTransaction({ env, uuid: url.searchParams.get('uuid') });
            return send(200, { transaction });
          }

          if (url.pathname === '/api/egovpay/callback') {
            return send(200, { received: true });
          }

          return send(405, { error: 'Method not allowed.' });
        } catch (error) {
          const result = publicError(error);
          return send(result.status, result.body);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), localEgovPayApi(env)],
  };
});
