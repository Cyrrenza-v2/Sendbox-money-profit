# VELTRION Deriv demo and MT5 bridge deployment

This deployment is intentionally limited to read-only Deriv API demo verification and owner-scoped MT5 snapshots. It does not enable live trading.

## Preconditions
- Review and merge PR #17 before deploying.
- Use the existing Supabase project `qalowxnqngzsdlayqivr`.
- Confirm the project already has the required server-side secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, and the configured Deriv OAuth client ID. Never commit secret values.
- Keep the real-account emergency stop and all production trading gates unchanged.

## Deploy from the repository root
Use a trusted development environment with the Supabase CLI installed and authenticated:

```sh
supabase link --project-ref qalowxnqngzsdlayqivr
supabase functions deploy deriv-oauth --no-verify-jwt
supabase functions deploy deriv-demo-session
supabase functions deploy mt5-bridge
```

The OAuth callback intentionally uses `verify_jwt = false` because its callback route cannot carry the VELTRION user JWT; its start route requires an authenticated user and the callback validates one-time state and PKCE. The demo session and MT5 bridge keep gateway JWT verification enabled.

## Post-deployment checks
1. Confirm the three function versions are ACTIVE in Supabase.
2. Sign in to VELTRION and use **Connect / Refresh Deriv** with a demo API account.
3. Use **Verify Demo API Account** and confirm a demo balance is returned with `read_only: true`.
4. Confirm demo balances do not change `real_trading_accounts` or Profit Wallet records.
5. Confirm MT5 `GET /snapshot` rejects unauthenticated requests and returns only rows belonging to the authenticated user.
6. Confirm MT5 heartbeat rows are tagged `demo`.
7. Do not test or enable real order execution as part of this release.

## Rollback
If the demo check fails, redeploy the previously deployed function versions from the Supabase dashboard or the last known-good Git revision. Do not change the real trading gates to work around a demo connection error.
