# eGovPH webapp prototype

A responsive React/Vite prototype inspired by the supplied eGovPH mobile dashboard reference.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite. The prototype includes functional search and filtering, category shortcuts, an announcement carousel, service detail sheets, demo QR scanning, a digital ID preview, local transaction history, and account preferences.

## Deploy to Vercel

The project includes a `vercel.json` and is ready for Vercel's Vite preset.

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. If this folder is inside a larger repository, set **Root Directory** to `outputs/egovph-webapp`.
4. Deploy. Vercel will run `npm run build` and publish the `dist` directory.

You can also deploy from this directory with `npx vercel` after signing in.

> This is an independent UI prototype. It does not connect to Philippine government systems and should not be used for real identity or service transactions.
