# eGovPH Embedded Web Experience — PRD Rules & Guidelines

> **Document version:** 1.0  
> **Status:** Active  
> **Last updated:** 22 July 2026  
> **Platform:** React + Vite SPA deployed on Vercel with serverless API functions  

---

## 1. Purpose

This document defines the **binding rules** that all contributors must follow when building, extending, or modifying the eGovPH Embedded Web Experience. It consolidates the PRD requirements into enforceable, checkable rules organized by concern.

---

## 2. Golden Rules

| # | Rule | Rationale |
|---|------|-----------|
| 1 | **No real citizen data in the prototype.** | The app simulates government services; storing PII violates hackathon rules and Philippine Data Privacy Act (RA 10173). |
| 2 | **Server secrets never reach the browser.** | Only `VITE_*` prefixed variables are bundled. All API keys live in Vercel Functions (server-side). |
| 3 | **Test-mode credentials only.** | Any eGovPay key must start with `test_`. The code rejects live keys at runtime. |
| 4 | **No production government API calls without approval.** | All integrations default to mock mode (`VITE_API_MODE=mock`) in development. |
| 5 | **Visible disclaimer required.** | The deployed app must show that no real government/identity data is processed. |
| 6 | **Brand usage requires organizer authorization.** | eGovPH logo and related marks are used under hackathon license only. |

---

## 3. Environment & Configuration Rules

### 3.1 Variable Naming Convention

| Prefix | Exposure | Location | Example |
|--------|----------|----------|---------|
| `VITE_` | Client-side (bundled) | `.env.local` | `VITE_APP_ENV=development` |
| No prefix | Server-only (Vercel Functions) | `.env.local` / Vercel dashboard | `EGOVPAY_API_KEY=test_...` |

### 3.2 Required Files

```
.env.example    → Template with empty values (committed to git)
.env.local      → Actual credentials (git-ignored, NEVER committed)
```

### 3.3 Configuration Rules

- [ ] `.env.local` is listed in `.gitignore`
- [ ] No secret appears in any `VITE_*` variable
- [ ] `VITE_API_MODE` defaults to `mock` — real API calls require explicit opt-in
- [ ] Every new integration adds its keys to `.env.example` with empty values
- [ ] Base URLs are validated at startup and trailing slashes are stripped

---

## 4. API Integration Rules

### 4.1 Registered Services

| Service | Auth Method | Server Variable Prefix | Purpose |
|---------|-------------|----------------------|---------|
| eGov SSO | Partner code + secret | `EGOV_SSO_` | Citizen authentication |
| eVerify | Client ID + secret + public key | `EVERIFY_` | National ID verification |
| eMessage | Bearer access token | `EMESSAGE_` | SMS/push notifications |
| eGov AI | Access code header | `EGOV_AI_` | AI-powered civic assistant |
| eGovPay | HMAC-SHA256 + API key header | `EGOVPAY_` | Payment gateway |
| eReport | Bearer access token | `EREPORT_` | Citizen incident reporting |
| Face Liveness | API key header | `FACE_LIVENESS_` | Biometric face verification |
| DBM COMPASS | API key header | `COMPASS_` | Budget transparency data |

### 4.2 Integration Rules

1. **All external API calls happen server-side** (in `/api/` Vercel Functions).
2. **Never expose API keys to the front-end** — the React app calls `/api/*` endpoints only.
3. **Every API function must validate its HTTP method** and return `405` for disallowed methods.
4. **Timeouts are mandatory** — use `AbortSignal.timeout(12_000)` (12 seconds max).
5. **Error responses are sanitized** — never leak upstream error details to the client.
6. **Rate limiting headers** should be respected and propagated where applicable.
7. **HMAC digests** must be computed server-side using `node:crypto`.
8. **Callback endpoints** acknowledge receipt but never trust as proof of state change.

---

## 5. Front-End Rules

### 5.1 Design Compliance

| Rule | Requirement |
|------|-------------|
| Primary viewport | 320–500 px (centered mobile surface on larger screens) |
| No horizontal overflow | Only the category rail may scroll horizontally |
| Touch targets | Minimum 44 x 44 CSS px; prefer 48 px |
| Color contrast | WCAG 2.1 AA minimum |
| Typography | Poppins primary; system sans-serif fallback |
| Spacing rhythm | 4, 8, 12, 16, 20, 24, 32 px increments |
| Safe areas | Respect CSS `env(safe-area-inset-*)` on all edges |
| Bottom nav | Always fixed; content has sufficient bottom padding |
| Text zoom | Functional at 200% browser zoom |

### 5.2 Component Rules

- Every interactive element has an `aria-label` or visible text label
- Navigation communicates current page with `aria-current="page"`
- Modal sheets trap focus and close with `Escape`
- Animations use `transform`/`opacity` and respect `prefers-reduced-motion`
- Images: informational ones get descriptive `alt`; decorative ones use `alt=""`
- Loading, empty, error, and offline states must always be handled

### 5.3 Color Tokens (Enforced)

```css
--color-primary-blue: #064ED8;
--color-dark-blue: #06338F;
--color-soft-blue: #EAF2FF;
--color-yellow: #F7C928;
--color-red: #E43D4E;
--color-ink: #141B2B;
--color-muted: #637087;
--color-divider: #DFE6F1;
```

---

## 6. Back-End Rules (Vercel Functions)

### 6.1 File Structure

```
/api
├── _lib/              → Shared utilities (not exposed as endpoints)
│   ├── egovpay.js
│   ├── everify.js
│   ├── emessage.js
│   ├── egov-ai.js
│   ├── ereport.js
│   ├── face-liveness.js
│   └── validate.js
├── egovpay/
│   ├── create.js      → POST /api/egovpay/create
│   ├── status.js      → GET  /api/egovpay/status?uuid=
│   └── callback.js    → POST /api/egovpay/callback
├── everify/
│   └── verify.js      → POST /api/everify/verify
├── emessage/
│   └── send.js        → POST /api/emessage/send
├── egov-ai/
│   └── chat.js        → POST /api/egov-ai/chat
├── ereport/
│   └── submit.js      → POST /api/ereport/submit
├── face-liveness/
│   └── check.js       → POST /api/face-liveness/check
└── auth/
    ├── login.js        → POST /api/auth/login
    └── verify.js       → GET  /api/auth/verify
```

### 6.2 Handler Rules

1. **Single responsibility** — one handler per file, one HTTP method per handler.
2. **Input validation first** — reject bad input before touching external services.
3. **Structured error handling** — wrap upstream calls in try/catch; return consistent JSON errors.
4. **No persistent state** — functions are stateless; use external stores if needed.
5. **Cache-Control: no-store** — on all mutation and sensitive-data responses.
6. **CORS is handled by Vercel** — do not set CORS headers manually unless required for specific origins.

---

## 7. Security Rules

### 7.1 Mandatory Checks

| Check | Where | Rule |
|-------|-------|------|
| API key prefix validation | Server startup | eGovPay key must start with `test_` |
| UUID format validation | Before upstream calls | Regex: `/^[0-9a-f]{8}-...-[0-9a-f]{12}$/i` |
| HMAC digest | Payment creation | `sha256(amount|txnid)` with API key |
| Webhook signature | Callback handlers | Verify `X-Webhook-Signature` if `EGOVPAY_WEBHOOK_SECRET` is set |
| Content-Type enforcement | All POST handlers | Reject non-JSON bodies |
| Method allowlisting | All handlers | Return 405 for unexpected methods |

### 7.2 Prohibited Actions

- Storing PhilSys numbers, real names, or government document data
- Using `eval()`, `Function()`, or dynamic code execution
- Logging secrets, tokens, or full request bodies containing credentials
- Disabling HTTPS or serving mixed content
- Committing `.env.local` or any file containing real credentials
- Embedding API keys in client-side JavaScript

---

## 8. Deployment Rules

### 8.1 Build Requirements

```bash
# Must complete without errors
npm run build        # → Vite production build to /dist

# Output structure
/dist
├── index.html
├── assets/
│   ├── *.js
│   └── *.css
└── favicon.svg
```

### 8.2 Vercel Configuration

```json
{
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }],
  "functions": { "api/**/*.js": { "runtime": "@vercel/node@3" } }
}
```

### 8.3 Deployment Checklist

- [ ] `npm run build` completes without errors
- [ ] No TypeScript or ESLint critical errors
- [ ] All `VITE_*` variables are safe for public exposure
- [ ] Server secrets are set in Vercel Environment Variables (not in code)
- [ ] The deployed URL loads without 404 on any defined route
- [ ] Prototype disclaimer is visible on the deployed app

---

## 9. Testing Rules

| Scope | Tool | Passing Criteria |
|-------|------|-----------------|
| Build | Vite | Zero errors, zero unresolved imports |
| Accessibility | axe-core / Lighthouse | No critical or serious violations |
| Responsive | Chrome DevTools | No overflow at 320, 390, 430, 500, 1440 px |
| Keyboard | Manual | All controls reachable; focus visible |
| API | Postman / curl | Correct status codes; no leaked secrets in responses |
| Performance | Lighthouse | TTI < 3s on simulated 4G |

---

## 10. Acceptance Gates

Before any deployment to staging or production, all of the following must be true:

1. Identity header, search, category rail, campaign banner, context cards, featured services, and bottom nav render correctly at 390 x 844 px.
2. Zero unintended horizontal overflow at tested viewports.
3. All five navigation items are visible, operable, and correctly labeled.
4. Digital ID retains the raised circular blue emphasis.
5. Search, category filtering, service modal, continue action, history entry, Digital ID reveal, and account preferences work without console errors.
6. A keyboard-only user can operate every interactive control.
7. No interactive target is smaller than 44 x 44 CSS pixels.
8. The production build succeeds and Vercel deployment loads correctly.
9. The prototype disclaimer is visible.
10. No real government or identity data is stored or transmitted.

---

## 11. Contribution Workflow

```
1. Branch from main → feature/your-feature-name
2. Implement following all rules in this document
3. Run build + lint + accessibility check locally
4. Open PR with description referencing FR-ID from this PRD
5. Pass automated checks
6. Get review approval
7. Merge to main → auto-deploy to Vercel preview
```

---

## Appendix A: Quick Reference — Functional Requirements

| ID | Feature | Entry Point |
|----|---------|-------------|
| FR-01 | Search | Home screen search bar |
| FR-02 | Category filter | Horizontal category rail |
| FR-03 | Service details | Service card tap → modal sheet |
| FR-04 | History | Bottom nav → History tab |
| FR-05 | Campaign rotation | Auto-rotating banner |
| FR-06 | QR scanner | Bottom nav → Scan QR |
| FR-07 | Digital ID | Bottom nav → center raised button |
| FR-08 | Account preferences | Bottom nav → Account |
| FR-09 | Embedded product entry | Featured tile / service card / search |
| FR-10 | Keyboard shortcuts | Ctrl/Cmd+K = search; Esc = close modal |

---

*End of PRD Rules document.*
