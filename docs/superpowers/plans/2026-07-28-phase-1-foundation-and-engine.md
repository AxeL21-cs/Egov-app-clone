# Phase 1: Foundation & Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the server capability plumbing and the pure domain engine, then move the education catalog out of `App.jsx` so the existing journey is data-driven — with no visible change to the app.

**Architecture:** Two independent halves. `api/_lib/` gains a shared HTTP/error/config layer plus a `withCapability` wrapper that resolves each service to live-or-mock server-side. `src/domain/` gains pure, dependency-free modules (`profile`, `journey`, `matcher`, `catalog`) that never import React, `fetch`, or browser APIs — making eligibility logic testable under `node:test` with no browser and no network.

**Tech Stack:** React 19.2.8, Vite 8.1.5, Node ≥20.19.0, `node:test` (built-in), ESM throughout (`"type": "module"`).

## Global Constraints

- Node `>=20.19.0`. `node:test` and `AbortSignal.timeout` are built in — add **no** test or HTTP dependencies.
- All files are ESM. No `require()`, no `module.exports`.
- `src/domain/**` must import **nothing** outside itself. No React, no `lucide-react`, no `fetch`, no `localStorage`, no `Date.now()`.
- `api/_lib/**` must import nothing from `src/`.
- Time is always injected as a `now` parameter. Never call `Date.now()` inside domain code.
- Rule `test` functions return exactly `true`, `false`, or the string `'unknown'`.
- No match tier above `'possible'`. Never emit `eligible`, a numeric score, or the words qualified / approved / guaranteed / entitled.
- Every catalog entry requires `source`, `sourceLabel`, `verifiedOn`, `verification`, and `gate`.
- Error responses never expose upstream messages for status ≥ 500.
- Catalog icons are **strings**, never component references — `src/domain/` cannot import `lucide-react`.

**Deviation from spec §4.5, recorded deliberately:** the spec sketched `oneOf` as a group id linking several alternative *steps*. This plan instead puts an `options` array on a single step. "One proof of household income" is one requirement satisfiable several ways — one step with four options models that more directly than four steps that cancel each other out, and it matches the existing dropdown UI in `App.jsx:562-570`.

---

### Task 1: Test runner and error primitives

**Files:**
- Create: `api/_lib/errors.js`
- Create: `test/api/errors.test.js`
- Modify: `package.json` (add `test` script)

**Interfaces:**
- Consumes: nothing
- Produces: `class ApiError extends Error` with `constructor(message, status = 500, details = undefined)`; `publicError(error) -> { status, body: { error, details? } }`

- [ ] **Step 1: Add the test script**

In `package.json`, add to `"scripts"`:

```json
"test": "node --test test/"
```

- [ ] **Step 2: Write the failing test**

Create `test/api/errors.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, publicError } from '../../api/_lib/errors.js';

test('ApiError carries status and details', () => {
  const error = new ApiError('bad uuid', 400, { field: 'uuid' });
  assert.equal(error.message, 'bad uuid');
  assert.equal(error.status, 400);
  assert.deepEqual(error.details, { field: 'uuid' });
});

test('publicError passes through 4xx messages', () => {
  const result = publicError(new ApiError('A valid UUID is required.', 400));
  assert.equal(result.status, 400);
  assert.equal(result.body.error, 'A valid UUID is required.');
});

test('publicError hides 5xx internals', () => {
  const result = publicError(new ApiError('ECONNREFUSED 10.0.0.5:5432', 500));
  assert.equal(result.status, 500);
  assert.equal(result.body.error, 'An internal error occurred.');
});

test('publicError defaults unknown errors to 500 and hides the message', () => {
  const result = publicError(new Error('secret stack detail'));
  assert.equal(result.status, 500);
  assert.equal(result.body.error, 'An internal error occurred.');
});

test('publicError clamps out-of-range status codes', () => {
  const result = publicError(new ApiError('weird', 999));
  assert.equal(result.status, 500);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '.../api/_lib/errors.js'`

- [ ] **Step 4: Write the implementation**

Create `api/_lib/errors.js`:

```js
export class ApiError extends Error {
  constructor(message, status = 500, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function usableStatus(value) {
  return Number.isInteger(value) && value >= 400 && value < 600 ? value : 500;
}

export function publicError(error) {
  const status = usableStatus(error?.status);
  const safeMessage = status < 500
    ? (error?.message || 'Request could not be completed.')
    : 'An internal error occurred.';

  return {
    status,
    body: {
      error: safeMessage,
      ...(status < 500 && error?.details ? { details: error.details } : {}),
    },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS — 5 tests

- [ ] **Step 6: Commit**

```bash
git add package.json api/_lib/errors.js test/api/errors.test.js
git commit -m "feat: add ApiError and public error normalisation"
```

---

### Task 2: HTTP client with timeout

**Files:**
- Create: `api/_lib/http.js`
- Create: `test/api/http.test.js`

**Interfaces:**
- Consumes: `ApiError` from `api/_lib/errors.js`
- Produces: `fetchJSON(url, { method, headers, body, timeout, fetchImpl }) -> Promise<object>`. Throws `ApiError`. `fetchImpl` defaults to global `fetch` and exists so tests never touch the network.

- [ ] **Step 1: Write the failing test**

Create `test/api/http.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '.../api/_lib/http.js'`

- [ ] **Step 3: Write the implementation**

Create `api/_lib/http.js`:

```js
import { ApiError } from './errors.js';

export async function fetchJSON(url, {
  method = 'GET',
  headers = {},
  body = undefined,
  timeout = 12_000,
  fetchImpl = fetch,
} = {}) {
  const options = { method, headers: { ...headers }, signal: AbortSignal.timeout(timeout) };

  if (body !== undefined) {
    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetchImpl(url, options);
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new ApiError('The service did not respond in time.', 504);
    }
    throw new ApiError('The service could not be reached.', 502);
  }

  const raw = await response.text();
  let payload;
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || `Service returned HTTP ${response.status}.`;
    throw new ApiError(message, response.status, payload?.errors);
  }

  return payload ?? {};
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — 11 tests total

- [ ] **Step 5: Commit**

```bash
git add api/_lib/http.js test/api/http.test.js
git commit -m "feat: add fetchJSON with timeout and error normalisation"
```

---

### Task 3: Capability registry

**Files:**
- Create: `api/_lib/config.js`
- Create: `test/api/config.test.js`

**Interfaces:**
- Consumes: `ApiError`
- Produces: `CAPABILITIES` (object keyed by capability name); `capabilityStatus(env, name) -> 'live' | 'unconfigured'`; `capabilityConfig(env, name) -> { baseUrl, creds }` (throws `ApiError` 503 when unconfigured)

Base URLs and credential variable names come from spec §2 and §6.1.

- [ ] **Step 1: Write the failing test**

Create `test/api/config.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAPABILITIES, capabilityStatus, capabilityConfig } from '../../api/_lib/config.js';

const FULL_ENV = {
  EGOV_AI_API_BASE_URL: 'https://ai.test',
  EGOV_AI_ACCESS_CODE: 'code',
};

test('registry covers all eight services', () => {
  assert.deepEqual(Object.keys(CAPABILITIES).sort(), [
    'compass', 'egovAi', 'egovpay', 'emessage',
    'ereport', 'everify', 'faceLiveness', 'sso',
  ]);
});

test('live when base URL and all credentials are present', () => {
  assert.equal(capabilityStatus(FULL_ENV, 'egovAi'), 'live');
});

test('unconfigured when the base URL is missing', () => {
  assert.equal(capabilityStatus({ EGOV_AI_ACCESS_CODE: 'code' }, 'egovAi'), 'unconfigured');
});

test('unconfigured when a credential is missing', () => {
  assert.equal(capabilityStatus({ EGOV_AI_API_BASE_URL: 'https://ai.test' }, 'egovAi'), 'unconfigured');
});

test('unconfigured when a value is blank or whitespace', () => {
  assert.equal(capabilityStatus({ ...FULL_ENV, EGOV_AI_ACCESS_CODE: '   ' }, 'egovAi'), 'unconfigured');
});

test('capabilityConfig strips a trailing slash from the base URL', () => {
  const config = capabilityConfig({ ...FULL_ENV, EGOV_AI_API_BASE_URL: 'https://ai.test/' }, 'egovAi');
  assert.equal(config.baseUrl, 'https://ai.test');
  assert.equal(config.creds.EGOV_AI_ACCESS_CODE, 'code');
});

test('capabilityConfig throws 503 when unconfigured', () => {
  assert.throws(() => capabilityConfig({}, 'egovAi'), (error) => error.status === 503);
});

test('an unknown capability name throws', () => {
  assert.throws(() => capabilityStatus(FULL_ENV, 'nope'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '.../api/_lib/config.js'`

- [ ] **Step 3: Write the implementation**

Create `api/_lib/config.js`:

```js
import { ApiError } from './errors.js';

export const CAPABILITIES = {
  sso:          { baseUrl: 'EGOV_SSO_API_BASE_URL',      creds: ['EGOV_SSO_PARTNER_CODE', 'EGOV_SSO_PARTNER_SECRET'] },
  everify:      { baseUrl: 'EVERIFY_API_BASE_URL',       creds: ['EVERIFY_CLIENT_ID', 'EVERIFY_CLIENT_SECRET'] },
  faceLiveness: { baseUrl: 'FACE_LIVENESS_API_BASE_URL', creds: ['FACE_LIVENESS_API_KEY'] },
  emessage:     { baseUrl: 'EMESSAGE_API_BASE_URL',      creds: ['EMESSAGE_ACCESS_TOKEN'] },
  egovAi:       { baseUrl: 'EGOV_AI_API_BASE_URL',       creds: ['EGOV_AI_ACCESS_CODE'] },
  egovpay:      { baseUrl: 'EGOVPAY_API_BASE_URL',       creds: ['EGOVPAY_API_KEY', 'EGOVPAY_SETTLEMENT_TEMPLATE_UUID'] },
  ereport:      { baseUrl: 'EREPORT_API_BASE_URL',       creds: ['EREPORT_ACCESS_TOKEN'] },
  compass:      { baseUrl: 'COMPASS_API_BASE_URL',       creds: ['COMPASS_API_KEY'] },
};

function definition(name) {
  const found = CAPABILITIES[name];
  if (!found) throw new ApiError(`Unknown capability: ${name}`, 500);
  return found;
}

function filled(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function capabilityStatus(env, name) {
  const { baseUrl, creds } = definition(name);
  if (!filled(env?.[baseUrl])) return 'unconfigured';
  return creds.every((key) => filled(env?.[key])) ? 'live' : 'unconfigured';
}

export function capabilityConfig(env, name) {
  const { baseUrl, creds } = definition(name);
  if (capabilityStatus(env, name) !== 'live') {
    throw new ApiError('This service is not configured.', 503);
  }
  return {
    baseUrl: env[baseUrl].trim().replace(/\/$/, ''),
    creds: Object.fromEntries(creds.map((key) => [key, env[key].trim()])),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — 19 tests total

- [ ] **Step 5: Commit**

```bash
git add api/_lib/config.js test/api/config.test.js
git commit -m "feat: add capability registry with per-service liveness"
```

---

### Task 4: Token cache

**Files:**
- Create: `api/_lib/token-cache.js`
- Create: `test/api/token-cache.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `getCachedToken(key, fetchToken, { now, marginMs }) -> Promise<string>` where `fetchToken()` resolves `{ token, expiresInSec }`; `clearTokenCache()`

Used by SSO and eGov AI only (spec §6.4). The other six services use static credentials.

- [ ] **Step 1: Write the failing test**

Create `test/api/token-cache.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '.../api/_lib/token-cache.js'`

- [ ] **Step 3: Write the implementation**

Create `api/_lib/token-cache.js`:

```js
const cache = new Map();

export function clearTokenCache() {
  cache.clear();
}

export async function getCachedToken(key, fetchToken, {
  now = () => Date.now(),
  marginMs = 60_000,
} = {}) {
  const current = cache.get(key);
  if (current && current.expiresAt - marginMs > now()) {
    return current.token;
  }

  const { token, expiresInSec } = await fetchToken();
  cache.set(key, { token, expiresAt: now() + (expiresInSec ?? 3600) * 1000 });
  return token;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — 24 tests total

- [ ] **Step 5: Commit**

```bash
git add api/_lib/token-cache.js test/api/token-cache.test.js
git commit -m "feat: add token cache for SSO and eGov AI exchanges"
```

---

### Task 5: withCapability wrapper

**Files:**
- Create: `api/_lib/capability.js`
- Create: `test/api/capability.test.js`

**Interfaces:**
- Consumes: `capabilityStatus`, `capabilityConfig`, `publicError`
- Produces: `withCapability(name, { method, timeout, live, mock }) -> (req, res) => Promise<void>`
  - `live({ env, req, config, timeout })` resolves the payload
  - `mock({ req })` resolves the payload
  - Responds `{ data, source: 'live' | 'mock', capability }`

- [ ] **Step 1: Write the failing test**

Create `test/api/capability.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '.../api/_lib/capability.js'`

- [ ] **Step 3: Write the implementation**

Create `api/_lib/capability.js`. `req.env` is honoured so tests can inject an environment; production falls back to `process.env`.

```js
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

    if (capabilityStatus(env, name) !== 'live') {
      if (!mock) {
        return res.status(503).json({ error: 'This service is not configured.' });
      }
      return send(await mock({ req }), 'mock');
    }

    try {
      const config = capabilityConfig(env, name);
      return send(await live({ env, req, config, timeout }), 'live');
    } catch (error) {
      console.error(`[${name}] live call failed:`, error?.message);
      if (mock) return send(await mock({ req }), 'mock');
      const result = publicError(error);
      return res.status(result.status).json(result.body);
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — 30 tests total

- [ ] **Step 5: Commit**

```bash
git add api/_lib/capability.js test/api/capability.test.js
git commit -m "feat: add withCapability wrapper with mock fallback"
```

---

### Task 6: Health endpoint

**Files:**
- Create: `api/health.js`
- Create: `test/api/health.test.js`

**Interfaces:**
- Consumes: `CAPABILITIES`, `capabilityStatus`
- Produces: `GET /api/health -> { capabilities: { <name>: 'live' | 'unconfigured' }, liveCount, total }`

Status strings only — never credential values (spec §6.6).

- [ ] **Step 1: Write the failing test**

Create `test/api/health.test.js`:

```js
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '.../api/health.js'`

- [ ] **Step 3: Write the implementation**

Create `api/health.js`:

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — 34 tests total

- [ ] **Step 5: Commit**

```bash
git add api/health.js test/api/health.test.js
git commit -m "feat: add /api/health capability preflight"
```

---

### Task 7: Profile model and demo personas

**Files:**
- Create: `src/domain/profile.js`
- Create: `test/domain/profile.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `EMPTY_PROFILE`; `PERSONAS` (array); `createProfile(overrides) -> Profile`; `getPersona(id) -> Profile | undefined`

Every attribute defaults to `null` (unknown) except `id` and `label`. `null` is distinct from `false` (spec §4.1).

- [ ] **Step 1: Write the failing test**

Create `test/domain/profile.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_PROFILE, PERSONAS, createProfile, getPersona } from '../../src/domain/profile.js';

test('every attribute in the empty profile is unknown', () => {
  for (const [key, value] of Object.entries(EMPTY_PROFILE)) {
    if (key === 'id' || key === 'label') continue;
    assert.equal(value, null, `${key} should default to null`);
  }
});

test('createProfile merges overrides onto the empty profile', () => {
  const profile = createProfile({ age: 18, educationStatus: 'incoming-college' });
  assert.equal(profile.age, 18);
  assert.equal(profile.educationStatus, 'incoming-college');
  assert.equal(profile.householdIncomeBracket, null);
});

test('createProfile rejects unknown attributes', () => {
  assert.throws(() => createProfile({ favouriteColour: 'blue' }), /favouriteColour/);
});

test('ships at least four personas including an empty one', () => {
  assert.ok(PERSONAS.length >= 4);
  assert.ok(PERSONAS.some((persona) => persona.id === 'empty'));
});

test('every persona has a unique id and a label', () => {
  const ids = PERSONAS.map((persona) => persona.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const persona of PERSONAS) assert.equal(typeof persona.label, 'string');
});

test('getPersona finds Mika', () => {
  const mika = getPersona('mika');
  assert.equal(mika.age, 18);
  assert.equal(mika.educationStatus, 'incoming-college');
});

test('getPersona returns undefined for an unknown id', () => {
  assert.equal(getPersona('nobody'), undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '.../src/domain/profile.js'`

- [ ] **Step 3: Write the implementation**

Create `src/domain/profile.js`:

```js
export const EMPTY_PROFILE = {
  id: 'empty',
  label: 'No information yet',
  age: null,
  region: null,
  city: null,
  citizenship: null,
  educationStatus: null,       // 'incoming-college' | 'enrolled-college' | 'senior-high' | 'out-of-school' | 'graduate'
  academicStanding: null,      // 'high' | 'average'
  employmentStatus: null,      // 'none' | 'informal' | 'employed' | 'self-employed' | 'ofw'
  householdIncomeBracket: null,// 'low' | 'middle' | 'high'
  isPWD: null,
  isSoloParent: null,
  isIndigenous: null,
  has4Ps: null,
  philHealthMember: null,
  verifiedAttributes: null,
};

const ALLOWED = new Set(Object.keys(EMPTY_PROFILE));

export function createProfile(overrides = {}) {
  for (const key of Object.keys(overrides)) {
    if (!ALLOWED.has(key)) {
      throw new Error(`Unknown profile attribute: ${key}`);
    }
  }
  return { ...EMPTY_PROFILE, ...overrides };
}

export const PERSONAS = [
  createProfile({
    id: 'mika', label: 'Mika, 18 — incoming freshman',
    age: 18, region: 'NCR', city: 'San Juan City', citizenship: 'PH',
    educationStatus: 'incoming-college', academicStanding: 'high',
    employmentStatus: 'none', isPWD: false,
  }),
  createProfile({
    id: 'ramon', label: 'Ramon, 45 — informal worker',
    age: 45, region: 'NCR', city: 'Caloocan City', citizenship: 'PH',
    educationStatus: 'graduate', employmentStatus: 'informal',
    householdIncomeBracket: 'low', isPWD: false, philHealthMember: false,
  }),
  createProfile({
    id: 'liza', label: 'Liza, 32 — solo parent',
    age: 32, region: 'Region IV-A', city: 'Cavite City', citizenship: 'PH',
    educationStatus: 'graduate', employmentStatus: 'employed',
    householdIncomeBracket: 'low', isSoloParent: true, has4Ps: true,
  }),
  { ...EMPTY_PROFILE },
];

export function getPersona(id) {
  return PERSONAS.find((persona) => persona.id === id);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — 41 tests total

- [ ] **Step 5: Commit**

```bash
git add src/domain/profile.js test/domain/profile.test.js
git commit -m "feat: add pure profile model with demo personas"
```

---

### Task 8: Journey resolver

**Files:**
- Create: `src/domain/journey.js`
- Create: `test/domain/journey.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `resolveJourney({ steps, completed, processing }) -> ResolvedStep[]`; `journeyProgress(resolvedSteps) -> { done, total, percent }`

A resolved step adds `status` (`'complete' | 'processing' | 'available' | 'locked' | 'conditional'`) and `lockedBy` (title of the first unmet dependency, or `''`).

This replaces the hardcoded chain in `App.jsx:432-484`.

- [ ] **Step 1: Write the failing test**

Create `test/domain/journey.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveJourney, journeyProgress } from '../../src/domain/journey.js';

const STEPS = [
  { id: 'a', title: 'Profile', dependsOn: [] },
  { id: 'b', title: 'Birth certificate', dependsOn: ['a'] },
  { id: 'c', title: 'School record', dependsOn: ['b'] },
  { id: 'x', title: 'PWD ID', dependsOn: [], conditional: 'claims-pwd' },
];

const byId = (steps) => Object.fromEntries(steps.map((step) => [step.id, step]));

test('a step with satisfied dependencies is available', () => {
  const steps = byId(resolveJourney({ steps: STEPS, completed: ['a'] }));
  assert.equal(steps.a.status, 'complete');
  assert.equal(steps.b.status, 'available');
});

test('a step with unmet dependencies is locked and names the blocker', () => {
  const steps = byId(resolveJourney({ steps: STEPS, completed: [] }));
  assert.equal(steps.c.status, 'locked');
  assert.equal(steps.c.lockedBy, 'Birth certificate');
});

test('conditional steps are never locked', () => {
  const steps = byId(resolveJourney({ steps: STEPS, completed: [] }));
  assert.equal(steps.x.status, 'conditional');
});

test('a completed conditional step reads as complete', () => {
  const steps = byId(resolveJourney({ steps: STEPS, completed: ['x'] }));
  assert.equal(steps.x.status, 'complete');
});

test('processing unlocks dependants but is not complete', () => {
  const steps = byId(resolveJourney({ steps: STEPS, completed: ['a'], processing: ['b'] }));
  assert.equal(steps.b.status, 'processing');
  assert.equal(steps.c.status, 'available');
});

test('the first step of an empty journey is available', () => {
  const steps = byId(resolveJourney({ steps: STEPS, completed: [] }));
  assert.equal(steps.a.status, 'available');
});

test('progress ignores conditional steps', () => {
  const resolved = resolveJourney({ steps: STEPS, completed: ['a'] });
  const progress = journeyProgress(resolved);
  assert.equal(progress.total, 3);
  assert.equal(progress.done, 1);
  assert.equal(progress.percent, 33);
});

test('progress counts processing as done', () => {
  const resolved = resolveJourney({ steps: STEPS, completed: ['a'], processing: ['b'] });
  assert.equal(journeyProgress(resolved).done, 2);
});

test('an empty journey reports zero percent without dividing by zero', () => {
  assert.deepEqual(journeyProgress([]), { done: 0, total: 0, percent: 0 });
});

test('a missing dependency id does not crash and locks the step', () => {
  const steps = byId(resolveJourney({ steps: [{ id: 'q', title: 'Q', dependsOn: ['ghost'] }], completed: [] }));
  assert.equal(steps.q.status, 'locked');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '.../src/domain/journey.js'`

- [ ] **Step 3: Write the implementation**

Create `src/domain/journey.js`:

```js
export function resolveJourney({ steps = [], completed = [], processing = [] } = {}) {
  const doneSet = new Set(completed);
  const processingSet = new Set(processing);
  const titles = new Map(steps.map((step) => [step.id, step.title]));

  const satisfied = (id) => doneSet.has(id) || processingSet.has(id);

  return steps.map((step) => {
    const dependsOn = step.dependsOn || [];

    if (doneSet.has(step.id)) return { ...step, status: 'complete', lockedBy: '' };
    if (processingSet.has(step.id)) return { ...step, status: 'processing', lockedBy: '' };
    if (step.conditional) return { ...step, status: 'conditional', lockedBy: '' };

    const unmet = dependsOn.find((id) => !satisfied(id));
    if (unmet) {
      return { ...step, status: 'locked', lockedBy: titles.get(unmet) || 'an earlier step' };
    }

    return { ...step, status: 'available', lockedBy: '' };
  });
}

export function journeyProgress(resolvedSteps = []) {
  const core = resolvedSteps.filter((step) => step.status !== 'conditional');
  const done = core.filter((step) => step.status === 'complete' || step.status === 'processing').length;
  const total = core.length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — 51 tests total

- [ ] **Step 5: Commit**

```bash
git add src/domain/journey.js test/domain/journey.test.js
git commit -m "feat: add dependency-driven journey resolver"
```

---

### Task 9: Education catalog

**Files:**
- Create: `src/domain/catalog/education.js`
- Create: `test/domain/education.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: default export — an array of three catalog entries (`ched-bpms`, `ched-tes`, `dswd-aics`) plus their `journey.steps`

Data migrated from `App.jsx:48-181`. **Icons become strings** — `src/domain/` cannot import `lucide-react`.

- [ ] **Step 1: Write the failing test**

Create `test/domain/education.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import education from '../../src/domain/catalog/education.js';

test('carries the three education programmes', () => {
  assert.deepEqual(education.map((entry) => entry.id).sort(), ['ched-bpms', 'ched-tes', 'dswd-aics']);
});

test('every entry is in the education domain', () => {
  for (const entry of education) assert.equal(entry.domain, 'education');
});

test('AICS is gated on assessment, never automatic', () => {
  const aics = education.find((entry) => entry.id === 'dswd-aics');
  assert.equal(aics.gate, 'assessment');
  assert.equal(aics.type, 'Crisis assistance');
});

test('the merit scholarship is competitive and its call is closed', () => {
  const bpms = education.find((entry) => entry.id === 'ched-bpms');
  assert.equal(bpms.gate, 'competitive');
  assert.equal(bpms.window.status, 'closed');
});

test('icons are strings, never component references', () => {
  for (const entry of education) {
    assert.equal(typeof entry.icon, 'string');
    for (const step of entry.journey.steps) assert.equal(typeof step.icon, 'string');
  }
});

test('the BPMS journey chain is declared, not implied by order', () => {
  const bpms = education.find((entry) => entry.id === 'ched-bpms');
  const steps = Object.fromEntries(bpms.journey.steps.map((step) => [step.id, step]));
  assert.deepEqual(steps['bpms-birth'].dependsOn, []);
  assert.deepEqual(steps['bpms-sf9'].dependsOn, ['bpms-birth']);
  assert.deepEqual(steps['bpms-admission'].dependsOn, ['bpms-sf9']);
  assert.deepEqual(steps['bpms-income'].dependsOn, ['bpms-admission']);
});

test('the income step offers four accepted alternatives', () => {
  const bpms = education.find((entry) => entry.id === 'ched-bpms');
  const income = bpms.journey.steps.find((step) => step.id === 'bpms-income');
  assert.equal(income.method, 'choice');
  assert.equal(income.options.length, 4);
});

test('no entry uses approval language', () => {
  const banned = /\b(qualified|approved|guaranteed|entitled|eligible)\b/i;
  for (const entry of education) {
    assert.equal(banned.test(entry.description), false, `${entry.id} description`);
    assert.equal(banned.test(entry.status), false, `${entry.id} status`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '.../src/domain/catalog/education.js'`

- [ ] **Step 3: Write the implementation**

Create `src/domain/catalog/education.js`:

```js
const isFilipino = {
  id: 'is-filipino', label: 'Filipino citizen', kind: 'hard',
  test: (p) => p.citizenship === null ? 'unknown' : p.citizenship === 'PH',
};

const isIncomingFreshman = {
  id: 'is-incoming-freshman', label: 'Incoming first-year student', kind: 'hard',
  test: (p) => p.educationStatus === null ? 'unknown' : p.educationStatus === 'incoming-college',
};

const isStudent = {
  id: 'is-student', label: 'Incoming or enrolled college student', kind: 'hard',
  test: (p) => p.educationStatus === null
    ? 'unknown'
    : ['incoming-college', 'enrolled-college'].includes(p.educationStatus),
};

const strongRecord = {
  id: 'strong-record', label: 'Strong Grade 12 record', kind: 'soft',
  test: (p) => p.academicStanding === null ? 'unknown' : p.academicStanding === 'high',
};

const lowIncome = {
  id: 'low-income', label: 'Low household income', kind: 'soft',
  test: (p) => p.householdIncomeBracket === null ? 'unknown' : p.householdIncomeBracket === 'low',
};

export default [
  {
    id: 'ched-bpms',
    domain: 'education',
    title: 'Bagong Pilipinas Merit Scholarship',
    shortTitle: 'Merit Scholarship',
    agency: 'CHED',
    type: 'Scholarship',
    status: 'Prepare for next call',
    statusTone: 'gold',
    description: 'A competitive merit pathway for high-performing incoming first-year students in priority programs.',
    icon: 'graduation-cap',
    accent: 'blue',
    gate: 'competitive',
    rules: [isFilipino, isIncomingFreshman, strongRecord],
    window: { status: 'closed', nextOpens: '2027-01', note: 'AY 2026–2027 call closed' },
    source: 'https://bpms.ched.gov.ph/',
    sourceLabel: 'Official CHED portal',
    verifiedOn: '2026-07-27',
    verification: 'verified',
    compassProgramCode: null,
    journey: {
      id: 'ched-bpms-journey',
      steps: [
        {
          id: 'bpms-profile', title: 'Online application profile',
          detail: 'Synthetic identity and basic applicant details are ready.',
          source: 'Applicant profile', icon: 'user-round',
          method: 'none', dependsOn: [], conditional: null, options: null,
        },
        {
          id: 'bpms-birth', title: 'PSA birth certificate',
          detail: 'Request a copy through the future eGov document-service connection.',
          source: 'Philippine Statistics Authority', icon: 'file-text',
          method: 'egov', dependsOn: [], conditional: null, options: null,
        },
        {
          id: 'bpms-sf9', title: 'Certified SF9 / Form 138',
          detail: 'Signed by your registrar or authorized school representative.',
          source: 'Senior high school registrar', icon: 'school',
          method: 'upload', dependsOn: ['bpms-birth'], conditional: null, options: null,
        },
        {
          id: 'bpms-admission', title: 'College admission proof',
          detail: 'Admission slip or another accepted proof from your selected institution.',
          source: 'College admissions office', icon: 'graduation-cap',
          method: 'upload', dependsOn: ['bpms-sf9'], conditional: null, options: null,
        },
        {
          id: 'bpms-income', title: 'One proof of household income',
          detail: 'Choose one accepted document path below.',
          source: 'BIR, DSWD, or employer', icon: 'wallet-cards',
          method: 'choice', dependsOn: ['bpms-admission'], conditional: null,
          options: [
            { id: 'non-filer', title: 'BIR non-filer / tax exemption certificate', detail: 'For a parent or guardian without a filed income tax return.' },
            { id: 'itr', title: 'Latest ITR or BIR Form 2316', detail: 'For employed or self-employed parents or legal guardians.' },
            { id: 'ofw', title: 'OFW or seafarer income proof', detail: 'Certified latest contract or equivalent proof of income.' },
            { id: 'four-ps', title: '4Ps certification', detail: 'DSWD or city/municipal social welfare certification.' },
          ],
        },
      ],
    },
  },
  {
    id: 'ched-tes',
    domain: 'education',
    title: 'Tertiary Education Subsidy',
    shortTitle: 'TES',
    agency: 'CHED / UniFAST',
    type: 'Grant-in-aid',
    status: 'After enrollment',
    statusTone: 'blue',
    description: 'Support for students enrolled in participating public or private higher education institutions.',
    icon: 'school',
    accent: 'red',
    gate: 'automatic',
    rules: [isFilipino, isStudent, lowIncome],
    window: { status: 'after-enrollment', nextOpens: null, note: 'Coordinate with your school' },
    source: 'https://unifast.gov.ph/tes.html',
    sourceLabel: 'Official UniFAST page',
    verifiedOn: '2026-07-27',
    verification: 'verified',
    compassProgramCode: null,
    journey: {
      id: 'ched-tes-journey',
      steps: [
        {
          id: 'tes-profile', title: 'Student profile',
          detail: 'Demo identity and student status saved.',
          source: 'eAbot demo profile', icon: 'user-round',
          method: 'none', dependsOn: [], conditional: null, options: null,
        },
        {
          id: 'tes-enrollment', title: 'Certificate of Registration or Enrollment',
          detail: 'Request this from your school after enrollment.',
          source: 'School registrar', icon: 'school',
          method: 'upload', dependsOn: ['tes-profile'], conditional: null, options: null,
        },
        {
          id: 'tes-residency', title: 'Certificate of Residency',
          detail: 'Conditional for the applicable private-school / no-SUC-or-LUC category.',
          source: 'LGU or barangay', icon: 'building-2',
          method: 'upload', dependsOn: [], conditional: 'private-school-category', options: null,
        },
        {
          id: 'tes-pwd', title: 'PWD ID',
          detail: 'Only needed when claiming the PWD priority category.',
          source: 'PDAO / LGU', icon: 'badge-check',
          method: 'upload', dependsOn: [], conditional: 'claims-pwd', options: null,
        },
      ],
    },
  },
  {
    id: 'dswd-aics',
    domain: 'education',
    title: 'AICS Educational Assistance',
    shortTitle: 'Educational Assistance',
    agency: 'DSWD',
    type: 'Crisis assistance',
    status: 'Assessment required',
    statusTone: 'pink',
    description: 'Short-term assistance for a student or family experiencing an actual crisis, subject to social-worker assessment.',
    icon: 'heart-handshake',
    accent: 'green',
    gate: 'assessment',
    rules: [isFilipino, lowIncome],
    window: { status: 'rolling', nextOpens: null, note: 'Local schedules vary' },
    source: 'https://www.dswd.gov.ph/aics/',
    sourceLabel: 'Official DSWD overview',
    verifiedOn: '2026-07-27',
    verification: 'verified',
    compassProgramCode: null,
    journey: {
      id: 'dswd-aics-journey',
      steps: [
        {
          id: 'aics-profile', title: 'Valid ID for the interview',
          detail: 'Demo identity is saved; bring an accepted physical ID to the actual interview.',
          source: 'Applicant', icon: 'user-round',
          method: 'none', dependsOn: [], conditional: null, options: null,
        },
        {
          id: 'aics-school', title: 'Current school document',
          detail: 'Enrollment assessment, certificate of enrollment/registration, or statement of account.',
          source: 'School registrar', icon: 'school',
          method: 'upload', dependsOn: ['aics-profile'], conditional: null, options: null,
        },
        {
          id: 'aics-assessment', title: 'Social-worker assessment',
          detail: 'A DSWD social worker determines whether an actual crisis qualifies for assistance.',
          source: 'DSWD field or satellite office', icon: 'heart-handshake',
          method: 'assisted', dependsOn: ['aics-school'], conditional: null, options: null,
        },
        {
          id: 'aics-local', title: 'Local supporting documents',
          detail: 'Residency, indigency, or authorization documents may be requested for your case.',
          source: 'Barangay / applicant', icon: 'building-2',
          method: 'upload', dependsOn: [], conditional: 'local-requirements', options: null,
        },
      ],
    },
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — 59 tests total

- [ ] **Step 5: Commit**

```bash
git add src/domain/catalog/education.js test/domain/education.test.js
git commit -m "feat: move education programmes into a data-driven catalog"
```

---

### Task 10: Catalog loader with validation

**Files:**
- Create: `src/domain/catalog/index.js`
- Create: `test/domain/catalog.test.js`

**Interfaces:**
- Consumes: `src/domain/catalog/education.js`
- Produces: `CATALOG` (validated array); `validateEntry(entry) -> string[]` (list of problems, empty when valid); `getEntry(id)`; `DOMAINS` (sorted unique domain names)

Validation throws at module load, so a malformed entry fails at startup rather than mid-demo (spec §9).

- [ ] **Step 1: Write the failing test**

Create `test/domain/catalog.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, DOMAINS, getEntry, validateEntry } from '../../src/domain/catalog/index.js';

const VALID = {
  id: 'x', domain: 'health', title: 'X', agency: 'A', type: 'T',
  gate: 'automatic', rules: [{ id: 'r', label: 'R', kind: 'hard', test: () => true }],
  window: { status: 'open' }, source: 'https://a.test', sourceLabel: 'A',
  verifiedOn: '2026-07-27', verification: 'verified', icon: 'x',
  journey: { id: 'xj', steps: [{ id: 's', title: 'S', dependsOn: [] }] },
};

test('the shipped catalog is valid', () => {
  assert.ok(CATALOG.length >= 3);
  for (const entry of CATALOG) assert.deepEqual(validateEntry(entry), []);
});

test('getEntry finds a programme by id', () => {
  assert.equal(getEntry('ched-bpms').agency, 'CHED');
});

test('DOMAINS lists unique domains', () => {
  assert.ok(DOMAINS.includes('education'));
  assert.equal(new Set(DOMAINS).size, DOMAINS.length);
});

test('a missing source is reported', () => {
  const problems = validateEntry({ ...VALID, source: undefined });
  assert.ok(problems.some((problem) => problem.includes('source')));
});

test('a missing verifiedOn is reported', () => {
  assert.ok(validateEntry({ ...VALID, verifiedOn: undefined }).some((p) => p.includes('verifiedOn')));
});

test('an invalid gate is reported', () => {
  assert.ok(validateEntry({ ...VALID, gate: 'magic' }).some((p) => p.includes('gate')));
});

test('an invalid verification value is reported', () => {
  assert.ok(validateEntry({ ...VALID, verification: 'maybe' }).some((p) => p.includes('verification')));
});

test('a rule without a label is reported', () => {
  const broken = { ...VALID, rules: [{ id: 'r', kind: 'hard', test: () => true }] };
  assert.ok(validateEntry(broken).some((p) => p.includes('label')));
});

test('a rule whose test is not a function is reported', () => {
  const broken = { ...VALID, rules: [{ id: 'r', label: 'R', kind: 'hard', test: 'yes' }] };
  assert.ok(validateEntry(broken).some((p) => p.includes('test')));
});

test('a dependsOn pointing at a missing step is reported', () => {
  const broken = { ...VALID, journey: { id: 'j', steps: [{ id: 's', title: 'S', dependsOn: ['ghost'] }] } };
  assert.ok(validateEntry(broken).some((p) => p.includes('ghost')));
});

test('a valid entry produces no problems', () => {
  assert.deepEqual(validateEntry(VALID), []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '.../src/domain/catalog/index.js'`

- [ ] **Step 3: Write the implementation**

Create `src/domain/catalog/index.js`:

```js
import education from './education.js';

const GATES = new Set(['automatic', 'competitive', 'assessment']);
const VERIFICATIONS = new Set(['verified', 'unverified']);
const REQUIRED = ['id', 'domain', 'title', 'agency', 'type', 'source', 'sourceLabel', 'verifiedOn', 'icon'];

export function validateEntry(entry) {
  const problems = [];

  for (const field of REQUIRED) {
    if (!entry?.[field]) problems.push(`${entry?.id || 'entry'}: missing ${field}`);
  }

  if (!GATES.has(entry?.gate)) problems.push(`${entry?.id}: invalid gate "${entry?.gate}"`);
  if (!VERIFICATIONS.has(entry?.verification)) problems.push(`${entry?.id}: invalid verification "${entry?.verification}"`);
  if (!entry?.window?.status) problems.push(`${entry?.id}: missing window.status`);

  for (const rule of entry?.rules || []) {
    if (!rule.label) problems.push(`${entry?.id}: rule ${rule.id} missing label`);
    if (typeof rule.test !== 'function') problems.push(`${entry?.id}: rule ${rule.id} test must be a function`);
  }

  const steps = entry?.journey?.steps || [];
  const ids = new Set(steps.map((step) => step.id));
  for (const step of steps) {
    for (const dependency of step.dependsOn || []) {
      if (!ids.has(dependency)) problems.push(`${entry?.id}: step ${step.id} depends on unknown step ${dependency}`);
    }
  }

  return problems;
}

export const CATALOG = [...education];

const allProblems = CATALOG.flatMap(validateEntry);
if (allProblems.length > 0) {
  throw new Error(`Invalid catalog entries:\n${allProblems.join('\n')}`);
}

export const DOMAINS = [...new Set(CATALOG.map((entry) => entry.domain))].sort();

export function getEntry(id) {
  return CATALOG.find((entry) => entry.id === id);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — 70 tests total

- [ ] **Step 5: Commit**

```bash
git add src/domain/catalog/index.js test/domain/catalog.test.js
git commit -m "feat: add catalog loader with load-time validation"
```

---

### Task 11: Matching engine

**Files:**
- Create: `src/domain/matcher.js`
- Create: `test/domain/matcher.test.js`

**Interfaces:**
- Consumes: `CATALOG`
- Produces:
  - `evaluateRule(rule, profile) -> true | false | 'unknown'`
  - `evaluateEntry(entry, profile) -> { programId, tier, reasons, gaps, blockers, window, source, sourceLabel, verification, funding }`
  - `matchPrograms({ profile, catalog, now }) -> Match[]` (ranked, `not-eligible` excluded)
  - `notEligible({ profile, catalog }) -> Match[]`
  - `topGaps(matches) -> [{ id, label, unlocks }]`

Tier rules from spec §5.1–§5.2. There is no `eligible` tier and no numeric score.

- [ ] **Step 1: Write the failing test**

Create `test/domain/matcher.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRule, evaluateEntry, matchPrograms, notEligible, topGaps } from '../../src/domain/matcher.js';
import { createProfile, getPersona, EMPTY_PROFILE } from '../../src/domain/profile.js';
import { CATALOG } from '../../src/domain/catalog/index.js';

const NOW = new Date('2026-07-28T00:00:00Z');

const entry = (gate, rules) => ({
  id: 'test-entry', domain: 'test', title: 'T', agency: 'A', type: 'T',
  gate, rules, window: { status: 'open' }, source: 'https://a.test',
  sourceLabel: 'A', verifiedOn: '2026-07-27', verification: 'verified', icon: 'x',
  journey: { id: 'j', steps: [] },
});

const pass = { id: 'p', label: 'Passes', kind: 'hard', test: () => true };
const fail = { id: 'f', label: 'Fails', kind: 'hard', test: () => false };
const unsure = { id: 'u', label: 'Unknown', kind: 'hard', test: () => 'unknown' };
const softPass = { id: 's', label: 'Soft passes', kind: 'soft', test: () => true };
const softFail = { id: 'sf', label: 'Soft fails', kind: 'soft', test: () => false };

test('evaluateRule returns the three states verbatim', () => {
  assert.equal(evaluateRule(pass, EMPTY_PROFILE), true);
  assert.equal(evaluateRule(fail, EMPTY_PROFILE), false);
  assert.equal(evaluateRule(unsure, EMPTY_PROFILE), 'unknown');
});

test('a failed hard rule produces not-eligible with a blocker', () => {
  const result = evaluateEntry(entry('automatic', [pass, fail]), EMPTY_PROFILE);
  assert.equal(result.tier, 'not-eligible');
  assert.deepEqual(result.blockers.map((b) => b.id), ['f']);
});

test('an unknown hard rule produces needs-info with a gap', () => {
  const result = evaluateEntry(entry('automatic', [pass, unsure]), EMPTY_PROFILE);
  assert.equal(result.tier, 'needs-info');
  assert.deepEqual(result.gaps.map((g) => g.id), ['u']);
});

test('a failed hard rule outranks an unknown one', () => {
  const result = evaluateEntry(entry('automatic', [unsure, fail]), EMPTY_PROFILE);
  assert.equal(result.tier, 'not-eligible');
});

test('an automatic gate with all hard rules passing is possible', () => {
  assert.equal(evaluateEntry(entry('automatic', [pass]), EMPTY_PROFILE).tier, 'possible');
});

test('a competitive gate is worth-checking, never possible', () => {
  assert.equal(evaluateEntry(entry('competitive', [pass]), EMPTY_PROFILE).tier, 'worth-checking');
});

test('an assessment gate is worth-checking', () => {
  assert.equal(evaluateEntry(entry('assessment', [pass]), EMPTY_PROFILE).tier, 'worth-checking');
});

test('a soft rule never disqualifies', () => {
  assert.equal(evaluateEntry(entry('automatic', [pass, softFail]), EMPTY_PROFILE).tier, 'possible');
});

test('passing soft rules are listed as reasons', () => {
  const result = evaluateEntry(entry('automatic', [pass, softPass]), EMPTY_PROFILE);
  assert.deepEqual(result.reasons.map((r) => r.id).sort(), ['p', 's']);
});

test('an unknown soft rule becomes a gap without changing the tier', () => {
  const soft = { id: 'su', label: 'Soft unknown', kind: 'soft', test: () => 'unknown' };
  const result = evaluateEntry(entry('automatic', [pass, soft]), EMPTY_PROFILE);
  assert.equal(result.tier, 'possible');
  assert.deepEqual(result.gaps.map((g) => g.id), ['su']);
});

test('the result never contains an approval field or a score', () => {
  const result = evaluateEntry(entry('automatic', [pass]), EMPTY_PROFILE);
  assert.equal('eligible' in result, false);
  assert.equal('score' in result, false);
  assert.equal(result.funding, null);
});

test('the source link is always carried into the result', () => {
  const result = evaluateEntry(entry('automatic', [pass]), EMPTY_PROFILE);
  assert.equal(result.source, 'https://a.test');
  assert.equal(result.sourceLabel, 'A');
});

test('the empty profile yields needs-info everywhere and no blockers', () => {
  const all = [
    ...matchPrograms({ profile: EMPTY_PROFILE, catalog: CATALOG, now: NOW }),
    ...notEligible({ profile: EMPTY_PROFILE, catalog: CATALOG }),
  ];
  assert.equal(all.length, CATALOG.length);
  for (const match of all) {
    assert.equal(match.tier, 'needs-info');
    assert.deepEqual(match.blockers, []);
  }
});

test('Mika matches the merit scholarship but never above worth-checking', () => {
  const matches = matchPrograms({ profile: getPersona('mika'), catalog: CATALOG, now: NOW });
  const bpms = matches.find((match) => match.programId === 'ched-bpms');
  assert.equal(bpms.tier, 'worth-checking');
  assert.deepEqual(bpms.reasons.map((r) => r.id).sort(), ['is-filipino', 'is-incoming-freshman', 'strong-record']);
});

test('matchPrograms excludes not-eligible entries', () => {
  const ramon = getPersona('ramon');
  const matches = matchPrograms({ profile: ramon, catalog: CATALOG, now: NOW });
  assert.equal(matches.some((match) => match.tier === 'not-eligible'), false);
  assert.ok(notEligible({ profile: ramon, catalog: CATALOG }).length > 0);
});

test('open windows rank above closed ones at the same tier', () => {
  const catalog = [
    { ...entry('automatic', [pass]), id: 'closed', window: { status: 'closed' } },
    { ...entry('automatic', [pass]), id: 'open', window: { status: 'open' } },
  ];
  const matches = matchPrograms({ profile: EMPTY_PROFILE, catalog, now: NOW });
  assert.equal(matches[0].programId, 'open');
});

test('possible ranks above worth-checking', () => {
  const catalog = [
    { ...entry('competitive', [pass]), id: 'contest' },
    { ...entry('automatic', [pass]), id: 'auto' },
  ];
  const matches = matchPrograms({ profile: EMPTY_PROFILE, catalog, now: NOW });
  assert.equal(matches[0].programId, 'auto');
});

test('ranking interleaves domains so one domain cannot fill the top', () => {
  const catalog = [
    { ...entry('automatic', [pass]), id: 'e1', domain: 'education' },
    { ...entry('automatic', [pass]), id: 'e2', domain: 'education' },
    { ...entry('automatic', [pass]), id: 'h1', domain: 'health' },
  ];
  const matches = matchPrograms({ profile: EMPTY_PROFILE, catalog, now: NOW });
  assert.equal(matches[1].domain, 'health');
});

test('topGaps ranks unknowns by how many programmes they unlock', () => {
  const shared = { id: 'income', label: 'Household income', kind: 'hard', test: () => 'unknown' };
  const lone = { id: 'age', label: 'Age', kind: 'hard', test: () => 'unknown' };
  const catalog = [
    { ...entry('automatic', [shared]), id: 'a' },
    { ...entry('automatic', [shared]), id: 'b' },
    { ...entry('automatic', [lone]), id: 'c' },
  ];
  const gaps = topGaps(matchPrograms({ profile: EMPTY_PROFILE, catalog, now: NOW }));
  assert.equal(gaps[0].id, 'income');
  assert.equal(gaps[0].unlocks, 2);
});

test('matching is deterministic for a fixed now', () => {
  const profile = createProfile({ citizenship: 'PH', educationStatus: 'incoming-college' });
  const first = matchPrograms({ profile, catalog: CATALOG, now: NOW });
  const second = matchPrograms({ profile, catalog: CATALOG, now: NOW });
  assert.deepEqual(first.map((m) => m.programId), second.map((m) => m.programId));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '.../src/domain/matcher.js'`

- [ ] **Step 3: Write the implementation**

Create `src/domain/matcher.js`:

```js
const TIER_ORDER = { possible: 0, 'worth-checking': 1, 'needs-info': 2, 'not-eligible': 3 };
const OPEN_WINDOWS = new Set(['open', 'rolling']);

export function evaluateRule(rule, profile) {
  const outcome = rule.test(profile);
  return outcome === true || outcome === false ? outcome : 'unknown';
}

function tierFor(gate) {
  return gate === 'automatic' ? 'possible' : 'worth-checking';
}

export function evaluateEntry(entry, profile) {
  const reasons = [];
  const gaps = [];
  const blockers = [];

  for (const rule of entry.rules || []) {
    const outcome = evaluateRule(rule, profile);
    const summary = { id: rule.id, label: rule.label };

    if (outcome === true) reasons.push(summary);
    else if (outcome === 'unknown') gaps.push(summary);
    else if (rule.kind === 'hard') blockers.push(summary);
  }

  const hardGaps = (entry.rules || []).some(
    (rule) => rule.kind === 'hard' && evaluateRule(rule, profile) === 'unknown',
  );

  let tier;
  if (blockers.length > 0) tier = 'not-eligible';
  else if (hardGaps) tier = 'needs-info';
  else tier = tierFor(entry.gate);

  return {
    programId: entry.id,
    domain: entry.domain,
    tier,
    reasons,
    gaps,
    blockers,
    window: entry.window,
    source: entry.source,
    sourceLabel: entry.sourceLabel,
    verification: entry.verification,
    funding: null,
  };
}

function rank(a, b) {
  const byTier = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
  if (byTier !== 0) return byTier;

  const openness = Number(OPEN_WINDOWS.has(b.window?.status)) - Number(OPEN_WINDOWS.has(a.window?.status));
  if (openness !== 0) return openness;

  const byReasons = b.reasons.length - a.reasons.length;
  if (byReasons !== 0) return byReasons;

  return a.programId.localeCompare(b.programId);
}

function interleaveDomains(matches) {
  const buckets = new Map();
  for (const match of matches) {
    if (!buckets.has(match.domain)) buckets.set(match.domain, []);
    buckets.get(match.domain).push(match);
  }

  const queues = [...buckets.values()];
  const output = [];
  while (output.length < matches.length) {
    for (const queue of queues) {
      if (queue.length > 0) output.push(queue.shift());
    }
  }
  return output;
}

export function matchPrograms({ profile, catalog, now }) {
  if (!now) throw new Error('matchPrograms requires an explicit `now`.');

  const matches = catalog
    .map((entry) => evaluateEntry(entry, profile))
    .filter((match) => match.tier !== 'not-eligible')
    .sort(rank);

  return interleaveDomains(matches);
}

export function notEligible({ profile, catalog }) {
  return catalog
    .map((entry) => evaluateEntry(entry, profile))
    .filter((match) => match.tier === 'not-eligible');
}

export function topGaps(matches) {
  const counts = new Map();
  for (const match of matches) {
    for (const gap of match.gaps) {
      const current = counts.get(gap.id) || { id: gap.id, label: gap.label, unlocks: 0 };
      current.unlocks += 1;
      counts.set(gap.id, current);
    }
  }
  return [...counts.values()].sort((a, b) => b.unlocks - a.unlocks || a.id.localeCompare(b.id));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — 90 tests total

- [ ] **Step 5: Commit**

```bash
git add src/domain/matcher.js test/domain/matcher.test.js
git commit -m "feat: add pure eligibility matcher with calibrated tiers"
```

---

### Task 12: Wire the journey resolver into the UI

**Files:**
- Create: `src/components/icons.js`
- Modify: `src/App.jsx` — remove `PROGRAMS` (48-103), `INCOME_OPTIONS` (105-110), `PROGRAM_REQUIREMENTS` (112-181), `getBpmsRequirements` (432-484); rewire `RequirementsScreen` and `ProgramCard`

**Interfaces:**
- Consumes: `CATALOG`, `getEntry`, `resolveJourney`, `journeyProgress`
- Produces: no new exports — `App.jsx` now renders from catalog data

The app must look and behave exactly as before. This task is a swap of the data source, not a redesign.

- [ ] **Step 1: Create the icon map**

`src/domain/` cannot import `lucide-react`, so string icon names are resolved here. Create `src/components/icons.js`:

```js
import {
  BadgeCheck, Building2, FileText, GraduationCap,
  HeartHandshake, School, UserRound, WalletCards,
} from 'lucide-react';

export const ICONS = {
  'badge-check': BadgeCheck,
  'building-2': Building2,
  'file-text': FileText,
  'graduation-cap': GraduationCap,
  'heart-handshake': HeartHandshake,
  school: School,
  'user-round': UserRound,
  'wallet-cards': WalletCards,
};

export function iconFor(name) {
  return ICONS[name] || FileText;
}
```

- [ ] **Step 2: Write the failing test**

Create `test/domain/icons.test.js` — verifies every icon name used in the catalog has a mapping, so a typo cannot ship a blank icon:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from '../../src/domain/catalog/index.js';

const MAPPED = new Set([
  'badge-check', 'building-2', 'file-text', 'graduation-cap',
  'heart-handshake', 'school', 'user-round', 'wallet-cards',
]);

test('every catalog icon name has a mapping', () => {
  for (const entry of CATALOG) {
    assert.ok(MAPPED.has(entry.icon), `unmapped programme icon: ${entry.icon}`);
    for (const step of entry.journey.steps) {
      assert.ok(MAPPED.has(step.icon), `unmapped step icon: ${step.icon}`);
    }
  }
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL if any catalog icon name is missing from the set. If it passes immediately, the catalog and map already agree — proceed.

- [ ] **Step 4: Replace the data constants in App.jsx**

Delete lines 48-181 (`PROGRAMS`, `INCOME_OPTIONS`, `PROGRAM_REQUIREMENTS`) and lines 432-484 (`getBpmsRequirements`). Add these imports below the existing `lucide-react` import:

```js
import { CATALOG, getEntry } from './domain/catalog/index.js';
import { resolveJourney, journeyProgress } from './domain/journey.js';
import { iconFor } from './components/icons.js';

const PROGRAMS = CATALOG;
```

Keep the local `PROGRAMS` alias so `HomeScreen` and `OpportunitiesScreen` need no edits.

- [ ] **Step 5: Update ProgramCard to resolve its icon by name**

In `ProgramCard`, replace `const Icon = program.icon;` with:

```js
const Icon = iconFor(program.icon);
```

Do the same in `RequirementsScreen` — replace `const ProgramIcon = program.icon;` with `const ProgramIcon = iconFor(program.icon);`.

`ProgramCard` also reads `program.timing` and `program.count`, which no longer exist. Replace the `program-footer` block with:

```jsx
<div className="program-footer">
  <span>{program.window.note}</span>
  <a href={program.source} target="_blank" rel="noreferrer">{program.sourceLabel}<ExternalLink /></a>
</div>
```

And in the `program-meta` span, replace `{program.count}` with `{program.journey.steps.length} steps`. Replace `{program.match}` with `Possible match`.

- [ ] **Step 6: Rewire RequirementsScreen onto resolveJourney**

Replace the requirement-building block (previously lines 499-513) with:

```js
const program = getEntry(state.selectedProgram) || CATALOG[0];
const processing = state.birthRequest === 'paid' && !state.complete.includes('bpms-birth')
  ? ['bpms-birth'] : [];
const requirements = resolveJourney({
  steps: program.journey.steps,
  completed: state.complete,
  processing,
});
const progress = journeyProgress(requirements);
const completedCount = progress.done;
const coreRequirements = requirements.filter((item) => item.status !== 'conditional');
const next = requirements.find((item) => item.status === 'available');
const ProgramIcon = iconFor(program.icon);
```

Then update the three usages that referenced the old shape:
- `progress` was a number; it is now an object — change `<ProgressBar value={progress} ...>` to `<ProgressBar value={progress.percent} ...>`.
- The step icon: inside the `requirements.map`, change `const Icon = requirement.icon;` to `const Icon = iconFor(requirement.icon);`.
- The income branch picker previously read `INCOME_OPTIONS`; change its `.map` source to `requirement.options` and its condition from `requirement.method === 'income'` to `requirement.method === 'choice'`.

- [ ] **Step 7: Update the remaining INCOME_OPTIONS reference in DocumentScreen**

`INCOME_OPTIONS` was deleted in Step 4, so the one surviving reference — in `DocumentScreen` — must be rewired to read options off the step itself. Replace:

```js
const isIncome = requirement.method === 'income';
```

with:

```js
const isIncome = requirement.method === 'choice';
```

and replace the `INCOME_OPTIONS.find((item) => item.id === state.selectedIncome)?.title` expression with:

```js
requirement.options?.find((item) => item.id === state.selectedIncome)?.title
```

- [ ] **Step 8: Update the App-level requirements memo**

Replace the `useMemo` in `App` with:

```js
const requirements = useMemo(() => {
  const program = getEntry(state.selectedProgram) || CATALOG[0];
  return resolveJourney({ steps: program.journey.steps, completed: state.complete });
}, [state]);
```

- [ ] **Step 9: Verify the build and the tests**

Run: `npm test`
Expected: PASS — 91 tests total

Run: `npm run build`
Expected: build succeeds with no unresolved-import warnings

- [ ] **Step 10: Verify the app by hand**

Run: `npm run dev`, then check each of these:
- Home lists three programmes with correct icons and agencies.
- Opening the Merit Scholarship shows five steps; only "PSA birth certificate" is `Ready to start`, the rest `Locked`.
- Completing the birth step unlocks SF9, then admission, then income.
- The income step shows a four-option dropdown.
- The progress bar advances as steps complete.
- Reset from the Profile screen returns everything to the initial state.

- [ ] **Step 11: Commit**

```bash
git add src/App.jsx src/components/icons.js test/domain/icons.test.js
git commit -m "refactor: drive the journey UI from the catalog and resolver"
```

---

## Verification

After Task 12, confirm the whole phase:

```bash
npm test          # 91 tests pass
npm run build     # succeeds
```

Then confirm the domain layer really is pure — this must print nothing:

```bash
grep -rE "from 'react|lucide-react|localStorage|Date\.now" src/domain/
```

And confirm the server layer never reaches into the client:

```bash
grep -rE "from '\.\./\.\./src" api/
```

## What Phase 1 deliberately leaves undone

- The matcher exists and is tested but is not yet rendered anywhere. The discovery screen is Phase 2.
- Only the education domain is populated. The other five are Phase 2.
- `withCapability` is tested but no service adapter uses it yet. Wiring eGovPay and eGov AI onto it is Phase 3.
- `getCachedToken` is unused until SSO and eGov AI land in Phase 3.
