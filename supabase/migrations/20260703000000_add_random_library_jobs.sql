create or replace function public.get_random_library_jobs(
  p_query text default null,
  p_status text default 'all',
  p_seed text default '',
  p_selection_limit integer default 10,
  p_page_limit integer default 12,
  p_page_offset integer default 0
)
returns table (
  id uuid,
  title text,
  video_url text,
  subtitle_file text,
  subtitle_settings jsonb,
  created_at timestamptz,
  status text
)
language sql
volatile
security invoker
set search_path = public
as $$
  with matching as (
    select
      jobs.id,
      jobs.title,
      jobs.video_url,
      jobs.subtitle_file,
      jobs.subtitle_settings,
      jobs.created_at,
      jobs.status,
      md5(jobs.id::text || coalesce(p_seed, '')) as random_key
    from public.jobs
    where jobs.user_id = auth.uid()
      and (
        nullif(trim(p_query), '') is null
        or jobs.title ilike ('%' || replace(replace(trim(p_query), '%', '\%'), '_', '\_') || '%')
      )
      and case p_status
        when 'ready' then jobs.status in ('ready', 'done')
        when 'processing' then jobs.status = 'processing'
        when 'pending' then jobs.status = 'pending'
        when 'failed' then jobs.status = 'failed'
        else true
      end
  ), selected as (
    select *
    from matching
    order by random_key, id
    limit greatest(p_selection_limit, 0)
  )
  select
    selected.id,
    selected.title,
    selected.video_url,
    selected.subtitle_file,
    selected.subtitle_settings,
    selected.created_at,
    selected.status
  from selected
  order by selected.random_key, selected.id
  limit greatest(p_page_limit, 1)
  offset greatest(p_page_offset, 0);
$$;

revoke all on function public.get_random_library_jobs(text, text, text, integer, integer, integer) from public;
grant execute on function public.get_random_library_jobs(text, text, text, integer, integer, integer) to authenticated;
