-- Book Collection database schema
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- ---------------------------------------------------------------------------
-- profiles: one row per account, holding the username shown in the navigation.
-- Supabase keeps the email and password in auth.users, which we never touch.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique check (char_length(username) between 3 and 30),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- books: one row per book. user_id ties every book to the account that owns it.
-- ---------------------------------------------------------------------------
create table if not exists public.books (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 200),
  author        text not null check (char_length(author) between 1 and 200),
  status        text not null default 'want' check (status in ('want', 'reading', 'read')),
  rating        smallint check (rating between 1 and 5),
  notes         text check (char_length(notes) <= 500),
  cover_url     text,
  cover_width   smallint,
  cover_height  smallint,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- The collection is always read newest-first for one user, so index that pair.
create index if not exists books_user_updated_idx
  on public.books (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- updated_at is maintained by the database so it can't be forgotten in code.
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists books_touch_updated_at on public.books;
create trigger books_touch_updated_at
  before update on public.books
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- When someone signs up, create their profile row from the username they gave.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security: the database itself refuses to return another person's
-- books, so a mistake in the application code cannot leak someone's data.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.books    enable row level security;

drop policy if exists "Profiles are readable by their owner" on public.profiles;
create policy "Profiles are readable by their owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can read their own books" on public.books;
create policy "Users can read their own books"
  on public.books for select
  using (auth.uid() = user_id);

drop policy if exists "Users can add books to their own collection" on public.books;
create policy "Users can add books to their own collection"
  on public.books for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own books" on public.books;
create policy "Users can update their own books"
  on public.books for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own books" on public.books;
create policy "Users can delete their own books"
  on public.books for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage bucket for cover pictures. Each user writes only inside a folder
-- named after their own user id, so nobody can overwrite someone else's cover.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

drop policy if exists "Cover pictures are publicly readable" on storage.objects;
create policy "Cover pictures are publicly readable"
  on storage.objects for select
  using (bucket_id = 'covers');

drop policy if exists "Users can upload their own covers" on storage.objects;
create policy "Users can upload their own covers"
  on storage.objects for insert
  with check (
    bucket_id = 'covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can replace their own covers" on storage.objects;
create policy "Users can replace their own covers"
  on storage.objects for update
  using (bucket_id = 'covers' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can delete their own covers" on storage.objects;
create policy "Users can delete their own covers"
  on storage.objects for delete
  using (bucket_id = 'covers' and auth.uid()::text = (storage.foldername(name))[1]);
