# VELTRION Phase 1: GitHub Pages Deployment Guide

## Overview
This guide walks you through deploying VELTRION Phase 1 to GitHub Pages using GitHub Actions, with automatic builds triggered on every push.

## Architecture
- **Repository**: Cyrrenza-v2/Sendbox-money-profit
- **Deployment Method**: GitHub Pages via GitHub Actions
- **Build Tool**: Vite (React)
- **Backend**: Supabase (authentication, database, RLS)
- **Hosting**: GitHub Pages (static hosting, free)

---

## Step 1: Configure Supabase Secrets in GitHub

### 1.1 Get Your Supabase Credentials
1. Log into [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon Public Key** (under "Project API keys")

### 1.2 Add Secrets to GitHub Repository
1. Go to your GitHub repository: `https://github.com/Cyrrenza-v2/Sendbox-money-profit`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each:

**Secret 1:**
- Name: `VITE_SUPABASE_URL`
- Value: `https://your-project.supabase.co`

**Secret 2:**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: `your_anon_key_here`

✅ Do **NOT** use your service role key. Only use the public anon key.

---

## Step 2: Verify GitHub Actions Workflow

The workflow file is already created at `.github/workflows/deploy.yml` and will:
1. Trigger on every push to `main` or `phase-1-veltrion` branch
2. Install dependencies
3. Build the React + Vite application
4. Deploy the `/dist` folder to GitHub Pages

### 2.1 Monitor the Workflow
1. Go to your repo → **Actions** tab
2. Click the latest workflow run
3. Watch the build process in real-time
4. Once complete, you'll see a "Deploy to GitHub Pages" step with a ✅

---

## Step 3: Enable GitHub Pages

### 3.1 Configure Pages Settings
1. Go to your repo → **Settings** → **Pages**
2. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions**
3. Click **Save**

✅ GitHub Pages is now configured to deploy from your GitHub Actions workflow.

---

## Step 4: Access Your Deployed App

Once the workflow completes:
- Your app will be live at: `https://Cyrrenza-v2.github.io/Sendbox-money-profit/`
- The PWA manifest allows you to install it on your phone via Chrome

### 4.1 Test the Deployment
1. Open `https://Cyrrenza-v2.github.io/Sendbox-money-profit/` in your browser
2. You should see the VELTRION login screen
3. Log in with your admin credentials
4. Verify the Home dashboard loads correctly

### 4.2 Install as PWA (Mobile)
1. Open the app in Chrome on your phone
2. Click the **Install** button (or menu → "Install app")
3. The app will be added to your home screen
4. It runs as a standalone app without browser chrome

---

## Step 5: Troubleshooting Deployment

### ❌ Build Failed
**Error**: `VITE_SUPABASE_URL is missing`

**Solution**:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Verify both secrets exist and have correct values
3. Re-run the workflow (click **Actions** → Latest run → **Re-run jobs**)

### ❌ App Loads But Login Fails
**Error**: `401 Unauthorized` or `Supabase connection error`

**Solution**:
1. Verify secrets are correct in GitHub (copy from Supabase again)
2. Check Supabase project is active
3. Verify admin user exists in `admin_users` table
4. Check that `admin_users.status = 'ACTIVE'`

### ❌ Assets Not Loading (404 errors)
**Error**: `/Sendbox-money-profit/app.js` returns 404

**Solution**: This is already fixed in `vite.config.js` with `base: '/Sendbox-money-profit/'`

If still broken:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh the page (Ctrl+Shift+R)
3. Check the **Actions** tab to confirm build completed successfully

### ❌ PWA Won't Install
**Error**: "Install" button doesn't appear

**Solution**:
1. The `manifest.json` is already configured
2. Make sure you're accessing via HTTPS (GitHub Pages is always HTTPS)
3. Try opening in a fresh incognito window
4. On Android, ensure Chrome is up to date

---

## Step 6: Making Changes and Auto-Deploying

Every time you push code to `main` or `phase-1-veltrion`:

```bash
# Make changes to frontend code
nano frontend/src/pages/Home.jsx

# Commit and push
git add .
git commit -m "Update Home dashboard styling"
git push origin phase-1-veltrion
```

The GitHub Actions workflow will automatically:
1. Detect the push
2. Build the application
3. Deploy to GitHub Pages
4. Your changes appear live at the URL within ~2-3 minutes

---

## Step 7: Production Checklist

- [ ] Supabase project created and running
- [ ] Database schema imported (via `database/schema.sql`)
- [ ] Admin user created in Supabase Auth
- [ ] Admin user record inserted into `admin_users` table
- [ ] `VITE_SUPABASE_URL` added as GitHub secret
- [ ] `VITE_SUPABASE_ANON_KEY` added as GitHub secret
- [ ] GitHub Pages enabled with GitHub Actions source
- [ ] Workflow run succeeded (green checkmark in Actions tab)
- [ ] App accessible at `https://Cyrrenza-v2.github.io/Sendbox-money-profit/`
- [ ] Login works with admin credentials
- [ ] Dashboard displays $100,000 virtual capital
- [ ] Navigation sidebar works on mobile
- [ ] PWA installs on phone

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Developer pushes code to GitHub (main or phase-1-veltrion)  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────────┐
                  │  GitHub Actions    │
                  │  Workflow Triggered│
                  └────────┬───────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
       ┌────────┐   ┌────────┐   ┌──────────────┐
       │Checkout│   │  npm   │   │Pull Secrets  │
       │  Code  │   │install │   │from GitHub   │
       └────────┘   └────────┘   └──────────────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
                           ▼
                  ┌────────────────────┐
                  │ npm run build      │
                  │ (Vite compiles)    │
                  └────────┬───────────┘
                           │
                           ▼
                  ┌────────────────────┐
                  │ Upload /dist/      │
                  │ to Pages artifact  │
                  └────────┬───────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │  GitHub Pages                       │
         │  URL: ...github.io/Sendbox-...     │
         │  (🌍 Live & Accessible)             │
         └─────────────────────────────────────┘
```

---

## Security Notes

⚠️ **Important Security Practices**:

1. **Never commit `.env.local`** — It's in `.gitignore` by default
2. **Only use anon key in frontend** — Service role key stays backend-only
3. **Supabase RLS policies enforce authorization** — Users can only access their own data
4. **GitHub Secrets are encrypted** — Not visible in workflow logs
5. **GitHub Pages uses HTTPS** — All connections are encrypted

---

## Next Steps

- Monitor GitHub Actions for successful deployments
- Test login and dashboard on multiple devices
- Set up continuous integration for Phase 2 features
- Plan Phase 2 deployment (trading, MT5, Deriv integration)

