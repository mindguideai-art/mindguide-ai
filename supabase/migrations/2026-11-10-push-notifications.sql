-- Phone and computer alerts (web push). Run once in the Supabase SQL editor. Safe to run again.
-- Supabase may warn about "destructive operations": that is only the "drop policy if exists" lines,
-- which remove a rule and immediately recreate it. No data is deleted.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  device text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists push_subscriptions_user on push_subscriptions (user_id);
alter table push_subscriptions enable row level security;
drop policy if exists "push own read" on push_subscriptions;
drop policy if exists "push own delete" on push_subscriptions;
create policy "push own read" on push_subscriptions for select using (user_id = auth.uid());
create policy "push own delete" on push_subscriptions for delete using (user_id = auth.uid());
-- Saving a device goes through the app's server, which checks who is signed in.
