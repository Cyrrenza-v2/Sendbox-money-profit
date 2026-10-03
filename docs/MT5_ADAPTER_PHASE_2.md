# VELTRION Phase 2 — MT5 Adapter

## Purpose

The `mt5-adapter` Supabase Edge Function is a broker-neutral, authenticated gateway between VELTRION and an authorized MT5 bridge/terminal agent. It is separate from the existing Deriv trading service and does not pretend that an MT5 heartbeat is a broker session.

Supported operations (POST body):

```json
{
  "operation": "health | account | sync | positions | orders | execution_reports | place_order | cancel_order",
  "connection_id": "owned mt5_connections UUID",
  "request_id": "optional idempotency/correlation ID",
  "payload": {}
}
```

The function authenticates the caller with Supabase Auth and verifies that the selected `mt5_connections` row belongs to that caller. It keeps the bridge secret server-side and sends only the selected connection metadata plus the requested operation to the bridge.

## Required server-side secrets/configuration

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MT5_BRIDGE_URL`: HTTPS base URL of the operator-controlled bridge
- `MT5_BRIDGE_SECRET`: bridge-to-function shared secret
- `MT5_LIVE_ORDERS_ENABLED`: defaults to disabled; set to `true` only after broker authorization, risk controls, and test certification
- `MT5_MAX_ORDER_VOLUME`: defaults to `1`; tune to a conservative broker-approved limit

Never put bridge secrets, MT5 passwords, service-role keys, or broker tokens in frontend code, GitHub commits, logs, or responses.

## Bridge HTTP contract

The function sends POST requests to:

- `/v1/mt5/health`
- `/v1/mt5/account`
- `/v1/mt5/sync`
- `/v1/mt5/positions`
- `/v1/mt5/orders`
- `/v1/mt5/execution-reports`
- `/v1/mt5/place-order`
- `/v1/mt5/cancel-order`

Headers: `Authorization: Bearer <MT5_BRIDGE_SECRET>`, `Content-Type: application/json`, `X-Request-Id`.

Request JSON contains `request_id`, `operation`, `connection` (id, broker, server, login, environment), and `payload`. The bridge must validate all values independently, authorize the account at the broker, enforce broker symbol/volume/price/market-hours constraints, deduplicate `client_order_id`, and return normalized JSON.

For `sync`, the response must include:
```json
{
  "account": {
    "account_number": "broker account identifier",
    "currency": "USD",
    "balance": 1000,
    "equity": 1000,
    "margin": 0,
    "free_margin": 1000
  },
  "positions": [],
  "orders": [],
  "execution_reports": []
}
```

The adapter mirrors account data into `mt5_accounts`, appends `mt5_account_snapshots`, and writes sync summaries to `mt5_sync_events`. Position, order and deal reconciliation must be tested against the broker bridge's normalized IDs and existing database constraints before enabling automatic full-history ingestion.

## Order safety

- Caller ownership is checked server-side; a caller cannot select another user's connection.
- Market/limit/stop order type, side, symbol, volume, client order ID, and optional stop-loss/take-profit fields are validated.
- Real/live/production routing is disabled unless `MT5_LIVE_ORDERS_ENABLED=true`; this is a second gate, not a substitute for account-level risk controls.
- Demo routing still requires a configured, trusted bridge and broker account.
- Every bridge call has a 12-second timeout and a correlation ID.
- A successful HTTP response means the bridge accepted/responded to the request, not necessarily that a trade was filled. Use execution reports to confirm final status.

## Not yet complete / acceptance criteria

This gateway is a Phase 2 integration boundary, not a complete production MT5 deployment. It requires a compatible bridge agent and an authorized broker/MT5 environment. No broker credentials or bridge URL are committed.

Before enabling real orders:
1. Implement or provision the MT5 bridge against an authorized MetaTrader/broker API.
2. Add idempotent execution, account-level risk limits, max exposure and emergency-stop checks at the bridge and server.
3. Test account sync, reconnects, duplicate requests, partial fills, rejections, cancellations, stale positions, and reconciliation with two isolated test users.
4. Verify every write against the live schema and RLS; confirm broker execution reports before updating final order state.
5. Keep live routing disabled until the acceptance suite passes.
