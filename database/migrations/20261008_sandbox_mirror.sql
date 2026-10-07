-- VELTRION: separate demo and real-account mirror sandboxes.
-- Simulated balances are never real broker funds and never feed the real profit wallet.
alter table public.sandbox_accounts add column if not exists sandbox_type text not null default 'demo';
update public.sandbox_accounts set sandbox_type='demo' where sandbox_type is null or sandbox_type='';
alter table public.sandbox_accounts drop constraint if exists sandbox_accounts_user_id_key;
alter table public.sandbox_accounts add constraint sandbox_accounts_user_type_key unique(user_id,sandbox_type);
