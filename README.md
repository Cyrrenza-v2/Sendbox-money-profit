# VELTRION — Private Trading & Financial Control Platform

GitHub: https://github.com/Cyrrenza-v2/Sendbox-money-profit

## Build
Browser → GitHub Pages → Supabase Auth/Data → protected Supabase Edge Functions → Deriv/MT5 integrations.

The web client uses the Supabase publishable key only. Never commit service-role keys, OAuth client secrets, access tokens or MT5 passwords.

Current UI is mobile responsive, data-driven from Supabase, and keeps sandbox values visibly separate from real-account data.

Deriv OAuth is routed through the existing Supabase `deriv-oauth` function.

Build commit: VELTRION web shell connected to Supabase.
