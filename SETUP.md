# VELTRION Phase 1 Setup Guide

## Overview
VELTRION Phase 1 is a secure, admin-only trading platform frontend built with React + Vite, authenticated via Supabase, with a comprehensive database schema for sandbox accounts, user sessions, and audit logging.

## Prerequisites
- Node.js 16+ and npm
- Supabase account (free tier acceptable)
- Git

## Step 1: Supabase Setup

### 1.1 Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free project
2. Note your project URL and anon public key
3. Navigate to **SQL Editor** in your Supabase dashboard

### 1.2 Run Database Schema
1. Open `database/schema.sql` from this repository
2. Copy the entire SQL script
3. Paste it into the Supabase SQL Editor and execute
4. Verify all tables are created:
   - `admin_users`
   - `sandbox_accounts`
   - `user_sessions`
   - `audit_logs`

### 1.3 Create Admin User
1. Go to Supabase **Authentication** → **Users**
2. Click **Add User** and create an admin account with an email and password
3. Copy the user's UUID
4. Go to **SQL Editor** and run:
```sql
insert into public.admin_users (user_id, role, status)
values ('<USER_UUID_HERE>', 'OWNER_ADMIN', 'ACTIVE');

insert into public.sandbox_accounts (admin_id, account_number, balance, equity)
select id, 'VEL-SBX-001', 100000.00, 100000.00
from public.admin_users
where user_id = '<USER_UUID_HERE>';
```
5. Verify the records are inserted

## Step 2: Frontend Setup

### 2.1 Install Dependencies
```bash
cd frontend
npm install
```

### 2.2 Configure Environment Variables
1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2.3 Run Development Server
```bash
npm run dev
```

The app should open at `http://localhost:3000`

## Step 3: Verification Checklist

### Authentication Test
- [ ] Attempt to log in with an **invalid email** → Should be rejected
- [ ] Attempt to log in with a **valid email but wrong password** → Should be rejected
- [ ] Log in with your **admin credentials** → Should succeed and redirect to `/`

### Dashboard Test
- [ ] Verify Home dashboard displays **$100,000.00** virtual capital
- [ ] Verify **$0.00** profit (no trades yet)
- [ ] Verify system status shows:
  - Deriv: NOT CONNECTED
  - MT5: NOT CONNECTED
  - Sandbox: ACTIVE
  - Real: PAUSED

### Sidebar Navigation Test
- [ ] Click menu button (☰) to open sidebar
- [ ] Click on menu items (they show "Coming in the next system phase")
- [ ] Click on **SECURITY** → Should show audit logs and sessions
- [ ] Click **LOG OUT** → Should redirect to login

### Security Test
- [ ] Open Security page and verify your login is logged
- [ ] Check that audit logs show timestamp and status

### Mobile & PWA Test
- [ ] Open app on mobile device (or mobile emulator in DevTools)
- [ ] Verify layout is responsive
- [ ] In Chrome, click **Install** to add to home screen
- [ ] Verify it runs as a standalone app

## Step 4: Production Build (Optional)

To build for production:
```bash
cd frontend
npm run build
```

This creates a `/dist` folder ready for deployment to GitHub Pages or any static host.

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure you created `.env.local` with correct keys
- Restart the dev server: `npm run dev`

### "Access denied: Unauthorized account"
- Make sure the admin user was properly inserted into `admin_users` table
- Verify the `user_id` matches the Supabase auth user ID

### "Cannot read properties of undefined (reading 'balance')"
- Make sure the sandbox account was created and linked to the admin user
- Check Supabase RLS policies are correctly set

### Login redirects to login page repeatedly
- Clear browser cookies and local storage
- Check that `admin_users.status = 'ACTIVE'` in Supabase

## Next Steps (Phase 2)
- Real-time WebSocket connection to Deriv API
- MT5 account provisioning and credentials
- Trading execution (BUY/SELL orders)
- Live price data and charts
- Position and order management
- Analytics dashboards
