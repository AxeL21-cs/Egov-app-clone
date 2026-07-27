import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withCapability } from '../../api/_lib/capability.js';

function makeRes() {
  return {
    statusCode: null, payload: null, headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.payload = body; return this; },
  };
}

const LIVE_ENV = { EGOV_AI_API_BASE_URL: 'https://ai.test', EGOV_AI_ACCESS_CODE: 'code' };

const handlerOptions = {
  method: 'POST',
  live: async () => ({ reply: 'live reply' }),
  mock: async () => ({ reply: 'mock reply' }),
};

test('rejects the wrong HTTP method with 405', async () => {
  const res = makeRes();
  await withCapability('egovAi', handlerOptions)({ method: 'GET', headers: {}, env: LIVE_ENV }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, 'POST');
});

test('uses mock when the capability is unconfigured', async () => {
  const res = makeRes();
  await withCapability('egovAi', handlerOptions)({ method: 'POST', headers: {}, env: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.source, 'mock');
  assert.equal(res.payload.capability, 'egovAi');
  assert.deepEqual(res.payload.data, { reply: 'mock reply' });
});

test('uses live when the capability is configured', async () => {
  const res = makeRes();
  await withCapability('egovAi', handlerOptions)({ method: 'POST', headers: {}, env: LIVE_ENV }, res);
  assert.equal(res.payload.source, 'live');
  assert.deepEqual(res.payload.data, { reply: 'live reply' });
});

test('falls back to mock when the live call throws', async () => {
  const res = makeRes();
  await withCapability('egovAi', {
    ...handlerOptions,
    live: async () => { throw new Error('upstream exploded'); },
  })({ method: 'POST', headers: {}, env: LIVE_ENV }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.source, 'mock');
  assert.equal(JSON.stringify(res.payload).includes('exploded'), false);
});

test('returns an error when live fails and no mock exists', async () => {
  const res = makeRes();
  await withCapability('egovAi', {
    method: 'POST',
    live: async () => { throw new Error('upstream exploded'); },
  })({ method: 'POST', headers: {}, env: LIVE_ENV }, res);

  assert.equal(res.statusCode, 500);
  assert.equal(res.payload.error, 'An internal error occurred.');
});

test('always sets no-store', async () => {
  const res = makeRes();
  await withCapability('egovAi', handlerOptions)({ method: 'POST', headers: {}, env: LIVE_ENV }, res);
  assert.equal(res.headers['Cache-Control'], 'no-store');
});

test('returns 503 when unconfigured and no mock is supplied', async () => {
  const res = makeRes();
  await withCapability('egovAi', {
    method: 'POST',
    live: async () => ({ reply: 'live reply' }),
  })({ method: 'POST', headers: {}, env: {} }, res);

  assert.equal(res.statusCode, 503);
  assert.equal(res.payload.error, 'This service is not configured.');
  assert.equal(res.headers['Cache-Control'], 'no-store');
});

test('returns a clean error when both live and mock throw', async () => {
  const res = makeRes();
  await withCapability('egovAi', {
    method: 'POST',
    live: async () => { throw new Error('upstream exploded'); },
    mock: async () => { throw new Error('mock fixture broken'); },
  })({ method: 'POST', headers: {}, env: LIVE_ENV }, res);

  assert.equal(res.statusCode, 500);
  assert.equal(res.payload.error, 'An internal error occurred.');
  const serialized = JSON.stringify(res.payload);
  assert.equal(serialized.includes('exploded'), false);
  assert.equal(serialized.includes('mock fixture broken'), false);
});
