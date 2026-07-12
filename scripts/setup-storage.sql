-- Run this in the Supabase SQL editor when bootstrapping storage manually.
-- The version-controlled equivalent is:
-- supabase/migrations/20260615020000_fix_subtitle_storage_rls.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'subtitles',
  'subtitles',
  false,
  10485760,
  array['text/plain', 'text/srt', 'application/x-subrip', 'text/vtt']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Subtitle objects require path ownership" on storage.objects;
create policy "Subtitle objects require path ownership"
  on storage.objects
  as restrictive
  for all
  to authenticated
  using (
    bucket_id <> 'subtitles'
    or (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id <> 'subtitles'
    or (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Subtitle owners can read objects" on storage.objects;
create policy "Subtitle owners can read objects"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'subtitles'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Subtitle owners can insert objects" on storage.objects;
create policy "Subtitle owners can insert objects"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'subtitles'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Subtitle owners can update objects" on storage.objects;
drop policy if exists "Subtitle source objects are immutable" on storage.objects;
create policy "Subtitle source objects are immutable"
  on storage.objects
  as restrictive
  for update
  to authenticated
  using (
    bucket_id <> 'subtitles'
  )
  with check (
    bucket_id <> 'subtitles'
  );

drop policy if exists "Subtitle owners can delete objects" on storage.objects;
create policy "Subtitle owners can delete objects"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'subtitles'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
