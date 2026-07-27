# eGovPH Back-End Architecture

> **Version:** 1.0  
> **Last updated:** 22 July 2026  
> **Runtime:** Vercel Serverless Functions (Node.js 18+)  
> **Pattern:** API proxy — all external service calls are server-side only  

---

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                        VERCEL DEPLOYMENT                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  /dist (Static)           /api (Serverless Functions)              │
│  ┌──────────────┐        ┌──────────────────────────────┐         │
│  │ React SPA    │  HTTP  │  Node.js handlers            │         │
│  │ index.html   │───────>│  Process.env has secrets      │         │
│  │ assets/*     │<───────│  12s timeout per function     │         │
│  └──────────────┘  JSON  └──────────────┬───────────────┘         │
│                                          │                         │
└──────────────────────────────────────────┼─────────────────────────┘
                                           │ HTTPS
                            ┌──────────────▼───────────────┐
                            │  External eGovPH Services     │
                            │  • SSO   • eVerify  • eGovPay │
                            │  • AI    • eMessage • eReport │
                            │  • Face Liveness  • COMPASS   │
                            └──────────────────────────────┘
```

**Key design decisions:**
- No Express server — each file in `/api` is an independent serverless function
- No database — prototype uses stateless request/response patterns
- No session storage — auth state is token-based (SSO) or client-side (demo)
- No persistent file storage — all data is transient

---

## 2. Directory Structure

```
api/
├── _lib/                          → Shared server utilities (NOT exposed as endpoints)
│   ├── config.js                  → Environment validation & loading
│   ├── validate.js                → Input validation helpers
│   ├── errors.js                  → Standardized error handling
│   ├── http.js                    → Fetch wrapper with timeout & error parsing
│   ├── egov-sso.js                → eGov SSO integration logic
│   ├── everify.js                 → National ID verification logic
│   ├── emessage.js                → Messaging service logic
│   ├── egovpay.js                 → Payment gateway logic (existing)
│   ├── egov-ai.js                 → AI assistant logic
│   ├── ereport.js                 → Citizen reporting logic
│   ├── face-liveness.js           → Biometric verification logic
│   └── compass.js                 → DBM budget data logic
│
├── auth/                          → Authentication endpoints
│   ├── login.js                   → POST /api/auth/login
│   ├── callback.js                → GET  /api/auth/callback
│   └── verify.js                  → GET  /api/auth/verify
│
├── egovpay/                       → Payment endpoints (existing)
│   ├── create.js                  → POST /api/egovpay/create
│   ├── status.js                  → GET  /api/egovpay/status
│   └── callback.js                → POST /api/egovpay/callback
│
├── everify/                       → Identity verification
│   └── verify.js                  → POST /api/everify/verify
│
├── emessage/                      → Notification sending
│   └── send.js                    → POST /api/emessage/send
│
├── egov-ai/                       → AI assistant
│   └── chat.js                    → POST /api/egov-ai/chat
│
├── ereport/                       → Incident reporting
│   └── submit.js                  → POST /api/ereport/submit
│
├── face-liveness/                 → Biometric checks
│   └── check.js                   → POST /api/face-liveness/check
│
├── compass/                       → Budget transparency
│   └── query.js                   → GET  /api/compass/query
│
└── health.js                      → GET  /api/health (deployment check)
```

**Convention:** Files prefixed with `_` (like `_lib/`) are not deployed as endpoints by Vercel.

---

## 3. Shared Utilities (`api/_lib/`)

### 3.1 Configuration Loader

```javascript
// api/_lib/config.js
export function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getBaseUrl(key) {
  return requireEnv(key).replace(/\/$/, ''); // Strip trailing slash
}

export function loadServiceConfig(prefix) {
  return {
    baseUrl: getBaseUrl(`${prefix}_API_BASE_URL`),
    // Additional keys loaded per-service
  };
}
```

### 3.2 Input Validation

```javascript
// api/_lib/validate.js
export function validateUUID(value, fieldName = 'id') {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(value || '')) {
    const error = new Error(`Invalid ${fieldName}: must be a valid UUID.`);
    error.status = 400;
    throw error;
  }
  return value;
}

export function validateRequired(body, fields) {
  const missing = fields.filter(f => !body?.[f]);
  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(', ')}`);
    error.status = 400;
    throw error;
  }
  return body;
}

export function validateMethod(req, allowed) {
  if (!allowed.includes(req.method)) {
    const error = new Error('Method not allowed.');
    error.status = 405;
    error.headers = { Allow: allowed.join(', ') };
    throw error;
  }
}

export function sanitizeString(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}
```

### 3.3 Standardized Error Handling

```javascript
// api/_lib/errors.js
export class ApiError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function handleError(res, error) {
  const status = Number.isInteger(error?.status) && error.status >= 400 && error.status < 600
    ? error.status
    : 500;

  // Never expose internal error details to clients
  const message = status < 500
    ? error.message
    : 'An internal error occurred. Please try again.';

  if (error.headers) {
    Object.entries(error.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json({
    error: message,
    ...(error.details && status < 500 && { details: error.details }),
  });
}
```

### 3.4 HTTP Client Wrapper

```javascript
// api/_lib/http.js
export async function fetchJSON(url, options = {}) {
  const { timeout = 12_000, ...fetchOptions } = options;

  const response = await fetch(url, {
    ...fetchOptions,
    signal: AbortSignal.timeout(timeout),
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || 'Empty response' };
  }

  if (!response.ok) {
    const error = new Error(data?.message || data?.error || `Upstream HTTP ${response.status}`);
    error.status = response.status;
    error.details = data?.errors;
    throw error;
  }

  return data;
}
```

---

## 4. Endpoint Handler Pattern

Every endpoint follows this consistent pattern:

```javascript
// api/<service>/<action>.js
import { validateMethod, validateRequired } from '../_lib/validate.js';
import { handleError } from '../_lib/errors.js';
import { doServiceAction } from '../_lib/<service>.js';

export default async function handler(req, res) {
  try {
    // 1. Validate HTTP method
    validateMethod(req, ['POST']);

    // 2. Parse and validate input
    const body = req.body;
    validateRequired(body, ['field1', 'field2']);

    // 3. Execute business logic (calls external API via _lib)
    const result = await doServiceAction({ env: process.env, ...body });

    // 4. Return success response
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ data: result });

  } catch (error) {
    // 5. Standardized error response
    return handleError(res, error);
  }
}
```

---

## 5. Route Map

| Method | Endpoint | Handler | Auth Required | Purpose |
|--------|----------|---------|---------------|---------|
| POST | `/api/auth/login` | `auth/login.js` | No | Initiate SSO login flow |
| GET | `/api/auth/callback` | `auth/callback.js` | No | SSO redirect callback |
| GET | `/api/auth/verify` | `auth/verify.js` | Token | Verify current session |
| POST | `/api/egovpay/create` | `egovpay/create.js` | No* | Create demo payment |
| GET | `/api/egovpay/status` | `egovpay/status.js` | No* | Check payment status |
| POST | `/api/egovpay/callback` | `egovpay/callback.js` | Webhook | Payment webhook |
| POST | `/api/everify/verify` | `everify/verify.js` | Session | Verify national ID |
| POST | `/api/emessage/send` | `emessage/send.js` | Session | Send notification |
| POST | `/api/egov-ai/chat` | `egov-ai/chat.js` | No* | AI assistant query |
| POST | `/api/ereport/submit` | `ereport/submit.js` | Session | Submit incident report |
| POST | `/api/face-liveness/check` | `face-liveness/check.js` | Session | Biometric check |
| GET | `/api/compass/query` | `compass/query.js` | No* | Budget data query |
| GET | `/api/health` | `health.js` | No | Deployment health check |

> *No\** = Open in prototype; should require auth in production.

---

## 6. Middleware Patterns

Vercel Functions don't have traditional middleware, but we can compose behaviors using wrapper functions:

### 6.1 Method Guard

```javascript
// Applied at the start of every handler
import { validateMethod } from '../_lib/validate.js';

// Inside handler:
validateMethod(req, ['POST']); // Throws 405 if method doesn't match
```

### 6.2 Auth Guard (for protected routes)

```javascript
// api/_lib/auth-guard.js
import { ApiError } from './errors.js';

export function requireAuth(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new ApiError(401, 'Authentication required.');
  }
  // In prototype: simple token presence check
  // In production: verify JWT signature with SSO public key
  return { token, authenticated: true };
}
```

### 6.3 Rate Limit Guard (simple per-IP)

```javascript
// api/_lib/rate-limit.js
const requests = new Map(); // In-memory (resets on cold start)
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

export function checkRateLimit(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const now = Date.now();
  const entry = requests.get(ip) || { count: 0, start: now };

  if (now - entry.start > WINDOW_MS) {
    entry.count = 0;
    entry.start = now;
  }

  entry.count++;
  requests.set(ip, entry);

  if (entry.count > MAX_REQUESTS) {
    throw new ApiError(429, 'Too many requests. Please try again later.');
  }
}
```

> **Note:** In-memory rate limiting resets on cold starts. For production, use Vercel KV or an external store.

### 6.4 Input Sanitization Guard

```javascript
// api/_lib/sanitize.js
export function sanitizeBody(body, schema) {
  const sanitized = {};
  for (const [key, rules] of Object.entries(schema)) {
    let value = body?.[key];
    if (rules.type === 'string') {
      value = typeof value === 'string' ? value.trim().slice(0, rules.maxLength || 1000) : '';
    }
    if (rules.type === 'number') {
      value = Number(value);
      if (isNaN(value)) value = 0;
    }
    if (rules.required && !value) {
      throw new ApiError(400, `Field '${key}' is required.`);
    }
    sanitized[key] = value;
  }
  return sanitized;
}
```

---

## 7. Request/Response Lifecycle

```
Incoming Request
      │
      ▼
┌─────────────────┐
│ Method Check     │── 405 Method Not Allowed
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Auth Guard       │── 401 Unauthorized (if protected route)
│ (if required)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Rate Limit       │── 429 Too Many Requests
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Input Validation │── 400 Bad Request (missing/invalid fields)
│ & Sanitization   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Business Logic   │── Calls _lib service module
│ (External API)   │── Timeout: 12s (20s for Face, 30s for AI)
└────────┬────────┘
         │
         ├── Success ──> 200/201 JSON response
         │
         └── Failure ──> handleError() → sanitized error JSON
```

---

## 8. Security Middleware Stack

Applied in order for every request:

| Order | Check | Action on Failure |
|-------|-------|-------------------|
| 1 | HTTP method allowlist | 405 + Allow header |
| 2 | Content-Type validation (POST) | 400 "Invalid content type" |
| 3 | Auth token presence (protected) | 401 "Authentication required" |
| 4 | Rate limit (per IP) | 429 "Too many requests" |
| 5 | Input size limit | 413 "Payload too large" |
| 6 | Input validation & sanitization | 400 with field-level errors |
| 7 | Credential format check | 500 "Configuration error" (logged) |
| 8 | Upstream timeout | 504 "Service temporarily unavailable" |

---

## 9. Webhook Handling (eGovPay Callback)

```javascript
// api/egovpay/callback.js
import { createHmac } from 'node:crypto';
import { handleError, ApiError } from '../_lib/errors.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      throw new ApiError(405, 'Method not allowed.');
    }

    // Verify webhook signature if secret is configured
    const secret = process.env.EGOVPAY_WEBHOOK_SECRET;
    if (secret) {
      const signature = req.headers['x-webhook-signature'];
      const expected = createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expected) {
        throw new ApiError(403, 'Invalid webhook signature.');
      }
    }

    // Acknowledge receipt — NEVER trust as sole proof of payment
    // The front-end must always verify via GET /api/egovpay/status
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ received: true });

  } catch (error) {
    return handleError(res, error);
  }
}
```

---

## 10. Health Check Endpoint

```javascript
// api/health.js
export default function handler(req, res) {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.VITE_APP_ENV || 'unknown',
    services: {
      egovpay: !!process.env.EGOVPAY_API_KEY,
      everify: !!process.env.EVERIFY_CLIENT_ID,
      emessage: !!process.env.EMESSAGE_ACCESS_TOKEN,
      egov_ai: !!process.env.EGOV_AI_ACCESS_CODE,
      ereport: !!process.env.EREPORT_ACCESS_TOKEN,
      face_liveness: !!process.env.FACE_LIVENESS_API_KEY,
      compass: !!process.env.COMPASS_API_KEY,
      sso: !!process.env.EGOV_SSO_PARTNER_SECRET,
    },
  });
}
```

> **Note:** Health check reports boolean key presence, never actual values.

---

## 11. Vercel Deployment Configuration

```json
// vercel.json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/**/*.js": {
      "runtime": "@vercel/node@3",
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

---

## 12. Local Development

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally (serves both SPA + API functions)
vercel dev

# Or use Vite + separate API testing
npm run dev          # Vite dev server (front-end)
# API functions tested via curl/Postman against vercel dev
```

**Environment loading:** Vercel CLI automatically reads `.env.local` for serverless functions during local development.

---

*End of Back-End Architecture document.*
