-- =====================================================================
-- Teletherapy platform – full database schema
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run
-- =====================================================================

-- gen_random_uuid() is built into Postgres 13+, no extension needed.

-- ---------- Enums ----------
create type user_role as enum ('patient', 'therapist', 'admin');
create type therapist_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type session_type as enum ('video', 'audio');
create type appointment_status as enum ('requested', 'accepted', 'rejected', 'cancelled', 'completed');
create type document_kind as enum ('licence', 'qualification', 'certification');
create type report_status as enum ('open', 'resolved');
create type risk_level as enum ('low', 'moderate', 'high');

-- ---------- Profiles (one row per auth user) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'patient',
  full_name text not null default '',
  email text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

-- ---------- Patient details (registration form) ----------
create table patient_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  age int not null check (age between 10 and 120),
  guardian_consent boolean not null default false,
  gender text,
  state text not null,
  city text not null,
  emotional_state int not null check (emotional_state between 1 and 10),
  concerns text[] not null default '{}',
  previous_support boolean not null,
  previous_support_details text,
  check (previous_support = false or length(coalesce(previous_support_details, '')) > 0),
  support_areas text[] not null default '{}',
  preferred_support text not null default 'either' check (preferred_support in ('video','audio','either')),
  created_at timestamptz not null default now()
);

-- ---------- Therapist details ----------
create table therapist_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  status therapist_status not null default 'pending',
  title text,
  bio text,
  photo_url text,
  specialties text[] not null default '{}',
  languages text[] not null default '{English}',
  years_experience int not null default 0,
  session_price int not null default 0,          -- naira per session (therapist earnings)
  session_minutes int not null default 50,
  licence_number text,
  rejection_reason text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table therapist_documents (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references therapist_profiles(id) on delete cascade,
  kind document_kind not null,
  title text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

-- Weekly availability (0 = Sunday … 6 = Saturday), times in Africa/Lagos
create table availability (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references therapist_profiles(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

create table blocked_dates (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references therapist_profiles(id) on delete cascade,
  day date not null,
  unique (therapist_id, day)
);

-- ---------- Appointments ----------
create table appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  therapist_id uuid not null references therapist_profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  type session_type not null default 'video',
  status appointment_status not null default 'requested',
  room_name text not null default ('session-' || replace(gen_random_uuid()::text, '-', '')),
  patient_note text,
  status_reason text,
  cancelled_by uuid references profiles(id),
  rescheduled_from timestamptz,
  therapist_fee int not null default 0,
  payout_status text not null default 'unpaid' check (payout_status in ('unpaid','paid')),
  reminder_24h_sent boolean not null default false,
  reminder_1h_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on appointments (therapist_id, starts_at);
create index on appointments (patient_id, starts_at);
-- Prevent double-booking an active slot for a therapist
create unique index appointments_no_double_booking
  on appointments (therapist_id, starts_at)
  where status in ('requested','accepted');

-- ---------- Consent: patient allows a therapist to see their details ----------
create table consents (
  patient_id uuid not null references profiles(id) on delete cascade,
  therapist_id uuid not null references therapist_profiles(id) on delete cascade,
  granted boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (patient_id, therapist_id)
);

-- ---------- Secure messaging ----------
create table messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  therapist_id uuid not null references therapist_profiles(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on messages (patient_id, therapist_id, created_at);

-- ---------- AI assessment & progress ----------
create table assessments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  answers jsonb not null,
  mood_score int not null,        -- 0–6 (PHQ-2 style)
  anxiety_score int not null,     -- 0–6 (GAD-2 style)
  total_score int not null,
  risk risk_level not null default 'low',
  summary text,
  recommended_specialties text[] not null default '{}',
  recommended_support text,
  created_at timestamptz not null default now()
);
create index on assessments (patient_id, created_at);

create table mood_checkins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  mood int not null check (mood between 1 and 10),
  note text,
  created_at timestamptz not null default now()
);
create index on mood_checkins (patient_id, created_at);

-- ---------- Subscriptions & payments (Paystack) ----------
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  plan text not null check (plan in ('basic','standard','premium','family')),
  status text not null default 'pending' check (status in ('pending','active','cancelled','past_due')),
  paystack_customer_code text,
  paystack_subscription_code text,
  paystack_email_token text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on subscriptions (patient_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references profiles(id) on delete set null,
  reference text unique not null,
  plan text,
  amount_kobo bigint not null,
  status text not null default 'pending' check (status in ('pending','success','failed')),
  channel text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Reports & flagged concerns ----------
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  subject_id uuid references profiles(id) on delete set null,
  source text not null default 'user' check (source in ('user','ai')),
  reason text not null,
  details text,
  status report_status not null default 'open',
  resolved_by uuid references profiles(id),
  resolution_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ---------- Engagement events (logins, Telegram clicks, check-ins) ----------
create table events (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete set null,
  kind text not null,       -- 'login' | 'telegram_click' | 'checkin' | 'assessment' | 'session_join'
  created_at timestamptz not null default now()
);
create index on events (kind, created_at);

-- ---------- Admin-editable settings ----------
create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into settings (key, value) values
  ('telegram_link', '"https://t.me/+tdTz3hcagzkyNjQ0"'),
  ('cancellation_cutoff_hours', '24'),
  ('helplines', '[{"name":"Emergency services (Nigeria)","phone":"112"}]'),
  ('plans', '{"basic":{"name":"Basic","price":10000},"standard":{"name":"Standard","price":20000},"premium":{"name":"Premium","price":30000},"family":{"name":"Family","price":50000}}');

-- =====================================================================
-- Helper functions
-- =====================================================================
create or replace function public.current_role_is(r user_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = r and is_active);
$$;

-- Admins only get admin powers after entering their two-factor code (aal2).
-- An admin password on its own is not enough to read other people's data.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_is('admin') and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

create or replace function public.has_consent(p uuid, t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from consents where patient_id = p and therapist_id = t and granted);
$$;

-- Therapist and patient share an appointment (needed for profile lookups & messaging)
create or replace function public.has_relationship(p uuid, t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from appointments
    where patient_id = p and therapist_id = t and status in ('requested','accepted','completed')
  );
$$;

-- Create a profile row automatically when someone signs up.
-- Role comes from sign-up metadata but can never be 'admin' (admins are promoted manually).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r user_role;
begin
  r := case when new.raw_user_meta_data->>'role' = 'therapist' then 'therapist'::user_role else 'patient'::user_role end;
  insert into profiles (id, role, full_name, email, phone)
  values (new.id, r, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email, new.raw_user_meta_data->>'phone');
  if r = 'therapist' then
    insert into therapist_profiles (id) values (new.id);
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Stop users changing their own role or active flag
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.uid() is not null then
    new.role := old.role;
    new.is_active := old.is_active;
  end if;
  return new;
end;
$$;
create trigger protect_profile before update on profiles
  for each row execute function public.protect_profile_fields();

-- Stop therapists approving themselves
create or replace function public.protect_therapist_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.uid() is not null then
    new.status := old.status;
    new.approved_at := old.approved_at;
    new.rejection_reason := old.rejection_reason;
  end if;
  return new;
end;
$$;
create trigger protect_therapist before update on therapist_profiles
  for each row execute function public.protect_therapist_status();

-- Appointment rules: patients may only cancel/reschedule; therapists only accept/reject/complete/cancel
create or replace function public.guard_appointment_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if public.is_admin() or auth.uid() is null then
    return new;
  end if;
  -- fields nobody but admins/server may change
  new.patient_id := old.patient_id;
  new.therapist_id := old.therapist_id;
  new.therapist_fee := old.therapist_fee;
  new.payout_status := old.payout_status;
  new.room_name := old.room_name;
  if auth.uid() = old.patient_id then
    if new.status not in ('cancelled', old.status) then
      raise exception 'Patients can only cancel or reschedule';
    end if;
    if new.status = 'cancelled' then new.cancelled_by := auth.uid(); end if;
    if new.starts_at <> old.starts_at then
      new.status := 'requested';         -- reschedule needs fresh therapist approval
      new.rescheduled_from := old.starts_at;
    end if;
  elsif auth.uid() = old.therapist_id then
    new.starts_at := old.starts_at;
    new.ends_at := old.ends_at;
    if new.status = 'cancelled' then new.cancelled_by := auth.uid(); end if;
  end if;
  return new;
end;
$$;
create trigger guard_appointment before update on appointments
  for each row execute function public.guard_appointment_update();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table profiles enable row level security;
alter table patient_profiles enable row level security;
alter table therapist_profiles enable row level security;
alter table therapist_documents enable row level security;
alter table availability enable row level security;
alter table blocked_dates enable row level security;
alter table appointments enable row level security;
alter table consents enable row level security;
alter table messages enable row level security;
alter table assessments enable row level security;
alter table mood_checkins enable row level security;
alter table subscriptions enable row level security;
alter table payments enable row level security;
alter table reports enable row level security;
alter table events enable row level security;
alter table settings enable row level security;

-- profiles
create policy "own profile" on profiles for select using (id = auth.uid() or public.is_admin());
create policy "therapist names are public" on profiles for select
  using (exists (select 1 from therapist_profiles t where t.id = profiles.id and t.status = 'approved'));
create policy "therapist sees own patients" on profiles for select
  using (public.has_relationship(profiles.id, auth.uid()));
create policy "update own profile" on profiles for update using (id = auth.uid() or public.is_admin());

-- patient_profiles
create policy "patient reads own" on patient_profiles for select using (id = auth.uid() or public.is_admin());
create policy "therapist reads with consent" on patient_profiles for select
  using (public.has_consent(id, auth.uid()));
create policy "patient inserts own" on patient_profiles for insert with check (id = auth.uid());
create policy "patient updates own" on patient_profiles for update using (id = auth.uid());

-- therapist_profiles
create policy "approved therapists are public" on therapist_profiles for select
  using (status = 'approved' or id = auth.uid() or public.is_admin());
create policy "therapist updates own" on therapist_profiles for update using (id = auth.uid() or public.is_admin());

-- therapist_documents (private)
create policy "docs owner or admin" on therapist_documents for select using (therapist_id = auth.uid() or public.is_admin());
create policy "docs owner insert" on therapist_documents for insert with check (therapist_id = auth.uid());
create policy "docs owner delete" on therapist_documents for delete using (therapist_id = auth.uid());

-- availability & blocked dates
create policy "availability readable" on availability for select using (true);
create policy "availability owner write" on availability for all using (therapist_id = auth.uid()) with check (therapist_id = auth.uid());
create policy "blocked readable" on blocked_dates for select using (true);
create policy "blocked owner write" on blocked_dates for all using (therapist_id = auth.uid()) with check (therapist_id = auth.uid());

-- appointments
create policy "appointment parties read" on appointments for select
  using (patient_id = auth.uid() or therapist_id = auth.uid() or public.is_admin());
create policy "patient books" on appointments for insert
  with check (patient_id = auth.uid() and status = 'requested'
    and exists (select 1 from therapist_profiles t where t.id = therapist_id and t.status = 'approved'));
create policy "parties update" on appointments for update
  using (patient_id = auth.uid() or therapist_id = auth.uid() or public.is_admin());

-- consents
create policy "consent parties read" on consents for select using (patient_id = auth.uid() or therapist_id = auth.uid() or public.is_admin());
create policy "patient manages consent" on consents for all using (patient_id = auth.uid()) with check (patient_id = auth.uid());

-- messages
create policy "message parties read" on messages for select using (patient_id = auth.uid() or therapist_id = auth.uid());
create policy "message parties send" on messages for insert
  with check (sender_id = auth.uid() and (patient_id = auth.uid() or therapist_id = auth.uid())
    and public.has_relationship(patient_id, therapist_id));
create policy "message mark read" on messages for update using (patient_id = auth.uid() or therapist_id = auth.uid());

-- assessments & mood
create policy "assessment own" on assessments for select
  using (patient_id = auth.uid() or public.is_admin() or public.has_consent(patient_id, auth.uid()));
create policy "mood own read" on mood_checkins for select
  using (patient_id = auth.uid() or public.has_consent(patient_id, auth.uid()));
create policy "mood own insert" on mood_checkins for insert with check (patient_id = auth.uid());

-- subscriptions & payments (written by the server only)
create policy "subscription own" on subscriptions for select using (patient_id = auth.uid() or public.is_admin());
create policy "payment own" on payments for select using (patient_id = auth.uid() or public.is_admin());

-- reports
create policy "report insert" on reports for insert with check (reporter_id = auth.uid());
create policy "report read" on reports for select using (reporter_id = auth.uid() or public.is_admin());
create policy "report admin update" on reports for update using (public.is_admin());

-- events
create policy "event insert own" on events for insert with check (user_id = auth.uid());
create policy "event admin read" on events for select using (public.is_admin());

-- settings
create policy "settings readable" on settings for select using (true);
create policy "settings admin write" on settings for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Storage buckets
-- =====================================================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('therapist-docs', 'therapist-docs', false) on conflict do nothing;

create policy "avatar upload own folder" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatar update own folder" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');

create policy "docs upload own folder" on storage.objects for insert
  with check (bucket_id = 'therapist-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "docs read own or admin" on storage.objects for select
  using (bucket_id = 'therapist-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "docs delete own" on storage.objects for delete
  using (bucket_id = 'therapist-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- Realtime for chat
alter publication supabase_realtime add table messages;

-- =====================================================================
-- Calls, notifications, reviews, session notes
-- =====================================================================
alter table profiles add column notify_email boolean not null default true;
alter table profiles add column notify_sms boolean not null default true;
alter table therapist_profiles add column rating_avg numeric(3,2) not null default 0;
alter table therapist_profiles add column rating_count int not null default 0;

-- Video and voice calls (built-in WebRTC). Appointment sessions and calls started from chat both live here.
create table calls (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete set null,
  patient_id uuid not null references profiles(id) on delete cascade,
  therapist_id uuid not null references therapist_profiles(id) on delete cascade,
  caller_id uuid not null references profiles(id) on delete cascade,
  callee_id uuid not null references profiles(id) on delete cascade,
  type session_type not null default 'video',
  status text not null default 'ringing' check (status in ('ringing','ongoing','ended','declined','missed','cancelled')),
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  ended_at timestamptz
);
create index on calls (callee_id, status, created_at);
create unique index calls_one_live_per_appointment on calls (appointment_id) where status in ('ringing','ongoing');

-- Signaling messages exchanged while a call connects (offer, answer, network candidates)
create table call_signals (
  id bigint generated always as identity primary key,
  call_id uuid not null references calls(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  from_session text not null,
  to_session text,
  kind text not null check (kind in ('hello','offer','answer','ice','bye')),
  payload jsonb,
  created_at timestamptz not null default now()
);
create index on call_signals (call_id, id);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on notifications (user_id, created_at desc);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references appointments(id) on delete cascade,
  patient_id uuid not null references profiles(id) on delete cascade,
  therapist_id uuid not null references therapist_profiles(id) on delete cascade,
  display_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text check (length(comment) <= 1500),
  created_at timestamptz not null default now()
);
create index on reviews (therapist_id, created_at desc);

-- Private notes a therapist keeps for each session. Patients and admins cannot read them.
create table session_notes (
  appointment_id uuid primary key references appointments(id) on delete cascade,
  therapist_id uuid not null references therapist_profiles(id) on delete cascade,
  body text not null default '',
  updated_at timestamptz not null default now()
);

create or replace function public.refresh_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare t uuid := coalesce(new.therapist_id, old.therapist_id);
begin
  update therapist_profiles set
    rating_avg = coalesce((select round(avg(rating)::numeric, 2) from reviews where therapist_id = t), 0),
    rating_count = (select count(*) from reviews where therapist_id = t)
  where id = t;
  return null;
end;
$$;
create trigger reviews_refresh_rating after insert or update or delete on reviews
  for each row execute function public.refresh_rating();

alter table calls enable row level security;
alter table call_signals enable row level security;
alter table notifications enable row level security;
alter table reviews enable row level security;
alter table session_notes enable row level security;

create policy "call parties read" on calls for select using (caller_id = auth.uid() or callee_id = auth.uid() or public.is_admin());
create policy "call parties update" on calls for update using (caller_id = auth.uid() or callee_id = auth.uid());
create policy "signal parties read" on call_signals for select
  using (exists (select 1 from calls c where c.id = call_id and (c.caller_id = auth.uid() or c.callee_id = auth.uid())));
create policy "signal parties send" on call_signals for insert
  with check (sender_id = auth.uid() and exists (
    select 1 from calls c where c.id = call_id and c.status in ('ringing','ongoing') and (c.caller_id = auth.uid() or c.callee_id = auth.uid())));

create policy "own notifications" on notifications for select using (user_id = auth.uid());
create policy "mark own notifications" on notifications for update using (user_id = auth.uid());

create policy "reviews are public" on reviews for select using (true);
create policy "patient reviews own completed session" on reviews for insert
  with check (patient_id = auth.uid() and exists (
    select 1 from appointments a where a.id = appointment_id and a.patient_id = auth.uid()
      and a.therapist_id = reviews.therapist_id and a.status = 'completed'));

create policy "therapist own notes" on session_notes for all
  using (therapist_id = auth.uid()) with check (therapist_id = auth.uid()
    and exists (select 1 from appointments a where a.id = appointment_id and a.therapist_id = auth.uid()));

-- Call parties may only move a call through its states, never change who is on it
create or replace function public.guard_call_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.patient_id := old.patient_id; new.therapist_id := old.therapist_id;
    new.caller_id := old.caller_id; new.callee_id := old.callee_id;
    new.appointment_id := old.appointment_id; new.type := old.type; new.created_at := old.created_at;
    if old.status in ('ended','declined','missed','cancelled') then new.status := old.status; end if;
  end if;
  return new;
end;
$$;
create trigger guard_call before update on calls for each row execute function public.guard_call_update();

alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table calls;

-- =====================================================================
-- Make yourself an admin (run after signing up with your email):
--   update profiles set role = 'admin' where email = 'you@example.com';
-- =====================================================================
create table if not exists assistant_messages (
  id bigint generated always as identity primary key,
  channel text not null default 'whatsapp',
  contact text not null,            -- WhatsApp number (wa_id)
  role text not null check (role in ('user','assistant')),
  content text not null,
  wa_message_id text unique,        -- stops the same WhatsApp message being answered twice
  created_at timestamptz not null default now()
);
create index if not exists assistant_messages_contact on assistant_messages (channel, contact, created_at desc);
alter table assistant_messages enable row level security;
-- No policies: only the server (service role) can read or write these rows.
