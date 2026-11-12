-- One-off first session (₦5,000 by default, set in Admin → Settings).
-- Lets someone who has never had a plan meet a therapist once before choosing a monthly plan.
-- Run once in Supabase → SQL Editor. Safe to run more than once.
create table if not exists session_credits (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  quantity int not null check (quantity between 1 and 50),
  source text not null default 'purchase' check (source in ('purchase', 'admin', 'organisation')),
  payment_reference text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists session_credits_patient on session_credits (patient_id, expires_at);
alter table session_credits enable row level security;
drop policy if exists "credits own read" on session_credits;
create policy "credits own read" on session_credits for select using (patient_id = auth.uid() or public.is_admin());
alter table appointments add column if not exists credit_id uuid references session_credits(id) on delete set null;

notify pgrst, 'reload schema';
