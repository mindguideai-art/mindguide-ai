-- MindGuide Assistant on WhatsApp: keeps a short conversation history per WhatsApp number.
-- Run once in Supabase → SQL Editor (already included in schema.sql for new projects).
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
