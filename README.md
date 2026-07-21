# eAbot

**Hanapin. Gabayan. Iabot.**

eAbot is a standalone, mobile-first government journey guide created for the DICT eGov Hackathon. It helps citizens discover benefits they may not know about, understand government requirements in the correct order, and reach a service hub only when they are ready.

This implementation is a functional hackathon prototype with synthetic citizen data. It is not connected to eGovPH, DSWD, ARTA, PSA, any Serbisyo Hub, or another government system.

## Included demo journey

- Three-step trust onboarding with an explicit benefit-matching consent screen
- Proactive Social Pension match for the synthetic citizen “Rosa Villanueva”
- Deterministic five-check readiness journey that moves from 60% to 100%
- “Huwag Mo Akong Pabalikin” pre-visit check
- Human-confirmed Serbisyo Hub appointment request simulation
- Goal-based service search and Taglish eAbot assistant
- Evidence-backed complaint preview generated from the demo journey
- Easy Mode, read-aloud, voice-input fallback, keyboard support, and responsive layouts
- Local persistence for non-sensitive demo progress

## Trust boundaries

- All identities, rules, documents, fees, appointments, messages, and complaint references are illustrative.
- The assistant explains a fixed demo knowledge base; deterministic rules control eligibility and readiness.
- “Possible match” does not mean eligible or approved.
- “100% ready” means ready to request a visit, not approved for a benefit.
- No real PSN, government password, payment credential, or document should be entered.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite and select **Simulan ang guided demo**.

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

The repository contains a `vercel.json` configured for Vite.

1. Import the GitHub repository into Vercel.
2. Keep the detected framework as **Vite**.
3. Use `npm run build` and the `dist` output directory.
4. Deploy.

Future authorized government integrations should be implemented through server-side adapters or Vercel Functions. Never expose integration credentials in Vite client code.

## Product direction

eAbot is intentionally standalone today. Its adapter boundary is designed so an authorized future integration could replace demo identity, messaging, payment, reporting, and scheduling services without rebuilding the citizen-facing Discover and Journey experiences.
