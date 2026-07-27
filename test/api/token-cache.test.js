import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getCachedToken, clearTokenCache } from '../../api/_lib/token-cache.js';

beforeEach(() => clearTokenCache());

test('fetches once and caches the result', async () => {
  let calls = 0;
  const fetchToken = async () => { calls += 1; return { token: 't1', expiresInSec: 3600 }; };
  const clock = () => 1_000_000;

  assert.equal(await getCachedToken('sso', fetchToken, { now: clock }), 't1');
  assert.equal(await getCachedToken('sso', fetchToken, { now: clock }), 't1');
  assert.equal(calls, 1);
});

test('refetches once the token has expired', async () => {
  let calls = 0;
  const fetchToken = async () => { calls += 1; return { token: `t${calls}`, expiresInSec: 100 }; };
  let time = 0;
  const clock = () => time;

  assert.equal(await getCachedToken('sso', fetchToken, { now: clock, marginMs: 0 }), 't1');
  time = 101_000;
  assert.equal(await getCachedToken('sso', fetchToken, { now: clock, marginMs: 0 }), 't2');
  assert.equal(calls, 2);
});

test('refetches early because of the safety margin', async () => {
  let calls = 0;
  const fetchToken = async () => { calls += 1; return { token: `t${calls}`, expiresInSec: 100 }; };
  let time = 0;
  const clock = () => time;

  await getCachedToken('sso', fetchToken, { now: clock, marginMs: 60_000 });
  time = 45_000;
  await getCachedToken('sso', fetchToken, { now: clock, marginMs: 60_000 });
  assert.equal(calls, 2);
});

test('keeps separate entries per key', async () => {
  const clock = () => 0;
  await getCachedToken('sso', async () => ({ token: 'a', expiresInSec: 3600 }), { now: clock });
  const other = await getCachedToken('egovAi', async () => ({ token: 'b', expiresInSec: 3600 }), { now: clock });
  assert.equal(other, 'b');
});

test('a failed fetch is not cached', async () => {
  let calls = 0;
  const failing = async () => { calls += 1; throw new Error('upstream down'); };
  await assert.rejects(() => getCachedToken('sso', failing, { now: () => 0 }));
  await assert.rejects(() => getCachedToken('sso', failing, { now: () => 0 }));
  assert.equal(calls, 2);
});

test('deduplicates concurrent requests for the same key', async () => {
  let calls = 0;
  const fetchToken = async () => {
    calls += 1;
    await new Promise(resolve => setImmediate(resolve));
    return { token: 't1', expiresInSec: 3600 };
  };
  const clock = () => 1_000_000;

  const promise1 = getCachedToken('sso', fetchToken, { now: clock });
  const promise2 = getCachedToken('sso', fetchToken, { now: clock });

  const [token1, token2] = await Promise.all([promise1, promise2]);

  assert.equal(token1, 't1');
  assert.equal(token2, 't1');
  assert.equal(calls, 1);
});
