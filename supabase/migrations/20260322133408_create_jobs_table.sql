create extension if not exists pgcrypto;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  video_url text not null,
  subtitle_file text not null,
  output_video text,
  status text not null default 'ready' check (status in ('pending', 'processing', 'ready', 'done', 'failed')),
  error_message text,
  subtitle_settings jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_user_id_idx on public.jobs (user_id);
create index if not exists jobs_status_idx on public.jobs (status);
create index if not exists jobs_created_at_idx on public.jobs (created_at desc);

alter table public.jobs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'jobs'
      and policyname = 'Users can insert own jobs'
  ) then
    create policy "Users can insert own jobs"
      on public.jobs
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'jobs'
      and policyname = 'Users can view own jobs'
  ) then
    create policy "Users can view own jobs"
      on public.jobs
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'jobs'
      and policyname = 'Users can update own jobs'
  ) then
    create policy "Users can update own jobs"
      on public.jobs
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'jobs'
      and policyname = 'Users can delete own jobs'
  ) then
    create policy "Users can delete own jobs"
      on public.jobs
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end;
$$;

create or replace function public.set_jobs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists jobs_set_updated_at on public.jobs;

create trigger jobs_set_updated_at
before update on public.jobs
for each row
execute function public.set_jobs_updated_at();
