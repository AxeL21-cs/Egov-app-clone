# eAbot

eAbot is a standalone, mobile-first opportunity and document-readiness webapp for the DICT eGov Hackathon. The demo follows Mika, a fictional 18-year-old incoming college freshman, as they discover government education support and turn complex requirements into a clear next-action plan.

The interface is inspired by the soft, airy component grammar of eGovPH while using original eAbot branding, content, and illustrations. It is a React/Vite webapp designed for Vercel—not a native mobile app or an eGovPH clone.

## Guided demo

The primary judge path includes:

1. Discover three distinct education-support pathways.
2. Select the current CHED merit-readiness path.
3. Review a dependency-aware document checklist.
4. Request a supporting PSA birth certificate through a mocked future eGov connection.
5. Complete a visibly non-functional mock QR payment.
6. Receive a mock receipt.
7. Return to the checklist with the request marked processing and the next school document unlocked.
8. Choose one of several accepted income-document branches.

TES is correctly represented as a school-mediated path that generally becomes actionable after enrollment. DSWD AICS Educational Assistance is represented as crisis assistance subject to social-worker assessment, not as a scholarship.

## Safety boundaries

- Every identity, match, upload, fee, QR, payment, receipt, and transaction reference is synthetic.
- Possible matches are not eligibility decisions or approvals.
- The scholarship payment shown is for a separately requested supporting document; eAbot never presents a scholarship application fee.
- The QR is non-functional and marked `DEMO — DO NOT PAY`.
- The prototype does not accept real documents, IDs, payment credentials, or account information.
- Government, school, receipt, and document-service APIs remain mocked; eGovPay is restricted to test-mode transactions.
- Published requirements and availability can change; the responsible agency or school remains authoritative.

## eGovPay test integration

The payment screen can create a hosted eGovPay **test-mode** transaction for the fixed ₱155 demo document request and query its transaction status. The server rejects any API key that does not start with `test_`. The user may always continue the guided demo without paying.

Required server-side environment variables:

```env
EGOVPAY_API_BASE_URL=
EGOVPAY_API_KEY=test_...
EGOVPAY_SETTLEMENT_TEMPLATE_UUID=
EGOVPAY_APP_URL=
```

`EGOVPAY_APP_URL` should be the deployed Vercel origin when callbacks need to be publicly reachable. These values are used only by `/api/egovpay/*` and must never be renamed with the `VITE_` prefix.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

The repository includes a Vite-ready `vercel.json`.

1. Import the GitHub repository into Vercel.
2. Keep the detected framework as **Vite**.
3. Use `npm run build`.
4. Use `dist` as the output directory.
5. Deploy.

Future authorized integrations should use server-side adapters or Vercel Functions. Never expose government-integration credentials in Vite client code.

## Design specification

The active interface contract is in [`docs/eAbot_Visual_Design.md`](docs/eAbot_Visual_Design.md).
