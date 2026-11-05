-- MindGuide AI: privacy and security hardening (run once in Supabase → SQL Editor).
-- 1) Therapists must use two-factor login (aal2) before they can read patient data.
-- 2) Access log: records who viewed which sensitive records.

-- 1. Two-factor for staff -------------------------------------------------------
-- True for patients; for therapists and admins only when they signed in with their code.
create or replace function public.mfa_ok()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role::text from profiles where id = auth.uid()), 'patient') not in ('therapist', 'admin')
      or coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

create or replace function public.has_consent(p uuid, t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.mfa_ok() and exists (select 1 from consents where patient_id = p and therapist_id = t and granted);
$$;

create or replace function public.has_relationship(p uuid, t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.mfa_ok() and exists (
    select 1 from appointments
    where patient_id = p and therapist_id = t and status in ('requested','accepted','completed')
  );
$$;

drop policy if exists "appointment parties read" on appointments;
create policy "appointment parties read" on appointments for select
  using (patient_id = auth.uid() or (therapist_id = auth.uid() and public.mfa_ok()) or public.is_admin());
drop policy if exists "parties update" on appointments;
create policy "parties update" on appointments for update
  using (patient_id = auth.uid() or (therapist_id = auth.uid() and public.mfa_ok()) or public.is_admin());

drop policy if exists "consent parties read" on consents;
create policy "consent parties read" on consents for select
  using (patient_id = auth.uid() or (therapist_id = auth.uid() and public.mfa_ok()) or public.is_admin());

drop policy if exists "message parties read" on messages;
create policy "message parties read" on messages for select
  using (patient_id = auth.uid() or (therapist_id = auth.uid() and public.mfa_ok()));
drop policy if exists "message parties send" on messages;
create policy "message parties send" on messages for insert
  with check (sender_id = auth.uid() and (patient_id = auth.uid() or (therapist_id = auth.uid() and public.mfa_ok()))
    and public.has_relationship(patient_id, therapist_id));
drop policy if exists "message mark read" on messages;
create policy "message mark read" on messages for update
  using (patient_id = auth.uid() or (therapist_id = auth.uid() and public.mfa_ok()));

drop policy if exists "therapist own notes" on session_notes;
create policy "therapist own notes" on session_notes for all
  using (therapist_id = auth.uid() and public.mfa_ok())
  with check (therapist_id = auth.uid() and public.mfa_ok()
    and exists (select 1 from appointments a where a.id = appointment_id and a.therapist_id = auth.uid()));

drop policy if exists "call parties read" on calls;
drop policy if exists "call parties update" on calls;
drop policy if exists "signal parties read" on call_signals;
drop policy if exists "signal parties send" on call_signals;
create policy "call parties read" on calls for select using (((caller_id = auth.uid() or callee_id = auth.uid()) and public.mfa_ok()) or public.is_admin());
create policy "call parties update" on calls for update using ((caller_id = auth.uid() or callee_id = auth.uid()) and public.mfa_ok());
create policy "signal parties read" on call_signals for select
  using (public.mfa_ok() and exists (select 1 from calls c where c.id = call_id and (c.caller_id = auth.uid() or c.callee_id = auth.uid())));
create policy "signal parties send" on call_signals for insert
  with check (sender_id = auth.uid() and public.mfa_ok() and exists (
    select 1 from calls c where c.id = call_id and c.status in ('ringing','ongoing') and (c.caller_id = auth.uid() or c.callee_id = auth.uid())));

-- 2. Access log ---------------------------------------------------------------
create table if not exists record_access_log (
  id bigint generated always as identity primary key,
  viewer_id uuid references profiles(id) on delete set null,
  viewer_role text,
  subject_id uuid references profiles(id) on delete set null,  -- whose information was viewed
  record text not null,                                        -- e.g. 'patient_details', 'session_notes'
  record_id text,
  created_at timestamptz not null default now()
);
create index if not exists record_access_log_created on record_access_log (created_at desc);
create index if not exists record_access_log_subject on record_access_log (subject_id, created_at desc);
alter table record_access_log enable row level security;
drop policy if exists "access log admin read" on record_access_log;
create policy "access log admin read" on record_access_log for select using (public.is_admin());
-- Rows are written by the server only (service role).
