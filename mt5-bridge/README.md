# VELTRION read-only MT5 bridge

This bridge connects a desktop MT5 terminal to VELTRION for **telemetry only**.

## What it sends

- account balance, equity, margin and free margin
- broker/server/login metadata
- open positions
- active pending orders
- recent historical orders
- recent historical deals/trade history

It does **not** import or store the MT5 password and it does **not** call any MT5 trading function.

The EA uses MQL5 `WebRequest()`, which requires the Supabase function URL to be added to MT5's **Tools → Options → Expert Advisors → Allow WebRequest for listed URL** list. MQL5 documents this requirement for WebRequest. 

## Install

1. Use Deriv MT5 desktop on Windows or macOS. Deriv recommends desktop when Expert Advisors are required.
2. In MetaEditor, create/open:
   `MQL5/Experts/VELTRION_MT5_ReadOnly.mq5`
3. Paste the EA from this directory and compile it.
4. In MT5, allow this URL:
   `https://qalowxnqngzsdlayqivr.supabase.co`
5. Attach **VELTRION_MT5_ReadOnly** to any chart.
6. Set:
   - `BridgeUrl`: the supplied VELTRION Supabase heartbeat endpoint.
   - `BridgeToken`: the private VELTRION bridge token. **Never use the MT5 password here.**
   - `VeltrionUserId`: the owner's Supabase Auth user UUID.
7. Keep the EA running. It sends a heartbeat every 5 seconds by default.

## Safety boundary

The EA contains no `CTrade`, `OrderSend`, `OrderModify`, `PositionClose`, or other order-placement code. It only reads MT5 account state/history and sends JSON telemetry.

VELTRION remains read-only. Real orders must continue to be placed through the official Deriv MT5 terminal.

## Important

Do not paste the bridge token, MT5 password, Supabase access token, or other secrets into ChatGPT.

The current VELTRION Edge Function expects the bridge token and validates the supplied owner user UUID before storing telemetry.
