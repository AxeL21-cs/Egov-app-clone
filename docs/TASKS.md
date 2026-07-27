# eGovPH / eAbot — Implementation Checklist

> **Execution:** Sequential — work top to bottom  
> **Current state:** eGovPay (live sandbox) + eGov AI (live) + mock mode for everything else  
> **Rule:** Later items depend on earlier ones. Don't skip ahead.  

---

## 1. Environment & Configuration

- [ ] Verify `.env.local` has all API keys filled in (see status labels: LIVE / READY / PENDING)
- [ ] Confirm `npm install` succeeds without errors
- [ ] Confirm `npx vercel dev` starts both SPA and serverless functions
- [ ] Confirm mock mode works (`VITE_API_MODE=mock`) — app loads without any base URLs
- [ ] Confirm eGovPay live sandbox works — `POST /api/egovpay/create` returns a transaction
- [ ] Confirm eGov AI endpoint responds — test with curl or Postman against `https://egov-ai-core-ws.oueg.info`

---

## 2. Server Shared Utilities

- [ ] Create `api/_lib/config.js` — environment loader with `requireEnv()` and `getBaseUrl()`
- [ ] Create `api/_lib/validate.js` — method check, UUID regex, required fields, string sanitizer
- [ ] Create `api/_lib/errors.js` — `ApiError` class + `handleError(res, error)` standardized response
- [ ] Create `api/_lib/http.js` — `fetchJSON(url, options)` wrapper with 12s timeout + error parsing
- [ ] Create `api/health.js` — `GET /api/health` returns service availability (boolean key presence, never values)

---

## 3. Authentication (Login / Logout / Session)

- [ ] Create `api/auth/login.js` — HMAC-sign partner code + timestamp, call SSO initiate, return `auth_url`
- [ ] Create `api/auth/callback.js` — exchange auth code for token, set httpOnly cookie, redirect to `/?auth=success`
- [ ] Create `api/auth/verify.js` — read session cookie, return `{ authenticated, user }`
- [ ] Create `api/auth/logout.js` — revoke token (best effort), clear both cookies (session + user)
- [ ] Create `src/context/AuthContext.jsx` — provider with `login()`, `logout()`, `checkSession()`, session polling
- [ ] Create `src/components/auth/LoginButton.jsx` — calls `api.login()`, redirects to SSO
- [ ] Create `src/components/auth/LogoutButton.jsx` — calls `api.logout()`, clears localStorage
- [ ] Create `src/components/common/AuthGate.jsx` — shows login prompt for anonymous users on protected features
- [ ] Wire auth into Header — show login button (anonymous) or name + avatar (authenticated)
- [ ] Handle `?auth=success` / `?auth=error` URL params on app mount

---

## 4. eGov AI Integration (Chat Assistant)

- [ ] Create `api/_lib/egov-ai.js` — sends messages to `EGOV_AI_API_BASE_URL/api/v1/chat` with `X-Access-Code` header
- [ ] Create `api/egov-ai/chat.js` — `POST /api/egov-ai/chat`, validates body, returns AI response
- [ ] Update `AssistantScreen` to call live `/api/egov-ai/chat` when `VITE_API_MODE !== 'mock'`
- [ ] Add typing indicator while waiting for AI response
- [ ] Add error state if AI service is down
- [ ] Keep mock fallback for offline demos

---

## 5. eVerify Integration (National ID Verification)

- [ ] Create `api/_lib/everify.js` — get access token (client credentials), then call verify endpoint with public key header
- [ ] Create `api/everify/verify.js` — `POST /api/everify/verify`, auth-gated, validates input fields
- [ ] Build verification UI component (demo data fields: name, birth date, masked ID)
- [ ] Wire into Digital ID page — "Verify your identity" button triggers the flow
- [ ] Show result state: verified / not found / error
- [ ] Add mock fallback

---

## 6. Face Liveness Integration (Biometric Check)

- [ ] Create `api/_lib/face-liveness.js` — sends base64 image to liveness API with `X-API-Key` header
- [ ] Create `api/face-liveness/check.js` — `POST /api/face-liveness/check`, auth-gated, 20s timeout
- [ ] Build camera capture UI (or file-upload fallback for desktop)
- [ ] Show result: live / not live / error
- [ ] Display privacy notice: "Your image is processed once and never stored"
- [ ] Wire into Digital ID page as step 2 after eVerify
- [ ] Add mock fallback

---

## 7. eMessage Integration (Notifications)

- [ ] Create `api/_lib/emessage.js` — sends message payload with `Authorization: Bearer` token
- [ ] Create `api/emessage/send.js` — `POST /api/emessage/send`, auth-gated, validates recipient + message
- [ ] Trigger notification after payment confirmation (server-side, inside eGovPay flow)
- [ ] Show "Confirmation sent to your number" toast in UI after successful send
- [ ] Add mock fallback (just show the toast without calling API)

---

## 8. eReport Integration (Citizen Reporting)

- [ ] Create `api/_lib/ereport.js` — submits report with `Authorization: Bearer` token
- [ ] Create `api/ereport/submit.js` — `POST /api/ereport/submit`, auth-gated, validates category + description
- [ ] Build report form UI — category dropdown, description textarea, optional location
- [ ] Add geolocation auto-fill (browser `navigator.geolocation`)
- [ ] Show success confirmation with report ID after submission
- [ ] Add to home screen via "Report" category circle (with "Bago" badge)
- [ ] Add mock fallback

---

## 9. DBM COMPASS Integration (Budget Transparency)

- [ ] Create `api/_lib/compass.js` — queries budget endpoint with `X-API-Key` header
- [ ] Create `api/compass/query.js` — `GET /api/compass/query`, public (no auth needed), caches 5 min
- [ ] Display budget data in a context card on home screen
- [ ] Add mock fallback with sample budget data

---

## 10. eGovPay Enhancement (Already Working)

- [ ] Verify `POST /api/egovpay/create` still works against live sandbox
- [ ] Verify `GET /api/egovpay/status?uuid=` returns correct transaction state
- [ ] Add eMessage notification trigger after successful payment (connect to step 7)
- [ ] Ensure "DEMO — DO NOT PAY" disclaimer is always visible
- [ ] Ensure `test_` prefix check rejects live keys at runtime

---

## 11. Frontend — Remaining Pages

- [ ] Digital ID page — auth-gated, shows ID card (masked), reveal/hide toggle, verification status from eVerify + Face Liveness
- [ ] History page — auth-gated, reads from localStorage, chronological list, empty state
- [ ] Account page — profile info, language toggle, notification preferences, logout button
- [ ] Service Modal — slide-up sheet, focus trap, Escape to close, "Continue" action

---

## 12. Security Hardening

- [ ] All handlers validate HTTP method (return 405 for wrong method)
- [ ] All POST handlers validate Content-Type is JSON
- [ ] All user input is sanitized (trim, max length, strip HTML)
- [ ] No secrets appear in any `VITE_*` variable
- [ ] CSP meta tag added to `index.html`
- [ ] Security headers added to `vercel.json` (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- [ ] eGovPay key starts with `test_` (runtime check)
- [ ] Face images are never persisted (process in-memory only)
- [ ] Error responses never expose internal details or stack traces
- [ ] `npm audit` shows no critical/high vulnerabilities

---

## 13. Accessibility

- [ ] All interactive elements have accessible name (aria-label or visible text)
- [ ] Keyboard navigation reaches every control
- [ ] Focus is visible on every focusable element (blue ring)
- [ ] Bottom nav has `role="navigation"` and `aria-current="page"` on active item
- [ ] Modals trap focus and close with Escape
- [ ] All images: informational → descriptive alt / decorative → `alt=""`
- [ ] Color contrast: 4.5:1 (body text), 3:1 (large text)
- [ ] Works at 200% browser zoom without breaking
- [ ] No horizontal overflow at 320px viewport
- [ ] `prefers-reduced-motion` respected (animations use transform/opacity only)

---

## 14. Responsive Testing

- [ ] 320px — no overflow, all content accessible, bottom nav visible
- [ ] 390px — matches reference layout proportions
- [ ] 430px — no issues
- [ ] 500px — still single column, content centered
- [ ] 1440px — centered max-width, no phone frame, no empty space abuse

---

## 15. Build & Deploy

- [ ] `npm run build` completes without errors
- [ ] Output in `/dist` — index.html, assets/*.js, assets/*.css
- [ ] `vercel.json` has correct rewrites (`/((?!api/).*)` → `/index.html`)
- [ ] All server-only env vars set in Vercel dashboard (never in code)
- [ ] Deploy to Vercel preview URL
- [ ] Homepage loads correctly
- [ ] `/api/health` returns OK with service availability
- [ ] Prototype disclaimer is visible on the deployed app

---

## 16. End-to-End Demo Flow

- [ ] Unified journey works: Login → Browse → Select opportunity → Document plan → Request document → Payment → Receipt → Updated checklist
- [ ] eGov AI answers questions during the journey
- [ ] Each completed action updates History
- [ ] Mock mode (`VITE_API_MODE=mock`) works fully offline as backup
- [ ] "Continue demo without paying" bypass works for judges
- [ ] Demo runs start-to-finish in under 5 minutes

---

## 17. Stretch (If Time Permits)

- [ ] PWA service worker — app shell caching, offline fallback page
- [ ] Skeleton loaders — for service list, banner, utility grid during loading
- [ ] Multi-language — EN/Filipino toggle in Account page
- [ ] Budget visualization — COMPASS data as simple chart
- [ ] Haptic feedback — subtle vibration on mobile button press

---

*Work top to bottom. Each section builds on the previous one.*  
*Reference `00-MASTER-PRD.md` for the governing spec and document map.*
