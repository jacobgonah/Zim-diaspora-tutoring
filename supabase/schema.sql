-- Run this in your new Supabase project SQL editor

-- Enable UUID extension if needed
create extension if not exists "uuid-ossp";

-- Tutors table (public profiles)
create table if not exists public.tutors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  title text, -- Mr, Ms, etc.
  surname text not null,
  subjects text[] not null default '{}',
  levels text[] not null default '{}', -- Primary, Secondary, High School, Advanced Level
  languages text[] not null default '{}', -- must include English
  qualifications text[] not null default '{}', -- Bachelor's Degree, Master's Degree, PhD, Diploma, National Certificate
  description text,
  years_experience integer,
  whatsapp text,
  photo_url text,
  cv_url text,
  is_live boolean default true, -- free at launch
  no_show_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tutors add column if not exists qualifications text[] not null default '{}';

-- Existing projects created this column as first_name.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tutors'
      and column_name = 'first_name'
  ) then
    alter table public.tutors rename column first_name to surname;
  end if;
end $$;

alter table public.tutors add column if not exists video_url text;

-- Public profile photo and a short introduction video.
-- Safe to run again. In the Supabase SQL editor, run this block if uploads fail.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('tutor-photos', 'tutor-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('tutor-videos', 'tutor-videos', false, 20971520, array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read tutor photos" on storage.objects;
create policy "Public read tutor photos"
  on storage.objects for select
  using (bucket_id = 'tutor-photos');

drop policy if exists "Tutors upload own photos" on storage.objects;
create policy "Tutors upload own photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'tutor-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Tutors update own photos" on storage.objects;
create policy "Tutors update own photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'tutor-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'tutor-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Tutors delete own photos" on storage.objects;
create policy "Tutors delete own photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'tutor-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Public read tutor videos" on storage.objects;
create policy "Public read tutor videos"
  on storage.objects for select
  using (bucket_id = 'tutor-videos');

drop policy if exists "Tutors upload own videos" on storage.objects;
create policy "Tutors upload own videos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'tutor-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Tutors update own videos" on storage.objects;
create policy "Tutors update own videos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'tutor-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'tutor-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Tutors delete own videos" on storage.objects;
create policy "Tutors delete own videos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'tutor-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Enable RLS
alter table public.tutors enable row level security;

-- Policies: anyone can read live tutors
create policy "Anyone can view live tutors"
  on public.tutors for select
  using (is_live = true);

-- Tutors can insert/update their own profile
create policy "Tutors can manage own profile"
  on public.tutors for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Availability slots (tutor sets weekly times)
create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid references public.tutors(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Sunday
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now()
);

alter table public.availability enable row level security;

create policy "Anyone can view availability"
  on public.availability for select
  using (true);

create policy "Tutors manage own availability"
  on public.availability for all
  using (
    exists (
      select 1 from public.tutors
      where tutors.id = availability.tutor_id
      and tutors.user_id = auth.uid()
    )
  );

-- Bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid references public.tutors(id) on delete cascade,
  parent_email text not null,
  parent_name text,
  slot_date date not null,
  start_time time not null,
  is_recurring boolean default false,
  status text default 'confirmed', -- confirmed, completed, no_show
  created_at timestamptz default now()
);

alter table public.bookings enable row level security;

drop policy if exists "Anyone can create booking" on public.bookings;
drop policy if exists "Signed-in users can create bookings" on public.bookings;
create policy "Signed-in users can create bookings"
  on public.bookings for insert
  to authenticated
  with check (auth.uid() is not null);

create policy "View own bookings or tutor bookings"
  on public.bookings for select
  using (true); -- simplify for MVP; tighten later

-- No-show reports
create table if not exists public.no_shows (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  reported_by text not null, -- 'parent' or 'tutor'
  created_at timestamptz default now(),
  unique(booking_id, reported_by)
);

alter table public.no_shows enable row level security;

create policy "Anyone can report no-show"
  on public.no_shows for insert
  with check (true);

create policy "View no-shows"
  on public.no_shows for select
  using (true);

-- Parent accounts, private tutor WhatsApp, and accept-to-chat bookings.
-- Safe to run again in the Supabase SQL editor.

create table if not exists public.parents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  surname text not null,
  phone text,
  location text,
  created_at timestamptz default now()
);

alter table public.parents add column if not exists location text;

alter table public.parents enable row level security;

drop policy if exists "Parents read own profile" on public.parents;
create policy "Parents read own profile"
  on public.parents for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Parents insert own profile" on public.parents;
create policy "Parents insert own profile"
  on public.parents for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Parents update own profile" on public.parents;
create policy "Parents update own profile"
  on public.parents for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_new_parent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_user_meta_data->>'role' = 'parent' then
    insert into public.parents (user_id, first_name, surname, phone)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'first_name', ''),
      coalesce(new.raw_user_meta_data->>'surname', ''),
      nullif(new.raw_user_meta_data->>'phone', '')
    )
    on conflict (user_id) do update
    set first_name = excluded.first_name,
        surname = excluded.surname,
        phone = coalesce(excluded.phone, public.parents.phone);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_parent on auth.users;
create trigger on_auth_user_created_parent
  after insert on auth.users
  for each row execute procedure public.handle_new_parent();

create table if not exists public.tutor_contacts (
  tutor_id uuid primary key references public.tutors(id) on delete cascade,
  whatsapp text not null
);

alter table public.tutor_contacts enable row level security;

drop policy if exists "Tutor reads own whatsapp" on public.tutor_contacts;
create policy "Tutor reads own whatsapp"
  on public.tutor_contacts for select
  to authenticated
  using (
    exists (
      select 1 from public.tutors t
      where t.id = tutor_contacts.tutor_id
        and t.user_id = auth.uid()
    )
  );

drop policy if exists "Tutor inserts own whatsapp" on public.tutor_contacts;
create policy "Tutor inserts own whatsapp"
  on public.tutor_contacts for insert
  to authenticated
  with check (
    exists (
      select 1 from public.tutors t
      where t.id = tutor_contacts.tutor_id
        and t.user_id = auth.uid()
    )
  );

drop policy if exists "Tutor updates own whatsapp" on public.tutor_contacts;
create policy "Tutor updates own whatsapp"
  on public.tutor_contacts for update
  to authenticated
  using (
    exists (
      select 1 from public.tutors t
      where t.id = tutor_contacts.tutor_id
        and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tutors t
      where t.id = tutor_contacts.tutor_id
        and t.user_id = auth.uid()
    )
  );

insert into public.tutor_contacts (tutor_id, whatsapp)
select id, whatsapp
from public.tutors
where whatsapp is not null and length(trim(whatsapp)) > 0
on conflict (tutor_id) do nothing;

update public.tutors set whatsapp = null where whatsapp is not null;

revoke select (whatsapp) on public.tutors from anon, authenticated, public;

alter table public.bookings add column if not exists parent_user_id uuid references auth.users(id) on delete cascade;
alter table public.bookings add column if not exists parent_phone text;
alter table public.bookings alter column status set default 'pending';

drop policy if exists "Signed-in users can create bookings" on public.bookings;
drop policy if exists "Parents create own bookings" on public.bookings;
create policy "Parents create own bookings"
  on public.bookings for insert
  to authenticated
  with check (parent_user_id = auth.uid());

drop policy if exists "View own bookings or tutor bookings" on public.bookings;
drop policy if exists "Parents and tutors view their bookings" on public.bookings;
create policy "Parents and tutors view their bookings"
  on public.bookings for select
  to authenticated
  using (
    parent_user_id = auth.uid()
    or exists (
      select 1 from public.tutors t
      where t.id = bookings.tutor_id
        and t.user_id = auth.uid()
    )
  );

create or replace function public.accept_booking(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;

  update public.bookings b
  set status = 'accepted'
  where b.id = target_id
    and b.status = 'pending'
    and exists (
      select 1 from public.tutors t
      where t.id = b.tutor_id
        and t.user_id = auth.uid()
    );

  if not found then
    raise exception 'This request cannot be accepted';
  end if;
end;
$$;

create or replace function public.booking_whatsapp_link(target_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bookings;
  tutor_user uuid;
  other_phone text;
  digits text;
  msg text;
  hour_label text;
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;

  select * into b from public.bookings where id = target_id;
  if not found or b.status is distinct from 'accepted' then
    return null;
  end if;

  select t.user_id into tutor_user from public.tutors t where t.id = b.tutor_id;

  if auth.uid() = tutor_user then
    other_phone := b.parent_phone;
  elsif auth.uid() = b.parent_user_id then
    select c.whatsapp into other_phone from public.tutor_contacts c where c.tutor_id = b.tutor_id;
  else
    raise exception 'Not allowed';
  end if;

  if other_phone is null or length(trim(other_phone)) = 0 then
    return null;
  end if;

  digits := regexp_replace(other_phone, '\D', '', 'g');
  if digits = '' then
    return null;
  end if;

  if extract(minute from b.start_time) = 0 then
    hour_label := trim(to_char(b.start_time, 'FMHH12am'));
  else
    hour_label := trim(to_char(b.start_time, 'FMHH12:MIam'));
  end if;

  msg := 'Hi, this is regarding our '
    || (array['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'])[extract(dow from b.slot_date)::int + 1]
    || ' '
    || hour_label
    || ' lesson';

  return 'https://wa.me/' || digits || '?text=' || replace(replace(msg, ' ', '%20'), ',', '%2C');
end;
$$;

revoke all on function public.accept_booking(uuid) from public, anon;
revoke all on function public.booking_whatsapp_link(uuid) from public, anon;
grant execute on function public.accept_booking(uuid) to authenticated;
grant execute on function public.booking_whatsapp_link(uuid) to authenticated;

-- Delete account. Safe to run again in the Supabase SQL editor.
-- Removes the signed-in parent or tutor login, and rows tied to that login.

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = any (con.conkey)
    where nsp.nspname = 'public'
      and rel.relname = 'bookings'
      and att.attname = 'parent_user_id'
      and con.contype = 'f'
  loop
    execute format('alter table public.bookings drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.bookings
  add constraint bookings_parent_user_id_fkey
  foreign key (parent_user_id) references auth.users(id) on delete cascade;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;

  -- Photo and video files sit outside the tutors cascade.
  begin
    delete from storage.objects
    where bucket_id in ('tutor-photos', 'tutor-videos')
      and (storage.foldername(name))[1] = auth.uid()::text;
  exception
    when others then
      null;
  end;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

drop policy if exists "Tutor deletes own whatsapp" on public.tutor_contacts;
create policy "Tutor deletes own whatsapp"
  on public.tutor_contacts for delete
  to authenticated
  using (
    exists (
      select 1 from public.tutors t
      where t.id = tutor_contacts.tutor_id
        and t.user_id = auth.uid()
    )
  );

-- Media review, gender, and qualification detail.
-- Safe to run again. Photos and videos stay off public pages until you approve them at /admin.
-- After this section, set your own admin password in the SQL editor:
--   select public.set_admin_password('<your password>');

create extension if not exists pgcrypto with schema extensions;

alter table public.tutors add column if not exists gender text;
alter table public.tutors add column if not exists qualification_detail text;
alter table public.tutors add column if not exists photo_status text;
alter table public.tutors add column if not exists video_status text;

update public.tutors
set photo_status = 'approved'
where photo_url is not null and photo_status is null and photo_url like '%://%';

update public.tutors
set photo_status = 'pending'
where photo_url is not null and photo_status is null and photo_url not like '%://%';

update public.tutors
set video_status = 'approved'
where video_url is not null and video_status is null and video_url like '%://%';

update public.tutors
set video_status = 'pending'
where video_url is not null and video_status is null and video_url not like '%://%';

alter table public.tutors drop constraint if exists tutors_gender_check;
alter table public.tutors add constraint tutors_gender_check
  check (gender is null or gender in ('Male', 'Female'));

alter table public.tutors drop constraint if exists tutors_photo_status_check;
alter table public.tutors add constraint tutors_photo_status_check
  check (photo_status is null or photo_status in ('pending', 'approved', 'rejected'));

alter table public.tutors drop constraint if exists tutors_video_status_check;
alter table public.tutors add constraint tutors_video_status_check
  check (video_status is null or video_status in ('pending', 'approved', 'rejected'));

create or replace function public.storage_object_name(p_value text, p_bucket text)
returns text
language plpgsql
immutable
as $$
declare
  marker text;
  rest text;
begin
  if p_value is null or length(trim(p_value)) = 0 then
    return null;
  end if;
  marker := '/object/public/' || p_bucket || '/';
  if position(marker in p_value) > 0 then
    rest := split_part(substr(p_value, position(marker in p_value) + length(marker)), '?', 1);
    return rest;
  end if;
  marker := '/object/authenticated/' || p_bucket || '/';
  if position(marker in p_value) > 0 then
    rest := split_part(substr(p_value, position(marker in p_value) + length(marker)), '?', 1);
    return rest;
  end if;
  if position('://' in p_value) = 0 and position('/media/' in p_value) = 0 then
    return split_part(p_value, '?', 1);
  end if;
  return null;
end;
$$;

revoke all on function public.storage_object_name(text, text) from public, anon, authenticated;

create table if not exists public.admin_secrets (
  id int primary key default 1 check (id = 1),
  password_hash text not null,
  session_token text,
  session_expires timestamptz
);

create table if not exists public.admin_media_grants (
  bucket_id text not null,
  object_name text not null,
  expires_at timestamptz not null,
  primary key (bucket_id, object_name)
);

alter table public.admin_secrets enable row level security;
alter table public.admin_media_grants enable row level security;
revoke all on table public.admin_secrets from public, anon, authenticated;
revoke all on table public.admin_media_grants from public, anon, authenticated;

create or replace function public.media_is_approved(p_bucket text, p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tutors t
    where (
      p_bucket = 'tutor-photos'
      and t.photo_status = 'approved'
      and public.storage_object_name(t.photo_url, 'tutor-photos') = p_name
    ) or (
      p_bucket = 'tutor-videos'
      and t.video_status = 'approved'
      and public.storage_object_name(t.video_url, 'tutor-videos') = p_name
    )
  );
$$;

create or replace function public.media_grant_active(p_bucket text, p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_media_grants g
    where g.bucket_id = p_bucket
      and g.object_name = p_name
      and g.expires_at > now()
  );
$$;

update storage.buckets
set public = false
where id in ('tutor-photos', 'tutor-videos');

drop policy if exists "Public read tutor photos" on storage.objects;
drop policy if exists "Read approved tutor photos" on storage.objects;
create policy "Read approved tutor photos"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'tutor-photos'
    and public.media_is_approved(bucket_id, name)
  );

drop policy if exists "Read granted tutor photos" on storage.objects;
create policy "Read granted tutor photos"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'tutor-photos'
    and public.media_grant_active(bucket_id, name)
  );

drop policy if exists "Tutors read own photos" on storage.objects;
create policy "Tutors read own photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'tutor-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Public read tutor videos" on storage.objects;
drop policy if exists "Read approved tutor videos" on storage.objects;
create policy "Read approved tutor videos"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'tutor-videos'
    and public.media_is_approved(bucket_id, name)
  );

drop policy if exists "Read granted tutor videos" on storage.objects;
create policy "Read granted tutor videos"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'tutor-videos'
    and public.media_grant_active(bucket_id, name)
  );

drop policy if exists "Tutors read own videos" on storage.objects;
create policy "Tutors read own videos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'tutor-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create or replace function public.enforce_media_review()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.media_review', true) = '1' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.photo_status := case when new.photo_url is null then null else 'pending' end;
    new.video_status := case when new.video_url is null then null else 'pending' end;
    return new;
  end if;
  if new.photo_url is distinct from old.photo_url then
    new.photo_status := case when new.photo_url is null then null else 'pending' end;
  else
    new.photo_status := old.photo_status;
  end if;
  if new.video_url is distinct from old.video_url then
    new.video_status := case when new.video_url is null then null else 'pending' end;
  else
    new.video_status := old.video_status;
  end if;
  return new;
end;
$$;

drop trigger if exists tutors_enforce_media_review on public.tutors;
create trigger tutors_enforce_media_review
  before insert or update on public.tutors
  for each row execute function public.enforce_media_review();

create or replace function public.set_admin_password(new_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new_password is null or length(new_password) < 8 then
    raise exception 'Use an admin password of at least 8 characters.';
  end if;
  insert into public.admin_secrets (id, password_hash)
  values (1, extensions.crypt(new_password, extensions.gen_salt('bf')))
  on conflict (id) do update
  set password_hash = excluded.password_hash,
      session_token = null,
      session_expires = null;
end;
$$;

revoke all on function public.set_admin_password(text) from public, anon, authenticated;

create or replace function public.admin_sign_in(p_password text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  stored text;
  token text;
begin
  select password_hash into stored from public.admin_secrets where id = 1;
  if stored is null then
    raise exception 'Admin sign-in is not set up yet. In the Supabase SQL editor, run select public.set_admin_password with your own password. The statement is commented at the end of supabase/schema.sql.';
  end if;
  if p_password is null or extensions.crypt(p_password, stored) is distinct from stored then
    raise exception 'That admin password is not correct.';
  end if;
  token := encode(extensions.gen_random_bytes(32), 'hex');
  update public.admin_secrets
  set session_token = token,
      session_expires = now() + interval '12 hours'
  where id = 1;
  return token;
end;
$$;

revoke all on function public.admin_sign_in(text) from public;
grant execute on function public.admin_sign_in(text) to anon, authenticated;

create or replace function public.admin_token_ok(p_token text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_secrets
    where id = 1
      and session_token is not null
      and p_token is not null
      and length(p_token) > 20
      and session_token = p_token
      and session_expires > now()
  );
$$;

revoke all on function public.admin_token_ok(text) from public, anon, authenticated;

create or replace function public.admin_require(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.admin_token_ok(p_token) then
    raise exception 'Sign in again.';
  end if;
end;
$$;

revoke all on function public.admin_require(text) from public, anon, authenticated;

create or replace function public.admin_remember_grant(p_bucket text, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_name is null then
    return;
  end if;
  insert into public.admin_media_grants (bucket_id, object_name, expires_at)
  values (p_bucket, p_name, now() + interval '30 minutes')
  on conflict (bucket_id, object_name) do update
  set expires_at = excluded.expires_at;
end;
$$;

revoke all on function public.admin_remember_grant(text, text) from public, anon, authenticated;

create or replace function public.admin_list_pending(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_require(p_token);
  return coalesce((
    select jsonb_agg(to_jsonb(pending_item) order by pending_item.surname, pending_item.kind)
    from (
      select t.id as tutor_id, t.title, t.surname, t.gender, 'photo'::text as kind
      from public.tutors t
      where t.photo_status = 'pending' and t.photo_url is not null
      union all
      select t.id, t.title, t.surname, t.gender, 'video'::text
      from public.tutors t
      where t.video_status = 'pending' and t.video_url is not null
    ) pending_item
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_list_pending(text) from public;
grant execute on function public.admin_list_pending(text) to anon, authenticated;

create or replace function public.admin_review_media(
  p_token text,
  p_tutor_id uuid,
  p_kind text,
  p_decision text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_require(p_token);
  if p_kind not in ('photo', 'video') or p_decision not in ('approved', 'rejected') then
    raise exception 'Choose a photo or video, then approve or reject it.';
  end if;
  perform set_config('app.media_review', '1', true);
  if p_kind = 'photo' then
    update public.tutors
    set photo_status = p_decision
    where id = p_tutor_id and photo_url is not null;
  else
    update public.tutors
    set video_status = p_decision
    where id = p_tutor_id and video_url is not null;
  end if;
end;
$$;

revoke all on function public.admin_review_media(text, uuid, text, text) from public;
grant execute on function public.admin_review_media(text, uuid, text, text) to anon, authenticated;

create or replace function public.admin_media_object(p_token text, p_tutor_id uuid, p_kind text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  stored text;
  bucket text;
  object_name text;
begin
  perform public.admin_require(p_token);
  if p_kind = 'photo' then
    bucket := 'tutor-photos';
    select photo_url into stored from public.tutors where id = p_tutor_id;
  elsif p_kind = 'video' then
    bucket := 'tutor-videos';
    select video_url into stored from public.tutors where id = p_tutor_id;
  else
    raise exception 'Choose a photo or video.';
  end if;
  object_name := public.storage_object_name(stored, bucket);
  if object_name is null then
    return null;
  end if;
  perform public.admin_remember_grant(bucket, object_name);
  return jsonb_build_object('bucket', bucket, 'object_name', object_name);
end;
$$;

revoke all on function public.admin_media_object(text, uuid, text) from public;
grant execute on function public.admin_media_object(text, uuid, text) to anon, authenticated;

create or replace function public.my_tutor_media()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;
  select jsonb_build_object(
    'photo_path', photo_url,
    'photo_status', photo_status,
    'video_path', video_url,
    'video_status', video_status
  ) into result
  from public.tutors
  where user_id = auth.uid();
  return coalesce(result, jsonb_build_object(
    'photo_path', null,
    'photo_status', null,
    'video_path', null,
    'video_status', null
  ));
end;
$$;

revoke all on function public.my_tutor_media() from public;
grant execute on function public.my_tutor_media() to authenticated;

create or replace function public.approved_media_path(p_tutor_id uuid, p_kind text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_kind = 'photo' and photo_status = 'approved' then public.storage_object_name(photo_url, 'tutor-photos')
    when p_kind = 'video' and video_status = 'approved' then public.storage_object_name(video_url, 'tutor-videos')
    else null
  end
  from public.tutors
  where id = p_tutor_id and is_live is true;
$$;

revoke all on function public.approved_media_path(uuid, text) from public;
grant execute on function public.approved_media_path(uuid, text) to anon, authenticated;

create or replace function public.list_tutors(
  p_subject text default null,
  p_level text default null,
  p_language text default null,
  p_gender text default null
) returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc), '[]'::jsonb)
  from (
    select
      id,
      title,
      surname,
      subjects,
      levels,
      languages,
      qualifications,
      qualification_detail,
      description,
      years_experience,
      gender,
      case when photo_status = 'approved' then '/media/' || id::text || '/photo' else null end as photo_url,
      case when video_status = 'approved' then '/media/' || id::text || '/video' else null end as video_url,
      is_live,
      coalesce(no_show_count, 0) as no_show_count,
      created_at
    from public.tutors
    where is_live is true
      and (nullif(p_subject, '') is null or subjects @> array[p_subject])
      and (nullif(p_level, '') is null or levels @> array[p_level])
      and (nullif(p_language, '') is null or languages @> array[p_language])
      and (nullif(p_gender, '') is null or gender = p_gender)
  ) t;
$$;

revoke all on function public.list_tutors(text, text, text, text) from public;
grant execute on function public.list_tutors(text, text, text, text) to anon, authenticated;

create or replace function public.get_tutor(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(t)
  from (
    select
      id,
      title,
      surname,
      subjects,
      levels,
      languages,
      qualifications,
      qualification_detail,
      description,
      years_experience,
      gender,
      case when photo_status = 'approved' then '/media/' || id::text || '/photo' else null end as photo_url,
      case when video_status = 'approved' then '/media/' || id::text || '/video' else null end as video_url,
      is_live,
      coalesce(no_show_count, 0) as no_show_count,
      created_at
    from public.tutors
    where id = p_id and is_live is true
  ) t;
$$;

revoke all on function public.get_tutor(uuid) from public;
grant execute on function public.get_tutor(uuid) to anon, authenticated;

revoke select (photo_url, video_url) on public.tutors from anon, authenticated;

grant execute on function public.media_is_approved(text, text) to anon, authenticated;
grant execute on function public.media_grant_active(text, text) to anon, authenticated;

-- =============================================
-- Account deletion
-- =============================================

-- Function to delete the current user's account and related data
create or replace function public.delete_user()
returns void
language plpgsql
security definer
as $$
begin
  -- Delete related data first
  delete from public.tutors where user_id = auth.uid();
  delete from public.bookings where parent_email = (select email from auth.users where id = auth.uid());
  
  -- Delete the auth user
  delete from auth.users where id = auth.uid();
end;
$$;

-- Allow authenticated users to call the function
grant execute on function public.delete_user() to authenticated;
