-- ===========================================================================
--  DO NOT RUN THIS AGAINST THE REAL SUPABASE PROJECT.
--  It deletes every row in books, profiles and auth.users so it can start
--  from a known state. It is meant for a throwaway local Postgres database.
-- ===========================================================================
--
-- Proves the Row Level Security policies in schema.sql really do isolate one
-- account's books from another's.
--
-- Every check raises an exception if it fails, so the script either prints
-- the full list of passes or stops at the first problem.

\set ON_ERROR_STOP on

-- Supabase runs requests as the "authenticated" role, which is not the table
-- owner and therefore cannot bypass RLS. Recreate that here.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$$;

grant usage on schema public, storage to authenticated;
grant select, insert, update, delete on public.books, public.profiles to authenticated;
grant select, insert, update, delete on storage.objects to authenticated;

-- Start from a clean slate so the script can be run repeatedly.
delete from public.books;
delete from public.profiles;
delete from auth.users;

-- Two accounts, created the way Supabase Auth creates them.
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'kayla@example.com', '{"username":"kayla"}'),
  ('22222222-2222-2222-2222-222222222222', 'sam@example.com',   '{"username":"sam"}');

-- --------------------------------------------------------------------------
do $$
declare n int;
begin
  select count(*) into n from public.profiles;
  if n <> 2 then
    raise exception 'FAIL: the sign-up trigger did not create both profiles (found %)', n;
  end if;
  if not exists (select 1 from public.profiles
                 where id = '11111111-1111-1111-1111-111111111111' and username = 'kayla') then
    raise exception 'FAIL: the username was not copied from the sign-up metadata';
  end if;
  raise notice 'PASS  signing up creates a profile row with the chosen username';
end
$$;

-- --------------------------------------------------------------------------
-- Act as Kayla from here on.
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into public.books (user_id, title, author, status, rating, notes) values
  ('11111111-1111-1111-1111-111111111111', 'Dracula', 'Bram Stoker', 'read', 4, 'Loved it.'),
  ('11111111-1111-1111-1111-111111111111', 'Jane Eyre', 'Charlotte Bronte', 'want', null, '');

do $$
declare n int;
begin
  select count(*) into n from public.books;
  if n <> 2 then raise exception 'FAIL: Kayla should see her own 2 books, saw %', n; end if;
  raise notice 'PASS  a signed-in user can add books and read them back';
end
$$;

-- --------------------------------------------------------------------------
-- Inserting a book under someone else's user_id must be refused.
do $$
begin
  begin
    insert into public.books (user_id, title, author)
    values ('22222222-2222-2222-2222-222222222222', 'Sneaky', 'Nobody');
    raise exception 'FAIL: a book was written into another user''s collection';
  exception
    when insufficient_privilege then
      raise notice 'PASS  writing a book into another user''s collection is refused';
  end;
end
$$;

-- --------------------------------------------------------------------------
-- The database, not the application, enforces the field rules.
do $$
begin
  begin
    insert into public.books (user_id, title, author, status)
    values ('11111111-1111-1111-1111-111111111111', 'Bad status', 'Someone', 'finished');
    raise exception 'FAIL: an invalid reading status was accepted';
  exception when check_violation then
    raise notice 'PASS  an invalid reading status is rejected';
  end;

  begin
    insert into public.books (user_id, title, author, rating)
    values ('11111111-1111-1111-1111-111111111111', 'Bad rating', 'Someone', 9);
    raise exception 'FAIL: a rating of 9 was accepted';
  exception when check_violation then
    raise notice 'PASS  a rating outside 1-5 is rejected';
  end;

  begin
    insert into public.books (user_id, title, author, notes)
    values ('11111111-1111-1111-1111-111111111111', 'Long notes', 'Someone', repeat('x', 501));
    raise exception 'FAIL: notes longer than 500 characters were accepted';
  exception when check_violation then
    raise notice 'PASS  notes longer than 500 characters are rejected';
  end;

  begin
    insert into public.books (user_id, title, author)
    values ('11111111-1111-1111-1111-111111111111', '', 'Someone');
    raise exception 'FAIL: an empty title was accepted';
  exception when check_violation then
    raise notice 'PASS  an empty title is rejected';
  end;
end
$$;

-- --------------------------------------------------------------------------
-- updated_at is maintained by the trigger, not by the application.
do $$
declare before timestamptz; after timestamptz;
begin
  select updated_at into before from public.books where title = 'Dracula';
  perform pg_sleep(0.05);
  update public.books set status = 'reading' where title = 'Dracula';
  select updated_at into after from public.books where title = 'Dracula';
  if after <= before then
    raise exception 'FAIL: updated_at did not move forward on update';
  end if;
  raise notice 'PASS  updated_at is refreshed automatically on every change';
end
$$;

-- --------------------------------------------------------------------------
-- Now act as Sam, who owns nothing.
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

do $$
declare n int;
begin
  select count(*) into n from public.books;
  if n <> 0 then
    raise exception 'FAIL: another user could see % of Kayla''s books', n;
  end if;
  raise notice 'PASS  another user sees none of Kayla''s books';

  update public.books set title = 'Hijacked' where title = 'Dracula';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: another user changed % rows', n; end if;
  raise notice 'PASS  another user cannot change Kayla''s books';

  delete from public.books where title = 'Dracula';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: another user deleted % rows', n; end if;
  raise notice 'PASS  another user cannot delete Kayla''s books';

  select count(*) into n from public.profiles;
  if n <> 1 then
    raise exception 'FAIL: profiles are not private (saw % rows)', n;
  end if;
  raise notice 'PASS  a user sees only their own profile row';
end
$$;

-- --------------------------------------------------------------------------
-- Cover pictures: a user may only write inside a folder named after their id.
do $$
begin
  insert into storage.objects (bucket_id, name)
  values ('covers', '22222222-2222-2222-2222-222222222222/mine.webp');
  raise notice 'PASS  a user can upload a cover into their own folder';

  begin
    insert into storage.objects (bucket_id, name)
    values ('covers', '11111111-1111-1111-1111-111111111111/stolen.webp');
    raise exception 'FAIL: a cover was written into another user''s folder';
  exception when insufficient_privilege then
    raise notice 'PASS  uploading into another user''s cover folder is refused';
  end;
end
$$;

-- --------------------------------------------------------------------------
-- Kayla's data survived every attempt above.
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

do $$
declare n int;
begin
  select count(*) into n from public.books;
  if n <> 2 then raise exception 'FAIL: Kayla should still have 2 books, has %', n; end if;
  if not exists (select 1 from public.books where title = 'Dracula') then
    raise exception 'FAIL: Dracula was lost';
  end if;
  raise notice 'PASS  Kayla''s books are untouched after the attempts above';
end
$$;

reset role;
\echo ''
\echo 'All database checks passed.'
