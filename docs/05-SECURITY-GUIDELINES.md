# eGovPH Security Guidelines

> **Version:** 1.0  
> **Last updated:** 22 July 2026  
> **Compliance context:** Philippine Data Privacy Act (RA 10173), eGov Hackathon rules  
> **Classification:** Internal — do not distribute outside the project team  

---

## 1. Security Principles

| Principle | Application |
|-----------|-------------|
| **Defense in depth** | Multiple layers: client validation, server validation, API-level checks |
| **Least privilege** | Each service key has minimum necessary permissions |
| **Fail closed** | On error, deny access rather than grant |
| **Zero trust** | Never trust client input, callback data, or referrer headers |
| **Separation of concerns** | Secrets on server only; UI handles presentation only |
| **Data minimization** | Collect nothing unnecessary; discard immediately after use |

---

## 2. Threat Model

### 2.1 Identified Threats

| Threat | Vector | Severity | Mitigation |
|--------|--------|----------|------------|
| API key exposure | Client-side bundle, git history | Critical | Server-only env vars; `.gitignore` |
| Credential theft | `.env.local` committed to repo | Critical | Git hooks; pre-commit check |
| XSS (Cross-Site Scripting) | User input rendered as HTML | High | React auto-escaping; no `dangerouslySetInnerHTML` |
| CSRF (Cross-Site Request Forgery) | Forged requests from other origins | Medium | SameSite cookies; origin validation |
| Injection attacks | Malformed input to external APIs | High | Input sanitization; parameterized requests |
| Payment tampering | Modified amounts/txnids | Critical | Server-side HMAC digest; amount hardcoded |
| Webhook spoofing | Fake payment confirmations | High | Signature verification; never trust as sole proof |
| Unauthorized access | Missing auth on protected routes | Medium | Auth guard middleware |
| DoS / Rate abuse | Excessive requests | Medium | Rate limiting per IP |
| PII leakage | Logging/storing citizen data | Critical | No PII storage; sanitized logs |
| Dependency vulnerabilities | Outdated npm packages | Medium | Regular audits; minimal dependencies |

### 2.2 Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│ UNTRUSTED ZONE                                                  │
│                                                                 │
│  Browser ──── Network ──── Third-party CDN                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ TRUST BOUNDARY (Vercel Edge)                                    │
├─────────────────────────────────────────────────────────────────┤
│ TRUSTED ZONE                                                    │
│                                                                 │
│  Vercel Functions ──── process.env ──── External eGov APIs      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Everything from the browser is untrusted. All validation happens server-side.

---

## 3. Credential Security

### 3.1 Storage Rules

| Rule | Implementation |
|------|---------------|
| Secrets in environment only | `process.env.EGOVPAY_API_KEY` — never hardcoded |
| Git-ignored credentials | `.env.local` in `.gitignore` |
| No secrets in VITE_ vars | `VITE_*` is bundled into client JS |
| Rotate on exposure | If a key leaks, revoke and regenerate immediately |
| Separate per environment | Dev/staging/prod use different keys |

### 3.2 Key Format Enforcement

```javascript
// api/_lib/config.js — Runtime safety checks
export function validateCredentials() {
  const egovpayKey = process.env.EGOVPAY_API_KEY;
  if (egovpayKey && !egovpayKey.startsWith('test_')) {
    throw new Error('FATAL: Live eGovPay key detected. Only test_ keys allowed in prototype.');
  }

  const compassKey = process.env.COMPASS_API_KEY;
  if (compassKey && !compassKey.startsWith('dbm_live_')) {
    console.warn('COMPASS key does not match expected prefix.');
  }
}
```

### 3.3 Pre-commit Hook (Recommended)

```bash
#!/bin/sh
# .git/hooks/pre-commit — Block commits containing secrets

# Check for common secret patterns
if git diff --cached --name-only | xargs grep -l -E "(PARTNER_SECRET|CLIENT_SECRET|API_KEY|ACCESS_TOKEN|ACCESS_CODE)=.{8,}" 2>/dev/null | grep -v ".env.example"; then
  echo "ERROR: Possible secret detected in staged files!"
  echo "Remove credentials before committing."
  exit 1
fi
```

---

## 4. Input Validation & Sanitization

### 4.1 Validation Rules by Field Type

| Field Type | Validation | Max Length | Example |
|------------|-----------|------------|---------|
| UUID | Regex: `/^[0-9a-f]{8}-...-[0-9a-f]{12}$/i` | 36 | Transaction IDs |
| Phone | Regex: `/^\+63[0-9]{10}$/` | 13 | eMessage recipient |
| Email | Basic format check | 254 | Account preferences |
| Free text | Strip HTML tags; trim whitespace | 500 | Report description |
| Base64 image | Validate prefix; check size | 5MB | Face liveness |
| Currency amount | Positive integer/float | — | Payment amount |
| Enum/category | Allowlist check | — | Report category |

### 4.2 Server-Side Validation Pattern

```javascript
// Every handler MUST validate before processing
export default async function handler(req, res) {
  try {
    validateMethod(req, ['POST']);

    const { recipient, message, channel } = req.body || {};

    // Type checks
    if (typeof recipient !== 'string' || typeof message !== 'string') {
      throw new ApiError(400, 'Invalid input types.');
    }

    // Format validation
    if (!/^\+63[0-9]{10}$/.test(recipient)) {
      throw new ApiError(400, 'Invalid phone number format.');
    }

    // Length limits
    if (message.length > 500) {
      throw new ApiError(400, 'Message exceeds maximum length (500 chars).');
    }

    // Allowlist for enums
    if (!['sms', 'push', 'email'].includes(channel)) {
      throw new ApiError(400, 'Invalid channel. Must be: sms, push, or email.');
    }

    // Safe to proceed...
  } catch (error) {
    return handleError(res, error);
  }
}
```

### 4.3 Client-Side Validation (Defense in Depth)

Client validation is for UX only — never a security boundary:

```javascript
// src/utils/validators.js
export function isValidPhone(value) {
  return /^\+63[0-9]{10}$/.test(value);
}

export function isValidUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function sanitizeText(value, maxLength = 500) {
  return String(value || '').replace(/<[^>]*>/g, '').trim().slice(0, maxLength);
}
```

---

## 5. Authentication & Authorization

### 5.1 SSO Token Flow

```
1. User clicks "Login" → Front-end calls POST /api/auth/login
2. Server initiates SSO with eGov (HMAC-signed request)
3. Server returns auth_url → Front-end redirects to eGov SSO
4. User authenticates on eGov SSO
5. eGov SSO redirects to /api/auth/callback with auth code
6. Server exchanges code for token, sets secure cookie
7. Subsequent requests include cookie → server validates
```

### 5.2 Token Security

| Property | Value | Reason |
|----------|-------|--------|
| Storage | `httpOnly` cookie | Prevents XSS token theft |
| Secure flag | `true` | HTTPS only |
| SameSite | `Lax` | CSRF protection |
| Max-Age | 3600 (1 hour) | Limit exposure window |
| Path | `/api/` | Only sent to server endpoints |

### 5.3 Auth Guard Implementation

```javascript
// api/_lib/auth-guard.js
import { ApiError } from './errors.js';

export function requireAuth(req) {
  // Option A: Cookie-based (production)
  const token = req.cookies?.egov_session;

  // Option B: Header-based (prototype/testing)
  const headerToken = req.headers.authorization?.replace('Bearer ', '');

  const activeToken = token || headerToken;

  if (!activeToken) {
    throw new ApiError(401, 'Authentication required. Please log in.');
  }

  // Prototype: simple presence check
  // Production: verify JWT signature, check expiry, validate claims
  return { authenticated: true, token: activeToken };
}
```

### 5.4 Route Protection Matrix

| Endpoint | Auth Required | Reason |
|----------|--------------|--------|
| `/api/auth/login` | No | Initiates login |
| `/api/auth/callback` | No | Receives SSO redirect |
| `/api/auth/verify` | Yes | Checks session validity |
| `/api/egovpay/create` | Recommended | Prevents unauthorized payments |
| `/api/everify/verify` | Yes | Sensitive identity data |
| `/api/emessage/send` | Yes | Prevents spam abuse |
| `/api/egov-ai/chat` | No* | AI assistant is publicly accessible |
| `/api/ereport/submit` | Yes | Ties report to citizen identity |
| `/api/face-liveness/check` | Yes | Biometric data must be protected |
| `/api/compass/query` | No | Public budget data |
| `/api/health` | No | Infrastructure check |

---

## 6. Payment Security (eGovPay)

### 6.1 Integrity Checks

| Check | Implementation | Purpose |
|-------|---------------|---------|
| HMAC digest | `sha256(amount\|txnid)` with API key | Tamper-proof transaction creation |
| Test mode enforcement | Reject keys not starting with `test_` | Prevent accidental live charges |
| UUID validation | Regex before any upstream call | Prevent injection |
| Amount hardcoding | Server defines amount, not client | Prevent price manipulation |
| Status verification | Always check `/status` endpoint | Never trust redirect params alone |
| Callback acknowledgment only | Return 200 but don't change state | Prevent replay attacks |

### 6.2 Payment Flow Security Rules

```
NEVER:
✗ Trust redirect URL parameters as proof of payment
✗ Allow client to set payment amount
✗ Store credit card or payment method details
✗ Use live API keys in the prototype
✗ Log full transaction details including names

ALWAYS:
✓ Compute HMAC server-side
✓ Verify transaction status via API before confirming
✓ Use unique transaction IDs (randomized)
✓ Set Cache-Control: no-store on all payment responses
✓ Validate UUID format before upstream calls
```

---

## 7. Data Protection & Privacy

### 7.1 Data Classification

| Classification | Examples | Handling |
|----------------|----------|----------|
| **Prohibited** | Real PhilSys numbers, actual SSNs | Never collect, store, or process |
| **Sensitive** | Face images, biometric data | Process in-memory; discard immediately |
| **Internal** | API keys, partner secrets | Server-side only; never log |
| **Demo** | Mock names, fake IDs | Clearly labeled as simulated |
| **Public** | Budget data, service descriptions | Can be cached and displayed |

### 7.2 Data Handling Rules

1. **No persistent PII storage** — The prototype does not write citizen data to any database or file.
2. **Face images are transient** — Processed in the API call and never stored server-side.
3. **History is client-side only** — Stored in `localStorage` as non-sensitive activity labels.
4. **Logs are sanitized** — Never log request bodies containing names, IDs, or biometric data.
5. **Demo data is clearly fake** — Use obviously fictional names like "Mika Reyes — Demo Profile".

---

## 8. Transport Security

### 8.1 HTTPS Enforcement

- All deployed URLs use HTTPS (enforced by Vercel)
- No mixed content (HTTP resources on HTTPS pages)
- HSTS is managed at the Vercel platform level

### 8.2 Security Headers

Applied via `vercel.json` to all `/api/*` responses:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-XSS-Protection", "value": "0" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### 8.3 Content Security Policy (CSP)

Recommended CSP for the HTML page:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' /api/;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
">
```

---

## 9. Dependency Security

### 9.1 Audit Schedule

```bash
# Run weekly or before every release
npm audit

# Fix automatically where possible
npm audit fix

# Check for known vulnerabilities
npx is-my-node-vulnerable
```

### 9.2 Dependency Rules

| Rule | Reason |
|------|--------|
| Minimal dependencies | Smaller attack surface |
| Pin exact versions | Prevent supply chain attacks via semver ranges |
| No unnecessary runtime deps | Only `react`, `react-dom`, and essential utilities |
| Audit before merge | Any new dependency requires security review |
| No pre/post install scripts from untrusted packages | Prevent malicious lifecycle hooks |

### 9.3 Lock File Integrity

```bash
# Verify package-lock.json hasn't been tampered with
npm ci  # Clean install from lock file (fails on mismatch)
```

---

## 10. Error Handling Security

### 10.1 Error Information Leakage Prevention

```javascript
// BAD — leaks internal details
res.status(500).json({
  error: error.message,           // May contain file paths, SQL, stack
  stack: error.stack,             // Full stack trace
  config: { apiKey: '...' },     // Credentials!
});

// GOOD — sanitized error response
res.status(500).json({
  error: 'An internal error occurred. Please try again.',
  // No stack, no config, no upstream details
});
```

### 10.2 Status Code Rules

| Code | When | Client sees |
|------|------|-------------|
| 400 | Client sent invalid input | Specific validation error message |
| 401 | Missing/invalid auth token | "Authentication required." |
| 403 | Valid auth but insufficient permission | "Access denied." |
| 404 | Resource not found | "Not found." |
| 405 | Wrong HTTP method | "Method not allowed." + Allow header |
| 429 | Rate limit exceeded | "Too many requests." |
| 500 | Server/upstream error | "An internal error occurred." (generic) |
| 504 | Upstream timeout | "Service temporarily unavailable." |

---

## 11. Security Checklist

### Before Every Deployment

- [ ] `npm audit` shows no critical/high vulnerabilities
- [ ] No secrets in any `VITE_*` environment variable
- [ ] `.env.local` is in `.gitignore` and not tracked
- [ ] `git log --all -p -- .env.local` returns nothing
- [ ] eGovPay key starts with `test_`
- [ ] No `console.log` statements printing sensitive data
- [ ] All POST handlers validate Content-Type
- [ ] All handlers validate HTTP method
- [ ] No `eval()`, `Function()`, or `innerHTML` with user data
- [ ] Error responses don't expose internal details
- [ ] Face images are not persisted anywhere
- [ ] Demo disclaimer is visible on the deployed app

### Before Code Review

- [ ] Input validation on all user-supplied data
- [ ] Output encoding (React handles this by default)
- [ ] No hardcoded credentials
- [ ] Rate limiting on abuse-prone endpoints
- [ ] Auth guard on sensitive endpoints
- [ ] UUID format validated before upstream calls
- [ ] Timeouts set on all external fetch calls
- [ ] Error handling wraps all async operations

---

## 12. Incident Response

If a security issue is discovered:

1. **Contain** — Revoke exposed credentials immediately via eGov partner dashboard
2. **Assess** — Determine scope: which keys, what access, what data
3. **Remediate** — Rotate all potentially compromised secrets
4. **Verify** — Confirm new credentials work; old ones are rejected
5. **Document** — Log the incident, root cause, and prevention steps
6. **Notify** — Inform hackathon organizers if real eGov systems were affected

**Emergency contacts:**
- eGov hackathon support team
- Vercel support (for deployment issues)
- Team security lead

---

*End of Security Guidelines document.*
