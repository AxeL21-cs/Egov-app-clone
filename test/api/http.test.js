import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchJSON } from '../../api/_lib/http.js';

function fakeResponse({ ok = true, status = 200, text = '{}' }) {
  return { ok, status, text: async () => text };
}

test('parses a JSON body', async () => {
  const result = await fetchJSON('https://x.test/a', {
    fetchImpl: async () => fakeResponse({ text: '{"uuid":"abc"}' }),
  });
  assert.deepEqual(result, { uuid: 'abc' });
});

test('returns an empty object for an empty body', async () => {
  const result = await fetchJSON('https://x.test/a', {
    fetchImpl: async () => fakeResponse({ text: '' }),
  });
  assert.deepEqual(result, {});
});

test('throws ApiError carrying the upstream status', async () => {
  await assert.rejects(
    () => fetchJSON('https://x.test/a', {
      fetchImpl: async () => fakeResponse({ ok: false, status: 404, text: '{"message":"not found"}' }),
    }),
    (error) => error.status === 404 && error.message === 'not found',
  );
});

test('falls back to a status message when the body is not JSON', async () => {
  await assert.rejects(
    () => fetchJSON('https://x.test/a', {
      fetchImpl: async () => fakeResponse({ ok: false, status: 502, text: '<html>gateway</html>' }),
    }),
    (error) => error.status === 502 && error.message.includes('502'),
  );
});

test('sends method, headers and JSON body', async () => {
  let seen = null;
  await fetchJSON('https://x.test/a', {
    method: 'POST',
    headers: { 'X-Token': 'abc' },
    body: { hello: 'world' },
    fetchImpl: async (url, options) => { seen = { url, options }; return fakeResponse({}); },
  });
  assert.equal(seen.url, 'https://x.test/a');
  assert.equal(seen.options.method, 'POST');
  assert.equal(seen.options.headers['X-Token'], 'abc');
  assert.equal(seen.options.headers['Content-Type'], 'application/json');
  assert.equal(seen.options.body, '{"hello":"world"}');
});

test('converts an aborted request into a 504', async () => {
  await assert.rejects(
    () => fetchJSON('https://x.test/a', {
      fetchImpl: async () => { const e = new Error('aborted'); e.name = 'TimeoutError'; throw e; },
    }),
    (error) => error.status === 504,
  );
});

test('converts a generic network error into a 502', async () => {
  await assert.rejects(
    () => fetchJSON('https://x.test/a', {
      fetchImpl: async () => { throw new TypeError('fetch failed'); },
    }),
    (error) => error.status === 502,
  );
});

test('throws on ok response with unparseable non-empty body', async () => {
  await assert.rejects(
    () => fetchJSON('https://x.test/a', {
      fetchImpl: async () => fakeResponse({ ok: true, status: 200, text: '<html>hello</html>' }),
    }),
    (error) => error.status === 502 && error.message === 'The service returned an unreadable response.',
  );
});
