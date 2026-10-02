# VELTRION — Private Trading & Financial Control Platform

GitHub: https://github.com/Cyrrenza-v2/Sendbox-money-profit
Live GitHub Pages: https://cyrrenza-v2.github.io/Sendbox-money-profit/

## Build
Browser → GitHub Pages → Supabase Auth/Data → protected Supabase Edge Functions → Deriv/MT5 integrations.

The GitHub repository is the canonical source of truth. AppDeploy is used only for optional visual QA.

The web client uses the Supabase publishable key only. Never commit service-role keys, OAuth client secrets, access tokens or MT5 passwords.

Current UI is mobile responsive, data-driven from Supabase, and keeps sandbox values visibly separate from real-account data.

Deriv OAuth is routed through the existing Supabase `deriv-oauth` function.

## Deployment
GitHub Actions builds `frontend/` with Vite and deploys only `frontend/dist` to GitHub Pages. The deployment workflow also provides the SPA `404.html` fallback.

Build commit: VELTRION Phase 8 operations/risk controls.
