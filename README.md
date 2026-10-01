Yes — you mean the entire VELTRION frontend: every screen, view, navigation item, component, state, and user interaction.

The backend plan defines what powers the system. What you want now is the complete frontend/view master plan.

VELTRION — COMPLETE FRONTEND MASTER PLAN

The frontend should be treated as one complete product, not just a Home dashboard.

VELTRION
                            │
                    ┌───────┴───────┐
                    │   APP SHELL   │
                    └───────┬───────┘
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
      HOME               TRADING             DERIV
        │                   │                    │
        │             ┌─────┼─────┐        ┌─────┼─────┐
        │             │     │     │        │     │     │
     Overview       Markets Positions Orders Account Wallet
        │
        ├── SANDBOX
        ├── MT5
        ├── REAL
        ├── PROFIT WALLET
        ├── ANALYTICS
        ├── OPERATIONS
        ├── SECURITY
        └── SETTINGS


---

1. FRONTEND PRODUCT STRUCTURE

The entire application should contain:

Authentication

1. Welcome


2. Login


3. Session verification


4. Device/session security



Main application

5. Home


6. Trading


7. Markets


8. Positions


9. Orders


10. Trade History



Deriv

11. Deriv Connection


12. Deriv Account


13. Deriv Wallet


14. Deriv Transactions



MT5

15. MT5 Overview


16. MT5 Virtual Account


17. MT5 Connection


18. MT5 Credentials


19. MT5 Positions


20. MT5 Orders



Sandbox

21. Sandbox Overview


22. Sandbox Capital


23. Sandbox Positions


24. Sandbox Orders


25. Sandbox Ledger


26. Sandbox Performance



Real

27. Real Account


28. Real Trading


29. Real Positions


30. Real Orders


31. Real Performance


32. Real Transactions



Profit Wallet

33. Wallet Overview


34. Wallet Transactions


35. Withdraw


36. Withdrawal History


37. Settlement



Analytics

38. Performance


39. P/L


40. Equity


41. Drawdown


42. Risk


43. Markets


44. Reports



Operations

45. System Health


46. Connections


47. Alerts


48. Reconciliation


49. Jobs


50. Emergency Controls



Security

51. Security Overview


52. Sessions


53. Devices


54. Audit Log


55. Security Settings



Settings

56. General


57. Trading Settings


58. Risk Settings


59. Notifications


60. Appearance


61. System Configuration



That's the complete frontend surface.


---

2. APP SHELL

Every authenticated screen uses the same application shell.

┌─────────────────────────────────────────────────────────┐
│ VELTRION                         🔔   ADMIN      ● LIVE │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│ HOME         │                                          │
│              │                                          │
│ TRADING      │                                          │
│  Markets     │             CURRENT VIEW                 │
│  Positions   │                                          │
│  Orders      │                                          │
│  History     │                                          │
│              │                                          │
│ DERIV        │                                          │
│ MT5          │                                          │
│ SANDBOX      │                                          │
│ REAL         │                                          │
│ WALLET       │                                          │
│ ANALYTICS    │                                          │
│ OPERATIONS   │                                          │
│ SECURITY     │                                          │
│ SETTINGS     │                                          │
│              │                                          │
│ LOG OUT      │                                          │
└──────────────┴──────────────────────────────────────────┘

Desktop

Persistent sidebar.

Tablet

Collapsible sidebar.

Phone

Bottom navigation + drawer.


---

3. MOBILE NAVIGATION

Because you will likely use the system from a phone, mobile must be designed independently rather than simply shrinking desktop.

Bottom navigation:

┌───────────────────────────────────────┐
│                                       │
│              CURRENT VIEW             │
│                                       │
├───────────────────────────────────────┤
│  Home    Markets   Trade   Wallet  ☰ │
└───────────────────────────────────────┘

The hamburger opens the complete navigation.


---

4. LOGIN VIEW

┌──────────────────────────────┐
│                              │
│          VELTRION            │
│   PRIVATE TRADING PLATFORM   │
│                              │
│ Email                        │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ └──────────────────────────┘ │
│                              │
│ Password                     │
│ ┌──────────────────────────┐ │
│ │                    👁    │ │
│ └──────────────────────────┘ │
│                              │
│       [ SIGN IN ]            │
│                              │
│ Secure connection ●          │
│                              │
└──────────────────────────────┘

No fake login.


---

5. HOME — COMMAND CENTER

This is the main view.

┌──────────────────────────────────────────────────────┐
│ Good afternoon, Admin                     🔔         │
│ VELTRION Command Center                              │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ┌──────────────────────┐ ┌─────────────────────────┐ │
│ │ SANDBOX PROFIT       │ │ VIRTUAL CAPITAL         │ │
│ │                      │ │                         │ │
│ │ $0.00                │ │ $100,000.00             │ │
│ │                      │ │                         │ │
│ │ Today    $0.00       │ │ Balance    $100,000     │ │
│ │ Total    $0.00       │ │ Equity     $100,000     │ │
│ │                      │ │ Available  $100,000     │ │
│ │ VIRTUAL / NON-REAL   │ │                         │ │
│ └──────────────────────┘ └─────────────────────────┘ │
│                                                      │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────┐ │
│ │ TODAY'S P/L    │ │ OPEN POSITIONS │ │ EXPOSURE   │ │
│ │ $0.00          │ │ 0              │ │ $0.00      │ │
│ └────────────────┘ └────────────────┘ └────────────┘ │
│                                                      │
│ MARKET OVERVIEW                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ EURUSD     LIVE                                  │ │
│ │ XAUUSD     LIVE                                  │ │
│ │ BTCUSD     LIVE                                  │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ SYSTEM STATUS                                        │
│ Deriv       ● Connected                             │
│ MT5         ● Test / Not connected                  │
│ Sandbox     ● Active                                │
│ Real        ● Paused                                │
└──────────────────────────────────────────────────────┘

No hardcoded balances or fake connection statuses.


---

6. TRADING VIEW

The Trading section becomes the actual trading workspace.

┌─────────────────────────────────────────────────────┐
│ TRADING                           SANDBOX ▼         │
├──────────────────────┬──────────────────────────────┤
│ MARKETS              │                              │
│                      │ EURUSD                       │
│ EURUSD               │                              │
│ XAUUSD               │      PRICE CHART             │
│ BTCUSD               │                              │
│ GBPUSD               │                              │
│                      │                              │
│                      ├──────────────────────────────┤
│                      │ ORDER PANEL                  │
│                      │                              │
│                      │ Size                         │
│                      │ [        ]                   │
│                      │                              │
│                      │ SL        TP                 │
│                      │ [ ]       [ ]                │
│                      │                              │
│                      │ [ BUY ]       [ SELL ]       │
└──────────────────────┴──────────────────────────────┘

The mode selector must be very clear:

SANDBOX
REAL

And REAL should require additional confirmation and backend authorization.


---

7. MARKETS VIEW

MARKETS

Search markets 🔎

Symbol     Bid       Ask       Spread      Status
────────────────────────────────────────────────
EURUSD     —         —         —           LIVE
GBPUSD     —         —         —           LIVE
XAUUSD     —         —         —           LIVE
BTCUSD     —         —         —           LIVE

Selecting a market opens:

Market Details
├── Live price
├── Chart
├── Bid/Ask
├── Spread
├── Market status
├── Recent movement
├── Open positions
└── Trade


---

8. POSITIONS VIEW

OPEN POSITIONS

Symbol   Side   Size   Entry   Current   P/L
──────────────────────────────────────────────
EURUSD   BUY    0.10   —       —         —

Total floating P/L: $0.00
Exposure: $0.00

Selecting a position:

Position Details
├── Entry
├── Current
├── Size
├── P/L
├── Stop Loss
├── Take Profit
└── Close Position


---

9. ORDERS VIEW

ORDERS

OPEN
PENDING
COMPLETED
REJECTED
CANCELLED

Each order shows:

Order ID
Symbol
Side
Size
Price
Status
Created
Updated


---

10. HISTORY VIEW

Complete historical activity:

TRADE HISTORY

Date
Symbol
Side
Entry
Exit
Size
P/L
Duration
Status

Filters:

Today
7 days
30 days
Custom
Symbol
Mode
Result


---

11. DERIV SECTION

Deriv Connection

DERIV

Connection Status
● CONNECTED

Account
CR1234567

Currency
USD

[ REFRESH CONNECTION ]

Market Data
● LIVE

If disconnected:

DERIV
● DISCONNECTED

Market data unavailable.

[ CONNECT DERIV ]


---

12. DERIV ACCOUNT

DERIV ACCOUNT

Account ID       CR1234567
Currency         USD
Balance          $—
Equity           $—
Status           CONNECTED

Portfolio
Transactions
Trading

All real values come from Deriv/backend.


---

13. DERIV WALLET

DERIV WALLET

Available
$—

Reserved
$—

Total
$—

Recent transactions
────────────────────
Deposit
Withdrawal
Trade
Transfer


---

14. MT5 OVERVIEW

MT5

CONNECTION
● CONNECTED / TEST / DISCONNECTED

ACCOUNT

Login        —
Server       —
Balance      —
Equity       —
Margin       —
Free Margin  —

[ OPEN MT5 ]

Only show actual server/login information once genuine MT5 infrastructure exists.


---

15. MT5 CONNECTION

MT5 CONNECTION

Server
┌───────────────────────┐
│ Actual provisioned    │
└───────────────────────┘

Login
┌───────────────────────┐
│ Actual account        │
└───────────────────────┘

Status
● Connected

[ TEST CONNECTION ]

No invented credentials.


---

16. MT5 VIRTUAL ACCOUNT

MT5 VIRTUAL ACCOUNT

Balance
$100,000.00

Equity
$100,000.00

Margin
$0.00

Free Margin
$100,000.00

Positions
0

Orders
0

The frontend clearly labels it:

VIRTUAL / SANDBOX


---

17. SANDBOX SECTION

The Sandbox section gets its own complete workspace.

SANDBOX

Overview
Capital
Positions
Orders
Ledger
Performance
Risk


---

18. SANDBOX OVERVIEW

SANDBOX

● ACTIVE

Virtual Capital
$100,000.00

Balance
$100,000.00

Equity
$100,000.00

Today's P/L
$0.00

Total P/L
$0.00

Open Positions
0


---

19. SANDBOX CAPITAL

SANDBOX CAPITAL

Starting Capital
$100,000.00

Current Balance
$100,000.00

Reserved
$0.00

Available
$100,000.00

Floating P/L
$0.00

Realized P/L
$0.00


---

20. SANDBOX LEDGER

This is the accounting history.

SANDBOX LEDGER

Time       Type           Amount       Balance
──────────────────────────────────────────────
10:00      INITIAL        +100,000     100,000
10:15      TRADE RESERVE  —            —
10:40      PROFIT         +250         100,250


---

21. SANDBOX PERFORMANCE

Charts:

EQUITY CURVE
──────────────
       ╱╲
      ╱  ╲
─────╯    ╲────

Daily P/L
Win rate
Drawdown
Profit factor

All generated from actual backend records.


---

22. REAL SECTION

This section must visually distinguish real money from sandbox.

REAL

⚠ REAL ACCOUNT

Account
Deriv Real Account

Balance
$—

Equity
$—

Trading
● PAUSED

[ VIEW ACCOUNT ]

When real trading is disabled:

REAL TRADING PAUSED

Real trading is currently disabled by system controls.


---

23. REAL TRADING VIEW

When authorized:

REAL TRADING

REAL ACCOUNT ● CONNECTED

Available
$—

Market
EURUSD

Size
[      ]

Stop Loss
[      ]

Take Profit
[      ]

[ BUY ]

[ SELL ]

Before execution:

CONFIRM REAL ORDER

You are about to submit a REAL trade.

Account: CRxxxx
Symbol: EURUSD
Side: BUY
Size: 0.10

[ CANCEL ] [ CONFIRM ]


---

24. REAL POSITIONS

REAL POSITIONS

Account
CRxxxx

Symbol
Side
Size
Entry
Current
P/L
Status

No sandbox positions appear here.


---

25. REAL PERFORMANCE

REAL PERFORMANCE

Balance
$—

Equity
$—

Realized P/L
$—

Floating P/L
$—

Drawdown
—

Trades
—


---

26. PROFIT WALLET

PROFIT WALLET

┌───────────────────────────────┐
│ AVAILABLE                     │
│                               │
│ $—                            │
│                               │
│ REAL / SETTLED FUNDS ONLY     │
└───────────────────────────────┘

Reserved       $—
Processing     $—

[ WITHDRAW ]

Important distinction:

Sandbox profit does not automatically appear here.


---

27. WALLET TRANSACTIONS

WALLET TRANSACTIONS

Type          Amount       Status
──────────────────────────────────
Profit        $—           SETTLED
Withdrawal    $—           COMPLETED
Transfer      $—           PROCESSING


---

28. WITHDRAWAL VIEW

WITHDRAW FUNDS

Available
$—

Amount
┌──────────────────────┐
│                      │
└──────────────────────┘

Destination
┌──────────────────────┐
│                      │
└──────────────────────┘

[ CONTINUE ]

Then:

CONFIRM WITHDRAWAL

Amount: $—
Destination: —

Status:
Funds will be reserved before processing.

[ CANCEL ] [ CONFIRM ]


---

29. WITHDRAWAL HISTORY

WITHDRAWAL HISTORY

ID
Amount
Destination
Requested
Status
Completed

Clicking one opens its complete event timeline.


---

30. ANALYTICS

Analytics should be a dedicated professional dashboard.

ANALYTICS

Performance
Risk
Equity
Drawdown
Markets
Reports


---

31. PERFORMANCE VIEW

PERFORMANCE

Total P/L       $—
Today's P/L     $—
Weekly P/L      $—
Monthly P/L     $—

Win Rate        —%
Profit Factor   —
Trades          —
Average Win     $—
Average Loss    $—

Mode selector:

SANDBOX ▼
REAL

Never combine them into one financial figure.


---

32. RISK VIEW

RISK

Current Exposure       $—
Maximum Exposure       $—

Open Positions         —
Daily Loss             $—
Daily Loss Limit       $—

Drawdown               —%
Maximum Drawdown       —%

Risk Status
● NORMAL

If limits are reached:

⚠ RISK LIMIT REACHED

New trades have been blocked.


---

33. OPERATIONS DASHBOARD

This is the backend control panel exposed to the frontend.

OPERATIONS

SYSTEM HEALTH

API               ● HEALTHY
DATABASE          ● HEALTHY
AUTH              ● HEALTHY
DERIV             ● CONNECTED
MARKET            ● LIVE
SANDBOX           ● ACTIVE
MT5               ● TEST
REAL TRADING      ● PAUSED
WALLET            ● HEALTHY
RECONCILIATION    ● SYNCED


---

34. CONNECTIONS VIEW

CONNECTIONS

Deriv
● Connected
Last sync: —

Market Data
● Live

MT5
● Test

Database
● Healthy

Selecting a service gives diagnostics.


---

35. ALERTS VIEW

ALERTS

● All
● Critical
● Warning
● Informational

────────────────────────────

Market data disconnected
2 minutes ago
WARNING

Deriv connection restored
10 minutes ago
INFO


---

36. RECONCILIATION VIEW

RECONCILIATION

Deriv
● SYNCED

MT5
● SYNCED

Wallet
● SYNCED

Last Run
10:32:15

Mismatches
0

[ RUN RECONCILIATION ]

If a mismatch occurs:

⚠ RECONCILIATION MISMATCH

Internal balance: $10,000
External balance: $9,850

Real trading has been paused.

[ VIEW DETAILS ]


---

37. EMERGENCY CONTROL VIEW

This should be protected.

EMERGENCY CONTROLS

Global Trading
● ENABLED

Sandbox Trading
● ENABLED

Real Trading
● PAUSED

Withdrawals
● ENABLED

Market Processing
● ENABLED

Buttons:

[ PAUSE ALL TRADING ]

[ PAUSE REAL TRADING ]

[ PAUSE WITHDRAWALS ]

Every action requires confirmation and produces an audit record.


---

38. SECURITY DASHBOARD

SECURITY

Security Status
● SECURE

Current Session
Device
Login time
Last activity

Active Sessions
1

Security Events
0 unresolved

Audit Log


---

39. DEVICES

DEVICES

Samsung / Android
CURRENT DEVICE
● ACTIVE

Last active
Now

[ REVOKE ]


---

40. SESSIONS

ACTIVE SESSIONS

Current Android session
● ACTIVE

Last activity
Now

Location/network metadata
where appropriate

[ SIGN OUT OTHER SESSIONS ]


---

41. AUDIT LOG

AUDIT LOG

Time       Action               Result
────────────────────────────────────────
10:30      Login                SUCCESS
10:35      Deriv Connect        SUCCESS
10:40      Sandbox Order        SUCCESS
10:45      Risk Setting Change  SUCCESS

Selecting an event opens details.


---

42. SETTINGS

SETTINGS

General
Trading
Risk
Notifications
Appearance
System

General

Account
Language
Currency
Timezone

Trading

Default mode
Default order size
Chart settings
Confirmation settings

Risk

Max exposure
Max daily loss
Max positions
Max order size

Risk settings require elevated authorization.


---

43. NOTIFICATION CENTER

Top-right notification icon opens:

NOTIFICATIONS

● Market data restored
● Sandbox trade closed
⚠ High exposure
● Deriv connected

Critical notifications remain visible until acknowledged.


---

44. GLOBAL MODE INDICATOR

This should appear throughout the application.

┌─────────────────┐
│ SANDBOX         │
│ VIRTUAL         │
└─────────────────┘

or:

┌─────────────────┐
│ REAL            │
│ LIVE FUNDS      │
└─────────────────┘

This prevents accidental confusion.


---

45. GLOBAL CONNECTION INDICATOR

Header:

● SYSTEM LIVE

Clicking it:

SYSTEM STATUS

API             ●
DATABASE        ●
DERIV           ●
MARKET          ●
MT5             ●
SANDBOX         ●
REAL            ●


---

46. LOADING STATES

Every screen needs proper loading states.

Example:

SANDBOX PROFIT

Loading...
──────────

Not:

$0.00

unless $0.00 is actually the backend value.


---

47. EMPTY STATES

Example:

OPEN POSITIONS

No open positions.

[ GO TO MARKETS ]


---

48. ERROR STATES

Example:

MARKET DATA UNAVAILABLE

We couldn't retrieve live market data.

Last confirmed update:
10:31:22

[ RETRY ]

Never pretend the stale price is live.


---

49. OFFLINE MODE

If the phone loses internet:

┌─────────────────────────────────────┐
│ ⚠ CONNECTION LOST                   │
│                                     │
│ VELTRION is offline.                │
│ Live trading data is unavailable.   │
└─────────────────────────────────────┘

The app must not imply that a trade was successfully executed just because the user tapped the button.


---

50. CONFIRMATION SYSTEM

Sensitive actions require confirmation.

Sandbox trade

Normal confirmation depending on settings.

Real trade

Strong confirmation.

Withdrawal

Strong confirmation.

Risk change

Strong confirmation.

Emergency stop

Strong confirmation.


---

51. FRONTEND COMPONENT SYSTEM

Instead of building every screen separately, create reusable components:

/components
├── AppShell
├── Sidebar
├── MobileNav
├── Header
├── ModeBadge
├── StatusBadge
├── BalanceCard
├── PnLCard
├── PositionCard
├── OrderCard
├── MarketCard
├── MarketTable
├── PriceChart
├── OrderPanel
├── WalletCard
├── TransactionTable
├── AlertPanel
├── HealthPanel
├── RiskPanel
├── ConfirmationModal
├── ErrorState
├── EmptyState
├── LoadingState
└── DataTable

This keeps the entire interface consistent.


---

52. FRONTEND DATA RULE

The frontend should never own financial truth.

For example:

❌ Frontend:
balance = 100000

Instead:

Frontend
   ↓
GET /api/home/summary
   ↓
Backend
   ↓
Database
   ↓
Current balance
   ↓
Frontend


---

53. FRONTEND STATE MANAGEMENT

The frontend needs separate state domains:

authState
userState
systemState
marketState
sandboxState
derivState
mt5State
realState
walletState
analyticsState
notificationState

This prevents one part of the application from corrupting another.


---

54. ROUTE STRUCTURE

A clean route architecture:

/login

/app
/app/home

/app/trading
/app/trading/markets
/app/trading/positions
/app/trading/orders
/app/trading/history

/app/deriv
/app/deriv/account
/app/deriv/wallet
/app/deriv/transactions

/app/mt5
/app/mt5/account
/app/mt5/connection
/app/mt5/positions
/app/mt5/orders

/app/sandbox
/app/sandbox/capital
/app/sandbox/positions
/app/sandbox/orders
/app/sandbox/ledger
/app/sandbox/performance

/app/real
/app/real/account
/app/real/trading
/app/real/positions
/app/real/orders
/app/real/performance

/app/wallet
/app/wallet/transactions
/app/wallet/withdrawals

/app/analytics
/app/analytics/performance
/app/analytics/risk
/app/analytics/markets
/app/analytics/reports

/app/operations
/app/operations/health
/app/operations/connections
/app/operations/alerts
/app/operations/reconciliation
/app/operations/emergency

/app/security
/app/security/sessions
/app/security/devices
/app/security/audit

/app/settings


---

55. COMPLETE FRONTEND FLOW

The final user experience becomes:

LOGIN
                      │
                      ▼
                    HOME
                      │
       ┌──────────────┼──────────────┐
       │              │              │
    TRADING          DERIV           MT5
       │              │              │
   Markets         Account        Account
   Positions       Wallet         Connection
   Orders          Transactions   Positions
   History                         Orders
       │
       ▼
    SANDBOX
       │
   Capital
   Trading
   Positions
   Ledger
   Performance
       │
       ▼
      REAL
       │
   Account
   Trading
   Positions
   Orders
   Performance
       │
       ▼
  PROFIT WALLET
       │
   Balance
   Transactions
   Withdraw
       │
       ▼
   ANALYTICS
       │
       ▼
   OPERATIONS
       │
       ▼
   SECURITY
       │
       ▼
   SETTINGS


---

56. FINAL FRONTEND PRINCIPLE

The finished VELTRION frontend should feel like a private professional trading-control terminal, not a generic banking dashboard.

It has three layers:

Layer 1 — Financial view

Balance
Equity
P/L
Positions
Orders
Wallet

Layer 2 — Trading view

Markets
Charts
Buy/Sell
Risk
Sandbox
Real
MT5
Deriv

Layer 3 — Control view

System health
Connections
Reconciliation
Security
Audit
Emergency controls
Settings

And the most important separation remains:

VELTRION
                    │
          ┌─────────┴─────────┐
          │                   │
       SANDBOX              REAL
          │                   │
     $100,000 VIRTUAL     ACTUAL FUNDS
          │                   │
     Sandbox Ledger       Real Ledger
          │                   │
     Sandbox Wallet       Real Wallet
          │                   │
       NEVER ───────────────►
          │
     automatically
     becomes real money

So yes: this is the entire frontend/view layer that sits on top of the backend plan. The next implementation should build the App Shell + routing + Home + all navigation views as one coherent frontend, with every financial/status value wired to the backend rather than using placeholder data.VELTRION — Complete Backend Master Plan

The backend should be designed as the control center of VELTRION. The frontend should only display information and request actions. The backend owns authentication, database state, trading logic, risk controls, Deriv communication, MT5 integration, wallets, reconciliation, audit logs, and security.

The key rule is:

> Frontend requests → Backend validates → Engine executes → Database records → External system confirms → Backend reconciles → Frontend displays.




---

1. Backend Architecture

VELTRION WEB / PWA / APK
                                  │
                                  ▼
                         AUTHENTICATED API
                                  │
                     ┌────────────┴────────────┐
                     │                         │
              API / Edge Functions       WebSocket Services
                     │                         │
                     └────────────┬────────────┘
                                  ▼
                         VELTRION CORE
                                  │
          ┌───────────────┬───────┼────────┬───────────────┐
          ▼               ▼       ▼        ▼               ▼
       AUTH            SANDBOX   RISK     MARKET         WALLET
          │               │       │        │               │
          ▼               ▼       ▼        ▼               ▼
      SECURITY         TRADING  ENGINE   DERIV          LEDGER
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
                  DERIV                        MT5
             External Broker              MT5 Infrastructure
                    │                           │
                    └─────────────┬─────────────┘
                                  ▼
                           RECONCILIATION
                                  │
                                  ▼
                              SUPABASE
                            PostgreSQL DB


---

2. Backend Responsibilities

VELTRION backend will own:

1. Authentication


2. Admin authorization


3. Sessions/devices


4. Database access


5. Sandbox account


6. Sandbox trading engine


7. Market-data processing


8. Risk management


9. Deriv OAuth


10. Deriv account synchronization


11. Deriv market data


12. Real Deriv trading


13. MT5 integration


14. Virtual MT5 account management


15. Real trading separation


16. Profit wallet


17. Withdrawals


18. Ledger


19. Reconciliation


20. Alerts


21. System health


22. Audit logs


23. Scheduled jobs


24. Emergency controls


25. Analytics


26. Backups/recovery support




---

3. Backend Technology Stack

For the architecture we've been building, use:

Layer	Technology

Database	Supabase PostgreSQL
Authentication	Supabase Auth
Backend API	Supabase Edge Functions
Database security	PostgreSQL RLS
Realtime state	Supabase Realtime/WebSockets
External market	Deriv API/WebSocket
Real trading	Deriv API
MT5	Genuine MT5 infrastructure when provisioned
Secrets	Supabase/server-side secrets
Scheduled jobs	Supabase scheduled functions/cron
Source control	GitHub
CI/CD	GitHub Actions
Frontend	VELTRION Web/PWA
Mobile	Android wrapper/app later


The important point is that Supabase is the backend foundation, not the trading engine itself.


---

4. Backend Service Structure

Create the backend as separate services/modules rather than one giant function.

backend/
│
├── auth/
│   ├── authentication
│   ├── authorization
│   ├── sessions
│   └── devices
│
├── admin/
│   ├── roles
│   ├── permissions
│   └── controls
│
├── sandbox/
│   ├── accounts
│   ├── orders
│   ├── positions
│   ├── execution
│   ├── pnl
│   └── ledger
│
├── market/
│   ├── symbols
│   ├── prices
│   ├── ticks
│   ├── subscriptions
│   └── market-status
│
├── deriv/
│   ├── oauth
│   ├── accounts
│   ├── wallet
│   ├── market
│   ├── trading
│   └── reconciliation
│
├── mt5/
│   ├── accounts
│   ├── connections
│   ├── symbols
│   ├── orders
│   ├── positions
│   └── synchronization
│
├── real/
│   ├── trading
│   ├── positions
│   ├── orders
│   └── reconciliation
│
├── wallet/
│   ├── sandbox-wallet
│   ├── profit-wallet
│   ├── transactions
│   └── withdrawals
│
├── risk/
│   ├── limits
│   ├── validation
│   ├── exposure
│   └── emergency-stop
│
├── operations/
│   ├── health
│   ├── alerts
│   ├── jobs
│   ├── reconciliation
│   └── monitoring
│
├── analytics/
│   ├── performance
│   ├── pnl
│   ├── drawdown
│   └── reports
│
└── audit/
    ├── audit-log
    └── security-events


---

5. Database Layer

The database becomes the persistent source of VELTRION state.

Core database groups

Authentication

auth.users
admin_users
admin_roles
user_sessions
devices
security_events

Sandbox

sandbox_accounts
sandbox_orders
sandbox_positions
sandbox_ledger
sandbox_daily_metrics
sandbox_risk_events

Market

market_symbols
market_ticks
market_quotes
market_subscriptions
market_sessions
market_data_health

Deriv

deriv_connections
deriv_accounts
deriv_tokens
deriv_scopes
deriv_events
deriv_transactions

MT5

mt5_accounts
mt5_connections
mt5_sessions
mt5_symbols
mt5_symbol_mapping
mt5_orders
mt5_positions
mt5_events

Real trading

real_trading_accounts
real_orders
real_positions
real_transactions
real_ledger
real_execution_events

Wallet

sandbox_wallet
sandbox_wallet_transactions

real_profit_wallet
profit_wallet_transactions

withdrawals
withdrawal_events
settlement_records

Risk

risk_limits
risk_events
exposure_snapshots
emergency_controls

Operations

system_health
service_status
connection_health
alerts
alert_events
job_queue
job_events
reconciliation_runs
reconciliation_items

Analytics

analytics_daily
analytics_trade_metrics
analytics_equity_snapshots
analytics_drawdowns
analytics_market_metrics
analytics_risk_metrics
analytics_reports
analytics_insights

Audit

audit_logs


---

6. Authentication Backend

The login flow should be:

VELTRION LOGIN
      │
      ▼
Supabase Auth
      │
      ▼
Session created
      │
      ▼
Check admin_users
      │
      ▼
Check role/permissions
      │
      ▼
Create security/session record
      │
      ▼
VELTRION HOME

Every backend request should carry an authenticated session.

The backend checks:

Who is this?
        ↓
Is the session valid?
        ↓
Is the account active?
        ↓
Is this user authorized?
        ↓
Is this operation allowed?

Because VELTRION is currently private and one-person, we can initially use a single administrative account while keeping the architecture capable of supporting additional roles later.


---

7. Authorization

Do not rely on the frontend saying:

"isAdmin": true

The backend determines it.

Example:

admin_users
    │
    ├── active
    ├── role
    └── permissions

Possible permissions:

VIEW_DASHBOARD
VIEW_MARKETS
TRADE_SANDBOX
TRADE_REAL
CONNECT_DERIV
CONNECT_MT5
VIEW_WALLET
REQUEST_WITHDRAWAL
MANAGE_RISK
MANAGE_SYSTEM
VIEW_AUDIT
EMERGENCY_STOP


---

8. Sandbox Backend

This is the first complete trading engine we should make operational.

Initial account:

Account type: SANDBOX
Starting capital: $100,000
Real money: $0
Withdrawable: $0

Database:

sandbox_accounts

Example:

id
account_code
starting_capital
balance
equity
available_margin
realized_pnl
floating_pnl
used_margin
status
created_at
updated_at


---

9. Sandbox Order Flow

Every sandbox order follows:

FRONTEND
   │
   ▼
POST /sandbox/orders
   │
   ▼
AUTHENTICATION
   │
   ▼
VALIDATION
   │
   ▼
RISK ENGINE
   │
   ▼
MARKET PRICE
   │
   ▼
SANDBOX EXECUTION ENGINE
   │
   ▼
ORDER CREATED
   │
   ▼
POSITION CREATED
   │
   ▼
LEDGER UPDATED
   │
   ▼
ACCOUNT UPDATED
   │
   ▼
RESPONSE


---

10. Sandbox Order States

NEW
 │
 ▼
VALIDATING
 │
 ├──── invalid ───► REJECTED
 │
 ▼
ACCEPTED
 │
 ▼
OPEN
 │
 ▼
MONITORING
 │
 ▼
CLOSED

Never allow:

sandbox order
      ↓
real Deriv order

That separation must exist in backend code.


---

11. Market Data Backend

Deriv becomes the external market-data source.

DERIV
  │
  ▼
WebSocket
  │
  ▼
Market Service
  │
  ├── validate
  ├── timestamp
  ├── normalize
  ├── map symbol
  └── detect stale data
  │
  ▼
VELTRION MARKET CACHE
  │
  ├── Sandbox engine
  ├── Dashboard
  ├── Charts
  └── Analytics

The backend should never let the frontend invent a price.


---

12. Market Data Rules

Each market update should contain information such as:

symbol
bid
ask
last_price
timestamp
source
sequence
status

The backend tracks:

LIVE
STALE
DISCONNECTED
RECOVERING

If market data becomes stale:

MARKET DATA LOST
       ↓
STOP NEW SANDBOX ORDERS
       ↓
STOP REAL ORDERS
       ↓
RECONNECT
       ↓
REFRESH CURRENT STATE
       ↓
RECONCILE
       ↓
RESUME

No fake price should be generated to make the interface look live.


---

13. Risk Engine

The risk engine sits between the request and execution.

ORDER REQUEST
     │
     ▼
RISK ENGINE
     │
     ├── account active?
     ├── market open?
     ├── valid symbol?
     ├── valid size?
     ├── sufficient balance?
     ├── maximum exposure?
     ├── maximum positions?
     ├── daily loss?
     ├── emergency stop?
     └── connection healthy?
     │
     ▼
ALLOW / REJECT

Initial controls:

MAX_ORDER_SIZE
MAX_OPEN_POSITIONS
MAX_TOTAL_EXPOSURE
MAX_SYMBOL_EXPOSURE
MAX_DAILY_LOSS
MAX_DRAWDOWN
MAX_LEVERAGE

These values belong in the database/configuration rather than hardcoded into the UI.


---

14. P/L Engine

The backend calculates:

Equity =
Balance + Floating P/L

and:

Realized P/L
=
Closed trade results

while:

Floating P/L
=
Current market value
-
Position entry value

The frontend only receives the calculated values.


---

15. Ledger Engine

Every financial movement receives a ledger record.

For example:

START
$100,000
   │
   ▼
OPEN TRADE
   │
   ▼
RESERVE MARGIN
   │
   ▼
POSITION
   │
   ▼
CLOSE TRADE
   │
   ▼
+ $250 PROFIT
   │
   ▼
BALANCE
$100,250

The ledger provides the historical explanation for why the balance changed.


---

16. Deriv Backend

Deriv integration should have its own isolated service.

VELTRION
   │
   ▼
Deriv OAuth
   │
   ▼
User authentication/consent
   │
   ▼
Callback
   │
   ▼
State + PKCE verification
   │
   ▼
Server-side token exchange
   │
   ▼
Deriv account
   │
   ▼
VELTRION stores connection metadata

The Deriv password should not be stored in VELTRION.


---

17. Deriv Token Security

Sensitive credentials remain server-side.

Browser
  │
  │ OAuth
  ▼
Deriv
  │
  ▼
Callback
  │
  ▼
VELTRION Backend
  │
  ▼
Secure token storage

Never:

Frontend JavaScript
     ↓
Deriv access token

and never commit secrets to GitHub.


---

18. Deriv Account Synchronization

Once connected:

Deriv
 │
 ├── account ID
 ├── currency
 ├── balance
 ├── portfolio
 └── transaction state
 │
 ▼
VELTRION
 │
 ▼
deriv_accounts

VELTRION should periodically reconcile its records with Deriv rather than assuming its own database is always correct.


---

19. Real Deriv Trading Backend

Real trading must have an additional safety barrier.

REAL ORDER
    │
    ▼
AUTH
    │
    ▼
REAL MODE ENABLED?
    │
    ▼
DERIV ACCOUNT CONNECTED?
    │
    ▼
RISK CHECK
    │
    ▼
MARKET CHECK
    │
    ▼
CONNECTION HEALTH
    │
    ▼
SUBMIT TO DERIV
    │
    ▼
WAIT FOR CONFIRMATION
    │
    ▼
RECONCILE

Important:

> Submitted does not automatically mean filled.



The backend must process the actual response/state from the external trading system.


---

20. Sandbox vs Real Isolation

This is one of the most important backend rules.

VELTRION
                    │
             ┌──────┴──────┐
             │             │
         SANDBOX          REAL
             │             │
       $100,000 virtual    │
             │             │
       sandbox ledger      │
                           │
                      Deriv money
                           │
                      real ledger

There must be separate:

accounts
orders
positions
ledgers
wallets
transactions
execution events

The database should make accidental cross-mode operations difficult or impossible.


---

21. MT5 Backend

This requires a distinction.

If VELTRION wants the official MetaTrader 5 application to log into a genuine VELTRION account, VELTRION needs genuine MT5 broker/trade-server infrastructure.

The backend therefore becomes:

VELTRION
   │
   ▼
MT5 Infrastructure
   │
   ├── MT5 Server
   ├── Accounts
   ├── Symbols
   ├── Orders
   └── Positions
          │
          ▼
Official MetaTrader 5 App

VELTRION's database synchronizes with that infrastructure.

It does not pretend to be an MT5 server.


---

22. MT5 Synchronization

MT5 SERVER
    │
    ▼
MT5 Bridge / Integration
    │
    ▼
VELTRION Backend
    │
    ▼
mt5_accounts
mt5_orders
mt5_positions
mt5_events
    │
    ▼
VELTRION UI

Synchronization must handle:

CONNECTED
DISCONNECTED
RECONNECTING
SYNCING
SYNCED
ERROR

Actual MT5 server/login credentials should only appear after genuine MT5 infrastructure provisions them.


---

23. Wallet Architecture

There are actually multiple financial domains.

Sandbox wallet

$100,000 virtual

Deriv real account

External real funds

VELTRION real profit wallet

Real funds only when genuinely backed

They cannot be treated as one balance.


---

24. Profit Wallet

The wallet should have explicit states:

AVAILABLE
RESERVED
PROCESSING
WITHDRAWABLE
COMPLETED

Example:

SANDBOX PROFIT
$12,500
       │
       X
       │
       X
       ▼
REAL MONEY

That conversion must not happen automatically.

For real withdrawals, the system needs actual external funds/settlement backing.


---

25. Withdrawal Backend

WITHDRAWAL REQUEST
       │
       ▼
AUTHENTICATION
       │
       ▼
ACCOUNT CHECK
       │
       ▼
BALANCE CHECK
       │
       ▼
RISK/FRAUD CHECK
       │
       ▼
RESERVE FUNDS
       │
       ▼
PROCESS
       │
       ▼
EXTERNAL CONFIRMATION
       │
       ▼
COMPLETE

States:

REQUESTED
VALIDATING
RESERVED
PROCESSING
EXTERNAL_CONFIRMATION
COMPLETED
FAILED
REJECTED
CANCELLED

Every transition gets recorded.


---

26. Reconciliation Engine

This is critical.

The reconciliation service asks:

> Does VELTRION's database agree with the external system?



For Deriv:

VELTRION
   │
   ├── balance
   ├── positions
   ├── transactions
   │
   ▼
COMPARE
   ▲
   │
DERIV

For MT5:

VELTRION DB
     ↕
MT5 SERVER

If something differs:

MISMATCH
   │
   ▼
RECONCILIATION ITEM
   │
   ▼
ALERT
   │
   ▼
TRADING MAY BE PAUSED


---

27. System Health Service

The backend continuously monitors:

Database
Auth
API
Deriv
Market WebSocket
Sandbox engine
MT5
Wallet
Jobs
Reconciliation
Security

Example:

SYSTEM HEALTH

API              ● HEALTHY
DATABASE         ● HEALTHY
DERIV            ● CONNECTED
MARKET DATA      ● LIVE
SANDBOX ENGINE   ● ACTIVE
MT5              ● TEST
REAL TRADING     ● PAUSED
WALLET           ● HEALTHY
RECONCILIATION   ● SYNCED

These statuses must come from actual backend checks.


---

28. Background Jobs

Some backend work should happen automatically.

Examples:

market-health-check
deriv-token-check
deriv-reconciliation
mt5-sync
sandbox-metrics
equity-snapshot
risk-monitor
wallet-monitor
withdrawal-monitor
system-health
alert-processing
database-maintenance

A job queue can track:

QUEUED
RUNNING
COMPLETED
FAILED
RETRYING


---

29. Alert Engine

Backend events create alerts.

Examples:

DERIV DISCONNECTED
MARKET DATA STALE
MT5 DISCONNECTED
DAILY LOSS LIMIT REACHED
HIGH EXPOSURE
WITHDRAWAL FAILED
RECONCILIATION MISMATCH
AUTHENTICATION FAILURE
SECURITY EVENT

The frontend simply displays them.


---

30. Emergency Controls

Create a central emergency control.

emergency_controls

Possible controls:

GLOBAL_TRADING_ENABLED
SANDBOX_TRADING_ENABLED
REAL_TRADING_ENABLED
WITHDRAWALS_ENABLED
DERIV_CONNECTION_ENABLED
MT5_CONNECTION_ENABLED

Example:

GLOBAL TRADING
     │
     ▼
      OFF

Then the backend rejects new trading operations regardless of what the frontend displays.


---

31. Audit System

Every important backend action gets recorded.

Example:

audit_logs

actor
action
resource
resource_id
old_state
new_state
ip/device metadata where appropriate
timestamp
result

Examples:

LOGIN
DERIV_CONNECTED
MT5_CONNECTED
SANDBOX_ORDER_CREATED
SANDBOX_ORDER_CLOSED
REAL_TRADING_ENABLED
REAL_ORDER_SUBMITTED
WITHDRAWAL_REQUESTED
RISK_LIMIT_CHANGED
EMERGENCY_STOP

This gives VELTRION a complete history of what happened.


---

32. API Structure

A clean API could look like:

/api/auth/*
/api/admin/*
/api/home/*
/api/markets/*
/api/sandbox/*
/api/deriv/*
/api/mt5/*
/api/real/*
/api/wallet/*
/api/withdrawals/*
/api/risk/*
/api/analytics/*
/api/operations/*
/api/security/*

Examples:

GET  /api/home/summary

GET  /api/markets
GET  /api/markets/:symbol

POST /api/sandbox/orders
GET  /api/sandbox/orders
GET  /api/sandbox/positions

GET  /api/deriv/status
POST /api/deriv/connect
GET  /api/deriv/account

GET  /api/mt5/status
GET  /api/mt5/account

GET  /api/wallet
GET  /api/wallet/transactions

POST /api/withdrawals

GET  /api/operations/health
GET  /api/operations/alerts


---

33. Idempotency

Financial operations must protect against double submission.

For example, if the phone sends:

BUY BTC

and the network times out, the user might press it again.

Without protection:

BUY
BUY

could happen.

With idempotency:

request_id = ABC123

The backend sees the second request:

ABC123 already processed

and returns the existing result.

This is essential for:

orders

withdrawals

transfers

wallet operations



---

34. Database Security

Use PostgreSQL Row Level Security where appropriate.

But RLS should not be the only protection.

The complete chain is:

USER
 ↓
AUTH
 ↓
SESSION
 ↓
AUTHORIZATION
 ↓
API
 ↓
BUSINESS RULES
 ↓
RISK ENGINE
 ↓
DATABASE

Never:

USER
 ↓
DIRECT DATABASE WRITE

for sensitive financial operations.


---

35. Secrets Architecture

Never put these in frontend code:

Supabase service-role key
Deriv private credentials
OAuth secrets
MT5 administrator credentials
Encryption keys
Payment credentials
Database passwords

Instead:

Secret
  ↓
Server-side secret store
  ↓
Backend function
  ↓
External API

GitHub contains code and configuration templates, not production secrets.


---

36. Backend Environment Separation

Create:

DEVELOPMENT
STAGING
PRODUCTION

Each environment gets its own:

database
credentials
OAuth configuration
API configuration
risk settings
external connections

Most importantly:

> Development must never accidentally submit real Deriv trades.




---

37. Backend Testing Architecture

Tests should cover:

Unit

P/L
equity
margin
position
risk
ledger
wallet

Integration

Auth → API
API → database
API → Deriv
API → MT5

Security

unauthorized request
invalid session
RLS bypass attempt
mode switching
secret exposure

Financial isolation

sandbox → real = BLOCKED
real → sandbox = BLOCKED

Failure tests

Deriv offline
MT5 offline
database timeout
WebSocket disconnect
duplicate order
duplicate withdrawal
stale market
partial external response


---

38. Backend Deployment Pipeline

Developer change
      │
      ▼
GitHub
      │
      ▼
Pull Request
      │
      ▼
CI
 ├── lint
 ├── typecheck
 ├── tests
 ├── security checks
 ├── build
 └── migration checks
      │
      ▼
MERGE
      │
      ▼
STAGING
      │
      ▼
INTEGRATION TEST
      │
      ▼
PRODUCTION

Database migrations must be version-controlled.


---

39. Backend Logging

Logs should distinguish:

INFO
WARNING
ERROR
SECURITY
TRADING
FINANCIAL
SYSTEM

For example:

[TRADING]
Sandbox order SBX-00042 opened.

[MARKET]
Deriv WebSocket disconnected.

[SECURITY]
Invalid authentication attempt.

[FINANCIAL]
Withdrawal WD-0007 entered processing.

[RECONCILIATION]
Deriv balance mismatch detected.

Never log sensitive secrets.


---

40. Home Backend Endpoint

The Home page should not make 20 unrelated calls if we can avoid it.

Create:

GET /api/home/summary

It can return:

{
  sandbox: {
    balance,
    equity,
    todayPnl,
    totalPnl,
    openPositions
  },

  market: {
    status,
    symbols
  },

  deriv: {
    status,
    account
  },

  mt5: {
    status
  },

  realTrading: {
    status
  },

  wallet: {
    available
  },

  system: {
    api,
    database,
    reconciliation
  },

  alerts: []
}

The backend assembles this from the authoritative sources.


---

41. Backend Data Flow for Home

HOME API
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
   SANDBOX          CONNECTIONS       SYSTEM
       │               │                │
       ▼               ▼                ▼
   Accounts      Deriv / MT5       Health/Alerts
       │
       ▼
      P/L
       │
       ▼
   HOME SUMMARY
       │
       ▼
    FRONTEND


---

42. Analytics Backend

Analytics should be calculated from actual trading records.

Examples:

Total P/L
Win rate
Loss rate
Average win
Average loss
Profit factor
Maximum drawdown
Average trade
Trading volume
Exposure
Equity curve
Daily performance
Symbol performance

Do not manually enter these numbers.


---

43. Backend State Machine

The backend should operate as a controlled state machine.

SYSTEM
 │
 ├── STARTING
 │
 ├── HEALTHY
 │
 ├── DEGRADED
 │
 ├── RECOVERING
 │
 └── EMERGENCY_STOP

Trading availability depends on system state.

For example:

HEALTHY
   ↓
Trading allowed

DEGRADED
   ↓
New real trades blocked

EMERGENCY_STOP
   ↓
All new trades blocked


---

44. Full Backend Request Example

Suppose you press:

BUY EURUSD

The actual backend sequence is:

PHONE
 │
 ▼
VELTRION API
 │
 ▼
AUTH CHECK
 │
 ▼
MODE = SANDBOX?
 │
 ▼
SYMBOL VALID?
 │
 ▼
MARKET LIVE?
 │
 ▼
PRICE FRESH?
 │
 ▼
RISK CHECK
 │
 ▼
BALANCE CHECK
 │
 ▼
CREATE ORDER
 │
 ▼
EXECUTE SANDBOX
 │
 ▼
CREATE POSITION
 │
 ▼
UPDATE ACCOUNT
 │
 ▼
WRITE LEDGER
 │
 ▼
WRITE AUDIT LOG
 │
 ▼
UPDATE ANALYTICS
 │
 ▼
RETURN RESULT

The frontend then displays:

BUY EURUSD
OPENED
Entry: actual market price
Size: requested size
P/L: calculated by backend


---

45. Full Real Trade Example

For real trading:

PHONE
 │
 ▼
VELTRION API
 │
 ▼
AUTH
 │
 ▼
REAL MODE CHECK
 │
 ▼
DERIV CONNECTION
 │
 ▼
ACCOUNT CHECK
 │
 ▼
RISK ENGINE
 │
 ▼
MARKET CHECK
 │
 ▼
EMERGENCY STOP CHECK
 │
 ▼
DERIV API
 │
 ▼
EXTERNAL RESPONSE
 │
 ▼
RECONCILIATION
 │
 ▼
REAL LEDGER
 │
 ▼
AUDIT
 │
 ▼
FRONTEND

There is no shortcut around this.


---

46. Backend Build Order

I would build the backend in this exact order.

Backend 1 — Foundation

Supabase
PostgreSQL
Auth
RLS
environment configuration
migration system

Backend 2 — Admin

admin_users
roles
permissions
sessions
devices
security events

Backend 3 — Sandbox

sandbox_accounts
sandbox_orders
sandbox_positions
sandbox_ledger

Backend 4 — Market

market_symbols
market_ticks
market service
stale-data detection

Backend 5 — Trading Engine

order validation
execution
P/L
positions
risk
ledger

Backend 6 — Home API

/api/home/summary

Backend 7 — Deriv

OAuth
PKCE
account
market WebSocket
balance
portfolio
reconciliation

Backend 8 — MT5

MT5 infrastructure
account synchronization
symbols
orders
positions
connection health

Backend 9 — Real Trading

real accounts
real orders
real positions
risk gate
Deriv execution
reconciliation

Backend 10 — Wallet

profit wallet
transactions
withdrawals
settlement

Backend 11 — Operations

health
alerts
jobs
emergency controls
reconciliation

Backend 12 — Analytics

performance
P/L
drawdown
risk
reports

Backend 13 — Security

audit
secret management
session security
rate limits
failure handling

Backend 14 — Production

CI/CD
backup
monitoring
migration
recovery
production configuration


---

47. Final Backend Architecture

When complete, VELTRION's backend should look like this:

┌──────────────────┐
                         │  VELTRION CLIENT  │
                         │ Web / PWA / APK   │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ AUTH + API GATE  │
                         └────────┬─────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
        ┌──────────┐        ┌──────────┐       ┌──────────┐
        │ SECURITY │        │   RISK   │       │  AUDIT   │
        └────┬─────┘        └────┬─────┘       └────┬─────┘
             │                   │                  │
             └───────────────────┼──────────────────┘
                                 ▼
                       ┌────────────────────┐
                       │ VELTRION CORE      │
                       │ ENGINE             │
                       └─────────┬──────────┘
                                 │
        ┌────────────┬───────────┼────────────┬────────────┐
        ▼            ▼           ▼            ▼            ▼
    SANDBOX       MARKET       DERIV         MT5         WALLET
    ENGINE        ENGINE       ENGINE       ENGINE       ENGINE
        │            │           │            │            │
        └────────────┴───────────┼────────────┴────────────┘
                                 ▼
                         RECONCILIATION
                                 │
                                 ▼
                       ┌──────────────────┐
                       │ SUPABASE / PGSQL │
                       │ SOURCE OF STATE  │
                       └────────┬─────────┘
                                │
             ┌──────────────────┼──────────────────┐
             ▼                  ▼                  ▼
          ANALYTICS         OPERATIONS          AUDIT

The most important backend principle

VELTRION should never trust the screen.

The screen can say:

> “Buy”



The backend decides:

> “Is this authenticated, authorized, allowed by the current mode, allowed by risk, based on a valid market price, and safe to execute?”



The database records:

> “What actually happened?”



Deriv/MT5 records:

> “What actually happened externally?”



The reconciliation system checks:

> “Do those two realities agree?”



That gives us a backend that can support the $100,000 sandbox, live Deriv market data, genuine MT5 infrastructure, eventual real Deriv trading, profit-wallet accounting, withdrawals, analytics, and operational controls without mixing virtual and real money.Yes. For VELTRION, the database is essentially the permanent memory and record-keeping system of the application.

The easiest way to understand it is:

> The screen shows information. The database stores the information. The backend decides whether that information is allowed to change.



For your VELTRION setup, Supabase/PostgreSQL would be the central database.


---

1. What the database actually does

Imagine you open VELTRION and see:

SANDBOX PROFIT
$325.40

VIRTUAL CAPITAL
$100,000

OPEN POSITIONS
2

DERIV
● CONNECTED

MT5
● CONNECTED

Those numbers and statuses shouldn't simply exist inside the webpage.

They come from stored system data.

For example:

Home Screen
     ↓
Backend
     ↓
Database
     ↓
Current VELTRION state

So when you close the app and reopen it tomorrow, VELTRION still knows:

your account

your sandbox balance

previous trades

open positions

profit

connection records

audit history

settings

security sessions



---

2. Think of the database as VELTRION's memory

Without a database:

Open app
   ↓
$100,000
   ↓
Buy
   ↓
+$250
   ↓
Close app
   ↓
Everything disappears

With the database:

Open app
   ↓
Database retrieves account
   ↓
$100,000
   ↓
Buy
   ↓
Trade recorded
   ↓
Price changes
   ↓
P/L updated
   ↓
Position recorded
   ↓
Close app
   ↓
Open tomorrow
   ↓
Database restores current state

That's why the database is critical.


---

3. The database is not the trading engine

This distinction is very important.

The database stores state.

The trading engine calculates and controls behavior.

For example:

USER
 ↓
"BUY EUR/USD"
 ↓
BACKEND
 ↓
RISK ENGINE
 ↓
TRADING ENGINE
 ↓
DATABASE

The database records what happened.

It should not be treated as:

Frontend
   ↓
Direct database modification

That would be dangerous.


---

4. Example: your $100,000 sandbox

When VELTRION is initialized, the database could contain something conceptually like:

sandbox_accounts

account_id: SBX-001
starting_capital: 100000
balance: 100000
equity: 100000
realized_profit: 0
floating_profit: 0
status: ACTIVE

The Home screen then asks the backend:

> What is the current sandbox account?



The backend retrieves the account and returns the appropriate values.


---

5. When you make a trade

Suppose you buy something.

VELTRION doesn't simply change:

balance = 100500

Instead, several records can be created.

Order

sandbox_orders

order_id
account_id
symbol
side
volume
price
status
created_at

Position

sandbox_positions

position_id
account_id
symbol
side
volume
entry_price
current_price
floating_pnl
status

Ledger

sandbox_ledger

entry_id
account_id
type
amount
reference
timestamp

This gives you an auditable history.


---

6. Why the ledger is important

Imagine your sandbox eventually shows:

Balance: $103,450

You should be able to answer:

> Why is it $103,450?



The ledger provides the trail:

Starting capital       +$100,000
Trade #1                +$500
Trade #2                -$150
Trade #3                +$3,100
------------------------------------------------
Current balance        $103,450

That is much safer than simply storing one unexplained number.


---

7. Database structure for VELTRION

The database can be thought of as several departments.

VELTRION DATABASE
│
├── AUTHENTICATION
│
├── ADMIN
│
├── SANDBOX
│
├── DERIV
│
├── MT5
│
├── REAL TRADING
│
├── WALLET
│
├── ANALYTICS
│
├── OPERATIONS
│
├── SECURITY
│
└── AUDIT

Each department has its own tables.


---

8. Authentication database

This answers:

> Who is allowed to enter VELTRION?



For example:

auth.users
admin_users
user_sessions
devices

It can track:

Admin
Account status
Session
Device
Last login
Session expiration

Because your current VELTRION is private, there doesn't need to be a public registration system.


---

9. Sandbox database

This is the virtual trading environment.

sandbox_accounts
sandbox_orders
sandbox_positions
sandbox_ledger
sandbox_daily_metrics
sandbox_risk_events

It stores the complete virtual trading history.


---

10. Deriv database

This stores VELTRION's connection/state information related to Deriv.

For example:

deriv_connections
deriv_accounts
deriv_events
market_symbols
market_ticks
market_subscriptions

Important distinction:

The database doesn't become Deriv.

Deriv remains the external source for authorized external account/market information.

VELTRION records the necessary state and references.


---

11. MT5 database

Similarly:

mt5_accounts
mt5_connections
mt5_sessions
mt5_symbols
mt5_symbol_mapping
mt5_orders
mt5_positions
mt5_events

This lets VELTRION know what is happening with its MT5 integration.

But the database does not magically create an MT5 server.

The genuine MT5 infrastructure must exist separately.


---

12. Real trading database

This is completely separate from sandbox.

real_trading_accounts
real_orders
real_positions
real_transactions
real_ledger
real_execution_events

For example:

SANDBOX
SBX-000001

is not the same financial environment as:

REAL
REAL-000001

That separation should exist at the database level as well as the application level.


---

13. Wallet database

For the future real-money wallet:

real_profit_wallet
profit_wallet_transactions
withdrawals
withdrawal_events
settlement_records

This lets VELTRION track:

Available
Reserved
Withdrawable
Pending
Processing
Completed
Failed

Again, the database doesn't manufacture money.

It records legitimate financial state.


---

14. Operations database

This is the system's control room.

system_health
service_status
connection_health
alerts
alert_events
risk_limits
risk_events
emergency_controls

For example:

DERIV
status = CONNECTED

MARKET
status = LIVE

MT5
status = DISCONNECTED

REAL_TRADING
status = PAUSED

The Home screen can then display those statuses.


---

15. Security database

VELTRION needs to remember security events.

For example:

security_events
user_sessions
devices

It can record:

Login
Logout
New device
Session revoked
Security setting changed
Sensitive operation


---

16. Audit database

The audit log answers:

> Who did what, and when?



Example:

AUDIT LOG

10:42
Admin logged in

10:45
Deriv connected

11:02
Sandbox order created

11:15
Sandbox position closed

11:30
Risk setting changed

For a financial-control application, this history is extremely valuable.


---

17. How the Home screen uses the database

This connects directly to the Home screen we just designed.

Suppose Home displays:

SANDBOX PROFIT
$325

The flow is:

HOME
 ↓
BACKEND
 ↓
sandbox_accounts
sandbox_ledger
sandbox_positions
 ↓
CALCULATION/VALIDATION
 ↓
HOME
 ↓
$325

For:

DERIV
● CONNECTED

the flow is:

HOME
 ↓
BACKEND
 ↓
deriv_connections
connection_health
 ↓
VERIFY CURRENT STATE
 ↓
HOME
 ↓
● CONNECTED

For:

MT5
● CONNECTED

the backend checks the MT5 integration state.


---

18. Database + backend + frontend

This is the relationship I want VELTRION to maintain:

USER
                   │
                   ▼
              VELTRION UI
                   │
                   ▼
             BACKEND/API
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
    DATABASE     DERIV       MT5
        │
        ▼
  PERSISTENT STATE

The frontend should not be the authority.


---

19. What happens when you refresh?

This is important for your intended phone workflow.

You open VELTRION:

HOME

You refresh.

The application doesn't say:

> "Let's start again."



Instead:

REFRESH
   ↓
AUTH SESSION
   ↓
DATABASE
   ↓
CURRENT STATE
   ↓
HOME

So your state remains.


---

20. What happens if the phone is switched off?

Nothing should be lost merely because the phone shuts down.

PHONE OFF
     ↓
DATABASE REMAINS
     ↓
PHONE ON
     ↓
LOGIN/SESSION
     ↓
VELTRION
     ↓
CURRENT DATABASE STATE

That's one of the biggest reasons we use persistent backend storage.


---

21. What happens if the internet disappears?

VELTRION should not pretend that live trading is still happening.

For example:

INTERNET LOST
     ↓
MARKET CONNECTION LOST
     ↓
HOME
     ↓
MARKET
○ OFFLINE

The last known state can be displayed where appropriate, but clearly marked as stale/not current.


---

22. Database security

The database should not be publicly writable.

The intended structure is:

USER
 ↓
AUTHENTICATION
 ↓
AUTHORIZED REQUEST
 ↓
BACKEND
 ↓
VALIDATION
 ↓
DATABASE

Not:

USER
 ↓
DATABASE

And Supabase Row Level Security should enforce appropriate access restrictions.


---

23. The database is also the bridge between devices

Suppose you eventually use:

Samsung phone
       +
Tablet
       +
Desktop MT5

All can interact with the same VELTRION backend state.

PHONE ────────┐
              │
TABLET ───────┼──→ VELTRION BACKEND
              │          │
DESKTOP ──────┘          ▼
                      DATABASE

That's why you don't want important state stored only inside the phone.


---

24. Database and real money

This is where we need to be particularly strict.

For real trading:

Deriv
  ↓
External real account
  ↓
Actual external state

VELTRION's database records and reconciles that state.

It should not be able to turn:

sandbox_balance = 120000

into:

real_balance = 120000

just because someone changed a database record.

That is why we designed separate:

sandbox_ledger

and:

real_ledger


---

25. Simple analogy

Think of VELTRION as a bank office.

Frontend

The screen you see at the counter.

Backend

The bank employee/system that processes your request.

Database

The bank's records.

Deriv

An external financial institution/account provider.

MT5

An external trading infrastructure/interface.

Ledger

The accounting book showing exactly what happened.

You don't want the customer-facing screen to be able to simply type:

> "My balance is now $1,000,000."



The backend validates the request and the accounting records determine the legitimate state.


---

26. For VELTRION specifically

The database therefore has five major responsibilities:

1. REMEMBER
   Accounts, trades, settings, sessions

2. RECORD
   Orders, positions, transactions, events

3. PROTECT
   Access through authentication/RLS/authorization

4. RECONCILE
   Compare VELTRION state with Deriv/MT5

5. PROVIDE STATE
   Give the Home screen and other screens
   the current verified information

So when we build VELTRION, the database should be designed before we start wiring the Home screen to fake placeholder values.

The Home screen we just planned should ultimately be a live view of the database/backend state, not a collection of hardcoded numbers.VELTRION — HOME SCREEN MASTER PLAN

This plan covers only the Home screen.

No separate Trading, Deriv, MT5, Wallet, Analytics, or Settings screen design is being implemented here. Those destinations can exist in the sidebar, but this document defines what the Home screen itself contains.

The Home screen will have:

Primary screen area

Secondary screen/panel

Sidebar navigation

Top header

Account/status area

Sandbox Profit Wallet

Market/connection overview

Trading overview

Operations/security indicators

Responsive mobile version

All loading, empty, error and offline states



---

1. HOME SCREEN PURPOSE

The Home screen is VELTRION's command center.

When you open VELTRION, you should immediately understand:

WHO AM I?
WHAT ACCOUNT AM I USING?
HOW MUCH VIRTUAL CAPITAL DO I HAVE?
WHAT IS MY CURRENT PROFIT/LOSS?
IS DERIV CONNECTED?
IS MT5 CONNECTED?
IS THE MARKET LIVE?
DO I HAVE OPEN POSITIONS?
IS REAL TRADING ENABLED?
IS EVERYTHING HEALTHY?
WHAT SHOULD I DO NEXT?

It should not become a giant trading terminal.

The Home screen is the overview.

Detailed trading belongs in the Trading section.


---

2. COMPLETE HOME SCREEN STRUCTURE

┌─────────────────────────────────────────────────────────────┐
│ SIDEBAR │                 TOP HEADER                        │
│         ├───────────────────────────────────────────────────┤
│         │                                                   │
│         │              PRIMARY HOME AREA                   │
│         │                                                   │
│         │  Welcome / Account Status                         │
│         │                                                   │
│         │  ┌───────────────┐ ┌───────────────┐             │
│         │  │ Sandbox       │ │ Today's P/L   │             │
│         │  │ Profit        │ │               │             │
│         │  └───────────────┘ └───────────────┘             │
│         │                                                   │
│         │  ┌───────────────┐ ┌───────────────┐             │
│         │  │ Virtual       │ │ Open          │             │
│         │  │ Capital       │ │ Positions     │             │
│         │  └───────────────┘ └───────────────┘             │
│         │                                                   │
│         │  Market / Portfolio Overview                     │
│         │                                                   │
│         │  Quick Actions                                   │
│         │                                                   │
│         ├─────────────────────────────┬─────────────────────┤
│         │                             │                     │
│         │                             │ SECONDARY PANEL     │
│         │                             │                     │
│         │                             │ System Status       │
│         │                             │ Deriv               │
│         │                             │ MT5                 │
│         │                             │ Market              │
│         │                             │ Real Trading        │
│         │                             │ Security            │
│         │                             │                     │
└─────────┴─────────────────────────────┴─────────────────────┘


---

3. SIDEBAR NAVIGATION

The sidebar is part of the Home shell.

It remains available while you're on Home.

Desktop sidebar

┌──────────────────────┐
│                      │
│      VELTRION        │
│                      │
│   ● PRIVATE ADMIN    │
│                      │
├──────────────────────┤
│                      │
│ ⌂  HOME              │
│                      │
│ ◈  TRADING       ›   │
│                      │
│ ◎  DERIV         ›   │
│                      │
│ ◇  MT5           ›   │
│                      │
│ ▣  SANDBOX        ›   │
│                      │
│ ◉  REAL            ›  │
│                      │
│ ◇  PROFIT WALLET   ›  │
│                      │
│ ▥  ANALYTICS       ›  │
│                      │
│ ⚙  OPERATIONS      ›  │
│                      │
│ 🔒 SECURITY        ›  │
│                      │
│ ⚙  SETTINGS          │
│                      │
├──────────────────────┤
│                      │
│ ● SYSTEM ONLINE      │
│                      │
│     ADMIN            │
│                      │
│     LOG OUT          │
│                      │
└──────────────────────┘

The actual iconography should use a consistent icon library rather than emoji.


---

4. SIDEBAR BEHAVIOR

The sidebar has three states.

Expanded

Icon + label

Collapsed

Icon only

Mobile

Hidden
     ↓
Menu button
     ↓
Slide-out navigation

The sidebar should not cover the entire desktop workspace.


---

5. SIDEBAR ACTIVE STATE

Home is highlighted:

⌂  HOME
   ─────────

When the user navigates elsewhere, the selected section becomes highlighted.

The sidebar should clearly distinguish:

ACTIVE
AVAILABLE
CONNECTED
DISCONNECTED
PAUSED

But avoid turning the navigation into a wall of status indicators.


---

6. SIDEBAR GROUPS

The navigation can be organized visually:

OVERVIEW

HOME

TRADING

TRADING

CONNECTIONS

DERIV
MT5

ACCOUNTS

SANDBOX
REAL
PROFIT WALLET

INTELLIGENCE

ANALYTICS

CONTROL

OPERATIONS
SECURITY
SETTINGS

This makes the large system easier to understand.


---

7. TOP HEADER

At the top of the Home workspace:

┌──────────────────────────────────────────────────────────┐
│ ☰   VELTRION        SANDBOX ●       🔔    ADMIN   ▾     │
└──────────────────────────────────────────────────────────┘

Desktop:

VELTRION logo/name

current mode

notification icon

admin profile

account menu


Mobile:

☰     VELTRION       🔔


---

8. VELTRION BRAND AREA

The Home screen should use the VELTRION identity consistently.

VELTRION
PRIVATE TRADING & FINANCIAL CONTROL

The logo should be visible but not consume too much dashboard space.

The visual language should feel:

premium

controlled

financial

technical

clean

professional


Not like a gambling interface.


---

9. MODE INDICATOR

One of the most important elements.

At the top of the Home screen:

TRADING MODE

● SANDBOX

If real trading is disabled:

REAL TRADING
● PAUSED

These are two different pieces of information.

The current working mode can be:

SANDBOX

while real trading remains:

PAUSED


---

10. PRIMARY SCREEN

The primary screen is the large left/center portion of Home.

Its job is:

> Show the most important financial and trading information at a glance.




---

11. PRIMARY SCREEN — HEADER

Good afternoon

Welcome back to VELTRION.

Your trading environment is ready.

But the greeting should remain restrained.

Example:

Good afternoon, Admin.

Your VELTRION environment is ready.

No excessive motivational text.


---

12. PRIMARY CARD — SANDBOX PROFIT

This is the main financial card.

┌────────────────────────────────────────────┐
│ SANDBOX PROFIT                             │
│                                            │
│ $0.00                                      │
│                                            │
│ Today's P/L       $0.00                    │
│ Total P/L         $0.00                    │
│                                            │
│ VIRTUAL — NOT WITHDRAWABLE                 │
└────────────────────────────────────────────┘

This card should be visually prominent.


---

13. VIRTUAL CAPITAL CARD

┌──────────────────────────────────────┐
│ VIRTUAL CAPITAL                      │
│                                      │
│ $100,000.00                          │
│                                      │
│ Balance          $100,000.00         │
│ Equity           $100,000.00         │
│ Available        $100,000.00         │
└──────────────────────────────────────┘

The values must come from the sandbox account.

No hardcoded dashboard values.


---

14. TODAY'S PERFORMANCE CARD

┌──────────────────────────────────────┐
│ TODAY'S PERFORMANCE                  │
│                                      │
│ $0.00                                │
│                                      │
│ Open Positions       0               │
│ Closed Trades        0               │
│                                     │
│ [ VIEW PERFORMANCE ]                 │
└──────────────────────────────────────┘

Later this card becomes dynamic.

Example:

Today's P/L
+$325.40

with corresponding percentage/change information where appropriate.


---

15. OPEN POSITIONS CARD

┌──────────────────────────────────────┐
│ OPEN POSITIONS                       │
│                                      │
│ 3                                    │
│                                      │
│ Floating P/L        +$184.20         │
│ Exposure            $2,450           │
│                                      │
│ [ VIEW POSITIONS ]                   │
└──────────────────────────────────────┘

When none exist:

OPEN POSITIONS

0

No open positions.

[ VIEW MARKETS ]


---

16. PRIMARY MARKET OVERVIEW

The Home screen should show a small market snapshot, not the complete market terminal.

Example:

MARKET OVERVIEW

EUR/USD       1.XXXX     ▲
BTC/USD       XX,XXX     ▲
GOLD          X,XXX      ▼
VOLATILITY    XXXX       —

Only verified live data should be displayed as live.

If the feed is disconnected:

MARKET DATA
○ DISCONNECTED

Live prices unavailable.

Do not show stale prices as though they are current.


---

17. MARKET STATUS

Under the market snapshot:

MARKET DATA

● LIVE

Last update
14:32:08 UTC

Connection
WebSocket

Or:

MARKET DATA

● DEGRADED

Last update
2m 14s ago


---

18. QUICK ACTIONS

The Home screen should have a small number of important actions.

QUICK ACTIONS

[ TRADE ]
[ VIEW MARKETS ]
[ CONNECT DERIV ]
[ MT5 ]

But buttons should change based on state.

If Deriv is already connected:

[ VIEW DERIV ACCOUNT ]

If MT5 is not configured:

[ SET UP MT5 ]

rather than pretending it is connected.


---

19. SECONDARY SCREEN / PANEL

The secondary panel is the right-side control/status area of the Home screen.

Its job is not to duplicate the primary dashboard.

It answers:

> Is everything connected and safe?




---

20. SECONDARY PANEL — SYSTEM STATUS

┌──────────────────────────────┐
│ SYSTEM STATUS                │
├──────────────────────────────┤
│                              │
│ VELTRION API     ● ONLINE    │
│ DATABASE         ● ONLINE    │
│ AUTH             ● ONLINE    │
│ MARKET           ● LIVE      │
│ DERIV            ● CONNECTED │
│ MT5              ● CONNECTED │
│ SANDBOX          ● ACTIVE    │
│ REAL TRADING     ● PAUSED    │
│                              │
└──────────────────────────────┘

This is extremely useful because you can understand the system without opening Operations.


---

21. DERIV STATUS CARD

DERIV

● CONNECTED

Account
Verified

Market
● LIVE

Last tick
Just now

[ OPEN DERIV ]

If disconnected:

DERIV

○ NOT CONNECTED

Connect your Deriv account
to access authorized market
and account services.

[ CONNECT DERIV ]


---

22. MT5 STATUS CARD

MT5

● CONNECTED

Virtual Account
ACTIVE

Server
[Actual provisioned server]

[ OPEN MT5 ]

If infrastructure isn't provisioned:

MT5

○ NOT CONFIGURED

Official MT5 infrastructure
has not been connected.

[ MT5 SETUP ]

Do not display a fake server.


---

23. REAL TRADING STATUS

This needs special treatment.

REAL TRADING

● PAUSED

Real-money execution is
currently disabled.

[ VIEW REAL ACCOUNT ]

If enabled:

REAL TRADING

● ENABLED

Account verified
Risk controls active

The status should never imply that real trading is enabled merely because the Deriv account is connected.


---

24. SECURITY STATUS

SECURITY

● SECURE

Current session
Active

Device
Trusted

Last login
Today

[ SECURITY CENTER ]

If something requires attention:

SECURITY

⚠ ACTION REQUIRED

New device detected.

[ REVIEW ]


---

25. ALERTS PREVIEW

At the bottom of the secondary panel:

RECENT ALERTS

● Market connected
   2 min ago

● Sandbox ready
   5 min ago

No critical alerts

If critical:

CRITICAL

Deriv connection lost.

[ VIEW ALERT ]

Critical alerts should not be buried.


---

26. HOME SCREEN — COMPLETE DESKTOP LAYOUT

Putting everything together:

┌──────────────┬─────────────────────────────────────────────────────────────┐
│              │ TOP HEADER                                                  │
│   VELTRION   ├─────────────────────────────────────────────────────────────┤
│              │                                                             │
│ ● PRIVATE    │ Good afternoon, Admin.                  ● SANDBOX   🔔      │
│   ADMIN      │                                                             │
│              │ ┌────────────────────────────────┐ ┌─────────────────────┐ │
│ ───────────  │ │ SANDBOX PROFIT                 │ │ SYSTEM STATUS       │ │
│              │ │                                │ │                     │ │
│ ⌂ HOME       │ │ $0.00                         │ │ API       ● ONLINE  │ │
│              │ │                                │ │ DATABASE  ● ONLINE  │ │
│ ◈ TRADING ›  │ │ Today's P/L   $0.00            │ │ DERIV     ● CONNECT │ │
│              │ │ Total P/L     $0.00            │ │ MT5       ● CONNECT │ │
│ ◎ DERIV   ›  │ │                                │ │ MARKET    ● LIVE    │ │
│              │ │ VIRTUAL — NOT WITHDRAWABLE     │ │ REAL      ● PAUSED  │ │
│ ◇ MT5     ›  │ └────────────────────────────────┘ └─────────────────────┘ │
│              │                                                             │
│ ▣ SANDBOX ›  │ ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐ │
│              │ │ VIRTUAL CAPITAL │ │ TODAY'S P/L     │ │ OPEN POSITIONS │ │
│ ◉ REAL     › │ │                 │ │                 │ │                │ │
│              │ │ $100,000.00     │ │ $0.00           │ │ 0              │ │
│ ◇ WALLET   › │ │                 │ │                 │ │                │ │
│              │ │ Balance         │ │ Closed  0       │ │ Floating $0    │ │
│ ▥ ANALYTICS│ │ │ $100,000        │ │                 │ │                │ │
│              │ └─────────────────┘ └─────────────────┘ └────────────────┘ │
│ ⚙ OPERATIONS│                                                              │
│              │ MARKET OVERVIEW                        DERIV                │
│ 🔒 SECURITY │ ┌────────────────────────────────────┐ ┌───────────────────┐ │
│              │ │ EUR/USD   —       BTC/USD   —     │ │ ● CONNECTED       │ │
│ ⚙ SETTINGS  │ │ GOLD      —       VOLATILITY —     │ │ Account Verified  │ │
│              │ │                                    │ │ Market ● LIVE     │ │
│              │ └────────────────────────────────────┘ └───────────────────┘ │
│              │                                                             │
│ ● SYSTEM     │ QUICK ACTIONS                           MT5                 │
│   ONLINE     │ [ TRADE ] [ MARKETS ] [ DERIV ]        ┌──────────────────┐ │
│              │                                          │ ● CONNECTED      │ │
│ ADMIN        │                                          │ Account ACTIVE   │ │
│ LOG OUT      │                                          └──────────────────┘ │
└──────────────┴─────────────────────────────────────────────────────────────┘


---

27. HOME SCREEN INFORMATION HIERARCHY

The screen should prioritize information in this order:

Level 1 — Financial state

Sandbox Profit
Virtual Capital
Today's P/L
Equity

Level 2 — Trading state

Open Positions
Floating P/L
Market status

Level 3 — Connectivity

Deriv
MT5
API
Database

Level 4 — Safety

Real Trading
Risk
Security
Alerts

Level 5 — Navigation

Sidebar
Quick actions

This prevents the Home screen from becoming cluttered.


---

28. MOBILE HOME SCREEN

On a phone, the sidebar becomes a drawer.

┌───────────────────────────────┐
│ ☰   VELTRION            🔔    │
├───────────────────────────────┤
│                               │
│ Good afternoon, Admin         │
│                               │
│ ● SANDBOX                     │
│                               │
│ ┌───────────────────────────┐ │
│ │ SANDBOX PROFIT            │ │
│ │                           │ │
│ │ $0.00                     │ │
│ │                           │ │
│ │ Today's P/L     $0.00     │ │
│ │ Total P/L       $0.00     │ │
│ └───────────────────────────┘ │
│                               │
│ ┌───────────────────────────┐ │
│ │ VIRTUAL CAPITAL           │ │
│ │ $100,000.00               │ │
│ │                           │ │
│ │ Balance       $100,000    │ │
│ │ Equity        $100,000    │ │
│ └───────────────────────────┘ │
│                               │
│ ┌─────────────┐ ┌───────────┐│
│ │ TODAY       │ │ POSITIONS ││
│ │ $0.00       │ │ 0         ││
│ └─────────────┘ └───────────┘│
│                               │
│ MARKET                        │
│ ───────────────────────────── │
│ EUR/USD       —              │
│ BTC/USD       —              │
│ GOLD          —              │
│                               │
│ QUICK ACTIONS                 │
│ [ TRADE ]                     │
│ [ MARKETS ]                   │
│                               │
│ SYSTEM STATUS                 │
│ ● API       ONLINE            │
│ ● DERIV     CONNECTED         │
│ ● MT5       CONNECTED         │
│ ● MARKET    LIVE              │
│ ● REAL      PAUSED            │
│                               │
└───────────────────────────────┘


---

29. MOBILE SIDEBAR DRAWER

When the user taps ☰:

┌──────────────────────────────┐
│ VELTRION                     │
│ PRIVATE ADMIN                │
├──────────────────────────────┤
│                              │
│ ⌂ HOME                       │
│                              │
│ ◈ TRADING                    │
│   Markets                    │
│   Positions                  │
│   Orders                     │
│   History                    │
│                              │
│ ◎ DERIV                      │
│ ◇ MT5                        │
│ ▣ SANDBOX                    │
│ ◉ REAL                       │
│ ◇ PROFIT WALLET              │
│ ▥ ANALYTICS                  │
│ ⚙ OPERATIONS                 │
│ 🔒 SECURITY                  │
│ ⚙ SETTINGS                   │
│                              │
├──────────────────────────────┤
│ ● SYSTEM ONLINE              │
│                              │
│ LOG OUT                      │
└──────────────────────────────┘

Tap outside the drawer → close.


---

30. TABLET LAYOUT

Tablet should use an intermediate layout:

Sidebar
   +
Primary content
   +
Compact secondary panel

If the screen is too narrow:

Primary content
      ↓
Secondary panel

rather than squeezing everything horizontally.


---

31. HOME SCREEN STATES

The Home screen needs more than a "success" state.


---

Loading

Loading VELTRION...

Retrieving account state...

Do not immediately show fake financial numbers.


---

Connected

● SYSTEM ONLINE


---

Partially connected

⚠ SYSTEM DEGRADED

Deriv connected
MT5 disconnected
Market available


---

Offline

○ OFFLINE

Live account and market
information unavailable.

Last synchronized:
14:31 UTC

Do not imply current values are live.


---

32. NO-DATA STATE

For example, no positions:

OPEN POSITIONS

0

You currently have no open positions.

Not:

Error


---

33. ERROR STATE

Example:

MARKET DATA

Unable to retrieve live market data.

[ RETRY ]

No fabricated prices.


---

34. CRITICAL ERROR STATE

If the backend detects something dangerous:

┌───────────────────────────────────┐
│ ⚠ CRITICAL SYSTEM ALERT           │
│                                   │
│ Real trading has been paused.     │
│                                   │
│ Reason: reconciliation mismatch   │
│                                   │
│ [ OPEN OPERATIONS ]               │
└───────────────────────────────────┘

This takes priority over ordinary dashboard information.


---

35. NOTIFICATION CENTER

The bell opens:

NOTIFICATIONS

● Market connected
  2 min ago

● Sandbox order closed
  10 min ago

○ MT5 heartbeat restored
  25 min ago

[ VIEW ALL ]

Critical notifications should be visually distinct.


---

36. ADMIN PROFILE MENU

Top-right:

ADMIN
   ↓
┌──────────────────────┐
│ Account              │
│ Security             │
│ Sessions             │
│ Audit Log            │
├──────────────────────┤
│ Log Out              │
└──────────────────────┘


---

37. HOME SCREEN RULES

These rules should be hard requirements.

Rule 1

No fake financial figures.

Rule 2

No hardcoded market prices.

Rule 3

No fake "CONNECTED" statuses.

Rule 4

Sandbox and real money must remain visibly separated.

Rule 5

Real trading status must always be explicit.

Rule 6

The Home screen must never claim an external service is connected unless the backend has verified it.

Rule 7

The Home screen is an overview, not the full trading terminal.

Rule 8

Critical alerts override ordinary dashboard information.

Rule 9

Mobile and desktop use the same backend state.

Rule 10

Refreshing the Home screen must not reset or fabricate anything.


---

38. HOME SCREEN DATA SOURCES

Every component should have a defined source.

Home element	Source

Admin identity	Supabase Auth/profile
Sandbox capital	sandbox_accounts
Sandbox balance	sandbox_accounts
Equity	Sandbox engine
P/L	Sandbox engine/ledger
Positions	sandbox_positions
Market prices	Deriv market service
Deriv status	deriv_connections / health
Deriv account	deriv_accounts
MT5 status	MT5 integration
Real status	Real trading configuration
Security status	Session/security service
Alerts	alerts
System health	system_health



---

39. HOME SCREEN BACKEND FLOW

When Home opens:

USER
 │
 ▼
AUTH SESSION
 │
 ▼
HOME API
 │
 ├── ADMIN
 ├── SANDBOX
 ├── POSITIONS
 ├── MARKET
 ├── DERIV
 ├── MT5
 ├── REAL
 ├── SECURITY
 ├── ALERTS
 └── SYSTEM HEALTH
 │
 ▼
HOME STATE
 │
 ▼
UI

The frontend should not individually invent these states.


---

40. HOME SCREEN REFRESH

When the user pulls to refresh or reloads:

REFRESH
  ↓
AUTH VERIFY
  ↓
FETCH CURRENT STATE
  ↓
FETCH HEALTH
  ↓
FETCH MARKET STATUS
  ↓
UPDATE UI

The sandbox account remains persistent.


---

41. HOME SCREEN PERFORMANCE

The Home screen should load in layers.

Layer 1

VELTRION shell

Layer 2

authenticated account

Layer 3

sandbox financial state

Layer 4

connections

Layer 5

market snapshot

This prevents a slow external API from making the entire application appear frozen.


---

42. HOME SCREEN SECURITY

The Home screen should not expose:

OAuth tokens

API keys

MT5 passwords

service-role credentials

private backend configuration

sensitive external authentication data


Even if the browser developer tools are opened, secrets should not be sitting in frontend source.


---

43. HOME SCREEN FINAL EXPERIENCE

The ideal experience is:

OPEN VELTRION
      ↓
AUTHENTICATED
      ↓
HOME
      ↓
SEE SANDBOX
$100,000
      ↓
SEE CURRENT P/L
      ↓
SEE POSITIONS
      ↓
SEE MARKET
      ↓
SEE DERIV
      ↓
SEE MT5
      ↓
SEE REAL TRADING STATUS
      ↓
SEE SYSTEM HEALTH
      ↓
CHOOSE ACTION

You should be able to open VELTRION and understand the entire current state without opening another screen.


---

44. FINAL HOME SCREEN SPECIFICATION

The Home screen therefore consists of:

VELTRION HOME
│
├── SIDEBAR
│   ├── Home
│   ├── Trading
│   ├── Deriv
│   ├── MT5
│   ├── Sandbox
│   ├── Real
│   ├── Profit Wallet
│   ├── Analytics
│   ├── Operations
│   ├── Security
│   └── Settings
│
├── TOP HEADER
│   ├── Menu
│   ├── VELTRION
│   ├── Current Mode
│   ├── Notifications
│   └── Admin
│
├── PRIMARY SCREEN
│   ├── Greeting
│   ├── Sandbox Profit
│   ├── Virtual Capital
│   ├── Today's Performance
│   ├── Open Positions
│   ├── Market Overview
│   └── Quick Actions
│
└── SECONDARY SCREEN
    ├── System Status
    ├── Deriv Status
    ├── MT5 Status
    ├── Real Trading Status
    ├── Security Status
    └── Recent Alerts

The key design principle

Primary screen = "What is happening with my money and trading?"

Secondary screen = "Is the VELTRION system connected, healthy and safe?"

Sidebar = "Where do I go when I need to do something?"

That gives VELTRION a Home screen that functions as a genuine command center, while keeping the detailed functions in their proper sections.Absolutely. We can make this the final master implementation planning document: Plans 1 through 12, one after another, clearly separated, with enough detail that we can use it as the blueprint while actually building VELTRION.

VELTRION — FINAL MASTER IMPLEMENTATION BLUEPRINT

PLAN 1 — TECHNICAL MASTER ARCHITECTURE

1.1 Purpose

Define exactly how every part of VELTRION connects before implementation begins.

VELTRION will be a private, admin-controlled trading and financial-control platform.

Core principle:

> The frontend displays and controls the system; the backend and external systems remain the source of truth.



1.2 Overall architecture

VELTRION
                            │
             ┌──────────────┼──────────────┐
             │              │              │
            WEB            PWA            APK
             │              │              │
             └──────────────┼──────────────┘
                            │
                     SECURE API LAYER
                            │
              ┌─────────────┼─────────────┐
              │             │             │
          SUPABASE        DERIV          MT5
              │             │             │
              └─────────────┼─────────────┘
                            │
                    VELTRION ENGINE
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
       SANDBOX                              REAL
          │                                   │
     $100,000 virtual                    Real funds
          │                                   │
     Sandbox Ledger                       Real Ledger
          │                                   │
          └─────────────────┬─────────────────┘
                            │
                      RECONCILIATION
                            │
                 ┌──────────┴──────────┐
                 │                     │
              ANALYTICS              AUDIT

1.3 Technology responsibilities

Frontend

VELTRION dashboard

trading screens

charts

account screens

wallet

analytics

operations

security

responsive mobile interface


Supabase

authentication

PostgreSQL database

RLS

server-side functions where appropriate

persistent application state

audit records

financial/trading records


Deriv

OAuth

authorized account information

live market data

real trading where explicitly enabled

external real-account state


MT5

official MetaTrader terminal integration

genuine MT5 account/server infrastructure

MT5 orders/positions/account state


GitHub

authoritative source code

migrations

CI/CD

version history

release artifacts


1.4 Environment separation

DEVELOPMENT
     ↓
STAGING
     ↓
PRODUCTION

No production credentials should be used in development.

1.5 Operating modes

VELTRION must have explicit modes:

SANDBOX
REAL

The backend, not merely the UI, determines which execution path is allowed.

1.6 Core rule

SANDBOX ORDER
      ↓
SANDBOX ENGINE
      ↓
SANDBOX LEDGER

REAL ORDER
      ↓
REAL ENGINE
      ↓
DERIV
      ↓
REAL LEDGER

They must never cross.

1.7 Plan 1 completion condition

The entire system architecture is documented and implementation responsibilities are unambiguous.


---

PLAN 2 — DATABASE MASTER SCHEMA

2.1 Purpose

Create the permanent data model before building business logic.

The database becomes the persistent source of truth.


---

2.2 Authentication and administration

auth.users
admin_users
admin_roles
user_sessions
devices
security_events

admin_users

Core fields:

id
auth_user_id
role
status
created_at
updated_at
last_login_at

For the current private deployment:

role = OWNER_ADMIN
status = ACTIVE


---

2.3 Sandbox tables

sandbox_accounts
sandbox_orders
sandbox_positions
sandbox_ledger
sandbox_daily_metrics
sandbox_risk_events

Sandbox account

account_id
starting_capital
balance
equity
realized_profit
floating_profit
margin
free_margin
currency
status
created_at
updated_at

Initial account:

starting_capital = 100000
balance = 100000
equity = 100000
realized_profit = 0
floating_profit = 0


---

2.4 Deriv tables

deriv_connections
deriv_accounts
deriv_tokens
deriv_scopes
deriv_events
market_symbols
market_ticks
market_subscriptions

Sensitive OAuth material must not be exposed to the frontend.


---

2.5 MT5 tables

mt5_accounts
mt5_connections
mt5_sessions
mt5_symbols
mt5_symbol_mapping
mt5_orders
mt5_positions
mt5_events

Only genuine MT5 infrastructure should populate production MT5 credentials.


---

2.6 Real trading tables

real_trading_accounts
real_orders
real_positions
real_transactions
real_ledger
real_execution_events


---

2.7 Wallet tables

sandbox_wallet
sandbox_wallet_transactions

real_profit_wallet
profit_wallet_transactions

withdrawals
withdrawal_events
settlement_records


---

2.8 Operations tables

system_health
service_status
connection_health
risk_limits
risk_events
alerts
alert_events
emergency_controls
reconciliation_runs
reconciliation_items
job_queue
job_events


---

2.9 Analytics tables

analytics_daily
analytics_trade_metrics
analytics_equity_snapshots
analytics_drawdowns
analytics_market_metrics
analytics_risk_metrics
analytics_reports
analytics_insights


---

2.10 Audit

audit_logs

Important events should be recorded immutably or in an append-oriented structure.


---

2.11 Database relationships

ADMIN
 │
 ├── SESSION
 ├── DEVICE
 └── AUDIT

ADMIN
 │
 ├── SANDBOX ACCOUNT
 │      ├── ORDERS
 │      ├── POSITIONS
 │      └── LEDGER
 │
 ├── DERIV ACCOUNT
 │
 ├── MT5 ACCOUNT
 │
 └── REAL ACCOUNT
        ├── ORDERS
        ├── POSITIONS
        └── LEDGER

Plan 2 completion condition

Every required entity has a defined table, relationship, ownership model and migration path.


---

PLAN 3 — API & INTEGRATION CONTRACT

3.1 Purpose

Define how VELTRION's components communicate.


---

3.2 Authentication API

Conceptually:

/auth/login
/auth/logout
/auth/session
/auth/refresh
/auth/devices
/auth/revoke

The frontend never directly controls authorization.


---

3.3 Sandbox API

/sandbox/account
/sandbox/orders
/sandbox/orders/create
/sandbox/orders/{id}
/sandbox/positions
/sandbox/positions/{id}/close
/sandbox/history
/sandbox/ledger
/sandbox/risk


---

3.4 Deriv API layer

/deriv/connect
/deriv/callback
/deriv/account
/deriv/balance
/deriv/portfolio
/deriv/markets
/deriv/status
/deriv/reconnect

OAuth credentials and token exchange remain server-side.


---

3.5 MT5 API layer

/mt5/account
/mt5/status
/mt5/symbols
/mt5/orders
/mt5/positions
/mt5/events
/mt5/reconnect

The actual MT5 server protocol remains handled by the genuine MT5 infrastructure.


---

3.6 Real trading API

/real/account
/real/orders
/real/orders/{id}
/real/positions
/real/portfolio
/real/status
/real/pause
/real/resume


---

3.7 Wallet API

/wallet
/wallet/transactions
/wallet/withdraw
/wallet/withdrawals
/wallet/withdrawals/{id}
/wallet/reconcile


---

3.8 Operations API

/operations/health
/operations/services
/operations/alerts
/operations/reconciliation
/operations/jobs
/operations/emergency


---

3.9 Idempotency

Financial operations must support idempotency.

For example:

REQUEST
   ↓
IDEMPOTENCY KEY
   ↓
PROCESS
   ↓
RESULT STORED

If the phone sends the same request twice because of a network retry, VELTRION should not create two orders or two withdrawals.

Plan 3 completion condition

Every critical frontend action has a defined backend contract and error/success state.


---

PLAN 4 — SECURITY & SECRETS ARCHITECTURE

4.1 Purpose

Define what is allowed to exist where.


---

4.2 Frontend may contain

Public application configuration
Public API identifiers where appropriate
UI configuration
Public branding


---

4.3 Frontend must never contain

Supabase service-role secret
Deriv private client secret
Private OAuth tokens
MT5 administrator credentials
Encryption master keys
Withdrawal/payment secrets
Backend signing keys


---

4.4 OAuth security

Deriv:

VELTRION
   ↓
OAuth + PKCE
   ↓
DERIV
   ↓
USER AUTHENTICATES
   ↓
CONSENT
   ↓
CALLBACK
   ↓
STATE VERIFY
   ↓
PKCE VERIFY
   ↓
TOKEN EXCHANGE

No Deriv password is collected by VELTRION.


---

4.5 Authentication security

Implement:

secure sessions

session expiry

refresh handling

logout

device tracking

session revocation

sensitive-operation reauthentication

rate limiting

failed-login monitoring



---

4.6 Database security

Use:

RLS
Authorization checks
Input validation
Server-side business rules

Never trust a frontend request such as:

mode = REAL

The backend must independently verify whether REAL trading is permitted.


---

4.7 Financial security

Before a real order:

Authenticated?
      ↓
Authorized?
      ↓
REAL mode enabled?
      ↓
Account verified?
      ↓
Market valid?
      ↓
Risk valid?
      ↓
Connection healthy?
      ↓
Reconciliation healthy?
      ↓
Submit

Plan 4 completion condition

There is no obvious path through which a frontend user or leaked client-side configuration can directly bypass the financial controls.


---

PLAN 5 — TRADING ENGINE SPECIFICATION

5.1 Purpose

Define the actual trading logic.


---

5.2 Sandbox order lifecycle

NEW
 ↓
VALIDATING
 ↓
ACCEPTED
 ↓
OPEN
 ↓
MONITORING
 ↓
CLOSED

Failure:

REJECTED


---

5.3 Real order lifecycle

REQUESTED
 ↓
VALIDATING
 ↓
AUTHORIZED
 ↓
SUBMITTED
 ↓
EXTERNAL RESPONSE
 ├── CONFIRMED
 └── REJECTED

Never assume:

SUBMITTED = FILLED


---

5.4 Position model

Each position should contain:

position_id
account_id
symbol
side
volume
entry_price
current_price
stop_loss
take_profit
opened_at
closed_at
realized_pnl
floating_pnl
status


---

5.5 Sandbox P/L

For a long position:

P/L = (Current Price - Entry Price) × Position Quantity

For a short position:

P/L = (Entry Price - Current Price) × Position Quantity

The actual contract specifications, tick value, contract size, currency conversion and instrument rules must be applied where relevant.


---

5.6 Balance/equity

Balance
= Starting Capital + Realized P/L + applicable ledger adjustments

Equity
= Balance + Floating P/L

These formulas must match the instrument/account model implemented.


---

5.7 Risk engine

Controls can include:

MAX_ORDER_SIZE
MAX_OPEN_POSITIONS
MAX_DAILY_LOSS
MAX_EXPOSURE
MAX_SYMBOL_EXPOSURE

Risk validation happens before execution.


---

5.8 Market-data failure

If live data becomes invalid:

MARKET DATA LOST
       ↓
STOP NEW SANDBOX ORDERS
       ↓
DISPLAY CONNECTION ERROR
       ↓
RECONNECT
       ↓
VERIFY FRESH DATA
       ↓
RESUME

No invented prices.


---

5.9 Sandbox/real separation

The routing decision must be server-side:

order_mode = SANDBOX
        ↓
Sandbox Engine

versus:

order_mode = REAL
        ↓
Real Engine
        ↓
Deriv

Plan 5 completion condition

Trading behavior, P/L, order lifecycle, risk and execution routing are deterministic and testable.


---

PLAN 6 — MONEY & LEDGER SPECIFICATION

6.1 Purpose

Define exactly how money is represented.

This is one of the most important plans.


---

6.2 Three separate financial realities

Sandbox

$100,000 virtual

Real Deriv account

Actual external funds

VELTRION real profit wallet

Only backed by actual real-money state/transactions


---

6.3 Sandbox ledger

Example:

SBX-000001
BUY
EURUSD
+ virtual position

Closing it:

SBX-000002
REALIZED_PROFIT
+$150

This changes sandbox accounting only.


---

6.4 Real ledger

Real ledger entries require external references where applicable:

transaction_id
external_reference
source
type
amount
currency
status
timestamp


---

6.5 Wallet states

AVAILABLE
RESERVED
WITHDRAWABLE

Conceptually:

Withdrawable
= Available - Reserved


---

6.6 Withdrawal lifecycle

REQUESTED
 ↓
VALIDATING
 ↓
RESERVED
 ↓
PROCESSING
 ↓
EXTERNAL CONFIRMATION
 ↓
COMPLETED

Failure states:

FAILED
REJECTED
CANCELLED


---

6.7 Critical rule

This must never happen:

Sandbox Profit
      ↓
Database Update
      ↓
Real Money

Instead:

Sandbox Profit
      ↓
Virtual Ledger
      ↓
NOT CASH

Real funds must originate from legitimate real-money transactions.

Plan 6 completion condition

Every financial movement can be traced from source to ledger entry to external reference where applicable.


---

PLAN 7 — DERIV INTEGRATION SPECIFICATION

7.1 Purpose

Turn Deriv into a controlled external integration rather than mixing it with VELTRION's internal financial state.


---

7.2 Connection

CONNECT DERIV
     ↓
OAuth
     ↓
Authentication
     ↓
Consent
     ↓
Callback
     ↓
State + PKCE validation
     ↓
Token exchange
     ↓
Account


---

7.3 Market data

DERIV
  ↓
WebSocket
  ↓
Market Service
  ↓
Market Cache / Tick Store
  ↓
Sandbox Engine


---

7.4 Account data

Deriv
 ↓
Account service
 ↓
VELTRION
 ↓
Real account display

Real balance should not be fabricated from local calculations.


---

7.5 Real trading

VELTRION
 ↓
Risk engine
 ↓
Real execution service
 ↓
Deriv API
 ↓
Execution response
 ↓
VELTRION reconciliation


---

7.6 Reconnection

DISCONNECTED
 ↓
RECONNECT
 ↓
AUTHENTICATE
 ↓
SUBSCRIBE
 ↓
RETRIEVE CURRENT STATE
 ↓
RECONCILE
 ↓
CONNECTED


---

7.7 Deriv failure handling

If Deriv becomes unavailable:

DERIV OFFLINE
 ↓
REAL TRADING PAUSED
 ↓
MARKET STATUS DEGRADED
 ↓
RECONNECT
 ↓
STATE RECONCILIATION

Plan 7 completion condition

VELTRION can authenticate, receive live market data, retrieve account state, execute authorized real operations when enabled, and recover safely from connection failures.


---

PLAN 8 — MT5 INFRASTRUCTURE SPECIFICATION

8.1 Purpose

Define the official MT5 side correctly.


---

8.2 Important distinction

VELTRION's backend is not automatically an MT5 broker server.

If the goal is:

Official MetaTrader 5 app
       ↓
VELTRION server
       ↓
VELTRION account

then genuine MT5 broker/trade-server infrastructure must exist.


---

8.3 Required infrastructure

Potentially:

MetaQuotes / broker infrastructure
        ↓
MT5 server
        ↓
VELTRION virtual account
        ↓
MT5 login
        ↓
Official MT5 terminal

The exact commercial/licensing/provisioning route must be established with MetaQuotes before claiming the environment is production-ready.


---

8.4 Account

Once genuinely provisioned:

Server: [actual provisioned server]
Login: [actual account login]
Password: [private]

No fake values.


---

8.5 Symbol mapping

VELTRION must define:

Source Symbol
      ↓
VELTRION Symbol
      ↓
MT5 Symbol

Including:

precision

digits

contract size

minimum volume

volume step

trading hours

price source

supported order types



---

8.6 Synchronization

MT5
 ↓
Order
 ↓
MT5 infrastructure
 ↓
VELTRION integration
 ↓
Sandbox account

If the design uses MT5 as another interface into the same virtual trading environment, the synchronization rules must be explicit and tested.


---

8.7 MT5 failure

MT5 DISCONNECTED
 ↓
STOP NEW MT5 ORDERS
 ↓
PRESERVE CURRENT STATE
 ↓
RECONNECT
 ↓
SYNC
 ↓
RECONCILE
 ↓
RESUME

Plan 8 completion condition

Official MT5 connectivity has been proven using genuine provisioned infrastructure, not a simulated server.


---

PLAN 9 — UI/UX SCREEN-BY-SCREEN SPECIFICATION

9.1 Purpose

Turn the architecture into the actual VELTRION product.


---

9.2 Home

VELTRION

Sandbox Profit
$0.00

Virtual Capital
$100,000

Deriv
● Connected

MT5
● Connected

Today's P/L
$0.00

Open Positions
0

[ TRADE ]
[ MARKETS ]

All values come from the backend.


---

9.3 Trading

Sections:

Markets
Positions
Orders
History

Trading mode:

SANDBOX
REAL

Real mode requires additional confirmation and backend authorization.


---

9.4 Deriv

Connection
Account
Wallet
Market Status

Show:

OAuth status
Account
Balance
Connection health
Last market tick


---

9.5 MT5

Virtual Account
Connection
Credentials
Terminal

Only display credentials that genuinely exist.


---

9.6 Sandbox

Account
Capital
Profit
Ledger
Performance


---

9.7 Real

Account
Trading
Positions
Performance

The interface must visually distinguish real funds from virtual funds.


---

9.8 Profit Wallet

Balance
Transactions
Withdraw

Separate:

Sandbox Profit
NOT WITHDRAWABLE

from:

Real Funds


---

9.9 Analytics

Performance
Risk
Markets
Reports


---

9.10 Operations

System Health
Connections
Alerts
Reconciliation


---

9.11 Security

Sessions
Devices
Audit Log
Security Settings


---

9.12 Settings

Application preferences and controlled configuration.


---

9.13 Mobile design

The interface must work naturally on:

Android phone
Tablet
Desktop

No important financial control should disappear merely because the screen is smaller.

Plan 9 completion condition

Every backend capability has a defined user interface, state, loading behavior, error state and mobile behavior.


---

PLAN 10 — GITHUB, CI/CD & RELEASE ENGINEERING

10.1 Purpose

Make GitHub the authoritative engineering source.


---

10.2 Repository

Recommended structure:

VELTRION/
│
├── frontend/
├── backend/
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── configuration/
│
├── android/
├── tests/
├── scripts/
├── docs/
│
└── .github/
    └── workflows/


---

10.3 Branch model

main
 │
 ├── feature/*
 ├── fix/*
 └── release/*

Development:

feature
   ↓
tests
   ↓
pull request
   ↓
CI
   ↓
review
   ↓
merge


---

10.4 CI pipeline

Every important change:

CHECKOUT
 ↓
INSTALL
 ↓
LINT
 ↓
TYPE CHECK
 ↓
UNIT TEST
 ↓
INTEGRATION TEST
 ↓
SECURITY CHECK
 ↓
BUILD
 ↓
ARTIFACT

Failure blocks release.


---

10.5 Deployment

GitHub
 ↓
CI
 ↓
Production build
 ↓
Live web application
 ↓
PWA
 ↓
Android APK


---

10.6 Database migrations

Never casually modify production tables manually.

Use:

Migration 001
Migration 002
Migration 003
...

Each migration must be version-controlled.


---

10.7 Release records

Every production release should identify:

Version
Git commit
Database migration
Build artifact
Test result
Release date
Known issues
Rollback plan


---

10.8 Rollback

If a deployment breaks the application:

BAD RELEASE
 ↓
STOP
 ↓
ROLL BACK APPLICATION
 ↓
CHECK DATABASE COMPATIBILITY
 ↓
VERIFY EXTERNAL STATE
 ↓
RECONCILE
 ↓
RESUME

Never roll back blindly when financial state may have changed.

Plan 10 completion condition

A commit can move predictably from development through testing to production, with traceability and rollback procedures.


---

PLAN 11 — MASTER TESTING & QUALITY-ASSURANCE PLAN

11.1 Purpose

Attempt to break VELTRION before real operation.


---

11.2 Unit testing

Test:

P/L
Balance
Equity
Risk
Position calculations
Ledger
Wallet
Withdrawal calculations


---

11.3 Authentication testing

Test:

Valid login
Invalid login
Expired session
Logout
Revoked session
Unauthorized request
Wrong device/session


---

11.4 Deriv testing

Test:

OAuth success
OAuth failure
Invalid state
Invalid PKCE
Expired authorization
Disconnect
Reconnect
Market subscription
Market interruption
Account synchronization


---

11.5 Sandbox testing

Test:

BUY
SELL
OPEN
CLOSE
SL
TP
Floating P/L
Realized P/L
Balance
Equity
History
Risk rejection


---

11.6 Duplicate-request testing

Example:

User taps BUY
       ↓
Network delay
       ↓
User taps again

Expected:

ONE ORDER

not two.

Do the same for withdrawals.


---

11.7 Real/sandbox isolation testing

Critical tests:

Sandbox order → must NOT reach Deriv
Sandbox profit → must NOT become real funds
Real order → must NOT appear as sandbox order
Sandbox wallet → must NOT become withdrawal balance


---

11.8 MT5 testing

Only once genuine infrastructure exists:

Login
Server connection
Symbols
Price
Order
Position
SL
TP
Close
Reconnect
Synchronization


---

11.9 Wallet testing

Test:

Deposit/account state
Available balance
Reserved balance
Withdrawal
Duplicate withdrawal
Failed withdrawal
Cancelled withdrawal
External settlement
Reconciliation


---

11.10 Security testing

Test:

Unauthorized API request
Object-level authorization
RLS
Frontend manipulation
Invalid parameters
Token misuse
Session theft scenarios
Rate limiting
Secret exposure


---

11.11 Failure testing

Intentionally simulate:

Internet loss
Database outage
Deriv outage
MT5 outage
Market feed loss
API timeout
Browser refresh
Phone sleep
Server restart
Duplicate request
Partial failure

Expected behavior must be safe and explicit.


---

11.12 Recovery testing

FAILURE
 ↓
DETECT
 ↓
STOP UNSAFE OPERATION
 ↓
RESTORE CONNECTION
 ↓
RECONCILE
 ↓
RECOVER


---

11.13 Production acceptance criteria

Before launch:

Critical bugs = 0
Release blockers = 0
Financial calculation failures = 0
Sandbox/real isolation failures = 0
Security blockers = 0

Plan 11 completion condition

VELTRION has passed functional, security, financial, integration, failure and recovery testing.


---

PLAN 12 — FINAL LAUNCH RUNBOOK

12.1 Purpose

This is the final document used when the system actually moves into production.


---

12.2 Pre-launch

□ Code frozen
□ Tests passed
□ Database migrations reviewed
□ Production secrets configured
□ Backup verified
□ OAuth configured
□ Deriv connection tested
□ MT5 infrastructure verified if enabled
□ Risk controls configured
□ Wallet controls configured
□ Monitoring configured
□ Alerts configured
□ PWA verified
□ APK verified


---

12.3 Production deployment

FINAL COMMIT
     ↓
CI
     ↓
TESTS
     ↓
BUILD
     ↓
DEPLOY
     ↓
HEALTH CHECK


---

12.4 First login

VELTRION
 ↓
ADMIN LOGIN
 ↓
SESSION CREATED
 ↓
HOME

Verify:

Admin identity
Session
Database
Dashboard
Navigation


---

12.5 First Deriv connection

CONNECT DERIV
 ↓
OAuth
 ↓
Consent
 ↓
Callback
 ↓
Verification
 ↓
Account
 ↓
Market

Verify:

Account
Balance
Market
Connection
Reconnection


---

12.6 First sandbox trade

LIVE MARKET
 ↓
SANDBOX
 ↓
BUY/SELL
 ↓
POSITION
 ↓
PRICE MOVEMENT
 ↓
P/L
 ↓
CLOSE
 ↓
LEDGER

Verify every resulting value.


---

12.7 First MT5 test

If genuine MT5 infrastructure is ready:

OFFICIAL MT5
 ↓
LOGIN
 ↓
ACCOUNT
 ↓
SYMBOL
 ↓
PRICE
 ↓
ORDER
 ↓
POSITION
 ↓
VELTRION
 ↓
RECONCILIATION


---

12.8 Real trading activation

Initially:

REAL TRADING
● PAUSED

Only after all required conditions are verified:

ADMIN
 ↓
REAUTHENTICATE
 ↓
VERIFY REAL ACCOUNT
 ↓
VERIFY RISK
 ↓
VERIFY MARKET
 ↓
VERIFY RECONCILIATION
 ↓
ENABLE


---

12.9 Real-money operational controls

Maintain:

Trading pause
Emergency stop
Risk limits
Account verification
Market health
Reconciliation
Audit logging
Withdrawal controls


---

12.10 Post-launch monitoring

First 24 hours

Monitor:

Authentication
Database
Deriv
Market
Sandbox
MT5
Errors
Security
Reconciliation

First 7 days

Review:

Performance
Failures
Logs
Security
Trading state
Market stability
External integrations

First 30 days

Review:

Architecture
Performance
Security
Database
Backups
Risk controls
External APIs
User experience
Operational procedures


---

12.11 Long-term maintenance

VELTRION follows:

MONITOR
   ↓
DETECT
   ↓
INVESTIGATE
   ↓
FIX
   ↓
TEST
   ↓
RELEASE
   ↓
VERIFY
   ↓
MONITOR

Regularly review:

dependencies

security

database performance

backups

API changes

Deriv integration

MT5 integration

financial reconciliation

audit logs

Android/PWA releases



---

12.12 FINAL VELTRION MASTER FLOW

Everything we have planned ultimately becomes:

YOU
                          │
                    VELTRION LOGIN
                          │
                         HOME
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
     DERIV               MT5              SANDBOX
       │                  │                  │
     OAuth          Official MT5       $100,000 Virtual
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                    MARKET ENGINE
                          │
                    TRADING ENGINE
                          │
             ┌────────────┴────────────┐
             │                         │
          SANDBOX                    REAL
             │                         │
       Virtual Ledger             Real Ledger
             │                         │
             │                    Real Wallet
             │                         │
             │                     Withdrawal
             │                         │
             └────────────┬────────────┘
                          │
                    RECONCILIATION
                          │
                    RISK ENGINE
                          │
                    AUDIT ENGINE
                          │
                  ANALYTICS ENGINE
                          │
                  OPERATIONS CENTER
                          │
                   SECURITY CENTER

FINAL MASTER CHECKLIST

PLAN 01  Technical Architecture       → COMPLETE
PLAN 02  Database Schema               → COMPLETE
PLAN 03  API Contracts                 → COMPLETE
PLAN 04  Security & Secrets            → COMPLETE
PLAN 05  Trading Engine                → COMPLETE
PLAN 06  Money & Ledger                → COMPLETE
PLAN 07  Deriv Integration             → COMPLETE
PLAN 08  MT5 Infrastructure            → COMPLETE
PLAN 09  UI/UX                         → COMPLETE
PLAN 10  GitHub + CI/CD                → COMPLETE
PLAN 11  Testing + QA                  → COMPLETE
PLAN 12  Launch Runbook                → COMPLETE

And combined with the 14 product phases, we now have the complete VELTRION roadmap:

VELTRION
                     │
          ┌──────────┴──────────┐
          │                     │
     PRODUCT PLAN          IMPLEMENTATION PLAN
       PHASE 1–14              PLAN 1–12
          │                     │
          └──────────┬──────────┘
                     │
                 BUILD
                     ↓
                 TEST
                     ↓
                DEPLOY
                     ↓
                VERIFY
                     ↓
                OPERATE

This is the point where I would stop expanding the planning hierarchy. The next work should be actual implementation against these documents, starting at Phase 1 / Plan 1, rather than creating Phase 15 or Plan 13.PHASE 14 — FINAL PRODUCTION LAUNCH & MAINTENANCE

This is the final planning phase for VELTRION.

After Phase 14, the architecture and planning blueprint are complete. The work changes from planning to implementation → testing → deployment → operation.


---

14.1 — FINAL VELTRION LAUNCH ARCHITECTURE

VELTRION
                            │
                     FINAL RELEASE
                            │
             ┌──────────────┼──────────────┐
             │              │              │
           WEB             PWA            APK
             │              │              │
             └──────────────┼──────────────┘
                            │
                            ▼
                    SECURE BACKEND
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
     SUPABASE             DERIV                MT5
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                     VELTRION ENGINE
                            │
                ┌───────────┴───────────┐
                │                       │
             SANDBOX                  REAL
                │                       │
          $100,000 virtual          Real funds
                │                       │
                └───────────┬───────────┘
                            │
                            ▼
                    WALLET / LEDGER
                            │
                            ▼
                      RECONCILIATION
                            │
                            ▼
                       ANALYTICS
                            │
                            ▼
                    OPERATIONS / AUDIT


---

14.2 — FINAL PRE-LAUNCH GATE

Before anything is called production, all previous phases must pass.

PHASE 1   Foundation              ✓
PHASE 2   Infrastructure          ✓
PHASE 3   Deriv + Market           ✓
PHASE 4   Sandbox Trading          ✓
PHASE 5   MT5                      ✓
PHASE 6   Real Trading             ✓
PHASE 7   Wallet + Withdrawal      ✓
PHASE 8   Operations + Risk        ✓
PHASE 9   Analytics                ✓
PHASE 10  UI/UX                    ✓
PHASE 11  Security                 ✓
PHASE 12  Testing + Recovery       ✓
PHASE 13  Deployment + Android     ✓
PHASE 14  Launch                    ←

A phase is not considered complete merely because the code exists.

It must pass its acceptance tests.


---

14.3 — PRODUCTION CONFIGURATION FREEZE

Before launch, freeze the production configuration.

That includes:

production URL

Supabase project

authentication configuration

database schema

RLS policies

Deriv application configuration

OAuth redirect URI

MT5 infrastructure configuration

risk limits

wallet configuration

withdrawal configuration

PWA configuration

Android package ID

production secrets


DEVELOPMENT
     │
     ▼
STAGING
     │
     ▼
FINAL REVIEW
     │
     ▼
CONFIGURATION FREEZE
     │
     ▼
PRODUCTION

After the freeze, changes should go through the normal release process rather than being changed casually in production.


---

14.4 — PRODUCTION DATABASE CHECK

Before launch:

SUPABASE
   │
   ├── Authentication
   ├── Database
   ├── RLS
   ├── Functions
   ├── Triggers
   ├── Indexes
   ├── Migrations
   └── Backups

Verify:

□ All migrations applied
□ No duplicate schema objects
□ RLS enabled where required
□ Policies tested
□ Production service credentials protected
□ Backup available
□ Recovery procedure verified


---

14.5 — INITIAL PRODUCTION DATA

The initial VELTRION state should be deliberately minimal.

For the private admin account:

ADMIN
ACTIVE

Sandbox:

Starting Capital: $100,000
Balance: $100,000
Equity: $100,000
Realized P/L: $0
Floating P/L: $0

But those values must be created through the actual database initialization process, not hardcoded into the frontend.


---

14.6 — DERIV PRODUCTION CHECK

Before enabling the Deriv connection:

VELTRION
   ↓
Deriv OAuth
   ↓
Callback
   ↓
State verification
   ↓
PKCE verification
   ↓
Token exchange
   ↓
Account identification
   ↓
Permission verification
   ↓
Market connection

Verify:

□ OAuth application configured
□ Redirect URI exact
□ OAuth flow tested
□ State validation works
□ PKCE validation works
□ Account identified correctly
□ Account type identified correctly
□ Required permissions verified
□ Market data received
□ Reconnection works


---

14.7 — MT5 PRODUCTION CHECK

MT5 should only be marked CONNECTED after genuine MT5 infrastructure has been provisioned and tested.

MT5 INFRASTRUCTURE
        ↓
SERVER
        ↓
VIRTUAL ACCOUNT
        ↓
LOGIN
        ↓
OFFICIAL MT5 TERMINAL
        ↓
ACCOUNT STATE
        ↓
ORDERS / POSITIONS

Verify:

□ Genuine MT5 server
□ Server reachable
□ Account created
□ Credentials work
□ Symbols configured
□ Price feed works
□ Orders work
□ Positions synchronize
□ P/L synchronizes
□ Disconnect/reconnect works

No simulated MT5 server should be presented as genuine.


---

14.8 — SANDBOX GO-LIVE

Sandbox should be the first fully operational trading environment.

Initial state:

SANDBOX
● ACTIVE

Capital:
$100,000

Open Positions:
0

Today's P/L:
$0.00

Run:

Market
 ↓
BUY
 ↓
Position
 ↓
Price movement
 ↓
Floating P/L
 ↓
Close
 ↓
Realized P/L
 ↓
Ledger

Verify every number.


---

14.9 — REAL TRADING INITIAL STATE

Even after deployment, REAL trading should initially remain:

REAL TRADING
● PAUSED

This is intentional.

The application can be live while real-money execution remains disabled until the production environment has been separately verified.


---

14.10 — REAL TRADING ACTIVATION GATE

When the system is ready for controlled real trading:

REQUEST ENABLE
       ↓
ADMIN AUTHENTICATION
       ↓
REAL ACCOUNT VERIFIED
       ↓
ACCOUNT BALANCE VERIFIED
       ↓
DERIV CONNECTION HEALTHY
       ↓
MARKET DATA HEALTHY
       ↓
RISK LIMITS ACTIVE
       ↓
RECONCILIATION HEALTHY
       ↓
NO CRITICAL ALERTS
       ↓
ENABLE REAL TRADING

If one critical condition fails:

REAL TRADING
● PAUSED


---

14.11 — FIRST REAL-TRADING TEST

The first real-money test should be deliberately controlled and only performed when you have verified that the account, authorization, instrument, order type, size, and risk controls are correct.

Lifecycle:

REAL ORDER
    ↓
VALIDATION
    ↓
RISK CHECK
    ↓
SUBMISSION
    ↓
EXTERNAL RESPONSE
    ↓
CONFIRMED / REJECTED
    ↓
POSITION SYNC
    ↓
BALANCE SYNC
    ↓
LEDGER
    ↓
RECONCILIATION

Never infer execution from the fact that the request was successfully sent.


---

14.12 — WALLET GO-LIVE

The wallet has two clearly separated states:

SANDBOX PROFIT
Virtual
Not cash
Not withdrawable

and:

REAL PROFIT
Actual underlying funds
Subject to external account/payment state

The production wallet must preserve that distinction.


---

14.13 — WITHDRAWAL GO-LIVE

Before allowing real withdrawals:

REAL BALANCE
     ↓
AVAILABLE BALANCE
     ↓
RESERVED FUNDS
     ↓
WITHDRAWABLE
     ↓
SECURITY VERIFICATION
     ↓
WITHDRAWAL REQUEST
     ↓
EXTERNAL PROCESSING
     ↓
CONFIRMED SETTLEMENT
     ↓
RECONCILIATION

A withdrawal should never be marked completed solely because a VELTRION record says COMPLETED.


---

14.14 — PRODUCTION MONITORING

Once live, the Operations screen becomes the control center.

SYSTEM HEALTH

API                 ● HEALTHY
DATABASE            ● HEALTHY
AUTH                ● HEALTHY
DERIV               ● HEALTHY
MARKET DATA         ● HEALTHY
SANDBOX ENGINE      ● HEALTHY
MT5                 ● HEALTHY
REAL ENGINE         ● PAUSED
WALLET              ● HEALTHY
WITHDRAWALS         ● HEALTHY
RECONCILIATION      ● HEALTHY

Monitor continuously:

application errors

authentication

database

market feed

Deriv connectivity

MT5 heartbeat

order execution

wallet events

withdrawals

reconciliation

background jobs



---

14.15 — LAUNCH-DAY PROCEDURE

The actual launch sequence becomes:

01. BACKUP
       ↓
02. VERIFY DATABASE
       ↓
03. VERIFY SECURITY
       ↓
04. VERIFY ENVIRONMENT
       ↓
05. BUILD
       ↓
06. RUN TESTS
       ↓
07. DEPLOY WEB
       ↓
08. VERIFY WEB
       ↓
09. VERIFY PWA
       ↓
10. BUILD/INSTALL APK
       ↓
11. VERIFY AUTH
       ↓
12. VERIFY DERIV
       ↓
13. VERIFY MARKET
       ↓
14. VERIFY SANDBOX
       ↓
15. VERIFY MT5
       ↓
16. VERIFY MONITORING
       ↓
17. KEEP REAL TRADING PAUSED
       ↓
18. PRODUCTION ACCEPTANCE


---

14.16 — FIRST 24 HOURS

After launch, monitor more closely.

Check:

Every critical service
Authentication
Database
Market data
Deriv
MT5
Sandbox
Logs
Security alerts
Reconciliation

Look for:

unexpected errors

authentication failures

broken navigation

mobile issues

stale market data

duplicate requests

database errors

incorrect calculations

unexpected external API responses



---

14.17 — FIRST 7 DAYS

During the first operational period:

Daily
 ↓
Health check
 ↓
Database check
 ↓
Security check
 ↓
Trading reconciliation
 ↓
Backup verification
 ↓
Error review
 ↓
Performance review

Review:

sandbox trading results

market-data stability

Deriv connection stability

MT5 synchronization

system performance

security events

audit logs

wallet records



---

14.18 — MAINTENANCE CYCLE

VELTRION becomes a continuously maintained system.

MONITOR
   ↓
DETECT
   ↓
INVESTIGATE
   ↓
FIX
   ↓
TEST
   ↓
DEPLOY
   ↓
VERIFY
   ↓
MONITOR

No production change should skip testing simply because it appears small.


---

14.19 — VERSION RELEASE PROCESS

Every update follows:

NEW CODE
   ↓
FEATURE TEST
   ↓
SECURITY TEST
   ↓
INTEGRATION TEST
   ↓
BUILD
   ↓
STAGING
   ↓
ACCEPTANCE
   ↓
PRODUCTION
   ↓
MONITOR

Example:

VELTRION v1.0.0
        ↓
v1.0.1
        ↓
v1.1.0
        ↓
v1.2.0

Every version should be traceable to its source commit and deployment.


---

14.20 — BACKUP & RECOVERY ROUTINE

Maintain:

DATABASE BACKUPS
CONFIGURATION BACKUPS
MIGRATION HISTORY
AUDIT LOGS
RELEASE ARTIFACTS

Periodically test restoration.

The objective is:

FAILURE
  ↓
RESTORE
  ↓
RECONNECT
  ↓
RECONCILE
  ↓
RESUME


---

14.21 — SECURITY MAINTENANCE

Regularly review:

Active sessions
Devices
OAuth configuration
Secrets
Database policies
RLS
API permissions
Audit logs
Security alerts
Dependencies

Immediately revoke compromised credentials if detected.


---

14.22 — EXTERNAL SERVICE CHANGE MANAGEMENT

VELTRION depends on external systems such as Deriv and, once provisioned, MT5 infrastructure.

If an external API changes:

EXTERNAL CHANGE
       ↓
DETECT
       ↓
TEST
       ↓
UPDATE INTEGRATION
       ↓
STAGING
       ↓
PRODUCTION
       ↓
VERIFY

Do not silently assume external APIs will remain unchanged forever.


---

14.23 — INCIDENT RESPONSE

If something serious happens:

INCIDENT
   ↓
DETECT
   ↓
CLASSIFY
   ↓
CONTAIN
   ↓
PRESERVE DATA
   ↓
INVESTIGATE
   ↓
RECOVER
   ↓
RECONCILE
   ↓
VERIFY
   ↓
RESUME

For example, if real-account state becomes inconsistent:

REAL TRADING
     ↓
PAUSE
     ↓
RECONCILE
     ↓
IDENTIFY CAUSE
     ↓
CORRECT
     ↓
VERIFY
     ↓
RESUME


---

14.24 — FINAL PRODUCTION DASHBOARD

The finished VELTRION Home/Operations environment should give you a quick overview:

┌─────────────────────────────────────┐
│              VELTRION               │
├─────────────────────────────────────┤
│                                     │
│ SANDBOX PROFIT                      │
│ $0.00                               │
│                                     │
│ VIRTUAL CAPITAL                     │
│ $100,000.00                         │
│                                     │
│ DERIV          ● CONNECTED          │
│ MARKET         ● LIVE               │
│ MT5            ● CONNECTED         │
│                                     │
│ OPEN POSITIONS                 0    │
│ TODAY'S P/L                    $0   │
│                                     │
│ REAL TRADING       ● PAUSED         │
│                                     │
│ [ TRADE ]     [ MARKETS ]           │
│                                     │
└─────────────────────────────────────┘


---

14.25 — FINAL VELTRION OPERATING MODEL

After all 14 phases:

VELTRION
                       │
          ┌────────────┴────────────┐
          │                         │
       SANDBOX                     REAL
          │                         │
   $100,000 virtual           Deriv real account
          │                         │
   Sandbox Engine              Real Engine
          │                         │
    Virtual Ledger              Real Ledger
          │                         │
          │                    Real Wallet
          │                         │
          │                     Withdrawal
          │                         │
          └────────────┬────────────┘
                       │
                 RECONCILIATION
                       │
                 ┌─────┴─────┐
                 │           │
              ANALYTICS   AUDIT
                 │           │
                 └─────┬─────┘
                       │
                 OPERATIONS
                       │
                 SECURITY


---

14.26 — FINAL 14-PHASE BLUEPRINT

The complete plan is now:

Phase	System

1	Private Admin Foundation
2	Device & Infrastructure
3	Deriv + Live Market
4	Sandbox Trading Engine
5	Genuine MT5 Integration
6	Real Deriv Trading
7	Profit Wallet + Withdrawal
8	Operations + Risk
9	Analytics + Intelligence
10	Complete UI/UX
11	Security + Hardening
12	Testing + Failure Recovery
13	Deployment + PWA + Android
14	Production Launch + Maintenance



---

14.27 — FINAL LAUNCH GATE

The complete VELTRION project reaches production only when:

┌─────────────────────────────────────────┐
│          VELTRION FINAL GATE            │
├─────────────────────────────────────────┤
│                                         │
│ Architecture             ✓              │
│ Backend                  ✓              │
│ Database                 ✓              │
│ Authentication           ✓              │
│ Security                 ✓              │
│ Deriv integration        ✓              │
│ Live market              ✓              │
│ Sandbox                  ✓              │
│ MT5 infrastructure       ✓*             │
│ Real trading             ✓*             │
│ Wallet                   ✓*             │
│ Withdrawal               ✓*             │
│ Risk engine              ✓              │
│ Reconciliation           ✓              │
│ Analytics                ✓              │
│ UI/UX                    ✓              │
│ Mobile/PWA               ✓              │
│ Android                  ✓              │
│ Testing                  ✓              │
│ Recovery                 ✓              │
│ Monitoring               ✓              │
│ Backup                   ✓              │
│ Deployment               ✓              │
│                                         │
│ * Only after the underlying external    │
│   infrastructure/account is genuinely   │
│   provisioned and verified.              │
│                                         │
│ STATUS: PRODUCTION READY                │
└─────────────────────────────────────────┘

THE PLANNING PHASE IS NOW COMPLETE

We have defined VELTRION from Phase 1 through Phase 14.

The next step is no longer another planning phase.

It is:

BUILD → VERIFY → DEPLOY → TEST → OPERATE.

And the implementation order should start with Phase 1, then progress sequentially, with each phase passing its acceptance gate before the next major layer is enabled.

One important practical point: we should not mark any box above as actually passed yet just because it has been planned. The checkmarks represent the required launch gate. During implementation, each one has to be verified with the real GitHub, Supabase, Deriv, and—when applicable—genuine MT5 infrastructure.PHASE 13 — DEPLOYMENT, PWA & ANDROID

Purpose: take the tested VELTRION production candidate from Phase 12 and turn it into a real, installable product:

GitHub → Build → Test → Live Web App → PWA → Android APK

No new trading logic is introduced here. Phase 13 is about shipping the system safely.


---

13.1 — FINAL DEPLOYMENT ARCHITECTURE

VELTRION SOURCE
                              │
                            GITHUB
                              │
                              ▼
                       CI/CD PIPELINE
                              │
                ┌─────────────┴─────────────┐
                │                           │
             BUILD                       TEST
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
                       PRODUCTION BUILD
                              │
                              ▼
                       LIVE WEB APP
                              │
                 ┌────────────┼────────────┐
                 │            │            │
                 ▼            ▼            ▼
               PHONE        TABLET       DESKTOP
                 │
                 ▼
                PWA
                 │
                 ▼
            ANDROID WRAPPER
                 │
                 ▼
             VELTRION APK

Backend:

VELTRION WEB / APK
                            │
                            ▼
                       SECURE API
                            │
                    ┌───────┴───────┐
                    │               │
                SUPABASE          EXTERNAL
                    │             SERVICES
                    │               │
             ┌──────┼──────┐       ├── Deriv
             │      │      │       └── MT5
            AUTH    DB    EDGE


---

13.2 — SOURCE CONTROL

GitHub becomes the authoritative source for VELTRION application code.

Recommended structure:

VELTRION/
│
├── frontend/
├── backend/
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── configuration/
│
├── android/
├── tests/
├── scripts/
├── docs/
│
├── .github/
│   └── workflows/
│
└── README.md

The exact framework can be finalized during implementation, but the principle remains:

One controlled repository → reproducible builds.


---

13.3 — BRANCHING STRATEGY

Use:

main
 │
 ├── production
 │
 └── feature/*

A safer practical flow:

FEATURE
   ↓
TEST
   ↓
PULL REQUEST
   ↓
CI
   ↓
REVIEW
   ↓
MERGE
   ↓
MAIN
   ↓
PRODUCTION BUILD

For your private one-person project, this does not need to become complicated, but production should still be protected from accidental unfinished changes.


---

13.4 — CI/CD PIPELINE

Every production deployment should automatically run:

Git Push
   ↓
Install Dependencies
   ↓
Lint
   ↓
Type Check
   ↓
Unit Tests
   ↓
Integration Tests
   ↓
Build
   ↓
Security Checks
   ↓
Production Artifact
   ↓
Deploy

If a required step fails:

BUILD FAILED
      ↓
NO PRODUCTION DEPLOYMENT


---

13.5 — ENVIRONMENT CONFIGURATION

Maintain separate environments:

DEVELOPMENT
STAGING
PRODUCTION

Example:

VELTRION_ENV=production
PUBLIC_APP_URL=...
SUPABASE_URL=...
DERIV_APP_ID=...
DERIV_REDIRECT_URI=...

Private secrets remain server-side.

Never build a production APK containing:

Supabase service-role key

OAuth client secret

private API credentials

MT5 administrative credentials

encryption keys



---

13.6 — LIVE WEB APP

The production web application should provide one stable URL.

The user experience becomes:

Chrome
   ↓
VELTRION LIVE URL
   ↓
Login
   ↓
Home

The URL should remain stable so the same installed PWA can refresh to receive new versions.

For the current VELTRION direction, deployment should remain aligned with the previously chosen GitHub/Supabase-centered architecture, rather than introducing an unnecessary Vercel dependency.


---

13.7 — PRODUCTION URL

The final deployment should establish:

https://<VELTRION-PRODUCTION-URL>/

Requirements:

HTTPS

stable URL

correct OAuth redirect URI

PWA manifest

service worker

production API configuration

correct Supabase configuration

no development endpoints


If a custom domain is eventually used:

veltrion.<domain>
        ↓
Production web application

The exact domain can be selected separately.


---

13.8 — PWA CONFIGURATION

VELTRION becomes installable from Chrome.

Required:

manifest.json
service worker
HTTPS
icons
app name
short name
theme
display mode

Example:

Name:
VELTRION

Short name:
VELTRION

Display:
standalone

Start URL:
/


---

13.9 — VELTRION APP ICON

The PWA should use the actual VELTRION branding rather than the browser's generic icon.

Required sizes should include appropriate Android/PWA icon variants.

VELTRION LOGO
      ↓
1024×1024 source
      ↓
PWA icons
      ↓
Android launcher icon

The icon should remain recognizable at small sizes.


---

13.10 — SPLASH SCREEN

When the Android application starts:

┌──────────────────────┐
│                      │
│                      │
│       VELTRION       │
│                      │
│   TRADE • CONTROL    │
│                      │
│                      │
└──────────────────────┘

Then:

Splash
  ↓
Session check
  ↓
Login/Home

Do not display fake loading data while the backend is being checked.


---

13.11 — PWA INSTALLATION FLOW

On Android Chrome:

VELTRION WEB
    ↓
Install App
    ↓
Add to Home Screen
    ↓
VELTRION ICON
    ↓
OPEN
    ↓
Standalone App

The installed PWA should retain the same backend account and data.


---

13.12 — OFFLINE BEHAVIOR

VELTRION is a financial/trading system, so offline behavior must be conservative.

The app can cache:

static UI

branding

application shell

non-sensitive static resources


But it should not pretend live trading is available offline.

For example:

NETWORK LOST

Market data unavailable.
Real-time trading is unavailable.

[ RETRY ]

No stale price should be presented as a current price.


---

13.13 — PWA UPDATE SYSTEM

When a new version is deployed:

OLD VERSION
     ↓
NEW BUILD
     ↓
SERVICE WORKER UPDATE
     ↓
VERSION DETECTED
     ↓
REFRESH / UPDATE

The system should avoid leaving the user permanently stuck on an obsolete application shell.

A version indicator can be added:

VELTRION v1.0.x


---

13.14 — ANDROID APPLICATION

The PWA can be wrapped into an Android application.

VELTRION WEB APP
       ↓
ANDROID WEB APP WRAPPER
       ↓
ANDROID PROJECT
       ↓
BUILD
       ↓
VELTRION APK

The wrapper should use the same production VELTRION URL/backend.

It should not create a second independent financial system.


---

13.15 — ANDROID PACKAGE ID

Use a permanent package identifier.

For example:

com.veltrion.app

The final package ID should be chosen before the first production release because changing it later effectively creates a different Android application.


---

13.16 — ANDROID SECURITY

The APK must not contain production secrets.

The Android application should:

APK
 │
 └── HTTPS
       │
       ▼
VELTRION BACKEND
       │
       ├── Supabase
       ├── Deriv
       └── MT5

The APK is a client.

It is not the financial authority.


---

13.17 — ANDROID SESSION

The application should support:

login

persistent authenticated session where securely supported

logout

session expiration

session revocation

device registration

security verification


If the phone is lost:

VELTRION SECURITY
       ↓
REVOKE DEVICE SESSION
       ↓
PHONE
ACCESS DENIED


---

13.18 — ANDROID NETWORK HANDLING

Test:

Wi-Fi
 ↓
Mobile Data
 ↓
No Network
 ↓
Network Restored

The app should automatically re-check:

authentication

market connection

Deriv connection

current account state

open positions

pending transactions


It must not assume that the state from before the network interruption is still current.


---

13.19 — ANDROID BACK BUTTON

The Android back button needs deliberate behavior.

For example:

Trading
   ↓
Market
   ↓
Order Panel

Back should navigate appropriately rather than accidentally logging out or closing a critical operation.

For sensitive confirmations:

REAL ORDER CONFIRMATION

pressing Back should safely cancel/close the dialog rather than submit anything.


---

13.20 — DEEP LINKS

Eventually, VELTRION can support links such as:

veltrion://...

or HTTPS app links.

Potential uses:

OAuth callback handling

opening a specific VELTRION screen

security verification

notification navigation


However, OAuth callbacks must be designed carefully and tested against the actual Deriv application configuration.


---

13.21 — DERIV OAUTH IN PRODUCTION

Production configuration becomes:

VELTRION
   ↓
Connect Deriv
   ↓
Production OAuth
   ↓
Deriv
   ↓
Production callback
   ↓
State + PKCE verification
   ↓
Backend token exchange
   ↓
Authenticated account

The production redirect URI must exactly correspond to the registered OAuth application configuration.

Development and production callbacks should not be casually mixed.


---

13.22 — MT5 PRODUCTION CONFIGURATION

Once genuine MT5 infrastructure has been provisioned:

VELTRION
   │
   ▼
Production MT5 Infrastructure
   │
   ▼
Virtual Account
   │
   ▼
Official MT5 Terminal

The actual:

server

login

account

password

symbols

trading permissions


come from the real MT5 infrastructure.

VELTRION must not invent them.


---

13.23 — PRODUCTION DATABASE

Production gets its own Supabase environment/configuration.

Core areas:

AUTH
ADMIN
SANDBOX
DERIV
MARKETS
MT5
REAL TRADING
WALLETS
WITHDRAWALS
ANALYTICS
OPERATIONS
SECURITY
AUDIT

Before deployment:

Migrations
   ↓
Production DB
   ↓
Schema verification
   ↓
RLS verification
   ↓
Indexes
   ↓
Functions
   ↓
Triggers


---

13.24 — DATABASE MIGRATION RULE

Production database changes must be versioned.

Migration 001
Migration 002
Migration 003
...
Migration N

Do not manually change production tables without recording the change in the migration system.

This allows the production database to be reproduced and recovered reliably.


---

13.25 — PRODUCTION OBSERVABILITY

After deployment:

LIVE VELTRION
      │
      ▼
MONITORING
      │
 ┌────┼─────┐
 │    │     │
API  DB   EXTERNAL
 │    │     │
 │    │   Deriv
 │    │   MT5
 │    │
 └────┼─────┘
      │
    Alerts

Monitor:

application errors

API failures

database failures

authentication errors

Deriv connection

market feed

MT5 heartbeat

real trading state

withdrawals

reconciliation



---

13.26 — RELEASE VERSIONING

Use clear versions.

Example:

VELTRION v1.0.0

Then:

v1.0.1
v1.0.2
v1.1.0
v2.0.0

The Android APK and web application should be traceable to a specific Git commit/release.


---

13.27 — RELEASE ARTIFACTS

A successful production release should produce:

✓ Web build
✓ PWA build
✓ Android APK
✓ Source commit
✓ Database migration version
✓ Release notes
✓ Test report

This gives every deployed version a traceable identity.


---

13.28 — ROLLBACK PLAN

If production deployment causes a serious problem:

NEW RELEASE
    ↓
PROBLEM
    ↓
DETECT
    ↓
PAUSE AFFECTED OPERATIONS
    ↓
ROLL BACK APPLICATION
    ↓
VERIFY DATABASE
    ↓
RECONCILE EXTERNAL SYSTEMS
    ↓
RESTORE SERVICE

Database migrations need special care because rolling back application code does not automatically mean a database migration can safely be reversed.


---

13.29 — PRODUCTION DEPLOYMENT GATE

Before clicking the final deployment button:

PHASE 12 TESTS
      ✓
      │
      ▼
SECURITY CHECK
      ✓
      │
      ▼
DATABASE CHECK
      ✓
      │
      ▼
ENVIRONMENT CHECK
      ✓
      │
      ▼
DERIV CONFIG CHECK
      ✓
      │
      ▼
MT5 CONFIG CHECK
      ✓
      │
      ▼
PWA CHECK
      ✓
      │
      ▼
ANDROID BUILD CHECK
      ✓
      │
      ▼
PRODUCTION DEPLOY


---

13.30 — FIRST PRODUCTION STATE

The initial live VELTRION installation should not automatically begin with unrestricted real trading.

Recommended initial state:

VELTRION
────────────────────

WEB APP             ● LIVE
PWA                 ● LIVE
ANDROID             ● LIVE

SUPABASE            ● CONNECTED
DERIV MARKET        ● CONNECTED
SANDBOX             ● ACTIVE
MT5                 ● TEST/CONNECTED

REAL TRADING        ● PAUSED
WITHDRAWALS         ● CONTROLLED

This gives you a controlled production environment before enabling the most sensitive functions.


---

13.31 — FIRST PHONE TEST

Once the production web app is live:

ANDROID PHONE
     ↓
Chrome
     ↓
VELTRION URL
     ↓
LOGIN
     ↓
HOME
     ↓
INSTALL PWA
     ↓
VELTRION ICON
     ↓
OPEN

Then verify:

✓ Login
✓ Home
✓ Sandbox
✓ Market data
✓ Deriv connection
✓ Navigation
✓ Session persistence
✓ Logout
✓ Re-login


---

13.32 — APK TEST

Install the APK on the Android device.

Verify:

APK
 ↓
Splash
 ↓
Login
 ↓
Home
 ↓
Sandbox
 ↓
Markets
 ↓
Deriv
 ↓
Security

Then test:

Screen lock
Network loss
Network recovery
App close
App reopen
Logout
Session expiry
Device revocation


---

13.33 — APK VS PWA

Both should connect to the same backend.

VELTRION BACKEND
                    ▲
              ┌─────┴─────┐
              │           │
             PWA          APK
              │           │
           Browser      Android

Therefore:

If you create a sandbox position on the PWA:

PWA
 ↓
SERVER
 ↓
APK

the APK should see the same position.

And vice versa.


---

13.34 — FINAL PHASE 13 ACCEPTANCE TEST

□ GitHub repository production-ready
□ CI/CD working
□ Production build reproducible
□ Production environment configured
□ Secrets protected
□ Stable live URL
□ HTTPS active
□ PWA manifest valid
□ Service worker valid
□ VELTRION icon installed
□ Splash screen works
□ PWA installation works
□ PWA update works
□ Android wrapper works
□ APK builds successfully
□ APK installs successfully
□ APK login works
□ APK connects to production backend
□ PWA and APK share the same account state
□ Deriv production OAuth configured correctly
□ MT5 production configuration verified
□ Database migrations verified
□ RLS verified
□ Monitoring active
□ Rollback procedure tested
□ Production version tagged
□ Phase 12 tests passed


---

PHASE 13 FINAL ARCHITECTURE

GITHUB
                            │
                            ▼
                       CI / BUILD
                            │
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
                 WEB BUILD      ANDROID BUILD
                    │               │
                    ▼               ▼
               LIVE VELTRION      APK
                    │               │
                    └───────┬───────┘
                            │
                            ▼
                     SECURE BACKEND
                            │
              ┌─────────────┼─────────────┐
              │             │             │
          SUPABASE        DERIV          MT5
              │             │             │
              └─────────────┼─────────────┘
                            │
                            ▼
                     VELTRION ENGINE
                            │
                 ┌──────────┴──────────┐
                 │                     │
             SANDBOX                  REAL
                 │                     │
             $100,000               REAL FUNDS
                 │                     │
                 └──────────┬──────────┘
                            │
                       WALLET / AUDIT

PHASE 13 RESULT

At the end of Phase 13, VELTRION is no longer just a tested codebase.

It has a defined path to:

GitHub source → automated build → live web application → installable PWA → Android APK → shared production backend → Deriv/MT5 integrations.

The final planning phase is PHASE 14 — FINAL PRODUCTION LAUNCH & MAINTENANCE, which defines the actual go-live checklist, first production configuration, launch sequence, monitoring after launch, updates, backups, incident response, and long-term maintenance.PHASE 12 — FULL SYSTEM TESTING & FAILURE RECOVERY

Purpose: deliberately test VELTRION as if it were already operating in production, including normal workflows, failures, interruptions, duplicate requests, security failures, financial mismatches, and recovery.

Phase 12 is the “break it before launch” phase.


---

12.1 — MASTER TEST ARCHITECTURE

VELTRION
                            │
                            ▼
                     AUTHENTICATION
                            │
                            ▼
                        DASHBOARD
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
        DERIV              MT5             SANDBOX
          │                 │                 │
          ▼                 ▼                 ▼
      MARKET DATA       MT5 ACCOUNT      VIRTUAL ENGINE
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                            ▼
                       REAL TRADING
                            │
                            ▼
                         WALLET
                            │
                            ▼
                       WITHDRAWAL
                            │
                            ▼
                     RECONCILIATION
                            │
                            ▼
                        ANALYTICS
                            │
                            ▼
                     AUDIT / MONITORING

Every branch is tested independently and end-to-end.


---

12.2 — TEST ENVIRONMENTS

Create three environments:

DEVELOPMENT
     │
     ▼
STAGING
     │
     ▼
PRODUCTION

Development

For rapid code testing.

Staging

Production-like environment used for full integration testing.

Production

Only receives a build that passes the required test gates.


---

12.3 — TEST DATA SEPARATION

Testing must never accidentally use real money.

TEST ENVIRONMENT
       │
       ├── TEST AUTH
       ├── TEST DATABASE
       ├── SANDBOX TRADING
       ├── TEST DERIV CONFIG
       └── TEST MT5 CONFIG

Real-money credentials and production financial data must not be used simply because they are convenient.


---

12.4 — TEST LEVELS

VELTRION gets multiple layers of testing.

UNIT TESTS
    ↓
INTEGRATION TESTS
    ↓
API TESTS
    ↓
DATABASE TESTS
    ↓
SECURITY TESTS
    ↓
TRADING ENGINE TESTS
    ↓
EXTERNAL INTEGRATION TESTS
    ↓
END-TO-END TESTS
    ↓
FAILURE TESTS
    ↓
RECOVERY TESTS
    ↓
PRODUCTION READINESS


---

12.5 — UNIT TESTING

Test individual calculations and functions.

Examples:

P/L

Entry Price
Current Price
Position Size
Direction
       ↓
Correct P/L

Test:

BUY profit

BUY loss

SELL profit

SELL loss

zero movement

fractional values

rounding


Balance

Starting Balance
+ Realized P/L
- Withdrawals
+/- Other valid transactions
= Correct Balance


---

12.6 — RISK ENGINE TESTS

Test:

Maximum position size
Maximum open positions
Maximum daily loss
Maximum exposure

Example:

Max position = 1.00

Request = 1.50

Expected:
REJECTED

The test must verify that the backend rejects it even if the frontend is manipulated.


---

12.7 — SANDBOX ENGINE TESTING

Test the entire virtual lifecycle.

CREATE ORDER
     ↓
VALIDATE
     ↓
OPEN POSITION
     ↓
PRICE CHANGES
     ↓
FLOATING P/L
     ↓
SL / TP
     ↓
CLOSE
     ↓
REALIZED P/L
     ↓
LEDGER
     ↓
BALANCE

Test:

BUY

SELL

manual close

stop loss

take profit

multiple positions

simultaneous positions

market-data interruption

browser refresh

phone disconnect



---

12.8 — SANDBOX ACCOUNT INTEGRITY TEST

Start:

Balance = $100,000
Equity  = $100,000

Open a virtual trade.

Then verify:

Balance
Equity
Floating P/L
Position
Ledger

all remain internally consistent.

After closing:

Balance
= Previous Balance
+ Realized P/L

The database and UI must agree.


---

12.9 — DERIV OAUTH TESTING

Test the complete OAuth flow:

VELTRION
   ↓
CONNECT DERIV
   ↓
DERIV LOGIN
   ↓
CONSENT
   ↓
CALLBACK
   ↓
STATE CHECK
   ↓
PKCE CHECK
   ↓
TOKEN EXCHANGE
   ↓
ACCOUNT IDENTIFICATION
   ↓
AUTHENTICATED SESSION

Test failures at every stage.


---

12.10 — INVALID OAUTH STATE

Simulate:

Expected state:
ABC123

Returned state:
XYZ999

Expected:

AUTHORIZATION REJECTED

VELTRION must not create a Deriv session.


---

12.11 — INVALID PKCE

Use an incorrect verifier.

Expected:

TOKEN EXCHANGE FAILED

No authenticated account should be created.


---

12.12 — EXPIRED OAUTH SESSION

Test an expired authorization/token.

Expected behavior:

DERIV SESSION
     ↓
EXPIRED
     ↓
REAL TRADING BLOCKED
     ↓
RECONNECT / REAUTHORIZE

The application must not pretend the account remains authenticated.


---

12.13 — DERIV MARKET-DATA TEST

Normal:

Deriv
 ↓
WebSocket
 ↓
Ticks
 ↓
Market Engine
 ↓
VELTRION

Verify:

symbol

timestamp

bid/ask where applicable

price

subscription status

last tick

reconnect behavior



---

12.14 — MARKET DISCONNECT TEST

Simulate:

LIVE TICKS
   ↓
NETWORK FAILURE
   ↓
NO TICKS

Expected:

MARKET DATA
● DEGRADED

New trades that require fresh prices should be blocked according to the trading rules.

Existing positions must not magically disappear.


---

12.15 — MARKET RECONNECT TEST

Then restore the connection.

NETWORK RESTORED
       ↓
WEBSOCKET RECONNECT
       ↓
SUBSCRIPTIONS RESTORED
       ↓
FRESH TICK
       ↓
MARKET = LIVE

Verify that duplicate subscriptions are not created.


---

12.16 — MT5 TESTING

Once genuine MT5 infrastructure is available:

Official MT5
     ↓
VELTRION MT5 Server
     ↓
Virtual Account
     ↓
Trading Engine

Test:

server discovery

login

password

account number

symbol availability

prices

order submission

order status

position status

SL/TP

account balance

equity

disconnect

reconnect



---

12.17 — MT5 DISCONNECT

Simulate:

MT5
 ↓
CONNECTION LOST

Expected:

MT5
● OFFLINE

VELTRION must not report:

● CONNECTED

because the last known state was connected.


---

12.18 — MT5 RECONNECTION

After connection returns:

CONNECT
   ↓
AUTHENTICATE
   ↓
ACCOUNT STATE
   ↓
POSITIONS
   ↓
ORDERS
   ↓
SYMBOLS
   ↓
SYNC COMPLETE

Only after synchronization should the connection return to healthy status.


---

12.19 — REAL TRADING TEST

Real trading must first be tested in a controlled test environment/account where applicable.

Test lifecycle:

REAL MODE REQUEST
       ↓
ACCOUNT VERIFIED
       ↓
PERMISSIONS VERIFIED
       ↓
RISK CHECK
       ↓
MARKET CHECK
       ↓
RECONCILIATION CHECK
       ↓
ORDER SUBMITTED
       ↓
DERIV RESPONSE
       ↓
EXECUTION CONFIRMED / REJECTED
       ↓
POSITION SYNC
       ↓
LEDGER UPDATE

Never mark an order as filled merely because VELTRION sent the request.


---

12.20 — REAL ORDER REJECTION

Simulate a rejected order.

Expected:

ORDER
SUBMITTED
   ↓
DERIV
REJECTED
   ↓
VELTRION
REJECTED

There must be no fake position.

There must be no fake profit/loss.


---

12.21 — DUPLICATE ORDER TEST

This is critical.

User presses:

BUY
BUY

or network retries the same request.

Expected:

Request #1 → ACCEPTED
Request #2 → DUPLICATE

Only one order should exist.

Use idempotency keys and backend transaction controls.


---

12.22 — BROWSER REFRESH TEST

During:

order creation

position update

withdrawal request

OAuth callback


refresh the browser.

Expected:

NO DUPLICATE ORDER
NO DUPLICATE WITHDRAWAL
NO CORRUPTED SESSION
NO LOST LEDGER EVENT

The database/backend must own transaction state.


---

12.23 — PHONE SLEEP TEST

Because VELTRION is intended to work on mobile:

PHONE
  ↓
VELTRION OPEN
  ↓
SCREEN LOCKED
  ↓
NETWORK INTERRUPTED
  ↓
PHONE REOPENED

Expected:

SESSION CHECK
      ↓
DATA REFRESH
      ↓
CURRENT STATE

The app must retrieve current state from the backend rather than trusting stale browser memory.


---

12.24 — MULTI-DEVICE TEST

Example:

PHONE
   │
   ├── VELTRION
   │
   ▼
TABLET
   │
   └── VELTRION

Perform an action on the phone.

Then open the tablet.

The tablet should retrieve the current server state.

Example:

PHONE
Close Position
     ↓
SERVER
     ↓
TABLET
Position = CLOSED


---

12.25 — WALLET TESTING

Test:

AVAILABLE
RESERVED
WITHDRAWABLE

Example:

Available = $1,000
Reserved  = $200
Withdrawable = $800

Request $900:

REJECTED

Request $500:

ACCEPTED


---

12.26 — DUPLICATE WITHDRAWAL TEST

Simulate:

REQUEST WITHDRAWAL
      ↓
NETWORK DELAY
      ↓
USER PRESSES AGAIN

Expected:

ONE WITHDRAWAL

not:

TWO WITHDRAWALS


---

12.27 — WITHDRAWAL FAILURE TEST

Test:

REQUEST
   ↓
PROCESSING
   ↓
EXTERNAL FAILURE

Expected:

FAILED

and funds must be handled according to the defined reservation/reversal rules.

The system must not silently lose or duplicate funds.


---

12.28 — RECONCILIATION TEST

Create an intentional mismatch.

Example:

VELTRION:
$1,000

External Account:
$900

Expected:

MISMATCH DETECTED
       ↓
CRITICAL ALERT
       ↓
REAL TRADING PAUSED
       ↓
WITHDRAWAL RESTRICTIONS
       ↓
RECONCILIATION PROCESS

The system should not simply overwrite one value with the other without determining why they differ.


---

12.29 — DATABASE FAILURE TEST

Simulate temporary database unavailability.

Expected:

DATABASE
● OFFLINE

VELTRION should:

stop operations that require database confirmation

avoid creating partial financial transactions

show an appropriate error

retry where safe

preserve idempotency


It should never show a successful financial operation when the transaction was not committed.


---

12.30 — NETWORK FAILURE TEST

Test during:

login

OAuth

market streaming

sandbox order

real order

withdrawal

MT5 connection


Every operation needs an explicit final state.

For example:

UNKNOWN

is preferable to incorrectly displaying:

SUCCESS

when the server's final state is unknown.

The system can then reconcile the transaction before allowing a retry.


---

12.31 — SECURITY TESTING

Attempt unauthorized actions.

Examples:

Anonymous user → dashboard
Anonymous user → orders
Anonymous user → wallet

Unauthorized session → real trading
Unauthorized session → withdrawal
Unauthorized session → risk configuration

Expected:

ACCESS DENIED


---

12.32 — DATABASE AUTHORIZATION TEST

Try accessing another record by manipulating IDs.

Example:

/account/123

changed to:

/account/124

Expected:

ACCESS DENIED

This tests object-level authorization.


---

12.33 — FRONTEND MANIPULATION TEST

Modify browser values.

Example:

UI says:
Max order = 1.00

Modify browser request:

quantity = 1000

Expected:

SERVER
REJECTED

The backend must not trust frontend restrictions.


---

12.34 — REAL/SANDBOX LEAK TEST

This is one of the most important VELTRION tests.

Attempt:

SANDBOX ORDER
     ↓
REAL EXECUTION ROUTE

Expected:

BLOCKED

Attempt:

SANDBOX PROFIT
     ↓
REAL PROFIT WALLET

Expected:

BLOCKED

Attempt:

REAL ORDER
     ↓
SANDBOX LEDGER

Expected:

BLOCKED / CORRECTLY ROUTED


---

12.35 — ANALYTICS TESTING

Verify that analytics agree with source records.

Example:

Trade Records
     ↓
Analytics Engine
     ↓
Daily P/L
     ↓
Dashboard

If the ledger says:

+$100

analytics must not report:

+$150

without a documented reason.


---

12.36 — AUDIT LOG TESTING

Every critical event should produce an audit entry.

Test:

LOGIN
LOGOUT
DERIV CONNECT
MT5 CONNECT
ORDER
POSITION CLOSE
REAL ENABLE
REAL PAUSE
WITHDRAWAL
SECURITY CHANGE
RECONCILIATION

Verify:

timestamp

event type

actor

result

relevant reference ID



---

12.37 — FAILURE RECOVERY MATRIX

Failure	Expected Response

Deriv offline	Market/real trading degraded or paused
MT5 offline	MT5 marked offline; sync on reconnect
Database unavailable	Financial writes blocked safely
OAuth failure	No authenticated Deriv session
Expired token	Reauthorization/reconnection
Stale prices	New execution appropriately blocked
Duplicate order	One transaction only
Duplicate withdrawal	One withdrawal only
Real balance mismatch	Reconciliation + pause
Network interruption	Reconcile uncertain operations
Session revoked	Access denied
Unauthorized API request	Rejected
Risk limit exceeded	Order rejected
External order rejected	No fake position
Withdrawal failure	Explicit failed state + funds handling
Phone sleep	Refresh current state
Browser refresh	Preserve backend transaction state



---

12.38 — DISASTER RECOVERY

Test:

PRODUCTION FAILURE
       ↓
IDENTIFY FAILURE
       ↓
STOP AFFECTED OPERATIONS
       ↓
PRESERVE DATA
       ↓
RESTORE SERVICES
       ↓
RECONNECT EXTERNAL SYSTEMS
       ↓
RECONCILE
       ↓
VERIFY
       ↓
RESUME

For real trading:

Reconciliation must happen before automatically resuming normal execution after a serious failure.


---

12.39 — END-TO-END MASTER TEST

Now test the entire VELTRION journey.

LOGIN
  ↓
HOME
  ↓
DERIV CONNECT
  ↓
OAUTH
  ↓
ACCOUNT VERIFIED
  ↓
LIVE MARKET
  ↓
SANDBOX TRADE
  ↓
POSITION
  ↓
PROFIT
  ↓
MT5
  ↓
ACCOUNT SYNC
  ↓
REAL MODE
  ↓
REAL ACCOUNT VERIFICATION
  ↓
CONTROLLED REAL ORDER TEST
  ↓
REAL POSITION
  ↓
REAL P/L
  ↓
REAL WALLET
  ↓
WITHDRAWAL
  ↓
SETTLEMENT
  ↓
RECONCILIATION
  ↓
ANALYTICS
  ↓
AUDIT

Every transition must be verified.


---

12.40 — MOBILE END-TO-END TEST

Repeat the critical workflow on the phone:

Phone
 ↓
Login
 ↓
Home
 ↓
Deriv
 ↓
Markets
 ↓
Sandbox
 ↓
Positions
 ↓
History
 ↓
Wallet
 ↓
Security

Test:

portrait

landscape where supported

slow network

Wi-Fi → mobile data

screen lock

app reopening

browser refresh

PWA reopening



---

12.41 — PERFORMANCE TESTING

Measure:

Login response
Dashboard load
Market tick latency
Order validation
Order response
Database queries
Analytics load
Withdrawal request
Reconciliation

Look for:

slow queries

repeated API requests

unnecessary WebSocket subscriptions

memory leaks

excessive database writes

duplicate background jobs



---

12.42 — LOAD TESTING

Even though VELTRION starts as a private one-person system, test realistic bursts.

For example:

100 market ticks
1 second

and:

multiple simultaneous background events

The system should process market updates efficiently without corrupting positions or ledger records.


---

12.43 — TEST REPORT

Every test should have:

TEST ID
DESCRIPTION
ENVIRONMENT
INPUT
EXPECTED RESULT
ACTUAL RESULT
PASS / FAIL
ERROR
SEVERITY
FIX
RETEST

Example:

TEST: REAL-ORDER-004

Expected:
Duplicate request rejected.

Actual:
Duplicate request rejected.

Status:
PASS


---

12.44 — BUG SEVERITY

Use four levels.

CRITICAL

Examples:

real/sandbox funds mixed

unauthorized real order

duplicate withdrawal

incorrect ledger balance

credential exposure


Must block release.

HIGH

Examples:

Deriv cannot reconnect

MT5 account state incorrect

reconciliation failure

major security bypass


Must normally block release.

MEDIUM

Examples:

analytics calculation issue

non-critical UI error

notification failure


LOW

Examples:

spacing

minor visual issue

wording



---

12.45 — FINAL PHASE 12 RELEASE GATE

VELTRION cannot proceed to production deployment until:

┌─────────────────────────────────────┐
│       VELTRION TEST GATE            │
├─────────────────────────────────────┤
│                                     │
│ Unit Tests              ✓           │
│ Integration Tests       ✓           │
│ API Tests               ✓           │
│ Database Tests          ✓           │
│ Security Tests          ✓           │
│ Sandbox Tests           ✓           │
│ Deriv Tests             ✓           │
│ MT5 Tests               ✓           │
│ Wallet Tests            ✓           │
│ Withdrawal Tests        ✓           │
│ Reconciliation Tests    ✓           │
│ Mobile Tests            ✓           │
│ Multi-device Tests      ✓           │
│ Failure Tests            ✓           │
│ Recovery Tests           ✓           │
│ Performance Tests        ✓           │
│ End-to-End Tests         ✓           │
│                                     │
│ CRITICAL BUGS: 0                    │
│ RELEASE BLOCKERS: 0                 │
│                                     │
│ STATUS: PRODUCTION CANDIDATE        │
└─────────────────────────────────────┘

PHASE 12 RESULT

At the end of Phase 12, VELTRION should have evidence that the system can:

operate normally → detect failures → stop safely → preserve state → recover → reconcile → resume.

That is the difference between simply having features and having a system that has been tested under failure.

Next: PHASE 13 — DEPLOYMENT, PWA & ANDROID

Phase 13 will define how the tested VELTRION system moves from GitHub/Supabase into the live web application → installable PWA → Android APK, including production configuration, app icon/splash, CI/CD, domain/URL strategy, and release process.PHASE 11 — SECURITY, COMPLIANCE & PRODUCTION HARDENING

Purpose: make VELTRION secure enough to move from a development system toward controlled production operation.

Phase 11 does not add another trading feature. It protects everything already designed in Phases 1–10.


---

11.1 — SECURITY ARCHITECTURE

VELTRION
                            │
                     ┌──────▼──────┐
                     │    LOGIN    │
                     └──────┬──────┘
                            │
                    AUTHENTICATION
                            │
                    AUTHORIZATION
                            │
                 ┌──────────▼──────────┐
                 │   SECURITY LAYER    │
                 └──────────┬──────────┘
                            │
       ┌────────────┬───────┼────────┬─────────────┐
       │            │       │        │             │
      DB           API    DERIV     MT5         FINANCE
      RLS        Security  Tokens  Credentials   Controls
       │            │       │        │             │
       └────────────┴───────┼────────┴─────────────┘
                            │
                       AUDIT LOG
                            │
                       MONITORING
                            │
                     ALERT / RESPONSE

The security principle is:

> Never trust the browser.



Anything involving authentication, permissions, trading, money, credentials, or financial records must be validated server-side.


---

11.2 — AUTHENTICATION HARDENING

VELTRION remains a private admin system.

There should be no open public registration.

VELTRION
   │
LOGIN
   │
Supabase Auth
   │
Session Verification
   │
Admin Authorization
   │
HOME

Security requirements:

secure password authentication

session expiration

refresh-token handling

logout

session revocation

device/session tracking

protection against unauthorized account creation

protection against brute-force attempts

re-authentication for sensitive operations



---

11.3 — ADMIN AUTHORIZATION

Authentication answers:

> "Who are you?"



Authorization answers:

> "What are you allowed to do?"



VELTRION should maintain an explicit authorization layer.

Example:

ADMIN
 ├── VIEW_DASHBOARD
 ├── VIEW_MARKETS
 ├── TRADE_SANDBOX
 ├── CONNECT_DERIV
 ├── VIEW_REAL_ACCOUNT
 ├── ENABLE_REAL_TRADING
 ├── REQUEST_WITHDRAWAL
 ├── CHANGE_RISK_LIMITS
 └── MANAGE_SECURITY

Even though VELTRION initially has only one administrator, the authorization model should still exist.

That prevents the application from becoming dependent on a frontend assumption such as:

if loggedIn = true
    allowEverything()


---

11.4 — DATABASE SECURITY

Supabase Row Level Security (RLS) becomes mandatory.

VELTRION UI
     │
     ▼
AUTH SESSION
     │
     ▼
DATABASE REQUEST
     │
     ▼
RLS POLICY
     │
 ┌───┴────┐
 │        │
ALLOW    DENY

Tables containing sensitive information should not be publicly readable.

Examples:

admin_users

sandbox_accounts

sandbox_orders

sandbox_positions

sandbox_ledger

deriv_connections

real_trading_accounts

real_orders

real_positions

real_ledger

withdrawals

security_events

audit_logs

MT5 credentials/connection metadata



---

11.5 — SERVICE-ROLE PROTECTION

Supabase service-role credentials must never be placed in:

frontend JavaScript

GitHub Pages

browser local storage

public environment variables

client-side configuration


Correct:

Browser
   │
   ▼
Secure backend/Edge Function
   │
   ▼
Service-role credential
   │
   ▼
Supabase

Incorrect:

Browser
   │
   └── SERVICE_ROLE_KEY ❌


---

11.6 — API SECURITY

Every sensitive API endpoint should perform:

REQUEST
  │
  ▼
Authentication
  │
  ▼
Authorization
  │
  ▼
Input Validation
  │
  ▼
Risk Validation
  │
  ▼
Business Rules
  │
  ▼
Database / External API

Endpoints should reject:

missing authentication

invalid sessions

unauthorized actions

malformed input

impossible quantities

invalid symbols

invalid account IDs

invalid transaction states

duplicate requests



---

11.7 — INPUT VALIDATION

VELTRION must never assume that values coming from the browser are correct.

For example:

quantity = 999999999

cannot simply be accepted because the UI normally limits the input.

Backend validation must check:

minimum quantity

maximum quantity

decimal precision

allowed symbol

account balance

exposure

risk limits

trading mode

account status



---

11.8 — DERIV SECURITY

The Deriv connection remains OAuth-based.

VELTRION
   │
   ▼
Deriv OAuth
   │
   ▼
User authenticates at Deriv
   │
   ▼
Consent
   │
   ▼
Callback
   │
   ▼
State verification
   │
   ▼
PKCE verification
   │
   ▼
Backend token exchange
   │
   ▼
Secure Deriv session

VELTRION must never request or store the user's Deriv password as part of this flow.

OAuth tokens must be protected as sensitive credentials.


---

11.9 — OAUTH ATTACK PROTECTION

The implementation must validate:

State

Prevents an attacker from injecting an unauthorized OAuth response.

PKCE

Protects the authorization-code flow.

Redirect URI

Must exactly match the registered application configuration.

Token exchange

Should happen server-side where required by the chosen OAuth architecture.

Session binding

The returned authorization result must correspond to the VELTRION session that initiated it.


---

11.10 — DERIV ACCOUNT VERIFICATION

Before REAL trading becomes available:

Deriv Connected
      │
      ▼
Account Retrieved
      │
      ▼
Account Type Verified
      │
      ▼
Trading Permission Verified
      │
      ▼
Currency / Balance Verified
      │
      ▼
REAL MODE ELIGIBLE

If any verification fails:

REAL TRADING
● PAUSED


---

11.11 — MT5 SECURITY

MT5 credentials are sensitive.

VELTRION must not expose account passwords unnecessarily.

Instead:

MT5 Account
   │
Credentials
   │
Secure storage / infrastructure
   │
Authenticated MT5 server

The frontend should normally display:

Login: 70001234
Password: ••••••••
Server: VELTRION-VIRTUAL

rather than exposing the password.

And again:

VELTRION-VIRTUAL and 70001234 remain example values until genuine MT5 infrastructure provisions the account.


---

11.12 — SECRET MANAGEMENT

Create a strict secret classification.

Public configuration

Can appear in frontend:

APP_NAME
PUBLIC_APP_URL
PUBLIC_SUPABASE_URL

Private secrets

Must remain server-side:

SUPABASE_SERVICE_ROLE_KEY
OAUTH_CLIENT_SECRET
DERIV_PRIVATE_CREDENTIALS
MT5_SERVER_CREDENTIALS
ENCRYPTION_KEYS
WITHDRAWAL_PROVIDER_SECRETS

Never commit secrets into Git.


---

11.13 — GITHUB SECURITY

The repository should be checked for:

leaked API keys

OAuth secrets

passwords

private certificates

database credentials

environment files

service-role keys


Recommended repository rules:

.env
.env.*
secrets/
private/
credentials/

must not become part of the public repository.

Git history should also be checked because deleting a secret from the current file does not necessarily remove it from historical commits.


---

11.14 — SESSION SECURITY

VELTRION tracks:

SESSION
 ├── User
 ├── Device
 ├── Created
 ├── Last Active
 ├── IP metadata where appropriate
 ├── Expiration
 └── Revoked?

Security screen:

ACTIVE SESSIONS

Android Phone
● CURRENT

Tablet
● ACTIVE

[ REVOKE ]

If a session is revoked:

Session
   ↓
INVALID
   ↓
Access denied


---

11.15 — DEVICE SECURITY

Each authorized device can have:

Device ID
Device type
OS
Browser/app
First seen
Last seen
Session status

A suspicious device can be revoked.


---

11.16 — REAL TRADING PROTECTION

REAL trading receives an additional security layer.

REAL TRADING
     │
     ▼
Account Verified?
     │
     ▼
Permission Verified?
     │
     ▼
Risk Limits OK?
     │
     ▼
Market Data Fresh?
     │
     ▼
Reconciliation OK?
     │
     ▼
Trading NOT Paused?
     │
     ▼
ORDER AUTHORIZED

If any critical condition fails:

ORDER REJECTED


---

11.17 — EMERGENCY STOP

VELTRION should have an emergency control:

┌─────────────────────────────┐
│       REAL TRADING          │
│                             │
│       ● ENABLED             │
│                             │
│ [ PAUSE NEW REAL ORDERS ]   │
└─────────────────────────────┘

When activated:

NEW REAL ORDERS
       ↓
     BLOCKED

Existing positions are not automatically closed unless a separate, explicitly implemented emergency-close mechanism exists.


---

11.18 — SANDBOX/REAL ISOLATION

This receives special protection.

VELTRION
                     │
             ┌───────┴───────┐
             │               │
          SANDBOX           REAL
             │               │
         Virtual $       Real funds
             │               │
       Sandbox DB        Real DB
             │               │
       Sandbox Engine    Deriv API

A sandbox order must never reach:

Deriv BUY
Deriv SELL

A real order must never be generated from a sandbox order.

Backend checks should include:

order.mode
account.mode
execution.route
ledger.type


---

11.19 — WALLET SECURITY

Wallet operations require stricter authorization.

Withdrawal
    │
    ▼
Authenticated?
    │
    ▼
Authorized?
    │
    ▼
Balance verified?
    │
    ▼
Reserved funds checked?
    │
    ▼
Destination validated?
    │
    ▼
Security verification
    │
    ▼
Create withdrawal

The system must prevent:

negative withdrawals

withdrawals above available funds

duplicate withdrawal requests

spending reserved funds

changing destination after processing without authorization



---

11.20 — WITHDRAWAL IDEMPOTENCY

Every withdrawal gets a unique request identifier.

Example:

WD-000001

If the same request is accidentally submitted twice:

Request 1 → WD-000001
Request 2 → duplicate
             ↓
         REJECTED

This protects against double withdrawals caused by:

double taps

browser refresh

network retries

API retries

mobile connection interruptions



---

11.21 — FINANCIAL LEDGER INTEGRITY

Financial records should be treated as append-oriented records.

Example:

INITIAL_CAPITAL     +100,000
TRADE_PROFIT           +250
TRADE_LOSS              -80
WITHDRAWAL             -100
--------------------------------
CURRENT BALANCE       100,070

Important events should not simply be overwritten.

Corrections should produce another auditable event where appropriate.


---

11.22 — AUDIT LOG

Critical actions should produce audit records.

AUDIT EVENT

User: ADMIN
Action: ENABLE_REAL_TRADING
Time: 2026-...
Device: Android
Result: SUCCESS

Log events such as:

login

logout

failed login

device added

device revoked

Deriv connected

Deriv disconnected

MT5 connected

trading enabled

trading paused

order created

order rejected

position closed

risk limit changed

withdrawal requested

withdrawal completed

security settings changed

reconciliation mismatch



---

11.23 — RATE LIMITING

Sensitive endpoints require rate limits.

Examples:

LOGIN
OAuth callback
ORDER CREATION
WITHDRAWAL
PASSWORD/SECURITY CHANGE
DEVICE AUTHORIZATION

This reduces abuse from repeated requests.


---

11.24 — DATABASE BACKUPS & RECOVERY

VELTRION needs a recovery plan.

PRODUCTION DATABASE
        │
        ▼
BACKUP
        │
        ▼
RECOVERY STORAGE
        │
        ▼
RESTORE TEST

A backup that has never been successfully restored should not be considered a proven recovery strategy.

Test:

Can we restore?
Can we recover financial records?
Can we recover audit records?
Can we recover configuration?
Can we reconnect Deriv?
Can we reconcile MT5?


---

11.25 — RECONCILIATION SECURITY

For REAL trading:

VELTRION RECORDS
       │
       ├───────┐
       │       │
       ▼       ▼
 Real Ledger  Deriv
       │       │
       └───┬───┘
           ▼
       COMPARISON
           │
     ┌─────┴─────┐
     │           │
   MATCH      MISMATCH
     │           │
 CONTINUE       PAUSE

If a mismatch occurs:

REAL TRADING
● PAUSED

Reason:
Account state mismatch

[ VIEW DETAILS ]

This prevents the system from continuing blindly after an accounting or connection discrepancy.


---

11.26 — MONITORING

Phase 11 establishes production monitoring for:

API
DATABASE
AUTH
DERIV
MARKET DATA
SANDBOX ENGINE
MT5
REAL ENGINE
WALLET
WITHDRAWALS
RECONCILIATION
BACKGROUND JOBS

Each service gets:

HEALTHY
DEGRADED
OFFLINE
UNKNOWN


---

11.27 — SECURITY EVENT RESPONSE

Example:

CRITICAL EVENT
───────────────
Real-account reconciliation mismatch

Automatic response:

1. Record security event
2. Create critical alert
3. Pause new real orders
4. Preserve current state
5. Start reconciliation
6. Notify administrator
7. Require explicit recovery before resuming


---

11.28 — PRODUCTION ENVIRONMENTS

Separate:

DEVELOPMENT
     │
     ▼
STAGING
     │
     ▼
PRODUCTION

Production must not use development credentials.

Likewise:

DEV DATABASE ≠ PROD DATABASE
DEV KEYS ≠ PROD KEYS
DEV DERIV APP ≠ PROD CONFIG

where the external systems require separate environments/configurations.


---

11.29 — SECURITY CONFIGURATION

Create a central security configuration:

TRADING_MODE
REAL_TRADING_ENABLED
MAX_ORDER_SIZE
MAX_OPEN_POSITIONS
MAX_DAILY_LOSS
MAX_EXPOSURE
WITHDRAWALS_ENABLED
MT5_ENABLED
DERIV_ENABLED
MAINTENANCE_MODE

But these values must be enforced by backend services, not merely read by the UI.


---

11.30 — COMPLIANCE / LEGAL CHECKPOINT

Before VELTRION moves beyond private personal use into providing brokerage, managed trading, custody, payment, investment, or similar services to other people, the legal/regulatory model needs to be reviewed for the jurisdictions involved.

That is separate from software security.

For the current one-person private architecture, the system can be designed so that:

PRIVATE ADMIN
      ↓
PERSONAL SANDBOX
      ↓
AUTHORIZED PERSONAL DERIV ACCOUNT
      ↓
CONTROLLED TESTING

Any later move toward holding or managing other people's money, operating a brokerage, offering investment services, or presenting VELTRION as a financial service should trigger a dedicated legal/compliance review before launch.


---

11.31 — SECURITY TESTING

Before production:

Authentication

□ Wrong password rejected
□ Expired session rejected
□ Revoked session rejected
□ Unauthorized device rejected
□ Logout invalidates session

Database

□ Unauthorized read blocked
□ Unauthorized write blocked
□ RLS tested
□ Service-role key protected

Trading

□ Invalid order rejected
□ Oversized order rejected
□ Wrong mode rejected
□ Paused real trading rejects order
□ Stale market data blocks appropriate execution

Wallet

□ Insufficient balance rejected
□ Duplicate withdrawal rejected
□ Reserved funds protected
□ Invalid destination rejected

OAuth

□ Invalid state rejected
□ Invalid PKCE rejected
□ Wrong redirect rejected
□ Expired authorization rejected


---

11.32 — SECURITY PENETRATION CHECKLIST

Before production, test for common classes of vulnerabilities:

□ Broken authentication
□ Broken authorization
□ IDOR / object-level authorization problems
□ Injection
□ XSS
□ CSRF where applicable
□ Session fixation
□ Token leakage
□ Secret exposure
□ Rate-limit bypass
□ Replay attacks
□ Duplicate financial requests
□ Privilege escalation
□ Insecure file/config exposure

For the financial portions, testing should include transaction integrity, not just conventional web security.


---

11.33 — PHASE 11 FINAL SECURITY GATE

VELTRION should not move to Phase 12 until:

┌────────────────────────────────────┐
│       VELTRION SECURITY GATE       │
├────────────────────────────────────┤
│                                    │
│ Authentication       ✓             │
│ Authorization        ✓             │
│ Database RLS         ✓             │
│ API security         ✓             │
│ OAuth security       ✓             │
│ MT5 credential       ✓             │
│ Secret management    ✓             │
│ Session security     ✓             │
│ Device security      ✓             │
│ Sandbox isolation    ✓             │
│ Real trading safety  ✓             │
│ Wallet protection    ✓             │
│ Withdrawal safety    ✓             │
│ Audit logging        ✓             │
│ Monitoring           ✓             │
│ Reconciliation       ✓             │
│ Backup/recovery      ✓             │
│ Security testing     ✓             │
│ Compliance review    ✓             │
│                                    │
│ STATUS: READY FOR FULL TESTING     │
└────────────────────────────────────┘

PHASE 11 RESULT

At the end of Phase 11, VELTRION has moved from:

"A fully planned trading platform"

to:

"A security-hardened platform ready to be aggressively tested."

The next phase is Phase 12 — Full Testing & Failure Recovery, where we deliberately try to break the entire system: login, OAuth, market data, sandbox trading, MT5, real trading, wallet, withdrawals, reconciliation, mobile sessions, network failures, duplicate requests, and recovery.PHASE 10 — COMPLETE VELTRION UI/UX & PRODUCT ASSEMBLY

Purpose: Bring every backend system from Phases 1–9 into one coherent VELTRION product. Phase 10 does not introduce new financial/trading infrastructure; it defines exactly how the existing systems appear, connect, and behave for you as the administrator.


---

10.1 — Final VELTRION Product Structure

VELTRION
                            │
                     ┌──────┴──────┐
                     │   SIDEBAR   │
                     └──────┬──────┘
                            │
 ┌──────────┬──────────┬────┴───────┬──────────┬──────────┐
 │          │          │            │          │          │
HOME     TRADING     DERIV         MT5      SANDBOX     REAL
 │          │          │            │          │          │
 │       Markets   Connection   Virtual      Account    Account
 │       Positions Account      Account      Capital    Trading
 │       Orders    Wallet       Connection   Profit     Positions
 │       History                Terminal     Ledger     Performance
 │                                      Performance
 │
 ├── PROFIT WALLET
 │     ├── Balance
 │     ├── Transactions
 │     └── Withdraw
 │
 ├── ANALYTICS
 │     ├── Performance
 │     ├── Risk
 │     ├── Markets
 │     └── Reports
 │
 ├── OPERATIONS
 │     ├── System Health
 │     ├── Connections
 │     ├── Alerts
 │     └── Reconciliation
 │
 ├── SECURITY
 │     ├── Sessions
 │     ├── Devices
 │     ├── Audit Log
 │     └── Security Settings
 │
 └── SETTINGS

The important principle is:

One VELTRION system, with clearly separated SANDBOX and REAL financial environments.


---

10.2 — HOME DASHBOARD

The Home screen becomes the central control center.

┌───────────────────────────────────┐
│ VELTRION                    ☰     │
├───────────────────────────────────┤
│                                   │
│ SANDBOX PROFIT                    │
│ $0.00                             │
│                                   │
│ Virtual Capital     $100,000.00   │
│ Equity              $100,000.00   │
│ Today's P/L              $0.00    │
│                                   │
├───────────────────────────────────┤
│ DERIV                             │
│ ● CONNECTED                       │
│ Real Account: Connected           │
│ Market Feed: LIVE                 │
│                                   │
│ MT5                               │
│ ● CONNECTED                       │
│ Virtual Account: ACTIVE           │
│                                   │
├───────────────────────────────────┤
│ Open Positions              0     │
│ Orders Today                0     │
│                                   │
│ [ TRADE ]                         │
│ [ VIEW MARKETS ]                  │
└───────────────────────────────────┘

Home must show real database values

No:

fake balances

hardcoded P/L

fake connection status

placeholder account numbers presented as real

simulated "connected" indicators


Everything comes from the appropriate backend source.


---

10.3 — TRADING INTERFACE

Trading becomes one unified interface.

Markets

MARKETS

Symbol       Bid       Ask       Status
───────────────────────────────────────
EUR/USD      ...       ...       ● LIVE
GBP/USD      ...       ...       ● LIVE
USD/JPY      ...       ...       ● LIVE
XAU/USD      ...       ...       ● LIVE

Selecting a market opens:

EUR/USD

LIVE
────────────────────
       PRICE CHART

       ▲
       │     ╱╲
       │   ╱    ╲
       │ ╱        ╲
       └──────────────

Volume
Stop Loss
Take Profit

[ BUY ]
[ SELL ]


---

10.4 — TRADING MODE SELECTOR

This is extremely important.

Before an order can be created:

TRADING MODE

● SANDBOX
  Virtual funds
  No real money

○ REAL
  Real Deriv account
  Real money

If REAL is selected:

REAL TRADING

Account: REAL
Balance: $XXXX.XX

⚠ This order will use real funds.

[ CANCEL ]
[ CONFIRM REAL TRADING ]

The backend must independently enforce this.

The UI is not the security boundary.


---

10.5 — POSITION SCREEN

OPEN POSITIONS

EUR/USD
BUY
Volume: 0.10
Entry: 1.XXXX
Current: 1.XXXX
Floating P/L: +$XX.XX

SL: 1.XXXX
TP: 1.XXXX

[ CLOSE ]

For multiple positions:

TOTAL

Positions: 3
Floating P/L: +$125.40
Exposure: ...
Margin: ...

Sandbox and real positions must never be mixed into one financial calculation.


---

10.6 — ORDERS

Order history:

ORDERS

ID          Symbol    Side   Mode       Status
------------------------------------------------
SBX-00001   EUR/USD   BUY    SANDBOX    CLOSED
SBX-00002   XAU/USD   SELL   SANDBOX    OPEN
REAL-00001  EUR/USD   BUY    REAL       CONFIRMED

The mode must always be visible.


---

10.7 — DERIV SECTION

Connection

DERIV CONNECTION

OAuth Status       ● CONNECTED
Account             CR123456
Account Type        REAL
Balance             $XXXX
Market Feed         ● LIVE
WebSocket           ● CONNECTED

[ REFRESH ]
[ DISCONNECT ]

Wallet

Shows actual Deriv wallet/account information available through the authorized API.

It must not be confused with:

SANDBOX PROFIT

Those are different financial states.


---

10.8 — MT5 SECTION

Virtual Account

MT5 VIRTUAL ACCOUNT

Status: ● ACTIVE

Server:
VELTRION-VIRTUAL

Login:
70001234

Balance:
$100,000.00

Equity:
$100,000.00

[ CONNECTION DETAILS ]

Those server/login values remain examples until genuine MT5 infrastructure creates the actual account.

Connection

MT5 CONNECTION

Server       ● CONNECTED
Account      ● AUTHENTICATED
Heartbeat    ● ACTIVE
Prices       ● LIVE
Orders       ● SYNCED
Positions    ● SYNCED

Terminal

If the official MT5 infrastructure is provisioned, the user can use the official MetaTrader 5 terminal with the genuine credentials.

VELTRION should show:

Official MT5

Server
Login
Connection status
Last heartbeat


---

10.9 — SANDBOX SECTION

This becomes the virtual trading environment.

Account

SANDBOX ACCOUNT

Starting Capital       $100,000.00
Balance                 $100,000.00
Equity                  $100,000.00
Floating P/L                 $0.00
Realized P/L                $0.00

Capital

Show:

starting capital

current balance

equity

available margin

used margin

exposure


Profit

SANDBOX PROFIT

Today              $0.00
This Week          $0.00
This Month         $0.00
Total              $0.00

Ledger

Every balance change gets a record.

TIME        TYPE              AMOUNT
--------------------------------------
10:01       INITIAL_CAPITAL   +100000
11:25       REALIZED_PROFIT   +125
12:30       TRADE_LOSS        -40


---

10.10 — REAL SECTION

Completely separate from Sandbox.

REAL ACCOUNT

Deriv Account
CR123456

Balance
$XXXX.XX

Equity
$XXXX.XX

Today's P/L
$XX.XX

Real Trading
● ENABLED

Real Trading

Shows:

current account

available balance

open positions

pending orders

risk limits

execution status

trading pause state



---

10.11 — PROFIT WALLET

Two wallets must exist conceptually.

SANDBOX WALLET
$X,XXX.XX
Virtual
NOT WITHDRAWABLE

          ≠

REAL PROFIT WALLET
$XXX.XX
Real funds
Withdrawal eligible*

* Subject to actual underlying funds, account rules, transaction state, and any applicable withdrawal requirements.

Wallet screen

PROFIT WALLET

Available
$XXX.XX

Reserved
$XX.XX

Withdrawable
$XXX.XX

[ WITHDRAW ]


---

10.12 — WITHDRAWAL EXPERIENCE

WITHDRAW PROFIT

Available:
$500.00

Amount:
[ $________ ]

Destination:
[ __________ ]

Security verification

[ REQUEST WITHDRAWAL ]

Then:

WITHDRAWAL STATUS

Request ID: WD-00001

Amount: $250.00

Status:
● PROCESSING

Possible states:

PENDING
PROCESSING
COMPLETED
FAILED
REJECTED
CANCELLED

No withdrawal should appear completed merely because VELTRION created a database record.


---

10.13 — ANALYTICS

Phase 9's analytics become accessible here.

Overview

PERFORMANCE

Total P/L
+$XXX

Win Rate
XX%

Profit Factor
X.XX

Max Drawdown
X.X%

Open Positions
X

Charts

equity curve

P/L over time

drawdown

trade distribution

daily performance

market performance


Filters

MODE
[ SANDBOX ]

PERIOD
[ TODAY ]

MARKET
[ ALL ]

REAL and SANDBOX analytics remain separately filterable.


---

10.14 — OPERATIONS CENTER

This is the control room.

SYSTEM HEALTH

VELTRION API          ● HEALTHY
SUPABASE              ● HEALTHY
AUTH                  ● HEALTHY
DERIV OAuth            ● HEALTHY
DERIV WebSocket        ● HEALTHY
MARKET DATA            ● HEALTHY
SANDBOX ENGINE         ● HEALTHY
MT5                    ● HEALTHY
REAL ENGINE            ● PAUSED
WALLET                 ● HEALTHY
WITHDRAWALS            ● HEALTHY
RECONCILIATION         ● HEALTHY

If something breaks:

DERIV WEBSOCKET
● DEGRADED

Last tick:
14 seconds ago

[ VIEW DETAILS ]


---

10.15 — ALERT CENTER

Alerts should be categorized.

INFO

MT5 connection restored.

WARNING

Market data delayed.

CRITICAL

REAL ACCOUNT RECONCILIATION MISMATCH.
Real trading automatically paused.

The alert system should never silently hide financial/system failures.


---

10.16 — SECURITY CENTER

SECURITY

Current Device
● AUTHORIZED

Active Sessions
2

Last Login
Today, 15:42

Two-Factor Authentication
● ENABLED

API Security
● HEALTHY

Audit Logging
● ACTIVE

Devices

DEVICE
Android Phone
Last Active: Now
● ACTIVE

Tablet
Last Active: Yesterday
● ACTIVE

[ REVOKE ]

Audit Log

TIME        EVENT
-----------------------------------------
15:42       LOGIN
15:45       DERIV_CONNECTED
16:02       SANDBOX_ORDER_CREATED
16:05       POSITION_CLOSED
16:10       SETTINGS_CHANGED


---

10.17 — RESPONSIVE DESIGN

VELTRION must work on:

Phone

┌───────────────────┐
│ VELTRION       ☰  │
├───────────────────┤
│ Dashboard         │
│                   │
│ $100,000          │
│                   │
│ [ TRADE ]         │
│                   │
│ Positions         │
│                   │
└───────────────────┘

Tablet

Two-column dashboard.

Desktop

Full sidebar + multi-panel trading workspace.

┌────────────┬──────────────────────────────┐
│ SIDEBAR    │ MAIN                         │
│            │                              │
│ HOME       │ Chart                        │
│ TRADING    │                              │
│ DERIV      │ Order panel   Positions      │
│ MT5        │                              │
│ SANDBOX    │                              │
│ REAL       │                              │
│ ANALYTICS  │                              │
└────────────┴──────────────────────────────┘


---

10.18 — DARK/LIGHT MODE

VELTRION should support:

Appearance

● Dark
○ Light
○ System

But the financial meaning of colors must remain consistent:

positive P/L

negative P/L

warnings

critical errors

connection states


The interface should remain understandable without relying solely on color.


---

10.19 — LOADING, EMPTY & ERROR STATES

Every major screen needs three states.

Loading

Loading account...

Empty

No open positions.

Error

Unable to retrieve account data.

[ RETRY ]

Never display $0.00 merely because the backend failed to respond.

That distinction is important.


---

10.20 — CONFIRMATION SYSTEM

Financially significant actions require confirmation.

Examples:

CLOSE POSITION?

ENABLE REAL TRADING?

REQUEST WITHDRAWAL?

DISCONNECT DERIV?

CHANGE RISK LIMIT?

For particularly sensitive operations:

Re-authentication / security verification should be required.


---

10.21 — NOTIFICATION SYSTEM

VELTRION can provide:

🔔 Notifications

Deriv connected
MT5 connected
Position opened
Position closed
Stop loss triggered
Take profit triggered
Withdrawal requested
Withdrawal completed
Market disconnected
Risk limit reached
Reconciliation mismatch

Notifications must be generated from actual system events.


---

10.22 — FINAL UI DATA FLOW

VELTRION UI
                         │
             ┌───────────┴───────────┐
             │                       │
         READ DATA               USER ACTION
             │                       │
             ▼                       ▼
        BACKEND API             VALIDATION
             │                       │
       ┌─────┼─────┐                 │
       │     │     │                 ▼
     DERIV  MT5  SUPABASE       AUTHORIZATION
       │     │     │                 │
       └─────┼─────┘                 ▼
             │                    ENGINE
             ▼                      │
         VERIFIED DATA              ▼
             │                  LEDGER / DB
             ▼                      │
          UI UPDATE ◄───────────────┘

The frontend becomes the control surface, not the source of financial truth.


---

10.23 — FINAL PRODUCT RULES

Phase 10 locks in these rules:

Rule 1

Supabase/database/backend data is the source of truth for VELTRION state.

Rule 2

Deriv is the source of truth for actual Deriv account state.

Rule 3

A genuine MT5 server is the source of truth for MT5 account state once provisioned.

Rule 4

Sandbox money is virtual.

Rule 5

Real money is real and separately controlled.

Rule 6

Sandbox profit cannot become real money simply by changing a database value.

Rule 7

The UI cannot bypass backend authorization.

Rule 8

No fake connection statuses.

Rule 9

No fake MT5 credentials.

Rule 10

No financial operation is considered complete until its underlying transaction/external state is confirmed.


---

10.24 — PHASE 10 ACCEPTANCE TEST

Before Phase 10 is considered complete:

□ Home dashboard works
□ Sidebar works
□ Mobile layout works
□ Tablet layout works
□ Desktop layout works
□ Dark mode works
□ Light mode works
□ Trading screen works
□ Market screen works
□ Position screen works
□ Order history works
□ Deriv screen works
□ MT5 screen works
□ Sandbox screen works
□ Real screen works
□ Profit wallet works
□ Withdrawal screen works
□ Analytics works
□ Operations works
□ Alerts work
□ Security center works
□ Audit log works
□ Loading states work
□ Empty states work
□ Error states work
□ Confirmation dialogs work
□ Real/Sandbox separation is visible
□ Backend also enforces Real/Sandbox separation
□ No hardcoded financial figures
□ No fake external connection status
□ No secrets exposed in frontend


---

PHASE 10 FINAL ARCHITECTURE

┌─────────────────────┐
                         │      VELTRION       │
                         │    ADMIN SYSTEM     │
                         └──────────┬──────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
          SANDBOX                  REAL                  MT5
             │                      │                      │
       $100,000 virtual       Deriv real account     MT5 infrastructure
             │                      │                      │
       Sandbox Engine          Real Engine            MT5 Server
             │                      │                      │
       Virtual Ledger          Real Ledger           MT5 Account
             │                      │                      │
             └──────────────┬───────┴──────────────────────┘
                            │
                     WALLET / FINANCE
                            │
                     RECONCILIATION
                            │
                       ANALYTICS
                            │
                     OPERATIONS
                            │
                       SECURITY
                            │
                       VELTRION UI

Phase 10 result: the entire VELTRION system now has a defined product interface and user experience from login → dashboard → market → sandbox → MT5 → real trading → wallet → withdrawal → analytics → operations → security.

Next in the blueprint: Phase 11 — Security, Compliance & Production Hardening.Yes. We have planned Phases 1–9, but if the objective is to go from a completely fresh project to a finished VELTRION platform, I would not stop at Phase 9.

There are 5 final planning phases that close the gaps between “the platform works” and “the platform is actually ready to operate.”

The complete VELTRION master plan

Phase	What we plan

1	Private Admin Foundation
2	Infrastructure & Multi-Device
3	Deriv OAuth & Live Market
4	$100k Sandbox Trading Engine
5	Genuine MT5 Integration
6	Real Deriv Trading
7	Profit Wallet & Withdrawals
8	Operations, Risk & Monitoring
9	Analytics & Intelligence
10	User Interface & Complete UX
11	Security, Compliance & Production Hardening
12	Testing, Integration & Failure Recovery
13	Deployment, Domain, PWA & Android
14	Final Production Launch & Maintenance


So five more phases remain.


---

PHASE 10 — Complete UI/UX & Product Assembly

This is where we take all the backend systems we've planned and turn them into one coherent VELTRION application.

We plan every screen.

Main navigation

VELTRION

HOME

TRADING
 ├─ Markets
 ├─ Positions
 ├─ Orders
 └─ History

DERIV
 ├─ Connection
 ├─ Account
 └─ Wallet

MT5
 ├─ Virtual Account
 ├─ Connection
 └─ Terminal

SANDBOX
 ├─ Account
 ├─ Capital
 ├─ Profit
 ├─ Ledger
 └─ Performance

REAL
 ├─ Account
 ├─ Trading
 ├─ Positions
 └─ Performance

PROFIT WALLET
 ├─ Balance
 ├─ Transactions
 └─ Withdraw

ANALYTICS
 ├─ Performance
 ├─ Risk
 ├─ Markets
 └─ Reports

OPERATIONS
 ├─ System Health
 ├─ Connections
 ├─ Alerts
 └─ Reconciliation

SECURITY
 ├─ Sessions
 ├─ Devices
 ├─ Audit
 └─ Security Settings

SETTINGS

We then design:

mobile layout

desktop layout

tablet layout

dark/light theme

navigation

loading states

empty states

error states

confirmation dialogs

trading screens

wallet screens

charts

notifications

profile/security

responsive behavior


Phase 10 output: the entire VELTRION interface is mapped screen-by-screen before implementation.


---

PHASE 11 — Security, Compliance & Production Hardening

This is the phase where we make sure the system isn't merely functional.

We harden:

AUTHENTICATION
       ↓
AUTHORIZATION
       ↓
DATABASE RLS
       ↓
API SECURITY
       ↓
DERIV TOKEN SECURITY
       ↓
MT5 CREDENTIAL SECURITY
       ↓
TRADING CONTROLS
       ↓
WALLET SECURITY
       ↓
WITHDRAWAL SECURITY
       ↓
AUDIT

We also define:

secret management

token storage

session expiration

device authorization

rate limits

database permissions

API permissions

financial-operation authorization

emergency controls

backup strategy

recovery strategy

data retention

logging


And importantly, before operating anything involving real customer funds or brokerage services, we identify the applicable legal/licensing requirements rather than assuming the software itself provides authorization to operate such a service.

Phase 11 output: security and operational requirements are fully defined and hardened.


---

PHASE 12 — Full Testing & Failure Recovery

This is the "break everything before launch" phase.

We test the complete chain:

LOGIN
 ↓
HOME
 ↓
DERIV
 ↓
OAUTH
 ↓
MARKET DATA
 ↓
SANDBOX
 ↓
MT5
 ↓
REAL MODE
 ↓
WALLET
 ↓
WITHDRAWAL
 ↓
RECONCILIATION
 ↓
ANALYTICS

But we also deliberately test failures.

Deriv failure

Deriv disconnects
       ↓
VELTRION detects it
       ↓
real orders blocked
       ↓
reconnect
       ↓
retrieve actual state
       ↓
reconcile

MT5 failure

MT5 disconnect
       ↓
heartbeat failure
       ↓
new orders blocked
       ↓
reconnect
       ↓
synchronize

Database failure

Database unavailable
       ↓
financial operations stop
       ↓
system recovers
       ↓
reconcile

Duplicate request

same withdrawal submitted twice
             ↓
       idempotency check
             ↓
        one transaction

We also test:

incorrect passwords

expired sessions

invalid OAuth state

failed PKCE

stale market data

rejected orders

insufficient balance

oversized orders

duplicate orders

failed withdrawals

reconciliation mismatch

network interruption

browser refresh

phone sleep/wake

multiple devices


Phase 12 output: a complete test matrix and verified end-to-end system.


---

PHASE 13 — Deployment, PWA & Android

Now we package the finished system.

The architecture you previously established remains:

GITHUB
   │
   ├── Source Code
   ├── CI/CD
   └── Build
        │
        ▼
GITHUB PAGES / APPROVED HOST
        │
        ▼
VELTRION WEB APP
        │
        ├── Android PWA
        ├── Tablet
        └── Desktop

And:

SUPABASE
   │
   ├── Auth
   ├── Database
   ├── RLS
   ├── Edge Functions
   └── Backend Services

No Vercel is required for the architecture we've been planning.

Android

Then:

VELTRION WEB APP
       ↓
PWA
       ↓
ANDROID WRAPPER
       ↓
VELTRION APK

The Android version should use the same backend and account rather than becoming a separate application with a separate database.

Phase 13 output:

live web application

installable PWA

Android build

app icon

splash screen

production configuration

environment configuration

deployment pipeline



---

PHASE 14 — Final Production Launch

This is the final phase.

We perform the actual launch checklist.

SOURCE
  ↓
BUILD
  ↓
TEST
  ↓
SECURITY CHECK
  ↓
DATABASE CHECK
  ↓
DERIV CHECK
  ↓
MT5 CHECK
  ↓
WALLET CHECK
  ↓
RECONCILIATION CHECK
  ↓
BACKUP CHECK
  ↓
DEPLOY
  ↓
LIVE

Then we monitor the live platform.

First launch state

I would recommend the production system initially launch with:

VELTRION
│
├── SANDBOX
│    └── ACTIVE
│
├── DERIV MARKET DATA
│    └── ACTIVE
│
├── MT5
│    └── TEST/CONNECTED
│
└── REAL TRADING
     └── PAUSED

Then real trading is enabled only after the relevant live-account and operational tests have actually passed.


---

And then VELTRION is complete

The final architecture becomes:

VELTRION
                            │
                  ┌─────────┴─────────┐
                  │                   │
                WEB                 ANDROID
                  │                   │
                  └─────────┬─────────┘
                            │
                       AUTH / SESSION
                            │
              ┌─────────────┼─────────────┐
              │             │             │
            DERIV           MT5         SUPABASE
              │             │             │
           Markets       Virtual       Database
           Account       Account       Auth
           Trading       Terminal      Backend
              │             │             │
              └─────────────┼─────────────┘
                            │
                     VELTRION ENGINE
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
      SANDBOX              REAL              FINANCE
        │                   │                   │
     $100,000           Real Deriv          Wallet
     virtual            trading             Ledger
     capital               │                Withdrawal
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    RISK + RECONCILIATION
                            │
                  MONITORING + SECURITY
                            │
                     ANALYTICS + AI
                            │
                       AUDIT SYSTEM

So tonight's planning sequence

We've already completed:

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

Remaining:

10 — Complete UI/UX

11 — Security & Production Hardening

12 — Testing & Failure Recovery

13 — Deployment + PWA + Android

14 — Final Launch & Maintenance

After Phase 14, there isn't another major architectural phase that we need to invent before building. At that point, the work changes from planning the platform to implementing, testing, deploying, and operating the platform.

So yes — we can finish the entire planning blueprint tonight. Then we can use that blueprint as the single build specification rather than repeatedly redesigning VELTRION while coding.VELTRION — Phase 9: Analytics, Performance & Intelligence

Phase 9 adds the intelligence layer on top of everything built in Phases 1–8. VELTRION should now be able to explain what happened across sandbox trading, real Deriv trading, MT5, risk, and finances.

The key principle: analytics must be derived from recorded transactions and market data—not invented or hardcoded figures.


---

9.1 Phase 9 architecture

VELTRION
                            │
                    ANALYTICS ENGINE
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
    TRADING              FINANCE              RISK
       │                    │                    │
   Orders/P&L          Wallet/Ledger        Exposure/Loss
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                       DATA ENGINE
                            │
              ┌─────────────┼─────────────┐
              │             │             │
           SANDBOX        REAL           MT5
              │             │             │
              └─────────────┼─────────────┘
                            ▼
                     VELTRION INSIGHTS


---

9.2 Main Analytics Dashboard

Add a new sidebar section:

ANALYTICS

Overview
Performance
Trades
Risk
Markets
Financials
Reports

The overview could show:

VELTRION ANALYTICS

Sandbox P/L        +$8,240
Real P/L             +$740
Open Positions          3
Closed Trades           86
Win Rate              58%
Profit Factor          1.42
Max Drawdown          4.8%

────────────────────────

Today's P/L          +$120
This Week            +$540
This Month           +$740

Those numbers would be calculated from the actual ledger/trade database.


---

9.3 Sandbox analytics

The sandbox gets its own performance analysis.

SANDBOX PERFORMANCE

Starting Capital
$100,000

Current Balance
$108,240

Total P/L
+$8,240

Return
+8.24%

Trades
186

Winning
109

Losing
77

This allows you to evaluate the strategy without confusing virtual results with real money.


---

9.4 Real trading analytics

A separate real account report:

REAL PERFORMANCE

Starting Balance
$5,000

Current Balance
$5,740

Trading P/L
+$740

Open P/L
+$120

Closed P/L
+$620

Trades
42

The system should clearly distinguish:

REAL

from:

VIRTUAL

on every analytics page.


---

9.5 Performance chart

VELTRION can display equity over time.

Equity
  │
  │                 ╭──────
  │           ╭─────╯
  │      ╭────╯
  │  ╭───╯
  │──╯
  └──────────────────────── Time

The chart can use:

balance

equity

realized P/L

floating P/L

drawdown


with selectable periods:

1D   1W   1M   3M   6M   1Y   ALL


---

9.6 Trade analytics

Each trade contributes to aggregate statistics.

For example:

TRADE ANALYTICS

Total Trades          86
Winning Trades        50
Losing Trades         36

Average Win         +$42
Average Loss        -$28

Largest Win         +$185
Largest Loss        -$120

Win Rate             58.1%

These are descriptive statistics, not guarantees about future performance.


---

9.7 Profit factor

Add:

Profit Factor =
Gross Profit / Gross Loss

Example:

Gross Profit: $2,100
Gross Loss:   $1,480

Profit Factor: 1.42

The calculation should be generated from the ledger rather than entered manually.


---

9.8 Drawdown engine

VELTRION should calculate drawdown from the equity curve.

Peak Equity
    │
    ▼
$110,000
    │
    │
    ▼
$104,500

Drawdown:
-$5,500

Display:

Maximum Drawdown
5.0%

Current Drawdown
1.7%

Peak Equity
$110,000


---

9.9 Risk dashboard

Phase 8 created the risk controls. Phase 9 analyzes them.

RISK ANALYTICS

Current Exposure
$2,400

Maximum Allowed
$5,000

Exposure Used
48%

Daily Loss
$120

Daily Limit
$500

Limit Used
24%

This lets you see not just the rules but how much of each limit is currently being used.


---

9.10 Market analytics

VELTRION can analyze instruments individually.

MARKETS

EURUSD
Trades: 34
P/L: +$420

XAUUSD
Trades: 21
P/L: +$180

BTCUSD
Trades: 18
P/L: -$95

The same structure can be used for the instruments actually supported by the connected market feed.


---

9.11 Strategy tagging

Add optional trade tags:

Strategy:
[ BREAKOUT ]

Setup:
[ SUPPORT ]

Timeframe:
[ 15M ]

Direction:
[ BUY ]

Then VELTRION can answer:

BREAKOUT

Trades: 31
Wins: 19
Losses: 12
P/L: +$410

This is useful because the system can analyze how trades were categorized, without pretending that historical performance guarantees future results.


---

9.12 Session analytics

Analyze trading by time:

SESSION

Asian
Trades: 14
P/L: +$45

London
Trades: 38
P/L: +$420

New York
Trades: 34
P/L: +$275

This should be based on timestamps and the selected timezone.


---

9.13 Daily/weekly/monthly reports

Generate:

DAILY REPORT

Date:
01 Oct 2026

Sandbox P/L
+$180

Real P/L
+$42

Trades
14

Wins
8

Losses
6

Max Drawdown
1.2%

Withdrawals
$0

Then:

WEEKLY REPORT
MONTHLY REPORT
CUSTOM REPORT


---

9.14 Financial analytics

Combine the financial ledger with trading information.

FINANCIAL OVERVIEW

Real Balance
$5,740

Trading P/L
+$740

Deposits
+$5,000

Withdrawals
-$0

Pending Withdrawals
$300

This creates a much clearer financial picture than displaying one balance number.


---

9.15 Sandbox vs real comparison

Add a comparison screen, but keep the two accounting systems independent.

SANDBOX       REAL

Capital          $100,000      $5,000
P/L                +$8,240       +$740
Trades                 186          42
Win Rate              58%          55%
Drawdown              4.8%         3.1%

This is an analytical comparison only.


---

9.16 AI/Intelligence layer

Once the underlying data is reliable, VELTRION can add an optional AI analysis screen.

VELTRION INSIGHT

Recent trading activity shows:

• Most recent trades were concentrated
  in two instruments.

• Average losing trade was larger than
  the previous reporting period.

• Current exposure is below the configured
  maximum.

• One risk threshold is approaching its
  configured limit.

The AI should explain observed data, not invent market facts.


---

9.17 AI trading analysis

For an individual trade:

TRADE ANALYSIS

Instrument:
EURUSD

Direction:
BUY

Entry:
1.XXXX

Exit:
1.XXXX

Result:
+$42

Risk:
$20

R:R:
2.1

Then:

Observed factors:

• Stop-loss distance
• Position size
• Holding duration
• Market movement during trade
• Result relative to configured risk


---

9.18 AI must not secretly trade

The intelligence layer should remain separate from execution.

AI
 │
 ├── Analyze
 ├── Explain
 ├── Summarize
 └── Identify patterns
        │
        X
        │
   NO DIRECT ORDER

If recommendations are ever displayed, the actual order still requires explicit user authorization and passes through the same risk and execution controls.


---

9.19 Reports export

Allow:

EXPORT

[ PDF ]
[ CSV ]
[ XLSX ]

Reports can include:

trade history

P/L

equity curve

drawdown

risk

wallet transactions

withdrawals

reconciliation

audit events



---

9.20 Data integrity

Analytics should never become a second source of truth.

SOURCE OF TRUTH
       │
       ▼
Orders / Positions / Ledger
       │
       ▼
Analytics Engine
       │
       ▼
Charts / Reports / AI

Not:

Chart
  ↓
Database balance

The chart always derives from the underlying records.


---

9.21 Phase 9 database additions

Potential analytics tables/materialized summaries:

analytics_daily
analytics_trade_metrics
analytics_equity_snapshots
analytics_drawdowns
analytics_market_metrics
analytics_risk_metrics
analytics_reports
analytics_insights

These should be treated as derived data. The underlying transaction/ledger records remain authoritative.


---

9.22 Phase 9 acceptance tests

Analytics

[ ] P/L calculations are correct

[ ] Win/loss statistics are correct

[ ] Drawdown calculations are correct

[ ] Equity curve matches ledger

[ ] Risk metrics match actual positions

[ ] Market statistics match trade records


Separation

[ ] Sandbox analytics remain virtual

[ ] Real analytics remain real

[ ] No sandbox figure enters the real ledger

[ ] No real figure is presented as sandbox capital


AI

[ ] AI receives verified data

[ ] AI cannot directly execute trades

[ ] AI explanations identify their underlying data

[ ] AI does not fabricate missing information


Reports

[ ] PDF export

[ ] CSV export

[ ] XLSX export

[ ] Date filtering

[ ] Account/mode filtering



---

VELTRION after Phase 9

VELTRION
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
      TRADING           FINANCE          SECURITY
        │                 │                 │
      Deriv              Wallet           Audit
      MT5                Ledger           Sessions
      Sandbox            Withdrawals      Devices
      Real
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                   OPERATIONS
                          │
                Monitoring / Risk
                          │
                          ▼
                    ANALYTICS
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    Performance         Risk             Financials
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
                  VELTRION INSIGHTS
                          │
                     AI ANALYSIS
                          │
                  REPORTS / EXPORT

Roadmap status

1. Foundation → 2. Infrastructure → 3. Deriv → 4. Sandbox → 5. MT5 → 6. Real Trading → 7. Profit/Withdrawal → 8. Operations/Risk → 9. Analytics/Intelligence

Phase 9 makes VELTRION capable of recording, measuring, explaining, and reporting the entire trading and financial lifecycle while keeping the underlying ledgers and execution systems authoritative.VELTRION — Phase 8: Operations, Risk, Monitoring & Full System Control

Phase 8 should turn VELTRION from a collection of trading features into a controlled operating platform. The goal is to monitor every connection, trade, balance, wallet operation, security event, and system failure from one place.


---

8.1 Phase 8 architecture

VELTRION
                            │
                     ADMIN CONTROL
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       TRADING           FINANCE          SECURITY
          │                 │                 │
     Sandbox/Real      Wallet/Ledger     Sessions/Audit
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                       MONITORING
                            │
              ┌─────────────┼─────────────┐
              │             │             │
           DERIV           MT5         DATABASE
          HEALTH          HEALTH         HEALTH
              │             │             │
              └─────────────┼─────────────┘
                            │
                       ALERT ENGINE
                            │
                         ADMIN


---

8.2 Operations Dashboard

Create a dedicated Operations screen.

VELTRION OPERATIONS

SYSTEM
● API              HEALTHY
● DATABASE         HEALTHY
● AUTH             HEALTHY
● MARKET ENGINE    HEALTHY

CONNECTIONS
● DERIV            CONNECTED
● MT5              CONNECTED

TRADING
Sandbox            ACTIVE
Real Trading       PAUSED

FINANCE
Real Balance       $5,800
Withdrawable       $500
Pending Withdrawal $300

This gives you one place to determine what is actually happening.


---

8.3 System health monitoring

Monitor:

API availability

database connectivity

authentication

market-data stream

Deriv connection

MT5 connection

order engine

sandbox engine

real trading engine

wallet service

withdrawal service

reconciliation service


Each service gets:

HEALTHY
DEGRADED
OFFLINE
UNKNOWN


---

8.4 Deriv connection monitor

DERIV CONNECTION

OAuth
● AUTHENTICATED

Account
● REAL ACCOUNT

WebSocket
● CONNECTED

Last Tick
0.4 sec ago

Balance
$5,800

Portfolio
SYNCHRONIZED

Reconnect Attempts
0

If the connection dies:

DERIV DISCONNECTED

Real trading:
PAUSED

New real orders:
BLOCKED

Existing positions:
RECONCILIATION REQUIRED


---

8.5 MT5 monitor

For the genuine MT5 infrastructure from Phase 5:

MT5

Server
● ONLINE

Virtual Account
● ACTIVE

Login
70001234

Terminal
● CONNECTED

Last Heartbeat
2 sec ago

Open Positions
3

Orders
5

If MT5 loses connection:

MT5 CONNECTION LOST

New MT5 orders:
BLOCKED

Existing positions:
MONITORING

Synchronization:
PENDING


---

8.6 Trading control center

Add a central trading control:

TRADING CONTROL

SANDBOX
● ENABLED

REAL TRADING
○ PAUSED

MT5
● ENABLED

MARKET DATA
● ENABLED

[ PAUSE ALL TRADING ]

The important part is that this control exists server-side, not merely as a frontend button.


---

8.7 Emergency stop

Add:

⚠ EMERGENCY STOP

[ STOP ALL NEW ORDERS ]

When activated:

SANDBOX NEW ORDERS     BLOCKED
REAL NEW ORDERS        BLOCKED
MT5 NEW ORDERS         BLOCKED

Existing positions are not automatically closed unless you explicitly implement and authorize an emergency-close function.

That distinction prevents a "stop trading" button from unexpectedly liquidating positions.


---

8.8 Risk engine

Phase 8 should centralize risk rules.

Example:

RISK CONTROL

Maximum position size
$1,000

Maximum open positions
10

Maximum daily loss
$500

Maximum total exposure
$5,000

Real trading
PAUSED

The backend checks these rules before an order reaches the execution layer.

ORDER
  ↓
AUTHORIZATION
  ↓
ACCOUNT MODE
  ↓
RISK CHECK
  ↓
BALANCE CHECK
  ↓
SYMBOL CHECK
  ↓
EXECUTION


---

8.9 Real and sandbox risk remain separate

Never use:

one risk balance

for both systems.

Instead:

SANDBOX RISK
$100,000 virtual capital

REAL RISK
$5,800 real balance

A sandbox loss must never consume real trading risk allowance.


---

8.10 Alert center

VELTRION should generate alerts for important events.

Example:

ALERT CENTER

🔴 REAL ACCOUNT DISCONNECTED
16:04

🟠 RECONCILIATION REQUIRED
15:58

🟡 MT5 HEARTBEAT DELAY
15:42

🟢 DERIV RECONNECTED
15:39

Alert severity:

INFO
WARNING
CRITICAL


---

8.11 Financial alerts

Examples:

REAL BALANCE CHANGED

Previous:
$5,800

Current:
$5,250

Difference:
-$550

Or:

WITHDRAWAL REQUEST

WD-000024
$500

Status:
PENDING

And:

RECONCILIATION FAILURE

Internal:
$5,800

External:
$5,750

Difference:
$50


---

8.12 Complete audit log

Phase 8 should make the audit system much stronger.

Record:

LOGIN
LOGOUT
DEVICE ADDED
DEVICE REMOVED
DERIV CONNECTED
DERIV DISCONNECTED
MT5 CONNECTED
MT5 DISCONNECTED
SANDBOX ORDER
REAL ORDER
ORDER CANCELLED
POSITION CLOSED
RISK LIMIT CHANGED
REAL TRADING ENABLED
REAL TRADING PAUSED
WITHDRAWAL REQUESTED
WITHDRAWAL COMPLETED
WITHDRAWAL FAILED
SECURITY CHANGE

Each event:

event_id
admin_id
event_type
timestamp
device
IP/session metadata
resource_id
previous_state
new_state
result


---

8.13 Security center

Create:

SECURITY

Current Session
● ACTIVE

Devices
2

Active Sessions
2

Last Login
01 Oct 2026

Two-Factor Authentication
● ENABLED

Deriv Authorization
● ACTIVE

MT5 Credentials
● PROTECTED

You should also have:

[ LOG OUT OTHER DEVICES ]

[ REVOKE DERIV CONNECTION ]

[ PAUSE REAL TRADING ]


---

8.14 Device management

Since Phase 2 supports multiple devices:

YOUR DEVICES

Samsung
● Current device

Chrome Desktop
● Active

Android Tablet
● Active

Each device can be revoked independently.


---

8.15 Database monitoring

VELTRION should detect problems such as:

DATABASE
● CONNECTED

Pending Jobs
3

Failed Jobs
0

Unprocessed Events
0

Last Backup
...

For financial records, database backups and recovery procedures should be treated as critical infrastructure.


---

8.16 Background jobs

Phase 8 introduces scheduled workers for:

Market synchronization
Connection heartbeat
Position reconciliation
Balance reconciliation
Withdrawal monitoring
Risk calculations
Alert generation
Audit processing
Cleanup

Conceptually:

WORKER ENGINE
                     │
      ┌──────────────┼──────────────┐
      │              │              │
   MARKET         FINANCE        SECURITY
      │              │              │
   ticks         reconcile       audit
   health        wallet          alerts


---

8.17 Idempotency

This is particularly important for money and orders.

If VELTRION receives:

WD-000024

twice because of a network retry, it must not create two withdrawals.

Likewise:

ORDER-00051

must not execute twice because the client retransmitted the request.

Every critical operation gets an idempotency key:

request_id
operation_id
external_reference


---

8.18 Reconciliation engine

Phase 8 makes reconciliation continuous rather than manual.

RECONCILIATION ENGINE
                       │
        ┌──────────────┼──────────────┐
        │              │              │
       DERIV           MT5          WALLET
        │              │              │
     balance        positions      withdrawals
     trades         orders         settlements
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                   MATCH?
                  /      \
                YES       NO
                │          │
              OK       ALERT + PAUSE


---

8.19 System status page

Your main admin screen could have:

VELTRION STATUS

┌───────────────────────────────┐
│ SYSTEM                        │
│ ● Operational                 │
├───────────────────────────────┤
│ DERIV                         │
│ ● Connected                   │
├───────────────────────────────┤
│ MT5                           │
│ ● Connected                   │
├───────────────────────────────┤
│ SANDBOX                       │
│ ● Trading                     │
├───────────────────────────────┤
│ REAL                          │
│ ○ Paused                      │
├───────────────────────────────┤
│ WALLET                        │
│ ● Synchronized                │
└───────────────────────────────┘


---

8.20 Phase 8 database additions

Add operational tables such as:

system_health
service_status
connection_health
risk_limits
risk_events
alerts
alert_events
device_sessions
security_events
job_queue
job_events
reconciliation_runs
reconciliation_items
emergency_controls

Combined with the previous phases, VELTRION now has:

AUTH
ADMIN
DEVICES
SESSIONS
DERIV
MARKETS
SANDBOX
MT5
REAL TRADING
LEDGERS
PROFIT WALLET
WITHDRAWALS
RECONCILIATION
SECURITY
AUDIT
MONITORING
ALERTS
RISK


---

8.21 Phase 8 acceptance test

Before moving to Phase 9:

System

[ ] All major services report health

[ ] Connection failures are detected

[ ] Reconnection works

[ ] Background jobs are monitored


Trading

[ ] Sandbox trading can be paused

[ ] Real trading can be paused

[ ] MT5 trading can be controlled

[ ] Risk rules are enforced server-side

[ ] Emergency stop blocks new orders


Finance

[ ] Real balance reconciliation works

[ ] Wallet reconciliation works

[ ] Withdrawal monitoring works

[ ] Duplicate transactions are prevented


Security

[ ] Sessions can be revoked

[ ] Devices can be revoked

[ ] Important operations are audited

[ ] Sensitive operations require appropriate authentication


Reliability

[ ] Database failure is detected

[ ] Market-data failure is detected

[ ] Deriv failure blocks unsafe real trading

[ ] MT5 failure blocks unsafe execution

[ ] Reconciliation catches inconsistencies



---

VELTRION after Phase 8

┌───────────────────────┐
                 │       VELTRION        │
                 │    ADMIN CONTROL      │
                 └───────────┬───────────┘
                             │
       ┌─────────────┬───────┼───────┬──────────────┐
       │             │       │       │              │
     DERIV          MT5    SANDBOX  REAL          WALLET
       │             │       │       │              │
    Markets       Virtual  $100k   Real        Withdrawals
    Account       Account  Engine  Trading      Settlement
       │             │       │       │              │
       └─────────────┴───────┼───────┴──────────────┘
                             │
                     RISK + RECONCILIATION
                             │
                    MONITORING + ALERTS
                             │
                       AUDIT + SECURITY

Phase 8 is the control layer. After it, VELTRION isn't just capable of trading; it has the mechanisms to detect failures, restrict unsafe actions, reconcile external systems, protect financial operations, and give you a central view of the entire platform.VELTRION — Phase 7: Profit Wallet & Real Withdrawal

Phase 7 is the financial settlement layer. This is where we make the distinction between:

virtual sandbox profit

real Deriv trading profit

actual withdrawable funds


The most important rule is that VELTRION must never turn a virtual number into real money merely by changing a database balance.


---

7.1 Final financial architecture

VELTRION
                            │
              ┌─────────────┴─────────────┐
              │                           │
          SANDBOX                         REAL
              │                           │
        $100,000 VIRTUAL             DERIV REAL
              │                           │
        Virtual P/L                  Real P/L
              │                           │
        Sandbox Ledger               Real Ledger
              │                           │
              ▼                           ▼
      SANDBOX PROFIT                REAL PROFIT
        $8,000                       $800
              │                           │
              X                           │
       NOT WITHDRAWABLE                   ▼
                                   PROFIT WALLET
                                          │
                                          ▼
                                   WITHDRAWAL
                                          │
                                          ▼
                                  DERIV / APPROVED
                                  PAYMENT ROUTE

So the Profit Wallet should represent only money that is actually backed by a real-money balance/settlement event.


---

7.2 Two profit wallets

I would actually display two separate balances.

Sandbox Profit

SANDBOX PROFIT

+$8,000.00

Status:
VIRTUAL

Withdrawable:
NO

Real Profit

REAL PROFIT

+$800.00

Status:
REAL

Available:
$800.00

This removes ambiguity.


---

7.3 How real profit gets into the wallet

If you trade with the real Deriv account:

REAL DERIV ACCOUNT
       │
       ▼
REAL TRADE
       │
       ▼
REAL RESULT
       │
       ▼
REAL DERIV BALANCE
       │
       ▼
VELTRION RECONCILIATION
       │
       ▼
REAL PROFIT WALLET

VELTRION should only credit the wallet after the underlying real transaction/account state has been verified.

Deriv provides authenticated balance and transaction/account functionality through its API.


---

7.4 Don't calculate "profit" from a single balance

For example:

Starting real balance: $5,000
Current balance:       $5,800

VELTRION shouldn't automatically conclude:

> Profit = $800



because the account might also have had:

deposits

withdrawals

transfers

fees

adjustments

open-position P/L


Instead, the system needs a transaction-aware calculation.

Conceptually:

Real Profit =
Trading results
− trading costs
± other relevant adjustments

with deposits/withdrawals tracked separately.


---

7.5 Real-money ledger

The real ledger becomes:

REAL LEDGER

01 Oct   Initial funding       +$5,000
01 Oct   Trading P/L             +$120
01 Oct   Trading cost              -$5
02 Oct   Trading P/L             +$685
────────────────────────────────────
         Account state          ...

Every entry gets:

transaction ID
source
type
amount
currency
timestamp
status
external reference


---

7.6 Withdrawal screen

The VELTRION withdrawal screen could look like:

┌─────────────────────────────────┐
│        WITHDRAW PROFIT          │
├─────────────────────────────────┤
│                                 │
│ Available                       │
│ $800.00                         │
│                                 │
│ Amount                          │
│ [ $____________ ]              │
│                                 │
│ Destination                    │
│ Deriv / Supported Method       │
│                                 │
│ [ REQUEST WITHDRAWAL ]          │
│                                 │
└─────────────────────────────────┘

But the button should only be enabled when the amount is actually withdrawable.


---

7.7 Withdrawal lifecycle

REQUEST
   │
   ▼
VALIDATE
   │
   ├── authenticated?
   ├── real balance verified?
   ├── sufficient funds?
   ├── withdrawal permitted?
   └── amount valid?
   │
   ▼
PENDING
   │
   ▼
AUTHORIZED PAYMENT OPERATION
   │
   ▼
EXTERNAL CONFIRMATION
   │
   ▼
COMPLETED

Or:

PENDING
   ↓
REJECTED

No withdrawal should be marked Completed merely because the user pressed the button.


---

7.8 Withdrawal states

Use explicit states:

PENDING
PROCESSING
COMPLETED
FAILED
CANCELLED
REJECTED

Example:

WD-000024

Amount:
$500

Status:
● PROCESSING

Created:
01 Oct 2026

Reference:
••••••••


---

7.9 Withdrawal history

WITHDRAWAL HISTORY

ID          Amount     Status

WD-000024   $500       Processing
WD-000023   $250       Completed
WD-000022   $100       Rejected

Selecting one:

Withdrawal Details

Amount
$500

Requested
01 Oct 2026

Status
Processing

Destination
••••••••

External Reference
••••••••


---

7.10 Double-spending protection

This is essential.

Suppose:

Available:
$800

You request:

$500

VELTRION must immediately reserve that amount:

Available:
$300

Reserved:
$500

You shouldn't then be able to submit another $500 withdrawal.

Database concept:

available_balance
reserved_balance

with:

withdrawable =
available_balance - reserved_balance

The reservation and withdrawal state change should be atomic so two simultaneous requests cannot spend the same funds.


---

7.11 Sandbox withdrawal protection

If:

Sandbox Profit:
$8,000

the withdrawal button should explicitly show:

$8,000

VIRTUAL PROFIT

Withdrawable:
$0

This balance represents simulated
trading performance and is not
real Deriv funds.

That prevents the system from misrepresenting virtual performance as cash.


---

7.12 Real Deriv wallet connection

Where Deriv's supported APIs/payment functionality permits the intended operation, VELTRION can connect the authorized account to the relevant wallet/payment workflow.

Deriv's API documentation includes account/payment functionality and transaction operations, but the exact available withdrawal method and requirements depend on the account and applicable Deriv rules.

So we should build the withdrawal service around what Deriv actually confirms, rather than inventing a generic "send money" endpoint.


---

7.13 No direct fake settlement

This must never happen:

Sandbox:
+$8,000

VELTRION database:
"Deriv wallet = +$8,000"

That would create an accounting number without an underlying real transaction.

Instead:

REAL SOURCE
    ↓
AUTHORIZED TRANSACTION
    ↓
EXTERNAL CONFIRMATION
    ↓
VELTRION LEDGER


---

7.14 Profit wallet dashboard

The final Home screen can show:

VELTRION

┌───────────────────────────────┐
│ SANDBOX                       │
│                               │
│ Capital        $100,000       │
│ Virtual P/L      +$8,000      │
│ Withdrawable          $0      │
└───────────────────────────────┘

┌───────────────────────────────┐
│ REAL DERIV                    │
│                               │
│ Real Balance      $5,800      │
│ Real P/L            +$800     │
│ Withdrawable        $500      │
└───────────────────────────────┘

[ TRADE ]
[ PROFIT WALLET ]
[ WITHDRAW ]

The labels VIRTUAL and REAL should be visually unmistakable.


---

7.15 Security for withdrawals

A withdrawal should require additional protection.

For example:

WITHDRAWAL
    ↓
Authenticated session
    ↓
Re-authentication
    ↓
Confirm amount
    ↓
Confirm destination
    ↓
Server-side validation
    ↓
Submit

For higher-risk operations, a second authentication factor can be added.

Never put withdrawal authorization logic only in the frontend.


---

7.16 Audit trail

Every financial event gets recorded.

Example:

AUDIT LOG

REAL TRADE
REAL-000041
+$120

PROFIT CREDIT
PC-000018
+$120

WITHDRAWAL REQUEST
WD-000024
-$500

WITHDRAWAL COMPLETED
WD-000024
-$500

The system should be able to trace:

Withdrawal
   ↓
Profit wallet transaction
   ↓
Underlying real balance/transaction
   ↓
Original trading activity


---

7.17 Reconciliation

The system periodically compares:

VELTRION REAL LEDGER
          ↕
DERIV ACTUAL ACCOUNT

If:

VELTRION:
$5,800

DERIV:
$5,750

VELTRION should not quietly accept the difference.

Instead:

⚠ ACCOUNT RECONCILIATION REQUIRED

Internal balance:
$5,800

Deriv balance:
$5,750

Difference:
$50

Real withdrawals temporarily restricted.

This is much safer than silently modifying numbers.


---

7.18 Phase 7 database

Add:

real_profit_wallet
profit_wallet_transactions
withdrawals
withdrawal_events
settlement_records
reconciliation_records

Together:

REAL DERIV
    │
    ▼
REAL LEDGER
    │
    ▼
PROFIT WALLET
    │
    ▼
WITHDRAWAL
    │
    ▼
SETTLEMENT
    │
    ▼
RECONCILIATION


---

7.19 Phase 7 acceptance test

Before declaring VELTRION financially complete:

Profit

[ ] Real trading results are captured

[ ] Real balance is synchronized

[ ] Real profit calculation accounts for transactions

[ ] Sandbox profit remains virtual

[ ] Real profit is separately identified


Wallet

[ ] Available balance is accurate

[ ] Reserved balance works

[ ] Double withdrawal is prevented

[ ] Wallet transactions are auditable


Withdrawal

[ ] Withdrawal request works

[ ] Amount validation works

[ ] Real funds are verified

[ ] Destination is validated

[ ] Pending/processing/completed/failed states work

[ ] External confirmation is required before completion

[ ] Failed withdrawals are reconciled


Security

[ ] Re-authentication for withdrawal

[ ] Server-side authorization

[ ] Audit log

[ ] No sandbox → real-money conversion

[ ] No fabricated transaction status

[ ] Reconciliation detects discrepancies



---

Final VELTRION architecture after Phase 7

VELTRION
                            │
             ┌──────────────┴──────────────┐
             │                             │
          SANDBOX                         REAL
             │                             │
       $100,000 VIRTUAL                DERIV REAL
             │                             │
       LIVE MARKET DATA              REAL EXECUTION
             │                             │
       VIRTUAL TRADES                 REAL TRADES
             │                             │
       VIRTUAL PROFIT                 REAL PROFIT
             │                             │
             ▼                             ▼
      SANDBOX LEDGER                 REAL LEDGER
             │                             │
        NOT CASH                         │
                                           ▼
                                    PROFIT WALLET
                                           │
                                           ▼
                                      WITHDRAWAL
                                           │
                                           ▼
                                    REAL SETTLEMENT
                                           │
                                           ▼
                                      RECONCILIATION

The complete seven-phase roadmap is now:

Phase	System

1	Private VELTRION admin foundation
2	Device + backend/session infrastructure
3	Deriv OAuth + live market connection
4	$100,000 virtual sandbox trading engine
5	Genuine MT5 integration
6	Authorized real Deriv trading
7	Real profit wallet + legitimate withdrawal/settlement


The resulting VELTRION system is therefore not treating the $100,000 sandbox as money that can magically become cash. It uses the sandbox to simulate trading against real market data, while the separate real Deriv account handles actual money. Only genuine real-money activity can populate the real profit/withdrawal side.VELTRION — Phase 6: Real Deriv Trading

Phase 6 is the point where VELTRION moves from market-data + virtual trading into authorized real-money execution.

This phase must be built separately from the sandbox so that a virtual order can never accidentally become a real Deriv order.

Deriv's API supports authenticated trading through its WebSocket/API infrastructure, while OAuth is designed for web applications so the user authorizes access without giving the application their Deriv password.


---

6.1 The architecture

YOU
                          │
                     VELTRION
                          │
                 ┌────────┴────────┐
                 │                 │
              SANDBOX             REAL
                 │                 │
             $100,000          DERIV ACCOUNT
             VIRTUAL               │
                 │                 │
                 │            OAuth Session
                 │                 │
                 │                 ▼
                 │           REAL DERIV API
                 │                 │
                 │          REAL EXECUTION
                 │                 │
                 │                 ▼
                 │          REAL P/L
                 │                 │
                 └──────────┬──────┘
                            │
                       VELTRION
                       DASHBOARD

The two paths remain independent.


---

6.2 Real Trading must be explicitly enabled

The default remains:

TRADING MODE

🟢 SANDBOX

To enter real trading:

SANDBOX
   ↓
REAL TRADING
   ↓
Security confirmation
   ↓
Deriv authorization
   ↓
REAL MODE ENABLED

There should never be a hidden automatic switch.


---

6.3 Real-account confirmation

Before enabling real execution, VELTRION should display:

┌──────────────────────────────────┐
│       ENABLE REAL TRADING        │
├──────────────────────────────────┤
│                                  │
│ Deriv Account                    │
│ ••••••••                         │
│                                  │
│ Account Type                     │
│ REAL                             │
│                                  │
│ Current Balance                  │
│ $••••••                          │
│                                  │
│ ⚠ Orders placed in REAL mode    │
│ can use real funds.              │
│                                  │
│ [ CANCEL ]   [ ENABLE REAL ]     │
└──────────────────────────────────┘

The account type should be verified from the authorized Deriv account rather than trusting a frontend selection.


---

6.4 Real authorization

The real trading path should use the Deriv authorization already established in Phase 3.

Conceptually:

VELTRION
   │
   ▼
Authorized Deriv connection
   │
   ▼
Identify account
   │
   ▼
Verify real-account status
   │
   ▼
Verify required permission
   │
   ▼
Create authenticated trading session

Deriv documents authenticated WebSocket workflows for API access after OAuth authorization.


---

6.5 Real trading engine

The sandbox engine and real engine should be different services.

VELTRION ORDER
      │
      ▼
TRADING MODE?
      │
 ┌────┴────┐
 │         │
SANDBOX    REAL
 │         │
 ▼         ▼
Sandbox    Real
Engine     Deriv API
 │         │
 ▼         ▼
Virtual    Actual
Position   Deriv Order

This separation is one of the most important architectural decisions in the entire project.


---

6.6 Real order lifecycle

For a real order:

BUY
 │
 ▼
VELTRION
 │
 ▼
Validate account
 │
 ▼
Validate symbol
 │
 ▼
Validate quantity/stake
 │
 ▼
Validate risk rules
 │
 ▼
Confirm REAL mode
 │
 ▼
Deriv API
 │
 ▼
Deriv execution
 │
 ▼
Execution response
 │
 ▼
VELTRION records result

Deriv's current API documentation provides authenticated buy/sell operations.


---

6.7 Never assume execution

VELTRION must not display:

> Trade successful



just because it sent a request.

Instead:

REQUESTED
    ↓
SUBMITTED
    ↓
DERIV RESPONSE
    ↓
CONFIRMED / REJECTED

For example:

Order:
REAL-000041

Status:
● CONFIRMED

Deriv Reference:
••••••••

If Deriv rejects it:

Status:
✕ REJECTED

Reason:
[actual returned reason]


---

6.8 Real positions

After execution:

REAL POSITIONS

Instrument
EUR/USD

Direction
BUY

Size
0.10

Entry
1.08520

Current
1.08610

P/L
+$90.00

The real position should be reconciled against Deriv's actual account/portfolio information.

Deriv provides authenticated portfolio information for open positions.


---

6.9 Real balance

The real balance should always come from Deriv.

DERIV REAL ACCOUNT

Balance       $5,000.00
Equity        $5,090.00
Open P/L         +$90.00

Source:
DERIV

Never calculate the real balance independently and assume it is correct.

Deriv provides authenticated balance retrieval and balance-change subscriptions.


---

6.10 Two dashboards

I would make the distinction extremely obvious.

Sandbox

SANDBOX

$100,000.00
VIRTUAL

Profit
+$4,500.00

Real Money
$0

Real

DERIV REAL

$5,000.00
REAL

Today's P/L
+$90.00

Real Money
YES

Never combine these into:

Total money = $109,500

That would be misleading.


---

6.11 Real trading risk controls

Before sending an order, VELTRION should perform checks.

For example:

REAL ORDER CHECK

✓ Real account connected
✓ Account active
✓ Correct trading mode
✓ Symbol available
✓ Quantity valid
✓ Required funds available
✓ Risk limit acceptable
✓ Market available
✓ Authorization valid

Only after passing the checks:

[ SEND TO DERIV ]


---

6.12 Real trading limits

Create configurable safeguards such as:

MAX ORDER SIZE
MAX DAILY LOSS
MAX OPEN POSITIONS
MAX TOTAL EXPOSURE

Example:

REAL RISK SETTINGS

Maximum order:       $500
Maximum daily loss:  $250
Maximum exposure:  $1,000

These are VELTRION's own additional safeguards, not a replacement for Deriv's rules or account restrictions.


---

6.13 Emergency stop

Add:

REAL TRADING

                  ● ACTIVE

              [ PAUSE TRADING ]

When pressed:

REAL TRADING PAUSED

New orders:
DISABLED

Existing positions:
UNCHANGED

[ RESUME ]

This should block new VELTRION-initiated orders while leaving already-open positions subject to their actual market/account behavior.


---

6.14 Connection failure behavior

If Deriv disconnects:

DERIV CONNECTION
✕ LOST

VELTRION should immediately disable new real orders:

NEW REAL ORDERS
DISABLED

It should not fabricate prices, balances or execution confirmations.

After reconnection:

Connection restored
     ↓
Re-authenticate/reconnect
     ↓
Retrieve actual account state
     ↓
Reconcile positions
     ↓
Re-enable trading


---

6.15 Reconciliation

This is essential.

VELTRION should periodically compare:

VELTRION RECORD
       ↕
DERIV ACTUAL STATE

For:

balance

open positions

orders

transaction status


If they disagree:

RECONCILIATION WARNING

VELTRION:
1 open position

DERIV:
2 open positions

Trading temporarily paused.

This prevents the internal database from silently drifting away from the real account.


---

6.16 Real trade ledger

The real ledger is separate from the sandbox ledger.

REAL DERIV LEDGER

Deposit              +$5,000
Trade P/L               +$90
Fees                     -$2
────────────────────────────
Actual account state   ...

The exact amounts should be populated from actual Deriv transactions/account data.

Database concept:

real_trading_accounts
real_orders
real_positions
real_transactions
real_ledger
real_execution_events


---

6.17 What happens to sandbox profit?

This is where we maintain the rule from the earlier phases.

Suppose:

Sandbox:
$100,000 → $108,000

The $8,000 is:

$8,000 virtual profit.

It does not automatically become:

Deriv real balance +$8,000

For actual money to exist in the real Deriv account, it must come through a legitimate real-money transaction/settlement mechanism.

So Phase 6 does not create a fake conversion.


---

6.18 If you want the sandbox to become a real-money pathway

There is a separate business/financial layer we would need to design.

Conceptually:

SANDBOX PERFORMANCE
        │
        ▼
Performance record
        │
        ▼
Separate funding/settlement rules
        │
        ▼
Actual real-money source
        │
        ▼
Authorized Deriv transaction
        │
        ▼
REAL DERIV BALANCE

The virtual P/L itself is not the source of funds.


---

6.19 Phase 6 database

At this point the system has two complete financial worlds:

SANDBOX
├── sandbox_accounts
├── sandbox_orders
├── sandbox_positions
├── sandbox_ledger
└── sandbox_metrics

REAL
├── real_trading_accounts
├── real_orders
├── real_positions
├── real_transactions
├── real_ledger
└── real_execution_events

And both connect to:

admin
sessions
audit_logs
market_data


---

6.20 Phase 6 acceptance test

Before Phase 7:

Real connection

[ ] Deriv OAuth works

[ ] Correct Deriv account identified

[ ] Real account verified

[ ] Authorization verified

[ ] Real balance retrieved

[ ] Real portfolio retrieved


Real execution

[ ] Real order validation works

[ ] Real order reaches Deriv only when explicitly authorized

[ ] Deriv execution response is captured

[ ] Rejected orders are handled correctly

[ ] Real positions synchronize

[ ] Real P/L updates

[ ] Real balance updates


Safety

[ ] Sandbox cannot execute real orders

[ ] Real mode requires explicit activation

[ ] Real mode can be paused

[ ] Disconnect blocks new orders

[ ] Reconciliation detects mismatches

[ ] Real and sandbox ledgers remain separate

[ ] No Deriv password is stored by VELTRION

[ ] Sensitive authorization material is not exposed in frontend code



---

Phase 6 final architecture

VELTRION
                            │
                     TRADING MODE
                            │
               ┌────────────┴────────────┐
               │                         │
            SANDBOX                     REAL
               │                         │
          $100,000                     DERIV
          VIRTUAL                     REAL $
               │                         │
          Sandbox Engine            OAuth/API
               │                         │
          Virtual Orders          Real Orders
               │                         │
          Virtual P/L             Real P/L
               │                         │
          Sandbox Ledger          Real Ledger
               │                         │
               └────────────┬────────────┘
                            │
                         AUDIT
                            │
                         YOU

What Phase 6 gives us

At the end of Phase 6, VELTRION has two clearly separated capabilities:

Sandbox: real Deriv market data + $100,000 virtual capital + virtual trading.

Real: explicitly authorized Deriv account + real execution + real balance/P&L.

Then Phase 7 is the final financial layer: designing the profit wallet, real-money settlement, withdrawal workflow, transaction reconciliation, limits, and the rules for what—if anything—can legitimately move from VELTRION's accounting system into a real Deriv wallet.VELTRION — Phase 5: MT5 Integration

Phase 5 connects the VELTRION sandbox to MetaTrader 5. The critical distinction is that there are two possible implementations:

1. Official MT5 terminal connection — requires genuine MT5 broker/trade-server infrastructure.


2. VELTRION's own MT5-style terminal — no MetaQuotes broker server required, but it isn't the official MT5 application.



Since your plan is to use the official MT5 app, Phase 5 should be designed around option 1.


---

5.1 Target architecture

YOU
                          │
              ┌───────────┴───────────┐
              │                       │
        VELTRION APP             OFFICIAL MT5
              │                       │
              │                 Login:
              │                 VELTRION server
              │                       │
              └───────────┬───────────┘
                          │
                          ▼
                VELTRION MT5 SERVER
                          │
                  ACCOUNT MANAGEMENT
                          │
                          ▼
                 VELTRION TRADE ENGINE
                          │
             ┌────────────┼────────────┐
             │            │            │
           MARKET       ORDERS        RISK
             │            │            │
             └────────────┼────────────┘
                          │
                          ▼
                   SANDBOX LEDGER
                          │
                       $100,000
                        VIRTUAL


---

5.2 First: obtain legitimate MT5 infrastructure

This is the part we cannot simulate with frontend code.

MetaTrader's official documentation distinguishes ordinary demo/live accounts from the broker infrastructure that operates MT5 servers. Live accounts are opened by brokerage companies, and MetaQuotes provides broker/server infrastructure separately from ordinary terminal software.

So Phase 5 begins with:

VELTRION
   ↓
MetaQuotes broker inquiry
   ↓
MT5 broker/server access
   ↓
Infrastructure provisioning
   ↓
VELTRION MT5 environment

The exact commercial/licensing arrangement needs to be confirmed directly with MetaQuotes before implementation.


---

5.3 VELTRION virtual MT5 account

Once the appropriate infrastructure exists, VELTRION can provision the virtual account.

Example:

VELTRION MT5 ACCOUNT

Account type:     Virtual
Currency:         USD

Server:
VELTRION-VIRTUAL

Login:
70001234

Password:
••••••••

Investor password:
••••••••

Balance:
$100,000.00

Status:
● ACTIVE

These are example values until the real MT5 infrastructure generates actual account credentials.

We should never pretend that VELTRION-VIRTUAL / 70001234 is already a functioning MT5 server.


---

5.4 Official MT5 connection

On the official MetaTrader 5 application:

Open MT5
   ↓
Login to existing account
   ↓
Server:
VELTRION-VIRTUAL
   ↓
Login:
70001234
   ↓
Password:
••••••••
   ↓
SIGN IN

MT5's official account authorization requires the account login, password and broker/server selection.

If the infrastructure has been correctly provisioned, MT5 should then communicate directly with the VELTRION MT5 server.


---

5.5 MT5 → VELTRION engine

The flow becomes:

Official MT5
     │
     │ BUY
     ▼
VELTRION MT5 SERVER
     │
     ▼
VELTRION ORDER ENGINE
     │
     ├── Validate account
     ├── Validate symbol
     ├── Validate volume
     ├── Check risk
     └── Execute virtual order
     │
     ▼
SANDBOX POSITION
     │
     ▼
P/L ENGINE

The order remains virtual.


---

5.6 Market data

The market side remains:

DERIV
                   │
              LIVE MARKET
                   │
                   ▼
             VELTRION MARKET
                SERVICE
                   │
           ┌───────┴────────┐
           │                │
           ▼                ▼
      VELTRION UI      MT5 SERVER
                            │
                            ▼
                      OFFICIAL MT5

So the conceptual experience becomes:

Deriv market → VELTRION → MT5 virtual account.

The actual technical implementation will need to ensure the MT5 server's symbol/price-feed infrastructure is configured correctly; we shouldn't assume that simply forwarding a Deriv WebSocket feed makes an MT5 broker server automatically valid.


---

5.7 Symbol mapping

This becomes an important Phase 5 component.

For example:

DERIV SYMBOL
     │
     ▼
VELTRION INTERNAL SYMBOL
     │
     ▼
MT5 SYMBOL

A mapping table could contain:

symbol_mapping

source
source_symbol
veltrion_symbol
mt5_symbol
price_precision
contract_size
min_volume
volume_step
status

This prevents the system from assuming that every broker/instrument uses identical specifications.


---

5.8 MT5 trading operations

The virtual MT5 account should eventually support:

Market orders

BUY
SELL

Position management

CLOSE
MODIFY

Risk controls

STOP LOSS
TAKE PROFIT

Pending orders

Where supported by the configured MT5 environment:

BUY LIMIT
SELL LIMIT
BUY STOP
SELL STOP

Account information

Balance
Equity
Margin
Free Margin
Floating P/L

All of these must correspond to the VELTRION virtual ledger.


---

5.9 One ledger, multiple interfaces

This is critical.

You don't want:

VELTRION balance
      ≠
MT5 balance

Instead:

SANDBOX ACCOUNT
                     │
              VELTRION LEDGER
                     │
          ┌──────────┴──────────┐
          │                     │
     VELTRION UI            MT5 SERVER
          │                     │
          ▼                     ▼
       Dashboard             MT5 App

Both interfaces represent the same virtual account.


---

5.10 Example

You open a position in MT5:

EUR/USD
BUY
0.10

MT5 sends the order through the VELTRION MT5 infrastructure.

VELTRION records:

Order:
SBX-MT5-000001

Side:
BUY

Volume:
0.10

Entry:
1.08520

Then:

Market → 1.08610

VELTRION updates:

Floating P/L:
+$90

Open VELTRION on your phone:

EUR/USD BUY
0.10

Entry     1.08520
Current   1.08610

Floating P/L
+$90.00

Open MT5:

EUR/USD
BUY 0.10
Profit +$90

They should represent the same position.


---

5.11 MT5 connection status

VELTRION should show:

MT5 CONNECTION

Server
VELTRION-VIRTUAL

Account
70001234

Connection
● ONLINE

Last heartbeat
17:52:18

Balance
$100,000.00

Equity
$100,000.00

Open Positions
0

And if MT5 disconnects:

MT5
○ DISCONNECTED

Last heartbeat:
17:49:32

[ RECONNECT ]


---

5.12 Device architecture

You could therefore have:

YOUR PHONE
                 │
                 ▼
             VELTRION
                 │
                 │
             YOUR PC
                 │
                 ▼
           OFFICIAL MT5
                 │
                 │
                 ▼
         VELTRION MT5 SERVER
                 │
                 ▼
          SAME SANDBOX ACCOUNT

This means you aren't creating separate accounts for your phone and MT5.


---

5.13 Security

The MT5 password should not be sent to me or placed in chat.

VELTRION can display:

MT5 Password
••••••••••

and provide a secure password-management/reset flow.

Likewise:

Deriv credentials remain with Deriv.

MT5 credentials are handled through the legitimate MT5 account infrastructure.

Backend secrets aren't exposed to the frontend.

Sandbox credentials cannot authorize real Deriv trades.



---

5.14 Virtual vs real mode

Phase 5 must preserve the same hard boundary:

VELTRION
                         │
                  ACCOUNT MODE
                         │
             ┌───────────┴───────────┐
             │                       │
          VIRTUAL                   REAL
             │                       │
        MT5 SANDBOX              DERIV REAL
             │                       │
        $100,000                  REAL $
             │                       │
       VIRTUAL P/L               REAL P/L

MT5 Phase 5 is still sandbox.

We do not connect the MT5 virtual account to real Deriv execution.


---

5.15 Phase 5 database additions

We add:

mt5_accounts
mt5_connections
mt5_sessions
mt5_symbols
mt5_symbol_mapping
mt5_orders
mt5_positions
mt5_events

They connect to:

sandbox_accounts
sandbox_orders
sandbox_positions
sandbox_ledger


---

5.16 Phase 5 acceptance test

Before moving to Phase 6:

Infrastructure

[ ] MetaQuotes/broker infrastructure requirements confirmed

[ ] Legitimate MT5 server environment provisioned

[ ] VELTRION virtual account created

[ ] Server name works

[ ] Account login works


Official MT5

[ ] Official MT5 app can find the server

[ ] Login succeeds

[ ] Balance is displayed

[ ] Symbols are available

[ ] Prices update

[ ] Orders can be placed

[ ] Orders appear in VELTRION

[ ] Positions synchronize

[ ] P/L synchronizes

[ ] Closing a position from MT5 updates VELTRION

[ ] Closing from VELTRION updates the MT5 representation


Safety

[ ] MT5 account is explicitly virtual

[ ] Sandbox funds remain virtual

[ ] MT5 orders cannot reach real Deriv

[ ] Real Deriv balance remains untouched

[ ] Audit log records MT5 activity



---

Phase 5 final architecture

YOU
                          │
             ┌────────────┴────────────┐
             │                         │
          PHONE                    MT5 APP
             │                         │
             ▼                         ▼
        VELTRION UI              MT5 TERMINAL
             │                         │
             │                  MT5 ACCOUNT
             │                         │
             └────────────┬────────────┘
                          │
                          ▼
                VELTRION MT5 SERVER
                          │
                          ▼
                 VELTRION ENGINE
                          │
             ┌────────────┼────────────┐
             │            │            │
           MARKET       ORDERS        RISK
             │            │            │
             └────────────┼────────────┘
                          ▼
                  SANDBOX LEDGER
                          │
                          ▼
                    $100,000
                     VIRTUAL

After Phase 5

The progression is:

Phase 1: Private VELTRION admin foundation
Phase 2: Multi-device infrastructure
Phase 3: Deriv OAuth + live market
Phase 4: VELTRION sandbox trading engine
Phase 5: Genuine MT5 integration
Phase 6: Real Deriv trading connection
Phase 7: Real-money profit/withdrawal architecture

The key thing in Phase 5 is that we don't build a fake MT5 server. We establish the legitimate MT5 infrastructure first, then connect the virtual account and make VELTRION and MT5 represent the same sandbox ledger.VELTRION — Phase 4: Sandbox Trading Engine

Phase 4 is where the $100,000 virtual account becomes an actual working trading environment using the live market feed established in Phase 3.

The fundamental rule is:

> Real Deriv market prices → VELTRION sandbox execution → virtual P/L. No real Deriv trade execution.




---

4.1 Complete Phase 4 flow

DERIV
                      │
                 LIVE MARKET
                      │
                  LIVE TICKS
                      │
                      ▼
             VELTRION MARKET
                 SERVICE
                      │
                      ▼
             SANDBOX ENGINE
                      │
          ┌───────────┼───────────┐
          │           │           │
        ORDERS     POSITIONS    RISK
          │           │           │
          └───────────┼───────────┘
                      │
                      ▼
                 P/L ENGINE
                      │
          ┌───────────┴───────────┐
          │                       │
     REALIZED P/L           FLOATING P/L
          │                       │
          └───────────┬───────────┘
                      ▼
                SANDBOX LEDGER
                      │
                      ▼
               $100,000 VIRTUAL


---

4.2 Sandbox account

The account is initialized once.

VELTRION SANDBOX

Account: VEL-SBX-001
Type: Virtual
Currency: USD

Starting Capital       $100,000.00
Balance                $100,000.00
Equity                 $100,000.00
Floating P/L                 $0.00
Realized P/L                 $0.00
Open Positions                 0

The starting capital is not recreated every time you log in.


---

4.3 Trading screen

The main trading screen should look conceptually like:

┌─────────────────────────────────────────────┐
│ EUR/USD                    ● LIVE           │
│ 1.08520                                      │
├─────────────────────────────────────────────┤
│                                             │
│                 PRICE CHART                 │
│                                             │
│       ╱╲       ╱╲                           │
│  ╱╲  ╱  ╲  ╱╲ ╱  ╲                          │
│ ╱  ╲╱    ╲╱  ╲    ╲                        │
│                                             │
├─────────────────────────────────────────────┤
│ Order                                       │
│                                             │
│ Size: [ 0.10 ]                              │
│                                             │
│ SL:   [       ]                             │
│ TP:   [       ]                             │
│                                             │
│ [ BUY ]                    [ SELL ]         │
└─────────────────────────────────────────────┘

Everything here is sandbox execution.


---

4.4 Order lifecycle

When you press BUY:

BUY
 │
 ▼
Validate order
 │
 ├── Account active?
 ├── Enough virtual capital?
 ├── Valid instrument?
 ├── Valid size?
 ├── Risk limits?
 └── Valid price?
 │
 ▼
Create sandbox order
 │
 ▼
Open virtual position
 │
 ▼
Monitor live Deriv ticks
 │
 ▼
Update floating P/L

Nothing gets sent to the real Deriv trading endpoint.


---

4.5 Order record

Each order receives its own identifier.

Example:

Order ID: SBX-000001
Symbol: EUR/USD
Side: BUY
Size: 0.10
Entry: 1.08520
Stop Loss: 1.08020
Take Profit: 1.09520
Status: OPEN

Database structure:

sandbox_orders

id
account_id
symbol
side
quantity
entry_price
stop_loss
take_profit
status
opened_at
closed_at


---

4.6 Positions

An order can produce an open position.

Example:

OPEN POSITIONS

EUR/USD
BUY
0.10

Entry       1.08520
Current     1.08610

Floating P/L
+$90.00

SL          1.08020
TP          1.09520

The current price comes from the live market feed.


---

4.7 Floating P/L

Every new market tick can cause the virtual position's value to change.

Conceptually:

Entry Price
      ↓
Current Market Price
      ↓
Price Difference
      ↓
Position Size
      ↓
Virtual P/L

The exact calculation depends on the instrument and contract specification, so we should implement instrument-specific rules rather than assuming every market behaves like a standard FX pair.


---

4.8 Stop-loss and take-profit

The sandbox engine monitors the live price.

Stop-loss

Position OPEN
     ↓
Market moves against position
     ↓
SL reached
     ↓
Virtual position CLOSED
     ↓
Realized P/L recorded

Take-profit

Position OPEN
     ↓
Market reaches TP
     ↓
Virtual position CLOSED
     ↓
Realized P/L recorded

These are virtual events.


---

4.9 Manual closing

You should also have:

OPEN POSITION

EUR/USD BUY
0.10

+$124.00

[ CLOSE POSITION ]

When you close:

Current price
     ↓
Close virtual position
     ↓
Calculate realized P/L
     ↓
Update balance
     ↓
Write ledger entry


---

4.10 Balance vs equity

The dashboard should distinguish them.

Balance

Money after closed trades.

Balance = Starting Capital + Realized P/L

Equity

Balance plus current floating P/L.

Equity = Balance + Floating P/L

Example:

Starting Capital     $100,000
Realized P/L          +$1,000
Balance              $101,000

Open-trade P/L          +$250
Equity                $101,250

These values should be calculated by the backend.


---

4.11 Profit ledger

Every financial change gets recorded.

Example:

SANDBOX LEDGER

Initial Capital       +$100,000.00
Trade SBX-000001         +$120.00
Trade SBX-000002         -$45.00
Trade SBX-000003         +$310.00
────────────────────────────────
Current Balance       $100,385.00

Database:

sandbox_ledger

id
account_id
transaction_type
reference_id
amount
balance_after
created_at

This creates an auditable history rather than simply changing one balance number.


---

4.12 Risk engine

Before allowing a trade, VELTRION checks risk.

Possible controls:

MAX POSITION SIZE
MAX OPEN POSITIONS
MAX LOSS PER TRADE
MAX DAILY LOSS
MAX TOTAL EXPOSURE

Example:

RISK CONTROL

Maximum daily sandbox loss: $2,000
Current daily loss:          $350

Status: ● WITHIN LIMIT

If a trade violates the configured limit:

ORDER REJECTED

Reason:
Daily loss limit would be exceeded.


---

4.13 Trading history

Create:

HISTORY

ID          Symbol    Side    P/L

SBX-00001  EUR/USD   BUY     +$120
SBX-00002  GBP/USD   SELL     -$45
SBX-00003  EUR/USD   BUY     +$310

Selecting a trade shows:

Trade Details

Order ID
Symbol
Side
Size
Entry
Exit
SL
TP
Open time
Close time
Realized P/L
Reason for closure


---

4.14 Market-data protection

This is important because Phase 4 depends on Phase 3.

If the live market connection disappears:

DERIV MARKET
      ↓
CONNECTION LOST
      ↓
SANDBOX ENGINE
      ↓
PAUSE NEW EXECUTION

VELTRION should not invent a price just because the feed stopped.

Existing positions can be marked:

> Market data unavailable — P/L temporarily unavailable.



Then the engine resumes when verified market data returns.


---

4.15 The most important separation

The backend must distinguish:

SANDBOX ORDER

from

REAL DERIV ORDER

For example:

order_mode = SANDBOX

must route exclusively to:

VELTRION SANDBOX ENGINE

while a future:

order_mode = REAL

would require a completely different authorization path.

Phase 4 contains no route from sandbox orders to real Deriv execution.


---

4.16 Database structure

Phase 4 adds:

sandbox_accounts
      │
      ├── sandbox_orders
      │
      ├── sandbox_positions
      │
      ├── sandbox_ledger
      │
      └── sandbox_daily_metrics

And:

market_symbols
      │
      ▼
market_ticks
      │
      ▼
sandbox_engine


---

4.17 Home dashboard after Phase 4

Now the home screen becomes a real trading dashboard:

VELTRION

SANDBOX PROFIT
+$385.00

Balance
$100,385.00

Equity
$100,640.00

Virtual Capital
$100,000.00

────────────────────

DERIV MARKET
● LIVE

SANDBOX
● ACTIVE

Open Positions
3

Today's P/L
+$385.00

[ TRADE ]
[ POSITIONS ]
[ HISTORY ]

And separately:

REAL DERIV ACCOUNT

● CONNECTED

Real Balance
$••••••

Real Trading
DISABLED

That makes it impossible to confuse the two balances visually.


---

4.18 Phase 4 acceptance test

Before Phase 5, we should verify:

Sandbox

[ ] $100,000 created correctly

[ ] Account persists

[ ] BUY works

[ ] SELL works

[ ] Orders receive IDs

[ ] Positions open correctly

[ ] Positions close correctly

[ ] Manual close works

[ ] Stop-loss works

[ ] Take-profit works

[ ] Floating P/L updates

[ ] Realized P/L updates

[ ] Balance updates

[ ] Equity updates

[ ] Ledger records every change

[ ] History displays correctly


Market

[ ] Live Deriv ticks feed sandbox

[ ] No fake prices

[ ] Instrument specifications are respected

[ ] Market disconnection is handled

[ ] Reconnection works


Safety

[ ] Sandbox order never reaches Deriv real trading

[ ] Real balance cannot be modified by sandbox

[ ] Sandbox profit cannot be presented as real money

[ ] Backend enforces sandbox mode

[ ] Every trade is auditable



---

Phase 4 final architecture

DERIV
                           │
                    LIVE MARKET DATA
                           │
                           ▼
                   VELTRION MARKET
                       SERVICE
                           │
                           ▼
                    SANDBOX ENGINE
                           │
             ┌─────────────┼─────────────┐
             │             │             │
          ORDERS        POSITIONS       RISK
             │             │             │
             └─────────────┼─────────────┘
                           │
                           ▼
                       P/L ENGINE
                           │
                    ┌──────┴──────┐
                    │             │
                 FLOATING      REALIZED
                    │             │
                    └──────┬──────┘
                           ▼
                    SANDBOX LEDGER
                           │
                           ▼
                    $100,000 VIRTUAL

Then Phase 5

Phase 5 is MT5 integration.

That's where we decide and implement the actual path for:

VELTRION Sandbox → genuine MT5-compatible account/server → official MetaTrader 5 terminal, including the server/account architecture required if you want to log into the VELTRION virtual account from the official MT5 app.VELTRION — Phase 3: Deriv Connection + Live Market

Phase 3 is where VELTRION stops being a standalone dashboard and becomes connected to the real Deriv environment.

The key rule remains:

> Deriv supplies the real market/account information. VELTRION's $100,000 remains virtual.



Deriv's current API documentation supports OAuth 2.0, real-time WebSocket market data, authenticated balances and portfolios. 


---

3.1 The complete Phase 3 flow

VELTRION
                     │
              [ CONNECT DERIV ]
                     │
                     ▼
             DERIV OAUTH 2.0
                     │
                     ▼
             DERIV LOGIN PAGE
                     │
              You authenticate
                     │
                     ▼
                 CONSENT
                     │
                     ▼
             VELTRION CALLBACK
                     │
             ┌───────┴────────┐
             │                │
        STATE VERIFIED    PKCE VERIFIED
             │                │
             └───────┬────────┘
                     ▼
              TOKEN EXCHANGE
                     │
                     ▼
            AUTHENTICATED SESSION
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
    ACCOUNT INFORMATION     MARKET DATA
          │                     │
          │               LIVE TICKS
          │                     │
          ▼                     ▼
     DERIV PANEL            VELTRION
                                │
                                ▼
                         SANDBOX ENGINE
                                │
                         $100,000 VIRTUAL

Deriv specifically documents OAuth 2.0 with PKCE and requires the registered redirect URI to match exactly. 


---

3.2 The Connect Deriv screen

We build the actual interface now.

┌─────────────────────────────────┐
│          CONNECT DERIV          │
├─────────────────────────────────┤
│                                 │
│  Real Deriv Account             │
│                                 │
│  Status                         │
│  ○ Not Connected                │
│                                 │
│  Market Data                    │
│  ○ Offline                      │
│                                 │
│  Account                        │
│  ○ Not Connected                │
│                                 │
│       [ CONNECT DERIV ]         │
│                                 │
│  You will sign in directly      │
│  through Deriv.                 │
│                                 │
└─────────────────────────────────┘

VELTRION does not ask you to type your Deriv password into VELTRION.

Deriv's documentation explicitly describes OAuth as allowing users to grant access without sharing their password with the application. 


---

3.3 OAuth permissions

We should request only the permissions Phase 3 actually needs.

Deriv currently documents these OAuth scopes:

trade

account_manage

application_read

payment 


For the first connection, we should minimize permissions.

If Phase 3 only needs:

LIVE MARKET
ACCOUNT INFORMATION
BALANCE

we don't need to immediately enable every possible financial operation.

When real trading is implemented later, the required trading authorization can be added deliberately.


---

3.4 Callback

After Deriv authentication:

Deriv
  ↓
VELTRION callback
  ↓
/callback

The callback verifies:

authorization code
state
PKCE
redirect URI

Then the backend exchanges the authorization code for the token.

The token exchange belongs on the protected backend side—not exposed as a secret in the browser.


---

3.5 Store the connection, not the password

Supabase should record something like:

deriv_connections

id
owner_id
deriv_account_id
connection_status
token_reference
created_at
updated_at
last_verified_at

The sensitive authorization material should be handled securely by the backend/secrets layer.

The browser should receive something closer to:

CONNECTED
Account: •••••1234
Status: ACTIVE

not the underlying credential.


---

3.6 Real account information

Once authenticated, VELTRION can request account information.

The current Deriv API has authenticated endpoints for balance and portfolio. Balance can also be subscribed to for real-time balance changes. 

VELTRION can therefore show:

DERIV ACCOUNT

Status       ● Connected
Account      ••••••••
Balance      $••••
Currency     USD
Connection   Active

The actual real balance should come from Deriv—not a hardcoded number.


---

3.7 Live market connection

This is one of the most important parts of Phase 3.

Deriv provides public market-data WebSocket endpoints, including active symbols, historical ticks and live tick subscriptions. 

So:

DERIV
  │
  │ live tick
  ▼
VELTRION MARKET SERVICE
  │
  ├── timestamp
  ├── symbol
  ├── quote
  └── market status
  │
  ▼
VELTRION


---

3.8 First market screen

We don't need to start with hundreds of instruments.

Start with a small verified list.

Example:

MARKETS

Symbol          Price          Status

EUR/USD         —              ● LIVE
GBP/USD         —              ● LIVE
USD/JPY         —              ● LIVE
Gold            —              ● LIVE

The symbols and prices should come from Deriv's market-data service rather than invented frontend values.


---

3.9 Live chart

When you select an instrument:

EUR/USD

LIVE ●

1.08520
       ╱╲
  ╱╲  ╱  ╲
╱  ╲╱    ╲
──────────────

Last tick
17:43:21

Source:
Deriv

The first implementation can use tick data.

Later we can build:

candles

timeframes

indicators

market depth/other supported data

trading signals


Deriv's tick-history endpoint also supports historical ticks and candle-style historical data. 


---

3.10 The critical sandbox connection

This is where VELTRION becomes interesting.

The market pipeline will be:

DERIV
               │
          REAL MARKET
               │
          LIVE TICKS
               │
               ▼
        VELTRION MARKET
               │
               ▼
       SANDBOX TRADING
               │
          $100,000
          VIRTUAL
               │
               ▼
          VIRTUAL P/L

Example:

Deriv EUR/USD
1.08500
     ↓
VELTRION receives tick
     ↓
Sandbox Buy
     ↓
Price moves to 1.08600
     ↓
VELTRION calculates
virtual P/L
     ↓
Sandbox balance changes

No real Deriv order is created by that sandbox trade.


---

3.11 Dashboard after successful connection

The Home screen changes from:

DERIV
○ NOT CONNECTED

to:

DERIV
● CONNECTED

Market
● LIVE

Account
● AUTHENTICATED

while the sandbox remains:

SANDBOX

Capital       $100,000.00
Balance       $100,000.00
Profit               $0.00
Positions               0

That distinction should always be visible.


---

3.12 Connection health

Add a proper status monitor:

DERIV CONNECTION

OAuth                 ✓
Account               ✓
Market WebSocket      ✓
Tick Stream           ✓
Last Tick             17:43:21
Latency               82 ms

If something fails:

Market WebSocket      ✕
Last successful tick  17:42:58

[ RECONNECT ]

Don't simply display "Connected" because the initial login succeeded.


---

3.13 Reconnection

Internet connections fail.

Therefore Phase 3 needs:

CONNECTED
    ↓
CONNECTION LOST
    ↓
RECONNECTING
    ↓
CONNECTED

The system should reconnect the market stream automatically where appropriate and update the dashboard status.


---

3.14 Phase 3 security boundary

This is extremely important:

DERIV
                      │
             ┌────────┴────────┐
             │                 │
        MARKET DATA       REAL ACCOUNT
             │                 │
             ▼                 ▼
        VELTRION          AUTH SESSION
             │
             ▼
       SANDBOX ENGINE
             │
             ▼
        $100,000 VIRTUAL

At Phase 3:

Enabled

✅ Deriv OAuth
✅ Account identification
✅ Live market data
✅ Real balance display, if authorized
✅ Real portfolio/account information, if authorized
✅ Sandbox market simulation

Still disabled

❌ Real Deriv trade execution from VELTRION
❌ Real-profit conversion
❌ Withdrawal of sandbox profit
❌ MT5 execution
❌ Real-money settlement

Those come only after their respective phases are built and tested.


---

3.15 Phase 3 database additions

We'll add:

deriv_connections
deriv_accounts
market_symbols
market_ticks
market_subscriptions
connection_events

And connect them to the existing:

admin_users
sandbox_accounts
sessions
audit_logs

The relationship becomes:

ADMIN
 │
 ├── DERIV CONNECTION
 │       │
 │       └── DERIV ACCOUNT
 │
 └── SANDBOX ACCOUNT
         │
         └── VIRTUAL TRADES


---

3.16 Phase 3 acceptance test

Before moving to Phase 4, we should be able to demonstrate:

Deriv

[ ] Click Connect Deriv

[ ] Redirect to official Deriv authentication

[ ] Authenticate at Deriv

[ ] Give consent

[ ] Return to VELTRION

[ ] Verify OAuth state

[ ] Verify PKCE

[ ] Exchange authorization code

[ ] Establish authenticated session

[ ] Identify the authorized account

[ ] Display connection status


Market

[ ] Retrieve active symbols

[ ] Subscribe to live ticks

[ ] Receive changing prices

[ ] Display timestamps

[ ] Reconnect after network interruption

[ ] Show market connection health


Account

[ ] Retrieve authorized balance

[ ] Display account status

[ ] Retrieve portfolio where applicable

[ ] Keep credentials/tokens out of frontend source


Sandbox

[ ] $100,000 remains virtual

[ ] Market prices come from Deriv

[ ] Sandbox trades do not reach Deriv

[ ] Sandbox P/L is calculated independently

[ ] Real Deriv balance and sandbox balance remain visibly separate



---

Phase 3 final architecture

YOU
                          │
                 PHONE / TABLET / PC
                          │
                          ▼
                    VELTRION
                          │
                 CONNECT DERIV
                          │
                          ▼
                   DERIV OAUTH
                          │
                    LOGIN + CONSENT
                          │
                          ▼
                    CALLBACK
                          │
                  STATE + PKCE
                    VERIFIED
                          │
                          ▼
                 AUTHENTICATED
                    DERIV SESSION
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
        ACCOUNT DATA             MARKET DATA
              │                       │
       Balance/Portfolio         Live Ticks
              │                       │
              └───────────┬───────────┘
                          ▼
                    VELTRION
                          │
                          ▼
                  SANDBOX ENGINE
                          │
                     $100,000
                      VIRTUAL
                          │
                          ▼
                    VIRTUAL P/L

The next phase, Phase 4, is where we build the actual sandbox trading engine: orders, positions, lot/stake sizing, entry price, stop-loss/take-profit rules, floating P/L, realized P/L, equity, margin/risk controls and the sandbox ledger—using the live Deriv market feed from Phase 3.# Sendbox-money-profit
