-- ============================================================================
-- Zim Diaspora Tutoring (ZDT) - Complete Supabase / PostgreSQL Schema
-- ============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto with schema extensions;

-- 1. TUTORS TABLE (Public Profiles)
create table if not exists public.tutors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  title text, -- Mr, Ms, Mrs, Dr, etc.
  surname text not null,
  gender text check (gender is null or gender in ('Male', 'Female')),
  subjects text[] not null default '{}',
  levels text[] not null default '{}', -- Primary, Secondary, High School, Advanced Level
  languages text[] not null default '{}', -- must include English
  qualifications text[] not null default '{}', -- Bachelor's Degree, Master's Degree, PhD, Diploma, National Certificate
  qualification_detail text,
  description text,
  years_experience integer,
  whatsapp text,
  photo_url text,
  video_url text,
  photo_status text check (photo_status is null or photo_status in ('pending', 'approved', 'rejected')),
  video_status text check (video_status is null or video_status in ('pending', 'approved', 'rejected')),
  cv_url text,
  is_live boolean default true,
  no_show_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tutors' and column_name = 'first_name'
  ) then
    alter table public.tutors rename column first_name to surname;
  end if;
end $$;

-- 2. STORAGE BUCKETS (Tutor Photos & Videos)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('tutor-photos', 'tutor-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('tutor-videos', 'tutor-videos', false, 20971520, array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

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

-- 3. TUTOR CONTACTS (Private WhatsApp Protection)
create table if not exists public.tutor_contacts (
  tutor_id uuid primary key references public.tutors(id) on delete cascade,
  whatsapp text not null
);

alter table public.tutor_contacts enable row level security;

create policy "Tutor reads own whatsapp" on public.tutor_contacts
  for select to authenticated
  using (exists (select 1 from public.tutors t where t.id = tutor_contacts.tutor_id and t.user_id = auth.uid()));

create policy "Tutor inserts own whatsapp" on public.tutor_contacts
  for insert to authenticated
  with check (exists (select 1 from public.tutors t where t.id = tutor_contacts.tutor_id and t.user_id = auth.uid()));

create policy "Tutor updates own whatsapp" on public.tutor_contacts
  for update to authenticated
  using (exists (select 1 from public.tutors t where t.id = tutor_contacts.tutor_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.tutors t where t.id = tutor_contacts.tutor_id and t.user_id = auth.uid()));

create policy "Tutor deletes own whatsapp" on public.tutor_contacts
  for delete to authenticated
  using (exists (select 1 from public.tutors t where t.id = tutor_contacts.tutor_id and t.user_id = auth.uid()));

revoke select (whatsapp) on public.tutors from anon, authenticated, public;
revoke select (photo_url, video_url) on public.tutors from anon, authenticated;

alter table public.tutors enable row level security;

create policy "Anyone can view live tutors" on public.tutors
  for select using (is_live = true);

create policy "Tutors can manage own profile" on public.tutors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4. AVAILABILITY TABLE
create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid references public.tutors(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Sunday
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now()
);

alter table public.availability enable row level security;

create policy "Anyone can view availability" on public.availability
  for select using (true);

create policy "Tutors manage own availability" on public.availability
  for all using (
    exists (
      select 1 from public.tutors where tutors.id = availability.tutor_id and tutors.user_id = auth.uid()
    )
  );

-- 5. PARENTS PROFILE TABLE
create table if not exists public.parents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  surname text not null,
  phone text,
  location text,
  created_at timestamptz default now()
);

alter table public.parents enable row level security;

create policy "Parents read own profile" on public.parents
  for select to authenticated using (auth.uid() = user_id);

create policy "Parents insert own profile" on public.parents
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Parents update own profile" on public.parents
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

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

-- 6. BOOKINGS TABLE
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid references public.tutors(id) on delete cascade,
  parent_user_id uuid references auth.users(id) on delete cascade,
  parent_email text not null,
  parent_name text,
  parent_phone text,
  slot_date date not null,
  start_time time not null,
  is_recurring boolean default false,
  status text default 'pending', -- pending, accepted, confirmed, completed, no_show
  created_at timestamptz default now()
);

alter table public.bookings enable row level security;

create policy "Parents create own bookings" on public.bookings
  for insert to authenticated
  with check (parent_user_id = auth.uid());

create policy "Parents and tutors view their bookings" on public.bookings
  for select to authenticated
  using (
    parent_user_id = auth.uid()
    or exists (
      select 1 from public.tutors t where t.id = bookings.tutor_id and t.user_id = auth.uid()
    )
  );

-- 7. NO-SHOW REPORTS TABLE (After 3 no-shows the profile is removed)
create table if not exists public.no_shows (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  reported_by text not null, -- 'parent' or 'tutor'
  created_at timestamptz default now(),
  unique(booking_id, reported_by)
);

alter table public.no_shows enable row level security;

create policy "Anyone can report no-show" on public.no_shows for insert with check (true);
create policy "View no-shows" on public.no_shows for select using (true);

-- 8. MEDIA REVIEW & ADMIN CONTROLS
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

create policy "Read approved tutor photos" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'tutor-photos' and public.media_is_approved(bucket_id, name));

create policy "Tutors upload own photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'tutor-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Read approved tutor videos" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'tutor-videos' and public.media_is_approved(bucket_id, name));

create policy "Tutors upload own videos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'tutor-videos' and (storage.foldername(name))[1] = auth.uid()::text);

-- 9. RPC FUNCTIONS: ACCEPT BOOKING & WHATSAPP LINK
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
      where t.id = b.tutor_id and t.user_id = auth.uid()
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

-- 10. RPC FUNCTIONS: LIST & GET TUTORS
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

-- Account deletion
create or replace function public.delete_user()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.tutors where user_id = auth.uid();
  delete from public.bookings where parent_email = (select email from auth.users where id = auth.uid());
  delete from auth.users where id = auth.uid();
end;
$$;

-- Permissions grants
grant execute on function public.list_tutors(text, text, text, text) to anon, authenticated;
grant execute on function public.get_tutor(uuid) to anon, authenticated;
grant execute on function public.accept_booking(uuid) to authenticated;
grant execute on function public.booking_whatsapp_link(uuid) to authenticated;
grant execute on function public.delete_user() to authenticated;

-- Email verification limit: 3 confirmation emails per address per UTC day.
-- The counter resets at midnight UTC. Run this section in the Supabase SQL editor.
create table if not exists public.email_verification_sends (
  id bigint generated always as identity primary key,
  email text not null,
  sent_on date not null,
  sent_at timestamptz not null default now()
);

create index if not exists email_verification_sends_email_day_idx
  on public.email_verification_sends (email, sent_on);

alter table public.email_verification_sends enable row level security;
revoke all on table public.email_verification_sends from public, anon, authenticated;

create or replace function public.check_email_verification_limit(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text;
  today date;
  sent_count integer;
begin
  normalized := lower(trim(coalesce(p_email, '')));
  if normalized = '' or position('@' in normalized) = 0 then
    return false;
  end if;

  today := (timezone('utc', now()))::date;
  perform pg_advisory_xact_lock(hashtext('email-verification:' || normalized));

  select count(*) into sent_count
  from public.email_verification_sends
  where email = normalized
    and sent_on = today;

  if sent_count >= 3 then
    return false;
  end if;

  insert into public.email_verification_sends (email, sent_on)
  values (normalized, today);

  return true;
end;
$$;

revoke all on function public.check_email_verification_limit(text) from public;
grant execute on function public.check_email_verification_limit(text) to anon, authenticated;
