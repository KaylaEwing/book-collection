-- Minimal stand-ins for the parts of Supabase that schema.sql depends on.
-- Supabase provides these in a real project; this file recreates just enough
-- of them to run the schema against a plain Postgres database, so the SQL can
-- be checked before it is pasted into the Supabase dashboard.
--
-- This file is for testing only. It is never run against the real project.

create schema if not exists auth;
create schema if not exists storage;

-- Supabase's account table. Only the columns schema.sql touches are needed.
create table if not exists auth.users (
  id                  uuid primary key default gen_random_uuid(),
  email               text unique,
  raw_user_meta_data  jsonb default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

-- In Supabase auth.uid() reads the id out of the request's JWT. Here it reads
-- a session setting instead, so a test can say "run as this user".
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create table if not exists storage.buckets (
  id      text primary key,
  name    text not null,
  public  boolean not null default false
);

create table if not exists storage.objects (
  id         uuid primary key default gen_random_uuid(),
  bucket_id  text references storage.buckets (id),
  name       text not null,
  owner      uuid,
  created_at timestamptz not null default now()
);

-- Supabase ships storage.objects with Row Level Security already switched on,
-- which is why schema.sql only needs to add policies to it. A plain Postgres
-- database does not, so enable it here to match the real thing. Without this
-- line the cover policies would appear to pass while allowing anything.
alter table storage.objects enable row level security;

-- Splits an object path into its folder parts, as Supabase does. The policies
-- use element 1 to check that a file sits in a folder named after the user id.
create or replace function storage.foldername(name text)
returns text[]
language sql
immutable
as $$
  select string_to_array(regexp_replace(name, '/[^/]*$', ''), '/');
$$;
