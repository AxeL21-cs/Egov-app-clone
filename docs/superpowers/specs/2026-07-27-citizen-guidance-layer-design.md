# eAbot — Citizen Guidance Layer: Design Spec

**Date:** 27 July 2026
**Status:** Approved design, ready for implementation planning
**Supersedes:** the integration sequencing in `docs/TASKS.md` §4–§11

---

## 1. Product definition

eAbot is a **proactive citizen guidance layer** that:

1. **discovers eligibility** across government programs,
2. **personalizes government journeys** into dependency-aware document plans,
3. **connects citizens to the right services at the right time.**

Education is the deepest demo vertical, not the product. The system must make a
second domain a *data* addition, never a code addition.

### 1.1 What changes from the current build

The existing app is a scholarship checklist with generic-looking labels.
`PROGRAMS`, `PROGRAM_REQUIREMENTS`, and `getBpmsRequirements()` in `src/App.jsx`
hardcode both the catalog and one specific unlock chain in JavaScript. This spec
converts both into data driven by a small pure engine.

---

## 2. Starting conditions

All eight services were confirmed against the organisers' API portal on
28 July 2026, then verified by DNS and TLS reachability check. **All eight hosts
resolve and serve over HTTPS.**

| Service | Base URL | Endpoint (as documented) | Auth |
|---|---|---|---|
| SSO | `https://hackathon-sso.e.gov.ph` | `POST /api/token` | issues a token |
| eVerify | `https://hackathon-everify-api.e.gov.ph` | `POST /api/query/qr` | `Authorization: Bearer` |
| Face Liveness | `https://hackathon-face-liveness-api.e.gov.ph` | `POST /v1/liveness/session` | `x-api-key` |
| eMessage | `https://ws-message.e.gov.ph` | `POST /messaging/v1/sms/push` | `X-EMESSAGE-Auth` |
| eGov AI | `https://egov-ai-core-ws.oueg.info` | `POST /api/v1/egov/integration/token` | issues a token |
| eGovPay | `https://egovpay-pgi-ws-dev.oueg.info` | `POST /api/v1/transaction` | `X-eGovPay-Token` |
| eReport | `https://stg-ereport-ws.oueg.info` | `GET /api/integration/datasets/report_types` | `Authorization: Bearer` |
| COMPASS | `https://dbm-ws.oueg.info` | `GET /api/v1/records/saaodb` | `X-API-Key` |

### 2.1 Corrected defect

`.env.local` previously held `egovpay-**pg1**-ws-dev.oueg.info` (digit one). The
correct host is `egovpay-**pgi**-ws-dev.oueg.info` (letter i). The incorrect host
has no DNS record, so **the eGovPay integration had never worked** — every
`POST /api/egovpay/create` failed at DNS resolution. Corrected in `.env.local`.

### 2.2 `docs/02-API-INTEGRATION.md` is unreliable

That document was written speculatively and does not match the portal. Its
`.egov.ph` hosts are fabricated: `egov.ph` (no dot) serves a **wildcard DNS
record**, so every subdomain resolves and resolution proved nothing. The real
services are on `e.gov.ph` (with a dot) and `oueg.info`. Its auth patterns are
also wrong — it describes SSO as HMAC-signed `/api/v1/auth/initiate`, and
eVerify as a name/birthdate/ID-number form. Neither matches reality.

**Every integration pattern in that file must be re-derived from the portal
before use.** This spec's §2 table supersedes it.

### 2.3 Authentication is per-service, not unified

There is no single platform token. Two services issue tokens by exchange (SSO,
eGov AI); six use static credentials under six different header names. The
design therefore needs a **small reusable token-cache helper used by two
services**, not a platform-wide auth layer.

### 2.4 Open questions

1. **Source of eVerify's Bearer token** — most likely SSO's `/api/token`, but
   unconfirmed. Confirm from the portal's eVerify page.
2. **eReport submit endpoint** — the captured call is a reference-data `GET`
   (`report_types`), not the report submission.
3. **A sandbox PhilSys QR value** for eVerify. `RAW_QR_CODE_VALUE` is a
   placeholder. Scanning a real ID would breach PRD Rules #1 and #10, so a test
   value must be obtained from the organisers.
4. **COMPASS `class` parameter** — the example uses `PS` (Personnel Services).
   Programme funding is likely `MOOE` or `CO`.
5. **`EGOV_SSO_PARTNER_CODE`** — portal shows `TEST_AGENCY`; `.env.local` holds
   `HACKATHON_SSO`. Confirm which is issued to this team.

**Design consequence (unchanged):** the system must remain fully demonstrable
with zero reachable services, and must light up per-service via environment
variables alone. Reachability today does not guarantee reachability on demo day.

---

## 3. Architecture

```
src/
  domain/                  PURE. no React, no fetch, no localStorage
    profile.js               citizen attribute shape + demo personas
    catalog/
      index.js               loads all domains, validates every entry
      education.js           social-assistance.js   health.js
      livelihood.js          civil-registry.js      business.js
    matcher.js               (profile, catalog, now) -> ranked matches
    journey.js               (journeyDef, progress) -> resolved steps
  services/
    api.js                   ONLY module that calls /api/*
    mocks/                   client-side last-resort fixtures
  pages/                     screens extracted from App.jsx
  components/                shared UI
  context/                   profile + progress state

api/
  _lib/
    config.js  http.js  errors.js  capability.js
    egovpay.js  egov-ai.js  emessage.js  everify.js
    face-liveness.js  ereport.js  compass.js  egov-sso.js
  health.js
  <service>/<action>.js      thin handlers
```

### 3.1 Layer boundaries

| Layer | May import | Must never touch |
|---|---|---|
| `src/domain/` | only itself | React, fetch, browser APIs |
| `src/services/` | domain types | external hosts — only `/api/*` |
| `src/pages/` | domain, services, components | eligibility computation |
| `api/_lib/` | node builtins | anything under `src/` |

The purity of `src/domain/` is the point: eligibility logic is testable with no
browser, no network, and no mock server.

### 3.2 App.jsx decomposition

The 885-line `src/App.jsx` splits along seams that already exist:

- 8 screen components move to `src/pages/*.jsx`, largely as-is.
- `PROGRAMS`, `PROGRAM_REQUIREMENTS`, `INCOME_OPTIONS` become the first entries
  in `domain/catalog/education.js`.
- `getBpmsRequirements()` generalizes into `journey.js` as a resolver over a
  declared `dependsOn` graph.

Explicitly **not** built: no router, no state library, no TypeScript migration,
no test framework beyond `node:test`.

---

## 4. Data model

### 4.1 Profile

```js
{
  id: 'demo-mika',
  age: 18,
  region: 'NCR', city: 'San Juan City',
  citizenship: 'PH',
  educationStatus: 'incoming-college',
  employmentStatus: 'none',
  householdIncomeBracket: null,   // null === UNKNOWN, not zero
  isPWD: false, isSoloParent: null, isIndigenous: null,
  has4Ps: null, philHealthMember: null,
  verifiedAttributes: [],         // populated by eVerify when available
}
```

`null` means **unknown** and is distinct from `false`.

### 4.2 Catalog entry

```js
{
  id: 'ched-bpms',
  domain: 'education',
  title: 'Bagong Pilipinas Merit Scholarship',
  agency: 'CHED',
  type: 'scholarship',
  gate: 'competitive',            // 'automatic' | 'competitive' | 'assessment'
  rules: [ /* §4.3 */ ],
  window: { status: 'closed', nextOpens: '2027-01', note: 'AY 2026-2027 call closed' },
  journey: 'ched-bpms-journey',   // must resolve to a defined journey
  source: 'https://bpms.ched.gov.ph/',
  sourceLabel: 'Official CHED portal',
  verifiedOn: '2026-07-27',
  verification: 'verified',       // 'verified' | 'unverified'
  compassProgramCode: null,
}
```

`source`, `sourceLabel`, `verifiedOn`, `verification`, and `gate` are
**mandatory**. Catalog validation fails at load time if any is missing.

### 4.3 Rule

```js
{
  id: 'is-incoming-freshman',
  label: 'Incoming first-year student',
  kind: 'hard',                   // 'hard' disqualifies | 'soft' boosts only
  test: (p) => p.educationStatus === null
    ? 'unknown'
    : p.educationStatus === 'incoming-college',
}
```

`test` returns **`true` | `false` | `'unknown'`**. Tri-state is mandatory. Two-state
logic silently converts "we have not asked" into "you do not qualify", which for a
benefits product is the failure mode that harms real citizens.

### 4.4 Match result

```js
{
  programId: 'ched-bpms',
  tier: 'possible',        // 'possible'|'worth-checking'|'needs-info'|'not-eligible'
  reasons:  [{ id, label }],   // rules that passed
  gaps:     [{ id, label }],   // rules that returned 'unknown'
  blockers: [{ id, label }],   // hard rules that failed
  window:   { status, nextOpens },
  source, sourceLabel, verification,
  funding:  null,              // COMPASS enrichment when available
}
```

There is deliberately **no `eligible: true` and no numeric score**. The highest
tier expressible is `possible`. The matcher is structurally incapable of
emitting an approval, so no screen can render one by mistake.

### 4.5 Journey step

```js
{
  id: 'bpms-birth',
  title: 'PSA birth certificate',
  detail: '...', source: 'Philippine Statistics Authority',
  method: 'egov',          // 'egov' | 'upload' | 'assisted' | 'choice'
  dependsOn: [],           // declared dependency ids
  conditional: null,       // rule id — step applies only when rule passes
  oneOf: null,             // group id for accepted-alternative documents
}
```

`dependsOn` replaces the hardcoded chain. `oneOf` generalizes the existing
income-document branching.

---

## 5. Matching engine

### 5.1 Algorithm

Per catalog entry:

1. Evaluate every rule to `true | false | 'unknown'`.
2. Any **hard** rule `false` → tier `not-eligible`; those rules become `blockers`.
3. Else any **hard** rule `'unknown'` → tier `needs-info`; those become `gaps`.
4. Else all hard rules pass → tier determined by `gate` (§5.2).
5. **Soft** rules never disqualify. They add `reasons` and lift ranking.

### 5.2 Gate to tier

| `gate` | Meaning | Tier |
|---|---|---|
| `automatic` | Meeting criteria generally means receiving it | `possible` |
| `competitive` | May apply; selection is a contest | `worth-checking` |
| `assessment` | A human decides case-by-case | `worth-checking` |

This keeps DSWD AICS honestly represented as crisis assistance subject to
social-worker assessment rather than an entitlement — as a property of data, so
every program gets the distinction.

### 5.3 Ranking

Sort by tier, then open window before closed, then soft-rule count. Then a
**domain-diversity pass**: the top results interleave domains so a discovery-led
demo shows breadth in one viewport instead of five education programs.

### 5.4 Determinism

`now` is an **injected parameter**. The matcher never calls `Date.now()`. Window
logic is testable and the demo cannot break because a hardcoded date passed.

### 5.5 Calibrated-language guarantees

- No `eligible` tier, no numeric score.
- `source` / `sourceLabel` are required on entries and are carried into every
  match, so a match cannot reach the UI without its authoritative link.
- `verification: 'unverified'` propagates into the result; the UI softens wording
  and badges those entries.
- Permitted match language: "possible match", "worth checking", "prepare for the
  next call". Forbidden: qualified, approved, guaranteed, enrolled, entitled.

### 5.6 Display of `not-eligible` matches

`not-eligible` entries are **excluded from the main discovery list** and shown
only under a collapsed "Not a fit right now" section, each with its `blockers`
stated plainly. They are never silently dropped: telling a citizen *why*
something does not apply is guidance, and hiding it entirely invites them to
pursue it elsewhere. They never count toward the headline match count.

### 5.7 COMPASS enrichment ordering

COMPASS enrichment runs **after** matching, never inside it. `funding` starts
`null` and is populated asynchronously. If COMPASS is unreachable the match is
unchanged and the UI omits the funding line. A transparency enhancement must
never be able to delay or break eligibility discovery.

### 5.8 Gaps as a feature

Aggregate `gaps` across all matches and rank by how many programs each unknown
would resolve, yielding: *"Answer one question about household income to sharpen
6 of your 14 matches."* This is the proactive-guidance thesis made visible, and
it falls out of the tri-state model at no extra cost.

---

## 6. API capability layer

### 6.1 Per-capability liveness

Liveness is resolved **per capability, server-side**. A global `VITE_API_MODE`
flag is the wrong shape: the mix of live and unconfigured services is uneven and
will change, and the browser cannot see whether a server-side base URL is set.

```js
// api/_lib/config.js
export const CAPABILITIES = {
  egovAi:       { baseUrl: 'EGOV_AI_API_BASE_URL',       creds: ['EGOV_AI_ACCESS_CODE'] },
  egovpay:      { baseUrl: 'EGOVPAY_API_BASE_URL',       creds: ['EGOVPAY_API_KEY', 'EGOVPAY_SETTLEMENT_TEMPLATE_UUID'] },
  emessage:     { baseUrl: 'EMESSAGE_API_BASE_URL',      creds: ['EMESSAGE_ACCESS_TOKEN'] },
  everify:      { baseUrl: 'EVERIFY_API_BASE_URL',       creds: ['EVERIFY_CLIENT_ID', 'EVERIFY_CLIENT_SECRET'] },
  faceLiveness: { baseUrl: 'FACE_LIVENESS_API_BASE_URL', creds: ['FACE_LIVENESS_API_KEY'] },
  ereport:      { baseUrl: 'EREPORT_API_BASE_URL',       creds: ['EREPORT_ACCESS_TOKEN'] },
  compass:      { baseUrl: 'COMPASS_API_BASE_URL',       creds: ['COMPASS_API_KEY'] },
  sso:          { baseUrl: 'EGOV_SSO_API_BASE_URL',      creds: ['EGOV_SSO_PARTNER_CODE', 'EGOV_SSO_PARTNER_SECRET'] },
};
```

A capability is `live` when its base URL and all credentials are present,
otherwise `unconfigured`.

### 6.2 Server-side mocks, uniform envelope

Mocks live on the server behind the same routes. The client always calls
`/api/*` and never branches. Every response declares provenance:

```json
{ "data": { }, "source": "mock", "capability": "everify" }
```

Consequences: React code is identical in both modes, so a newly supplied URL
requires only an env change; and the UI can honestly badge "live data" versus
"demo data" per feature.

### 6.3 The `withCapability` wrapper

```js
export default withCapability('egovAi', {
  method: 'POST',
  timeout: 30_000,
  live: chatWithAI,
  mock: mockChatReply,
});
```

Handles in one place: method check → 405, Content-Type validation, capability
resolution, mock fallback, timeout, `Cache-Control: no-store`, and error
normalization that never leaks upstream detail. This implements `TASKS.md` §12
once rather than in seven handlers.

Per-service timeouts: eGov AI 30s, Face Liveness 20s, eVerify 15s, eReport 15s,
eGovPay 12s, COMPASS 12s, SSO 12s, eMessage 10s.

### 6.4 Token-exchange helper

Two services issue tokens rather than accepting a static credential:

- **SSO** — `POST /api/token`, likely the source of eVerify's Bearer token.
- **eGov AI** — `POST /api/v1/egov/integration/token` with `{ access_code }`.

`api/_lib/token-cache.js` provides one small helper: fetch once, cache in module
scope until expiry (minus a 60s safety margin), refresh on 401, and never log
the token. Module scope is adequate — a warm serverless instance reuses it, and
a cold start simply re-fetches.

The other six services use static credentials under six different header names
(`X-eGovPay-Token`, `X-EMESSAGE-Auth`, `x-api-key`, `X-API-Key`,
`Authorization: Bearer`). Header naming is per-service configuration in each
adapter, not a shared convention.

### 6.5 Three-layer degradation

1. Capability unconfigured → server returns mock, flagged.
2. Capability configured but call fails or times out → server falls back to mock,
   flagged; the real error is logged server-side only.
3. `/api/*` itself unreachable → `src/services/api.js` serves a client-side fixture.

The app cannot white-screen because a government sandbox is down.

### 6.6 Health endpoint

`GET /api/health` returns `{ egovAi: 'live', everify: 'unconfigured', ... }` —
status strings only, never credential values. Pre-demo preflight.

### 6.7 Rate limiting

Serverless is stateless; no server-side limiter. Client-side debounce on AI chat
(20 req/min is the tightest documented limit) and a submit-lock on eReport.

---

## 7. Capability-to-verb mapping

| Product verb | Services |
|---|---|
| Discovers eligibility | eVerify, SSO, COMPASS (is it funded and open) |
| Personalizes journeys | eGov AI, journey engine |
| Connects at the right time | eMessage, eGovPay, eReport, Face Liveness |

eMessage is first-class, not an afterthought: "proactive" means the citizen does
not have to come looking. A push saying *"the CHED call opens Monday and you are
two documents short"* is the product thesis in one message.

---

## 8. Demo flow (~4 minutes)

1. Persona picker → Mika, 18, incoming freshman.
2. Discovery screen — ~14 matches across 6 domains, tiered, each with reasons,
   agency, and source link.
3. Gap prompt — answer one question; the list re-ranks live.
4. **Switch persona to a 45-year-old informal worker** — the whole match list
   changes. Livelihood and health rise; education falls away.
5. Drill into education → dependency journey driven by `dependsOn`.
6. PSA request → eGovPay test transaction → mock receipt → next step unlocks.
7. eMessage notification fires; AI answers "why is this locked?"; COMPASS badges
   funded programs.

Step 4 is the pitch in one interaction, and it costs one dropdown because the
matcher is pure.

---

## 9. Error handling

- **Catalog validated at load time** — missing `source`, unknown `journey` id, or
  a rule without a `label` throws at startup, never mid-demo.
- **React error boundary per screen** so one bad render cannot take down the shell.
- **Domain layer has no failure modes** — pure functions over in-memory data.
- API errors are handled entirely by §6.5.

---

## 10. Testing

Priority order:

1. **Domain** (`node:test`, no browser): golden profiles — Mika, 45-year-old
   informal worker, solo parent, senior, and an **empty profile** — run against the
   catalog with a fixed `now`. Assert tiers, reasons, blockers, gaps. The empty
   profile must yield `needs-info` everywhere and never a blocker.
2. **Catalog validation**: every entry has `source`, `verifiedOn`, a valid `gate`,
   labelled rules, and a `journey` that exists.
3. **Mock/live shape parity**: each capability's mock fixture must satisfy the
   same shape assertion as its live response. This is what prevents integrations
   breaking on the day a real URL arrives.
4. **Manual preflight**: `/api/health` before every demo run.

No component or E2E tests — at this scale they cost more than they return.

---

## 11. Scope boundaries

**In scope:** domain layer, 6-domain catalog (15–20 programs), capability layer
with server-side mocks for all 8 services, `App.jsx` decomposition, discovery and
persona UI, domain tests.

**Out of scope:** router, state library, TypeScript, component/E2E tests, PWA
service worker, multi-language, real PII handling of any kind.

**Known risk accepted by the product owner:** 15–20 programs at hackathon speed
means some entries will not be fully researched. Mitigated by the mandatory
`verifiedOn` date and the `verification: 'unverified'` flag, which the UI surfaces
rather than hides.

---

## 12. Prerequisite fixes

Independent of the above, and cheap:

- `AlertCircle` is used at `src/App.jsx:727` but never imported — the payment
  error path throws `ReferenceError` instead of rendering the error card.
- `node_modules` is not installed.
- `vercel.json` lacks `X-Frame-Options` and a CSP, both required by `TASKS.md` §12.

---

## 13. Implementation phasing

This spec is larger than one sitting. It decomposes into four phases, each
independently demoable — so an unfinished later phase never leaves the product
in a non-working state.

**Phase 1 — Foundation and engine.** §12 fixes, `api/_lib` plumbing
(`config.js`, `http.js`, `errors.js`, `capability.js`), `/api/health`, and the
pure domain layer (`profile.js`, `matcher.js`, `journey.js`) with the education
catalog migrated out of `App.jsx` and domain tests green.
*Demoable:* the existing journey, unchanged, now data-driven.

**Phase 2 — Discovery.** Remaining five catalog domains, `App.jsx`
decomposition into `src/pages/`, discovery screen, persona picker, gap prompt.
*Demoable:* the full §8 flow through step 5 — the core pitch.

**Phase 3 — Live capabilities.** eGov AI first (credential and host both
verified), then eGovPay verification, then each remaining service as its URL is
confirmed. Server-side mocks ship for all eight regardless.
*Demoable:* real AI assistance inside the journey.

**Phase 4 — Right-time signals.** eMessage notification, COMPASS funding badges,
eVerify and Face Liveness behind the Digital ID flow.
*Demoable:* the complete §8 flow.

Phases 1 and 2 are the product. Phases 3 and 4 are enrichment, and their
per-service work is independent — a service whose URL never arrives simply stays
mocked and flagged.
