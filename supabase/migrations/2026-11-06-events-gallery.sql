-- Events, event registrations and the photo gallery.
-- Run once in the Supabase SQL editor. Safe to run again.

-- 1. Events --------------------------------------------------------------------
create table if not exists community_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,                                   -- one or two lines for the event card
  description text,                               -- full details (plain text, line breaks kept)
  starts_at timestamptz not null,
  ends_at timestamptz,
  location_type text not null default 'online' check (location_type in ('online', 'in_person', 'hybrid')),
  venue text,                                     -- address for in-person events
  online_link text,                               -- only sent to people who register, never shown publicly
  image_path text,                                -- in the public 'event-images' bucket
  capacity int check (capacity is null or capacity > 0),
  registration_deadline timestamptz,
  registration_open boolean not null default true,
  custom_question text,                           -- optional extra question on the form
  custom_required boolean not null default false,
  is_published boolean not null default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_events_starts on community_events (starts_at);
alter table community_events enable row level security;
drop policy if exists "events admin all" on community_events;
create policy "events admin all" on community_events for all using (public.is_admin()) with check (public.is_admin());
-- The public website reads events through the app's server (/api/events), which never exposes online_link.

-- 2. Registrations -------------------------------------------------------------
create table if not exists event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references community_events(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  organisation text,
  custom_answer text,
  heard_from text,
  consent boolean not null default false,
  status text not null default 'registered' check (status in ('registered', 'attended', 'cancelled')),
  created_at timestamptz not null default now()
);
create unique index if not exists event_registrations_once on event_registrations (event_id, lower(email));
create index if not exists event_registrations_event on event_registrations (event_id, created_at desc);
alter table event_registrations enable row level security;
drop policy if exists "registrations admin all" on event_registrations;
create policy "registrations admin all" on event_registrations for all using (public.is_admin()) with check (public.is_admin());
-- New registrations are written by the server only (service role), after checks.

-- 3. Gallery -------------------------------------------------------------------
create table if not exists gallery_albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  taken_on date,
  event_id uuid references community_events(id) on delete set null,
  cover_path text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists gallery_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references gallery_albums(id) on delete cascade,
  image_path text not null,
  caption text,
  width int,
  height int,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists gallery_photos_album on gallery_photos (album_id, sort, created_at);
alter table gallery_albums enable row level security;
alter table gallery_photos enable row level security;
drop policy if exists "albums admin all" on gallery_albums;
drop policy if exists "albums public read" on gallery_albums;
drop policy if exists "photos admin all" on gallery_photos;
drop policy if exists "photos public read" on gallery_photos;
create policy "albums admin all" on gallery_albums for all using (public.is_admin()) with check (public.is_admin());
create policy "albums public read" on gallery_albums for select using (is_published);
create policy "photos admin all" on gallery_photos for all using (public.is_admin()) with check (public.is_admin());
create policy "photos public read" on gallery_photos for select
  using (exists (select 1 from gallery_albums a where a.id = album_id and a.is_published));

-- 4. Image storage (public buckets; only admins can upload or delete) -----------
insert into storage.buckets (id, name, public) values ('event-images', 'event-images', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true) on conflict do nothing;
drop policy if exists "event images admin write" on storage.objects;
drop policy if exists "event images admin delete" on storage.objects;
drop policy if exists "event images public read" on storage.objects;
drop policy if exists "gallery admin write" on storage.objects;
drop policy if exists "gallery admin delete" on storage.objects;
drop policy if exists "gallery public read" on storage.objects;
create policy "event images admin write" on storage.objects for insert with check (bucket_id = 'event-images' and public.is_admin());
create policy "event images admin delete" on storage.objects for delete using (bucket_id = 'event-images' and public.is_admin());
create policy "event images public read" on storage.objects for select using (bucket_id = 'event-images');
create policy "gallery admin write" on storage.objects for insert with check (bucket_id = 'gallery' and public.is_admin());
create policy "gallery admin delete" on storage.objects for delete using (bucket_id = 'gallery' and public.is_admin());
create policy "gallery public read" on storage.objects for select using (bucket_id = 'gallery');
