-- VELTRION Phase 8 canonical schema. Existing tables are preserved; risk_limits is an existing metric/value table.
create table if not exists public.system_health (
  id uuid primary key default gen_random_uuid(), service_name text not null unique,
  status text not null default 'UNKNOWN' check (status in ('HEALTHY','DEGRADED','OFFLINE','UNKNOWN')),
  last_heartbeat timestamptz not null default timezone('utc', now()), metadata jsonb
);
create table if not exists public.emergency_controls (
  id uuid primary key default gen_random_uuid(), control_key text not null unique,
  is_active boolean not null default true, updated_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.system_alerts (
  id uuid primary key default gen_random_uuid(), severity text not null default 'INFO' check (severity in ('INFO','WARNING','CRITICAL')),
  title text not null, message text not null, is_resolved boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.system_health enable row level security;
alter table public.emergency_controls enable row level security;
alter table public.system_alerts enable row level security;

insert into public.system_health(service_name,status,metadata) values
 ('API Gateway','HEALTHY','{"source":"veltrion"}'::jsonb),
 ('Supabase Database','HEALTHY','{"source":"supabase"}'::jsonb),
 ('Authentication Engine','HEALTHY','{"source":"supabase-auth"}'::jsonb),
 ('Deriv Market Data','HEALTHY','{"source":"deriv"}'::jsonb),
 ('Reconciliation Worker','HEALTHY','{"schedule":"5m"}'::jsonb)
on conflict (service_name) do nothing;

insert into public.emergency_controls(control_key,is_active) values
 ('SANDBOX_TRADING',true),('REAL_TRADING',false),('MT5_TRADING',false),('EMERGENCY_STOP',true)
on conflict (control_key) do nothing;

-- The existing risk_limits table uses metric/limit_value rows. Seed the Phase 8 defaults idempotently.
insert into public.risk_limits(user_id,risk_profile_id,metric,limit_value,period,enabled)
select null,null,v.metric,v.limit_value,v.period,true from (values
 ('MAX_ORDER_SIZE',500::numeric,'PER_ORDER'),('MAX_OPEN_POSITIONS',10::numeric,'GLOBAL'),
 ('MAX_DAILY_LOSS',250::numeric,'DAILY'),('MAX_TOTAL_EXPOSURE',1000::numeric,'GLOBAL')) v(metric,limit_value,period)
where not exists (select 1 from public.risk_limits r where r.user_id is null and r.metric=v.metric);
