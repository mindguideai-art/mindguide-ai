-- Lets an event send people to an outside registration form (e.g. Google Forms).
-- Run once in the Supabase SQL editor, after 2026-11-06-events-gallery.sql. Safe to run again.
alter table community_events add column if not exists registration_url text;
