# eGovPH API Integration Guide

> **Version:** 1.0  
> **Last updated:** 22 July 2026  
> **Architecture:** All API calls are proxied through Vercel serverless functions. The React front-end never contacts external services directly.

---

## 1. Integration Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│  React SPA      │  fetch  │  Vercel Function  │  fetch  │  eGovPH Service     │
│  (Browser)      │────────>│  /api/*           │────────>│  (External API)     │
│                 │<────────│                   │<────────│                     │
│  No secrets     │  JSON   │  Has secrets      │  JSON   │  Requires auth      │
└─────────────────┘         └──────────────────┘         └─────────────────────┘
```

**Key principle:** The browser only knows about `/api/*` routes. Credentials live exclusively in Vercel environment variables and are read by serverless functions at runtime.

---

## 2. Environment Variables Reference

| Variable | Service | Required | Notes |
|----------|---------|----------|-------|
| `EGOV_SSO_API_BASE_URL` | eGov SSO | Yes | Base endpoint for SSO |
| `EGOV_SSO_PARTNER_CODE` | eGov SSO | Yes | Issued partner code |
| `EGOV_SSO_PARTNER_SECRET` | eGov SSO | Yes | HMAC signing secret |
| `EVERIFY_API_BASE_URL` | eVerify | Yes | National ID verification endpoint |
| `EVERIFY_CLIENT_ID` | eVerify | Yes | OAuth2 client identifier |
| `EVERIFY_CLIENT_SECRET` | eVerify | Yes | OAuth2 client secret |
| `EVERIFY_PUBLIC_KEY` | eVerify | Yes | Encrypted public key for payload signing |
| `EMESSAGE_API_BASE_URL` | eMessage | Yes | Messaging service endpoint |
| `EMESSAGE_ACCESS_TOKEN` | eMessage | Yes | Bearer token for API access |
| `EGOV_AI_API_BASE_URL` | eGov AI | Yes | `https://egov-ai-core-ws.oueg.info` |
| `EGOV_AI_ACCESS_CODE` | eGov AI | Yes | Access code sent as header |
| `EGOVPAY_API_BASE_URL` | eGovPay | Yes | `https://egovpay-pg1-ws-dev.oueg.info` |
| `EGOVPAY_API_KEY` | eGovPay | Yes | Must start with `test_` in prototype |
| `EGOVPAY_SETTLEMENT_TEMPLATE_UUID` | eGovPay | Yes | Template for payment settlement |
| `EGOVPAY_WEBHOOK_SECRET` | eGovPay | Optional | For callback signature verification |
| `EGOVPAY_APP_URL` | eGovPay | Optional | Override for redirect URLs |
| `EREPORT_API_BASE_URL` | eReport | Yes | Incident reporting endpoint |
| `EREPORT_ACCESS_TOKEN` | eReport | Yes | Bearer token for API access |
| `FACE_LIVENESS_API_BASE_URL` | Face Liveness | Yes | Biometric verification endpoint |
| `FACE_LIVENESS_API_KEY` | Face Liveness | Yes | API key sent as header |
| `COMPASS_API_BASE_URL` | DBM COMPASS | Yes | Budget transparency data |
| `COMPASS_API_KEY` | DBM COMPASS | Yes | API key with `dbm_live_` prefix |

---

## 3. Service Integrations

---

### 3.1 eGovPH SSO (Single Sign-On)

**Purpose:** Authenticate citizens using their eGovPH account.

**Auth flow:** OAuth2-like partner authentication with HMAC-signed requests.

**Environment variables:**
```env
EGOV_SSO_API_BASE_URL=https://sso-api.egov.ph
EGOV_SSO_PARTNER_CODE=HACKATHON_SSO
EGOV_SSO_PARTNER_SECRET=<your-partner-secret>
```

**Authentication pattern:**
```javascript
// api/_lib/egov-sso.js
import { createHmac } from 'node:crypto';

export function createSSOSignature(partnerCode, secret, timestamp) {
  return createHmac('sha256', secret)
    .update(`${partnerCode}|${timestamp}`)
    .digest('hex');
}

export async function initiateSSO({ env, redirectUri }) {
  const { EGOV_SSO_API_BASE_URL, EGOV_SSO_PARTNER_CODE, EGOV_SSO_PARTNER_SECRET } = env;
  const timestamp = Date.now().toString();
  const signature = createSSOSignature(EGOV_SSO_PARTNER_CODE, EGOV_SSO_PARTNER_SECRET, timestamp);

  const response = await fetch(`${EGOV_SSO_API_BASE_URL}/api/v1/auth/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Partner-Code': EGOV_SSO_PARTNER_CODE,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
    },
    body: JSON.stringify({ redirect_uri: redirectUri }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) throw new Error(`SSO initiation failed: ${response.status}`);
  return response.json();
}
```

**Endpoint:** `POST /api/auth/login`  
**Front-end usage:**
```javascript
const res = await fetch('/api/auth/login', { method: 'POST' });
const { auth_url } = await res.json();
window.location.href = auth_url; // Redirect to eGov SSO
```

---

### 3.2 eVerify (National ID Verification)

**Purpose:** Verify a citizen's PhilSys (National ID) credentials.

**Auth flow:** OAuth2 client credentials + encrypted payload with public key.

**Environment variables:**
```env
EVERIFY_API_BASE_URL=https://everify-api.egov.ph
EVERIFY_CLIENT_ID=<uuid>
EVERIFY_CLIENT_SECRET=<long-secret>
EVERIFY_PUBLIC_KEY=<base64-encoded-encrypted-key>
```

**Integration pattern:**
```javascript
// api/_lib/everify.js
export async function getAccessToken(env) {
  const response = await fetch(`${env.EVERIFY_API_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: env.EVERIFY_CLIENT_ID,
      client_secret: env.EVERIFY_CLIENT_SECRET,
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`eVerify token failed: ${response.status}`);
  return response.json(); // { access_token, expires_in }
}

export async function verifyIdentity({ env, payload }) {
  const { access_token } = await getAccessToken(env);

  const response = await fetch(`${env.EVERIFY_API_BASE_URL}/api/v1/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,
      'X-Public-Key': env.EVERIFY_PUBLIC_KEY,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`eVerify failed: ${response.status}`);
  return response.json();
}
```

**Endpoint:** `POST /api/everify/verify`  
**Request body (from front-end):**
```json
{
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "birth_date": "1990-01-15",
  "id_number": "XXXX-XXXX-XXXX"
}
```

> **Security note:** In the prototype, use demo/masked data only. Never process real PhilSys numbers.

---

### 3.3 eMessage (Notifications)

**Purpose:** Send SMS/push notifications to citizens for transaction confirmations, OTPs, and service updates.

**Auth flow:** Static bearer access token.

**Environment variables:**
```env
EMESSAGE_API_BASE_URL=https://emessage-api.egov.ph
EMESSAGE_ACCESS_TOKEN=<access-token>
```

**Integration pattern:**
```javascript
// api/_lib/emessage.js
export async function sendMessage({ env, recipient, message, channel = 'sms' }) {
  const response = await fetch(`${env.EMESSAGE_API_BASE_URL}/api/v1/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.EMESSAGE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: recipient,
      message,
      channel, // 'sms' | 'push' | 'email'
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`eMessage send failed: ${response.status}`);
  return response.json();
}
```

**Endpoint:** `POST /api/emessage/send`  
**Request body:**
```json
{
  "recipient": "+639XXXXXXXXX",
  "message": "Your eGov transaction #TXN-123 has been confirmed.",
  "channel": "sms"
}
```

---

### 3.4 eGovPay (Payment Gateway)

**Purpose:** Process government service fee payments.

**Auth flow:** HMAC-SHA256 digest + API key header (`X-eGovPay-Token`).

**Environment variables:**
```env
EGOVPAY_API_BASE_URL=https://egovpay-pg1-ws-dev.oueg.info
EGOVPAY_API_KEY=test_<key>
EGOVPAY_SETTLEMENT_TEMPLATE_UUID=<uuid>
EGOVPAY_WEBHOOK_SECRET=<optional>
EGOVPAY_APP_URL=<optional-override>
```

**Integration pattern (already implemented):**
```javascript
// api/_lib/egovpay.js — Key excerpts
import { createHmac, randomBytes } from 'node:crypto';

// Safety: reject live keys
if (!apiKey.startsWith('test_')) {
  throw new Error('Live eGovPay credentials are disabled for this demo.');
}

// HMAC digest for transaction integrity
const digest = createHmac('sha256', apiKey)
  .update(`${amount}|${txnid}`)
  .digest('hex');

// Create transaction
const response = await fetch(`${baseUrl}/api/v1/transaction`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'X-eGovPay-Token': apiKey,
  },
  body: JSON.stringify({
    items, amount, settlement_template_uuid,
    redirect_url, txnid, callback_url, digest, currency, name
  }),
});
```

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/egovpay/create` | Create a new payment transaction |
| GET | `/api/egovpay/status?uuid=<uuid>` | Check transaction status |
| POST | `/api/egovpay/callback` | Receive payment webhook (acknowledge only) |

**Payment flow:**
```
1. Front-end calls POST /api/egovpay/create
2. Server creates HMAC digest, sends to eGovPay, returns { transaction: { url, uuid } }
3. Front-end redirects user to transaction.url (hosted payment page)
4. User completes payment on eGovPay
5. eGovPay redirects back to redirect_url with txnid
6. Front-end calls GET /api/egovpay/status?uuid=<uuid> to confirm
7. eGovPay also POSTs to /api/egovpay/callback (never trusted as sole proof)
```

---

### 3.5 eReport (Citizen Incident Reporting)

**Purpose:** Submit citizen reports for incidents, complaints, or service requests.

**Auth flow:** Static bearer access token.

**Environment variables:**
```env
EREPORT_API_BASE_URL=https://ereport-api.egov.ph
EREPORT_ACCESS_TOKEN=<access-token>
```

**Integration pattern:**
```javascript
// api/_lib/ereport.js
export async function submitReport({ env, report }) {
  const response = await fetch(`${env.EREPORT_API_BASE_URL}/api/v1/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.EREPORT_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      category: report.category,       // 'infrastructure' | 'safety' | 'health' | 'environment'
      description: report.description,
      location: report.location,       // { lat, lng, address }
      attachments: report.attachments, // Array of base64 images (optional)
      priority: report.priority,       // 'low' | 'medium' | 'high' | 'critical'
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`eReport submission failed: ${response.status}`);
  return response.json(); // { report_id, status, created_at }
}
```

**Endpoint:** `POST /api/ereport/submit`  
**Request body:**
```json
{
  "category": "infrastructure",
  "description": "Pothole on main road near barangay hall",
  "location": { "lat": 14.5995, "lng": 120.9842, "address": "Quezon City" },
  "priority": "medium"
}
```

---

### 3.6 Face Liveness (Biometric Verification)

**Purpose:** Verify that a real person (not a photo/video) is present during identity verification.

**Auth flow:** API key header.

**Environment variables:**
```env
FACE_LIVENESS_API_BASE_URL=https://face-liveness-api.egov.ph
FACE_LIVENESS_API_KEY=<uuid-format-key>
```

**Integration pattern:**
```javascript
// api/_lib/face-liveness.js
export async function checkLiveness({ env, imageData }) {
  const response = await fetch(`${env.FACE_LIVENESS_API_BASE_URL}/api/v1/liveness/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': env.FACE_LIVENESS_API_KEY,
    },
    body: JSON.stringify({
      image: imageData, // base64-encoded face image
      checks: ['blink', 'head_turn', 'depth'],
    }),
    signal: AbortSignal.timeout(20_000), // Longer timeout for ML processing
  });
  if (!response.ok) throw new Error(`Face liveness check failed: ${response.status}`);
  return response.json(); // { is_live, confidence, checks_passed }
}
```

**Endpoint:** `POST /api/face-liveness/check`  
**Request body:**
```json
{
  "image": "<base64-encoded-image>",
  "session_id": "optional-tracking-id"
}
```

> **Privacy note:** Face images must NOT be stored. Process in-memory only and discard immediately after verification.

---

### 3.7 eGov AI (Civic AI Assistant)

**Purpose:** AI-powered conversational assistant for citizen queries about government services.

**Auth flow:** Access code header.

**Environment variables:**
```env
EGOV_AI_API_BASE_URL=https://egov-ai-core-ws.oueg.info
EGOV_AI_ACCESS_CODE=<access-code>
```

**Integration pattern:**
```javascript
// api/_lib/egov-ai.js
export async function chatWithAI({ env, messages, context }) {
  const response = await fetch(`${env.EGOV_AI_API_BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Access-Code': env.EGOV_AI_ACCESS_CODE,
    },
    body: JSON.stringify({
      messages,  // [{ role: 'user' | 'assistant', content: '...' }]
      context,   // Optional context about current service
      stream: false,
    }),
    signal: AbortSignal.timeout(30_000), // AI responses may take longer
  });
  if (!response.ok) throw new Error(`eGov AI failed: ${response.status}`);
  return response.json(); // { reply, sources, confidence }
}
```

**Endpoint:** `POST /api/egov-ai/chat`  
**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "How do I apply for a birth certificate?" }
  ],
  "context": "document_services"
}
```

**Response:**
```json
{
  "reply": "To apply for a birth certificate, visit your local PSA office or use the PSA online portal...",
  "sources": ["psa.gov.ph/civil-registration"],
  "confidence": 0.92
}
```

---

### 3.8 DBM COMPASS (Budget Transparency)

**Purpose:** Access Department of Budget and Management data for transparency features.

**Auth flow:** API key header.

**Environment variables:**
```env
COMPASS_API_BASE_URL=https://compass-api.dbm.gov.ph
COMPASS_API_KEY=dbm_live_<key>
```

**Integration pattern:**
```javascript
// api/_lib/compass.js
export async function queryBudgetData({ env, endpoint, params }) {
  const url = new URL(`${env.COMPASS_API_BASE_URL}/api/v1/${endpoint}`);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': env.COMPASS_API_KEY,
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`COMPASS query failed: ${response.status}`);
  return response.json();
}
```

---

## 4. Error Handling Standard

All API functions must follow this error response format:

```javascript
// Consistent error response structure
function apiError(res, status, message, details = undefined) {
  return res.status(status).json({
    error: message,
    ...(details && { details }),
  });
}

// Usage in handlers
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return apiError(res, 405, 'Method not allowed.');
  }
  try {
    // ... business logic
  } catch (error) {
    const status = error.status || 500;
    const message = status < 500 ? error.message : 'An internal error occurred.';
    return apiError(res, status, message);
  }
}
```

---

## 5. Mock Mode

When `VITE_API_MODE=mock`, the front-end uses local mock data instead of calling `/api/*` endpoints. This enables:

- Development without credentials
- Offline development
- UI testing without external dependencies
- Consistent demo data for presentations

**Mock implementation pattern:**
```javascript
// src/services/api.js
const API_MODE = import.meta.env.VITE_API_MODE;

export async function createPayment() {
  if (API_MODE === 'mock') {
    return mockPaymentResponse();
  }
  return fetch('/api/egovpay/create', { method: 'POST' }).then(r => r.json());
}
```

---

## 6. Rate Limits & Quotas

| Service | Known Limit | Recommendation |
|---------|-------------|----------------|
| eGov SSO | ~100 req/min | Cache tokens client-side for their TTL |
| eVerify | ~30 req/min | Debounce verification requests |
| eMessage | ~60 msg/min | Queue messages; don't retry immediately |
| eGovPay | ~120 req/min | One transaction creation per user action |
| eGov AI | ~20 req/min | Debounce chat; show typing indicator |
| Face Liveness | ~10 req/min | One check per verification session |
| eReport | ~30 req/min | Prevent duplicate submissions |
| COMPASS | ~60 req/min | Cache responses (budget data is semi-static) |

---

## 7. Testing API Integrations

```bash
# Test eGovPay create (local dev)
curl -X POST http://localhost:3000/api/egovpay/create \
  -H "Content-Type: application/json"

# Test eGovPay status
curl "http://localhost:3000/api/egovpay/status?uuid=<transaction-uuid>"

# Test eGov AI chat
curl -X POST http://localhost:3000/api/egov-ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

---

## 8. Adding a New Integration

1. Add environment variables to `.env.example` (empty values)
2. Add actual values to `.env.local` (git-ignored)
3. Create `api/_lib/<service-name>.js` with the integration logic
4. Create `api/<service-name>/<action>.js` as the endpoint handler
5. Add mock response in `src/services/mocks/`
6. Update `src/services/api.js` with mock-mode branching
7. Add to Vercel Environment Variables for deployment
8. Document in this file under Section 3

---

*End of API Integration Guide.*
