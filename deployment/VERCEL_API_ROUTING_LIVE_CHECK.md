# Vercel API routing redeploy

Forces a deployment from the corrected `vercel.json` API routing configuration.

- `/api/*` is routed to serverless functions.
- SPA fallback is not used for `/api/*`.
- Real trading remains paused.
