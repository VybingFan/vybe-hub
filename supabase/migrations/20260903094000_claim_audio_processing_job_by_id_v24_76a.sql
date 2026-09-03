-- V24.76A: controlled single-job claim for the native rights processor.
-- This does not start processing or requeue any jobs. It only allows the service-role
-- processor to atomically claim one explicitly selected queued job during controlled testing.

create or replace function public.claim_audio_processing_job_by_id(
  target_job_id uuid,
  worker_version text
)
returns setof public.audio_processing_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(worker_version), '') is null then
    raise exception 'Worker version is required';
  end if;

  return query
  update public.audio_processing_jobs
  set status = 'processing',
      attempt_count = attempt_count + 1,
      processor_version = worker_version,
      started_at = now(),
      completed_at = null,
      last_error = null,
      updated_at = now()
  where id = target_job_id
    and status = 'queued'
  returning *;
end;
$$;

revoke all on function public.claim_audio_processing_job_by_id(uuid, text) from public;
revoke all on function public.claim_audio_processing_job_by_id(uuid, text) from anon;
revoke all on function public.claim_audio_processing_job_by_id(uuid, text) from authenticated;
grant execute on function public.claim_audio_processing_job_by_id(uuid, text) to service_role;

comment on function public.claim_audio_processing_job_by_id(uuid, text) is
  'V24.76A controlled service-role claim of one explicitly selected queued audio processing job.';
