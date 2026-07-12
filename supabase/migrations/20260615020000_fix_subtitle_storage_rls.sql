-- Subtitle files are stored in storage.objects under:
--   subtitles/<auth.uid()>/<filename>
--
-- Subtitle objects are immutable source assets. The editor imports content
-- into public.subtitle_documents and never rewrites storage.objects.

-- Restrictive policies are ANDed with every permissive policy. This prevents
-- a legacy broad policy such as "auth.uid() is not null" from allowing access
-- to another user's subtitle folder.
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
create policy "Subtitle owners can update objects"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'subtitles'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'subtitles'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
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
