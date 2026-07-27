# eGovPH Master PRD — Implementation Guide

> **This is the single entry point.** Start here and follow the numbered sequence.  
> **Version:** 1.0  
> **Date:** 22 July 2026  
> **Product:** eGovPH Embedded Web Experience (Hackathon Entry)  

---

## What This Project Is

A mobile-first React webapp that recreates the eGovPH home experience and integrates with **7 real eGov platform APIs** (SSO, eVerify, eMessage, eGovPay, eReport, Face Liveness, eGov AI) plus DBM COMPASS. The hackathon product module lives inside this shell.

---

## Document Map

Read and apply in this order:

```
┌─────────────────────────────────────────────────────────────────────┐
│  00-MASTER-PRD.md          ← YOU ARE HERE (start point)             │
│  TASKS.md                  ← Day-by-day implementation roadmap      │
│                                                                     │
│  ┌─── UNDERSTAND ───────────────────────────────────────────────┐   │
│  │  01-PRD-RULES.md        → What rules to follow               │   │
│  │  05-SECURITY-GUIDELINES.md → Security boundaries             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─── DESIGN ───────────────────────────────────────────────────┐   │
│  │  08-DESIGN-SYSTEM.md    → Consolidated visual spec & tokens  │   │
│  │  eAbot_Visual_Design.md → Detailed component specs (existing)│   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─── BUILD ────────────────────────────────────────────────────┐   │
│  │  03-FRONTEND-ARCHITECTURE.md  → React structure & components │   │
│  │  04-BACKEND-ARCHITECTURE.md   → API functions & patterns     │   │
│  │  07-AUTH-LOGIN-LOGOUT.md      → Login/Logout/Session flow    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─── INTEGRATE ────────────────────────────────────────────────┐   │
│  │  02-API-INTEGRATION.md  → Connect all 8 eGov services        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─── IMPROVE ─────────────────────────────────────────────────┐   │
│  │  06-RECOMMENDATIONS.md  → Future enhancements & demo tips    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

Execute all phases in sequence — no day boundaries. See `TASKS.md` for the full 37-task breakdown with checkboxes.

### Phase 1: Foundation

| Step | Action | Reference |
|------|--------|-----------|
| 1 | Set up environment — copy `.env.example` → `.env.local`, add credentials | `01-PRD-RULES.md` §3 |
| 2 | Scaffold front-end structure — create folders per architecture | `03-FRONTEND-ARCHITECTURE.md` §1 |
| 3 | Implement design tokens (CSS variables) | `08-DESIGN-SYSTEM.md` §2–5 |
| 4 | Build AppShell + BottomNav + basic routing | `03-FRONTEND-ARCHITECTURE.md` §2, §4 |
| 5 | Set up Vercel Functions structure (`api/_lib/`, shared utils) | `04-BACKEND-ARCHITECTURE.md` §2, §3 |

### Phase 2: Home Screen + Auth

| Step | Action | Reference |
|------|--------|-----------|
| 6 | Build Home screen (Header, Search, Categories, Campaign, Featured) | `eAbot_Visual_Design.md` §7.1–7.9 |
| 7 | Implement Login/Logout with eGov SSO | `07-AUTH-LOGIN-LOGOUT.md` §3–5 |
| 8 | Build Auth Context + AuthGate component | `07-AUTH-LOGIN-LOGOUT.md` §4, §7 |
| 9 | Connect eGovPay (payment flow already exists) | `02-API-INTEGRATION.md` §3.4 |
| 10 | Build Digital ID page with mask/reveal | `01-PRD-RULES.md` FR-07 |

### Phase 3: Integrations

| Step | Action | Reference |
|------|--------|-----------|
| 11 | Integrate eVerify (National ID verification) | `02-API-INTEGRATION.md` §3.2 |
| 12 | Integrate Face Liveness (biometric check) | `02-API-INTEGRATION.md` §3.6 |
| 13 | Integrate eMessage (SMS/push notifications) | `02-API-INTEGRATION.md` §3.3 |
| 14 | Integrate eGov AI (civic assistant) | `02-API-INTEGRATION.md` §3.7 |
| 15 | Integrate eReport (incident reporting) | `02-API-INTEGRATION.md` §3.5 |
| 16 | Integrate DBM COMPASS (budget transparency) | `02-API-INTEGRATION.md` §3.8 |

### Phase 4: Polish & Security

| Step | Action | Reference |
|------|--------|-----------|
| 17 | Apply all security checks (validation, sanitization, headers) | `05-SECURITY-GUIDELINES.md` §4–8 |
| 18 | Add accessibility (skip link, focus traps, aria labels) | `03-FRONTEND-ARCHITECTURE.md` §8 |
| 19 | Test responsive design (320, 390, 430, 500, 1440 px) | `01-PRD-RULES.md` §9 |
| 20 | Run security checklist | `05-SECURITY-GUIDELINES.md` §11 |
| 21 | Run acceptance gates | `01-PRD-RULES.md` §10 |

### Phase 5: Ship

| Step | Action | Reference |
|------|--------|-----------|
| 22 | Build unified end-to-end demo flow | `06-RECOMMENDATIONS.md` §1.1 |
| 23 | Ensure mock mode works for all services | `02-API-INTEGRATION.md` §5 |
| 24 | Deploy to Vercel and verify | `01-PRD-RULES.md` §8 |
| 25 | Demo rehearsal | `06-RECOMMENDATIONS.md` §8 |

---

## API Keys & Services Overview

All credentials live in `.env.local` (server-side, git-ignored). The front-end only calls `/api/*` routes.

| # | Service | What It Does | Key Variable |
|---|---------|-------------|--------------|
| 1 | **eGov SSO** | Citizen login/authentication | `EGOV_SSO_PARTNER_SECRET` |
| 2 | **eVerify** | National ID verification | `EVERIFY_CLIENT_SECRET` |
| 3 | **eMessage** | SMS/push notifications | `EMESSAGE_ACCESS_TOKEN` |
| 4 | **eGovPay** | Payment processing | `EGOVPAY_API_KEY` (test_ only!) |
| 5 | **eReport** | Incident reporting | `EREPORT_ACCESS_TOKEN` |
| 6 | **Face Liveness** | Biometric face check | `FACE_LIVENESS_API_KEY` |
| 7 | **eGov AI** | AI civic assistant | `EGOV_AI_ACCESS_CODE` |
| 8 | **DBM COMPASS** | Budget transparency | `COMPASS_API_KEY` |

---

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER                                        │
│                         (Mobile Browser / Webview)                        │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         VERCEL PLATFORM                                   │
│                                                                          │
│  ┌──────────────────────┐      ┌────────────────────────────────────┐   │
│  │    STATIC (CDN)      │      │     SERVERLESS FUNCTIONS           │   │
│  │                      │      │                                    │   │
│  │  React SPA           │      │  /api/auth/login      (SSO)       │   │
│  │  • index.html        │      │  /api/auth/callback   (SSO)       │   │
│  │  • JS bundles        │      │  /api/auth/verify     (Session)   │   │
│  │  • CSS               │      │  /api/auth/logout     (Session)   │   │
│  │  • Fonts/Images      │      │  /api/egovpay/*       (Payments)  │   │
│  │                      │      │  /api/everify/*       (ID Verify) │   │
│  │  Calls /api/* only   │      │  /api/emessage/*      (Notify)    │   │
│  │  No secrets here     │      │  /api/egov-ai/*       (AI Chat)   │   │
│  │                      │      │  /api/ereport/*       (Reports)   │   │
│  └──────────────────────┘      │  /api/face-liveness/* (Biometric) │   │
│                                │  /api/compass/*       (Budget)    │   │
│                                │  /api/health          (Status)    │   │
│                                │                                    │   │
│                                │  process.env has ALL secrets       │   │
│                                └──────────────┬─────────────────────┘   │
│                                               │                         │
└───────────────────────────────────────────────┼─────────────────────────┘
                                                │ HTTPS (server-to-server)
                                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     eGovPH PLATFORM SERVICES                             │
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ eGov SSO │ │ eVerify  │ │ eMessage │ │ eGovPay  │ │ eReport  │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                              │
│  │Face Live │ │ eGov AI  │ │ COMPASS  │                              │
│  └──────────┘ └──────────┘ └──────────┘                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow (Login → Use → Logout)

```
┌─────────────────── FULL USER SESSION ──────────────────────────────────┐
│                                                                        │
│  1. ANONYMOUS STATE                                                    │
│     • Can browse services, search, view categories                     │
│     • Can use eGov AI chat                                             │
│     • Cannot: pay, verify ID, view Digital ID, report, check history   │
│                                                                        │
│  2. LOGIN                                                              │
│     • User clicks "Log in with eGovPH"                                 │
│     • POST /api/auth/login → returns SSO auth_url                      │
│     • Redirect to eGov SSO login page                                  │
│     • User enters credentials on eGov (NOT our app)                    │
│     • eGov redirects to /api/auth/callback?code=XXX                    │
│     • Server exchanges code → token, sets httpOnly cookie              │
│     • Redirect to home with ?auth=success                              │
│                                                                        │
│  3. AUTHENTICATED STATE                                                │
│     • All features unlocked                                            │
│     • Cookie sent automatically on every /api/* request                │
│     • Session checked periodically (every 5 min)                       │
│     • Token expires after 1 hour                                       │
│                                                                        │
│  4. LOGOUT                                                             │
│     • User clicks "Log out" in Account page                            │
│     • POST /api/auth/logout                                            │
│     • Server revokes token with SSO (best effort)                      │
│     • Server clears both cookies (Max-Age=0)                           │
│     • Front-end clears local state + localStorage                      │
│     • Returns to anonymous state                                       │
│                                                                        │
│  5. SESSION EXPIRY                                                     │
│     • After 1 hour, cookie expires                                     │
│     • Next /api/ call returns 401                                      │
│     • Front-end detects → shows "Session expired, please log in again" │
│     • User returns to anonymous state                                  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Non-Negotiable Rules (Quick Reference)

These apply across ALL documents and ALL code:

| # | Rule | Violation = Block Deployment |
|---|------|------------------------------|
| 1 | No real citizen data stored or transmitted | Yes |
| 2 | API keys server-side only (no `VITE_` prefix) | Yes |
| 3 | eGovPay key must start with `test_` | Yes |
| 4 | `.env.local` never committed to git | Yes |
| 5 | All POST handlers validate method + input | Yes |
| 6 | Error responses never expose internal details | Yes |
| 7 | External fetch calls always have timeout | Yes |
| 8 | Prototype disclaimer visible on deployed app | Yes |
| 9 | No `eval()`, `Function()`, or `dangerouslySetInnerHTML` | Yes |
| 10 | Face images never persisted (process and discard) | Yes |

---

## File Structure (Complete Project)

```
Egov-app-clone/
├── .env.example                    → Template (committed)
├── .env.local                      → Real credentials (git-ignored)
├── .gitignore
├── index.html                      → SPA entry point
├── package.json
├── package-lock.json
├── vite.config.js
├── vercel.json                     → Deployment + headers config
│
├── public/                         → Static assets (served as-is)
│   ├── favicon.svg
│   └── site.webmanifest
│
├── src/                            → Front-end (React)
│   ├── main.jsx                    → Entry: renders <App />
│   ├── App.jsx                     → Root: providers + shell
│   ├── styles.css                  → Global: tokens + resets
│   ├── assets/                     → Icons, images
│   ├── components/                 → UI components (see 03-FRONTEND)
│   ├── pages/                      → Route-level pages
│   ├── hooks/                      → Custom React hooks
│   ├── services/                   → API client + mocks
│   ├── context/                    → React Context providers
│   └── utils/                      → Pure utility functions
│
├── api/                            → Back-end (Vercel Functions)
│   ├── _lib/                       → Shared server utilities
│   ├── auth/                       → Login, callback, verify, logout
│   ├── egovpay/                    → Payment create, status, callback
│   ├── everify/                    → ID verification
│   ├── emessage/                   → Notifications
│   ├── egov-ai/                    → AI assistant
│   ├── ereport/                    → Incident reporting
│   ├── face-liveness/              → Biometric verification
│   ├── compass/                    → Budget data
│   └── health.js                   → Health check
│
└── docs/                           → This documentation suite
    ├── 00-MASTER-PRD.md            → START HERE
    ├── 01-PRD-RULES.md             → Rules & acceptance criteria
    ├── 02-API-INTEGRATION.md       → Service integration details
    ├── 03-FRONTEND-ARCHITECTURE.md → React structure
    ├── 04-BACKEND-ARCHITECTURE.md  → Serverless structure
    ├── 05-SECURITY-GUIDELINES.md   → Security & compliance
    ├── 06-RECOMMENDATIONS.md       → Enhancements & demo tips
    └── 07-AUTH-LOGIN-LOGOUT.md     → Authentication flows
```

---

## Success Criteria (For Hackathon Judges)

| Criteria | Evidence |
|----------|----------|
| **Functional** | All 7 integrations work in a unified flow |
| **Secure** | Test-mode enforcement, HMAC digests, no PII storage |
| **Accessible** | WCAG 2.1 AA, keyboard navigable, screen reader friendly |
| **Performant** | < 3s TTI, < 200 KB bundle, Lighthouse > 90 |
| **Production-ready** | Clean architecture, documented, deployable |
| **User-centric** | Mobile-first, thumb-zone nav, progressive disclosure |
| **Innovative** | AI-powered assistant, progressive identity verification |

---

## Quick Start for New Team Members

```bash
# 1. Clone and install
git clone <repo-url>
cd Egov-app-clone
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in credentials (ask team lead)

# 3. Run locally
npx vercel dev
# Opens at http://localhost:3000

# 4. Read the docs
# Start with this file, then follow the document map above

# 5. Pick a task from the phase list and start building!
```

---

---

## Complete Document Index

| # | Document | Purpose |
|---|----------|---------|
| 00 | `00-MASTER-PRD.md` | Governing document — start here |
| 01 | `01-PRD-RULES.md` | Binding rules from the PRD |
| 02 | `02-API-INTEGRATION.md` | All 8 eGovPH service integrations |
| 03 | `03-FRONTEND-ARCHITECTURE.md` | React structure & state management |
| 04 | `04-BACKEND-ARCHITECTURE.md` | Serverless functions & patterns |
| 05 | `05-SECURITY-GUIDELINES.md` | Threat model & security checks |
| 06 | `06-RECOMMENDATIONS.md` | Enhancements & demo tips |
| 07 | `07-AUTH-LOGIN-LOGOUT.md` | Login, logout, session management |
| 08 | `08-DESIGN-SYSTEM.md` | Visual tokens & design decisions |
| — | `TASKS.md` | 37-task implementation roadmap (5 days) |
| — | `eAbot_Visual_Design.md` | Detailed component visual spec |
| — | `eGovPH_Design_PRD.docx` | Original hackathon PRD source |

---

*This is the governing document. All other docs are referenced from here.*  
*When in doubt, check `01-PRD-RULES.md` for the binding rule.*  
*For task assignment, see `TASKS.md`.*
