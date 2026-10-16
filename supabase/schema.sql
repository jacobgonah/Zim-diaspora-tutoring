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
  levels text[] not null default '{}', -- Primary, High School, Advanced Level
  languages text[] not null default '{}', -- must include English
  qualifications text[] not null default '{}', -- Degree, Diploma, National Certificate
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
  ('tutor-photos', 'tutor-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('tutor-videos', 'tutor-videos', true, 20971520, array['video/mp4', 'video/webm', 'video/quicktime'])
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
  created_at timestamptz default now()
);

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

alter table public.bookings add column if not exists parent_user_id uuid references auth.users(id);
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
