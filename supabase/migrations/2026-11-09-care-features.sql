-- Care features: risk flags, session summaries, private feedback, language & faith matching,
-- WhatsApp check-ins, journal, programmes and organisation plans.
-- Run once in the Supabase SQL editor (after the earlier migrations). Safe to run again.
-- Supabase may warn about "destructive operations": that is only the "drop policy if exists" /
-- "drop constraint if exists" lines, which remove a rule and immediately recreate it. No data is deleted.

-- 1. Therapist risk flags -------------------------------------------------------
alter table reports drop constraint if exists reports_source_check;
alter table reports add constraint reports_source_check check (source in ('user', 'ai', 'therapist'));
alter table reports add column if not exists risk_level text check (risk_level in ('low', 'medium', 'high', 'immediate'));
alter table reports add column if not exists action_taken text;
drop policy if exists "therapist flags own patients" on reports;
create policy "therapist flags own patients" on reports for insert
  with check (reporter_id = auth.uid() and source = 'therapist' and public.has_relationship(subject_id, auth.uid()));

-- 2. Session summaries shared with the patient ------------------------------------
create table if not exists session_summaries (
  appointment_id uuid primary key references appointments(id) on delete cascade,
  therapist_id uuid not null references therapist_profiles(id) on delete cascade,
  patient_id uuid not null references profiles(id) on delete cascade,
  summary text not null default '' check (length(summary) <= 4000),
  homework text[] not null default '{}',
  shared_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table session_summaries enable row level security;
drop policy if exists "therapist own summaries" on session_summaries;
drop policy if exists "patient reads shared summaries" on session_summaries;
create policy "therapist own summaries" on session_summaries for all
  using (therapist_id = auth.uid() and public.mfa_ok()) with check (therapist_id = auth.uid() and public.mfa_ok());
create policy "patient reads shared summaries" on session_summaries for select
  using (patient_id = auth.uid() and shared_at is not null);

-- 3. Private session feedback (seen by the MindGuide team only) ---------------------
create table if not exists session_feedback (
  appointment_id uuid primary key references appointments(id) on delete cascade,
  patient_id uuid not null references profiles(id) on delete cascade,
  therapist_id uuid not null references therapist_profiles(id) on delete cascade,
  overall int not null check (overall between 1 and 5),
  felt_heard int check (felt_heard between 1 and 5),
  connection text check (connection in ('good', 'some_issues', 'poor')),
  would_continue text check (would_continue in ('yes', 'not_sure', 'no')),
  private_comment text check (length(private_comment) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists session_feedback_therapist on session_feedback (therapist_id, created_at desc);
alter table session_feedback enable row level security;
drop policy if exists "feedback own insert" on session_feedback;
drop policy if exists "feedback read" on session_feedback;
create policy "feedback own insert" on session_feedback for insert with check (
  patient_id = auth.uid() and exists (select 1 from appointments a where a.id = appointment_id and a.patient_id = auth.uid() and a.status = 'completed'));
create policy "feedback read" on session_feedback for select using (patient_id = auth.uid() or public.is_admin());

-- 4. Language and faith preferences ---------------------------------------------------
alter table patient_profiles add column if not exists preferred_languages text[] not null default '{}';
alter table patient_profiles add column if not exists faith_preference text not null default 'none';
alter table patient_profiles drop constraint if exists patient_profiles_faith_check;
alter table patient_profiles add constraint patient_profiles_faith_check check (faith_preference in ('none', 'christian', 'muslim'));
alter table therapist_profiles add column if not exists faith_integration text[] not null default '{}';

-- 6. WhatsApp reminders and weekly check-ins ------------------------------------------
alter table patient_profiles add column if not exists whatsapp_opt_in boolean not null default false;
alter table patient_profiles add column if not exists whatsapp_number text;
create table if not exists whatsapp_checkins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  sent_at timestamptz not null default now(),
  answered_at timestamptz,
  mood int check (mood between 1 and 10)
);
create index if not exists whatsapp_checkins_patient on whatsapp_checkins (patient_id, sent_at desc);
alter table whatsapp_checkins enable row level security;
drop policy if exists "wa checkins own read" on whatsapp_checkins;
create policy "wa checkins own read" on whatsapp_checkins for select using (patient_id = auth.uid() or public.is_admin());

-- 7. Private journal and worksheets (only the patient can read these) -------------------
create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  kind text not null default 'journal' check (kind in ('journal', 'thought_record', 'gratitude', 'reflection')),
  title text check (length(title) <= 200),
  body jsonb not null default '{}',
  mood int check (mood between 1 and 10),
  created_at timestamptz not null default now()
);
create index if not exists journal_entries_patient on journal_entries (patient_id, created_at desc);
alter table journal_entries enable row level security;
drop policy if exists "journal own" on journal_entries;
create policy "journal own" on journal_entries for all using (patient_id = auth.uid()) with check (patient_id = auth.uid());

-- 8. Programmes (the content lives in the app; this stores review status and progress) ---
create table if not exists programme_status (
  slug text primary key,
  is_published boolean not null default false,
  reviewed_by text,
  reviewed_at timestamptz
);
alter table programme_status enable row level security;
drop policy if exists "programme status read" on programme_status;
drop policy if exists "programme status admin" on programme_status;
create policy "programme status read" on programme_status for select using (true);
create policy "programme status admin" on programme_status for all using (public.is_admin()) with check (public.is_admin());

create table if not exists programme_enrolments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  slug text not null,
  started_at timestamptz not null default now(),
  completed_weeks int[] not null default '{}',
  finished_at timestamptz,
  unique (patient_id, slug)
);
alter table programme_enrolments enable row level security;
drop policy if exists "enrolment own" on programme_enrolments;
create policy "enrolment own" on programme_enrolments for all using (patient_id = auth.uid() or public.is_admin()) with check (patient_id = auth.uid());

-- 9. Organisation plans (companies, universities, churches, NGOs) -------------------------
create table if not exists organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'company' check (kind in ('company', 'university', 'school', 'faith', 'ngo', 'other')),
  plan text not null default 'standard' check (plan in ('basic', 'standard', 'premium')),
  seats int not null default 10 check (seats > 0),
  join_code text not null unique,
  contact_name text,
  contact_email text,
  starts_on date not null default current_date,
  ends_on date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists organisation_members (
  organisation_id uuid not null references organisations(id) on delete cascade,
  patient_id uuid not null unique references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (organisation_id, patient_id)
);
alter table organisations enable row level security;
alter table organisation_members enable row level security;
drop policy if exists "organisations admin" on organisations;
drop policy if exists "org members own read" on organisation_members;
create policy "organisations admin" on organisations for all using (public.is_admin()) with check (public.is_admin());
create policy "org members own read" on organisation_members for select using (patient_id = auth.uid() or public.is_admin());
alter table subscriptions add column if not exists organisation_id uuid references organisations(id) on delete set null;

-- 10. Crisis helplines shown in the "Get help now" panel (admins can edit in Settings) -----
insert into settings (key, value) values ('helplines', '[
  {"name": "Emergency services (police, fire, ambulance)", "phone": "112"},
  {"name": "Lagos State emergency line", "phone": "767"},
  {"name": "SURPIN suicide prevention line (24 hours, free)", "phone": "0800 078 7746"},
  {"name": "Mentally Aware Nigeria Initiative (MANI)", "phone": "0809 111 6264"},
  {"name": "She Writes Woman (24 hours, free)", "phone": "0800 800 2000"},
  {"name": "Cece Yara child helpline (children and teens, free)", "phone": "0800 800 8001"}
]'::jsonb)
on conflict (key) do update set value = excluded.value
  where settings.value::text = '[{"name": "Emergency services (Nigeria)", "phone": "112"}]';
