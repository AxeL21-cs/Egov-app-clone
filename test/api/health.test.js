import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../api/health.js';

function makeRes() {
  return {
    statusCode: null, payload: null, headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.payload = body; return this; },
  };
}

test('reports every capability', async () => {
  const res = makeRes();
  await handler({ method: 'GET', env: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(Object.keys(res.payload.capabilities).length, 8);
  assert.equal(res.payload.total, 8);
  assert.equal(res.payload.liveCount, 0);
  assert.equal(res.headers['Cache-Control'], 'no-store');
});

test('counts configured capabilities as live', async () => {
  const res = makeRes();
  await handler({
    method: 'GET',
    env: { EGOV_AI_API_BASE_URL: 'https://ai.test', EGOV_AI_ACCESS_CODE: 'code' },
  }, res);
  assert.equal(res.payload.capabilities.egovAi, 'live');
  assert.equal(res.payload.liveCount, 1);
});

test('never leaks credential values', async () => {
  const res = makeRes();
  await handler({
    method: 'GET',
    env: { EGOV_AI_API_BASE_URL: 'https://ai.test', EGOV_AI_ACCESS_CODE: 'super-secret-code' },
  }, res);
  assert.equal(JSON.stringify(res.payload).includes('super-secret-code'), false);
  assert.equal(JSON.stringify(res.payload).includes('ai.test'), false);
});

test('rejects non-GET with 405', async () => {
  const res = makeRes();
  await handler({ method: 'POST', env: {} }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, 'GET');
  assert.equal(res.headers['Cache-Control'], 'no-store');
});
