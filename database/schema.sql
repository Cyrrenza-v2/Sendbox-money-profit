-- ============================================
-- VELTRION Phase 1: Database Schema
-- ============================================
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. Admin Users Table
-- ============================================
create table if not exists public.admin_users (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null unique,
    role text not null default 'OWNER_ADMIN',
    status text not null default 'ACTIVE',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    last_login_at timestamp with time zone
);

comment on table public.admin_users is 'Master admin user registry with strict access control';
comment on column public.admin_users.role is 'Role: OWNER_ADMIN, SYSTEM_ADMIN, TRADER_ADMIN';
comment on column public.admin_users.status is 'Status: ACTIVE, SUSPENDED, REVOKED';

-- ============================================
-- 2. Sandbox Accounts Table
-- ============================================
create table if not exists public.sandbox_accounts (
    id uuid default uuid_generate_v4() primary key,
    admin_id uuid references public.admin_users(id) on delete cascade not null,
    account_number text not null unique default 'VEL-SBX-001',
    currency text not null default 'USD',
    starting_balance numeric(15, 2) not null default 100000.00,
    balance numeric(15, 2) not null default 100000.00,
    equity numeric(15, 2) not null default 100000.00,
    realized_profit numeric(15, 2) not null default 0.00,
    unrealized_profit numeric(15, 2) not null default 0.00,
    status text not null default 'ACTIVE',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.sandbox_accounts is 'Virtual trading accounts for testing and paper trading';
comment on column public.sandbox_accounts.account_number is 'Unique account identifier';
comment on column public.sandbox_accounts.balance is 'Current account balance';
comment on column public.sandbox_accounts.equity is 'Current account equity (balance + unrealized P/L)';

-- ============================================
-- 3. User Sessions / Device Tracking Table
-- ============================================
create table if not exists public.user_sessions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    device_info text not null,
    status text not null default 'ACTIVE',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.user_sessions is 'Track all active user sessions and device information';
comment on column public.user_sessions.device_info is 'User agent / device fingerprint';
comment on column public.user_sessions.status is 'Status: ACTIVE, TERMINATED';

-- ============================================
-- 4. Audit Logs Table
-- ============================================
create table if not exists public.audit_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete set null,
    action text not null,
    actor_role text not null,
    status text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.audit_logs is 'Complete immutable audit trail of all system actions';
comment on column public.audit_logs.action is 'Action type: LOGIN, TRADE, WITHDRAWAL, CONFIGURATION_CHANGE, etc.';
comment on column public.audit_logs.actor_role is 'Role of the actor performing the action';
comment on column public.audit_logs.status is 'Status: SUCCESS, FAILED, BLOCKED';

-- ============================================
-- 5. Enable Row Level Security (RLS)
-- ============================================
alter table public.admin_users enable row level security;
alter table public.sandbox_accounts enable row level security;
alter table public.user_sessions enable row level security;
alter table public.audit_logs enable row level security;

-- ============================================
-- 6. RLS Policies
-- ============================================

-- Admin Users: Only authorized admin can read their own record
drop policy if exists "Allow individual admin read access" on public.admin_users;
create policy "Allow individual admin read access" on public.admin_users
    for select using (auth.uid() = user_id and status = 'ACTIVE');

-- Sandbox Accounts: Admin can read their associated sandbox accounts
drop policy if exists "Allow individual sandbox access" on public.sandbox_accounts;
create policy "Allow individual sandbox access" on public.sandbox_accounts
    for select using (
        admin_id in (
            select id from public.admin_users 
            where user_id = auth.uid() and status = 'ACTIVE'
        )
    );

-- User Sessions: User can manage their own sessions
drop policy if exists "Allow session management" on public.user_sessions;
create policy "Allow session management" on public.user_sessions
    for all using (user_id = auth.uid());

-- Audit Logs: User can view their own audit logs
drop policy if exists "Allow audit log creation and viewing" on public.audit_logs;
create policy "Allow audit log creation and viewing" on public.audit_logs
    for all using (user_id = auth.uid());

-- ============================================
-- 7. Indexes for Performance
-- ============================================
create index if not exists idx_admin_users_user_id on public.admin_users(user_id);
create index if not exists idx_sandbox_accounts_admin_id on public.sandbox_accounts(admin_id);
create index if not exists idx_user_sessions_user_id on public.user_sessions(user_id);
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at);

-- ============================================
-- 8. Triggers for Automatic Timestamps
-- ============================================
create or replace function update_timestamp()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists sandbox_accounts_timestamp on public.sandbox_accounts;
create trigger sandbox_accounts_timestamp
    before update on public.sandbox_accounts
    for each row
    execute function update_timestamp();
