-- V24.76B1: make post-completion similarity failures visible and retryable by operators.
-- This does not determine rights ownership or infringement; it only records processor state.

create or replace function public.fail_audio_post_processing_job(
  target_job_id uuid,
  failure text,
  worker_version text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.audio_processing_jobs
  set status = 'failed',
      completed_at = now(),
      last_error = left('Post-processing failure: ' || coalesce(failure, 'unknown error'), 2000),
      processor_version = coalesce(nullif(worker_version, ''), processor_version),
      updated_at = now()
  where id = target_job_id
    and status in ('completed', 'flagged');

  get diagnostics affected = row_count;
  if affected = 0 then
    raise exception 'Post-processing job is not in a completed or flagged state';
  end if;
end;
$$;

revoke all on function public.fail_audio_post_processing_job(uuid, text, text) from public;
revoke all on function public.fail_audio_post_processing_job(uuid, text, text) from anon;
revoke all on function public.fail_audio_post_processing_job(uuid, text, text) from authenticated;
grant execute on function public.fail_audio_post_processing_job(uuid, text, text) to service_role;
