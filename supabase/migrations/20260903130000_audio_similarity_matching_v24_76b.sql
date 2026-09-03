-- V24.76B: controlled Chromaprint similarity matching support.
-- Similarity is a review signal only and must not be treated as a copyright or ownership determination.

create or replace function public.get_audio_similarity_candidates(
  source_track_id uuid,
  duration_tolerance numeric default 0.10
)
returns table (
  candidate_track_id uuid,
  raw_fingerprint text,
  duration_sec numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  source_fp public.audio_fingerprints%rowtype;
begin
  if duration_tolerance < 0 or duration_tolerance > 0.50 then
    raise exception 'Invalid duration tolerance';
  end if;

  select * into source_fp
  from public.audio_fingerprints
  where track_id = source_track_id;

  if source_fp.track_id is null then
    raise exception 'Source fingerprint not found';
  end if;

  return query
  select
    af.track_id,
    af.metadata->>'chromaprint_raw',
    af.duration_sec
  from public.audio_fingerprints af
  where af.track_id <> source_track_id
    and nullif(af.metadata->>'chromaprint_raw', '') is not null
    and af.chromaprint_algorithm = source_fp.chromaprint_algorithm
    and af.sha256 <> source_fp.sha256
    and (
      source_fp.duration_sec is null
      or af.duration_sec is null
      or greatest(source_fp.duration_sec, af.duration_sec) = 0
      or abs(source_fp.duration_sec - af.duration_sec) / greatest(source_fp.duration_sec, af.duration_sec) <= duration_tolerance
    )
  order by af.created_at asc;
end;
$$;

create or replace function public.record_audio_similarity_match(
  source_track_id uuid,
  candidate_track_id uuid,
  similarity_score numeric,
  worker_version text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_fp public.audio_fingerprints%rowtype;
  candidate_fp public.audio_fingerprints%rowtype;
  match_id uuid;
  source_creator_id uuid;
  severity_value text;
begin
  if source_track_id = candidate_track_id then
    raise exception 'Source and candidate tracks must differ';
  end if;

  if similarity_score < 0.90 or similarity_score > 1 then
    raise exception 'Similarity score must be between 0.90 and 1.00';
  end if;

  select * into source_fp from public.audio_fingerprints where track_id = source_track_id;
  select * into candidate_fp from public.audio_fingerprints where track_id = candidate_track_id;

  if source_fp.track_id is null or candidate_fp.track_id is null then
    raise exception 'Both fingerprints must exist';
  end if;

  if source_fp.chromaprint_algorithm <> candidate_fp.chromaprint_algorithm then
    raise exception 'Chromaprint algorithm mismatch';
  end if;

  select creator_id into source_creator_id from public.tracks where id = source_track_id;
  severity_value := case when similarity_score >= 0.97 then 'high' else 'medium' end;

  insert into public.audio_match_candidates (
    source_track_id,
    candidate_track_id,
    exact_hash_match,
    fingerprint_score,
    combined_risk_score,
    reason_codes
  ) values (
    source_track_id,
    candidate_track_id,
    false,
    similarity_score,
    similarity_score,
    array['chromaprint_similarity']
  )
  on conflict (source_track_id, candidate_track_id) do update set
    fingerprint_score = greatest(coalesce(public.audio_match_candidates.fingerprint_score, 0), excluded.fingerprint_score),
    combined_risk_score = greatest(public.audio_match_candidates.combined_risk_score, excluded.combined_risk_score),
    reason_codes = array(
      select distinct reason
      from unnest(public.audio_match_candidates.reason_codes || excluded.reason_codes) as reason
    ),
    status = 'pending'
  returning id into match_id;

  insert into public.moderation_cases (
    case_type,
    track_id,
    creator_id,
    match_candidate_id,
    severity,
    status,
    risk_score,
    reason_codes,
    summary
  )
  select
    'duplicate_upload',
    source_track_id,
    source_creator_id,
    match_id,
    severity_value,
    'open',
    similarity_score,
    array['chromaprint_similarity'],
    'Acoustic fingerprint similarity detected. Human review required; this is not a rights or ownership determination.'
  where not exists (
    select 1
    from public.moderation_cases
    where match_candidate_id = match_id
      and status <> 'closed'
  );

  update public.audio_processing_jobs
  set status = 'flagged',
      processor_version = coalesce(nullif(worker_version, ''), processor_version),
      updated_at = now()
  where track_id = source_track_id
    and status = 'completed';

  return match_id;
end;
$$;

revoke all on function public.get_audio_similarity_candidates(uuid, numeric) from public, anon, authenticated;
revoke all on function public.record_audio_similarity_match(uuid, uuid, numeric, text) from public, anon, authenticated;
grant execute on function public.get_audio_similarity_candidates(uuid, numeric) to service_role;
grant execute on function public.record_audio_similarity_match(uuid, uuid, numeric, text) to service_role;
