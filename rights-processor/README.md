# VYBE Rights Processor — V24.76A

This is the private audio fingerprint worker foundation. It is intentionally **controlled single-job only**.

## Safety rules

- It never automatically consumes the queue.
- It requires an explicit `--job-id <uuid>`.
- Only a job currently in `queued` status can be claimed.
- The database claim/complete/fail functions are service-role only.
- Audio is downloaded from the private `music-audio` bucket to a temporary directory and deleted after processing.
- A SHA-256 match or Chromaprint signal is evidence for review, not a legal ownership or infringement determination.
- Do not run a full backfill until the controlled test sequence has passed.

## Runtime requirements

- Node 22+
- FFmpeg / `ffprobe`
- Chromaprint / `fpcalc`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- optional `VYBE_RIGHTS_PROCESSOR_VERSION` (defaults to `v24.76a0`)

The included Dockerfile installs FFmpeg and `libchromaprint-tools`.

## Before the first song

1. Apply migration `20260903094000_claim_audio_processing_job_by_id_v24_76a.sql`.
2. Build the app and confirm `/admin/fingerprints` and `/admin/rights-registry` load correctly.
3. Build the processor container.
4. Run doctor mode. This checks environment presence plus `ffprobe` and `fpcalc`; it does not touch a processing job.
5. In Admin, select one known test song from the queued list and copy its processing-job UUID.

Example container doctor:

```powershell
docker build -t vybe-rights-processor .\rights-processor
docker run --rm --env-file .\rights-processor\.env vybe-rights-processor --doctor
```

## Controlled first processing run

```powershell
docker run --rm --env-file .\rights-processor\.env vybe-rights-processor --job-id YOUR_JOB_UUID
```

Expected result for the one selected song:

- selected job moves `queued` → `processing` → `completed`, or `flagged` if an exact SHA-256 duplicate already exists;
- one `audio_fingerprints` record is inserted/upserted for that track;
- processor version is recorded;
- no unrelated queued job is claimed;
- temporary audio is removed after the run;
- a failure is recorded on that selected job rather than silently moving to another job.

## Controlled rollout after the first song passes

1. One original song.
2. Exact duplicate of that song — expect an exact-hash match candidate and human-review case.
3. Re-encoded copy — validate Chromaprint output before adding approximate-match automation.
4. Known collaborator/authorized duplicate — confirm Admin treats it as a rights-resolution case, not automatic infringement.
5. Unrelated song — confirm no false exact match.
6. Verify creator-facing access remains scoped and Admin visibility remains correct.
7. Only then design the small-batch/backfill mode.

## Important current limitation

The existing database completion function automatically creates a candidate for an **exact SHA-256 duplicate**. It stores Chromaprint for each processed recording, but it does not yet calculate approximate Chromaprint similarity against the catalog. V24.76A therefore establishes safe ingestion and exact duplicate detection first. Approximate recording similarity should be added only after the controlled fingerprints are validated.
