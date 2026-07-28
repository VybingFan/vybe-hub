# VYBE Rights Monitoring Foundation — V24.16

## Decision

The proposed phased structure is directionally correct. VYBE should treat it as
two connected systems:

1. **Control plane in the existing VYBE application:** job queue, fingerprint
   registry, rights evidence records, moderation cases, audit events, and the
   admin monitor.
2. **Native processor in a private container:** FFmpeg/FFprobe, SHA-256, and
   Chromaprint (`fpcalc`).

This prevents native binaries and the Supabase service-role key from entering
the browser or the current Cloudflare Worker.

## Included in V24.16

- automatic processing job creation after every new track;
- automatic requeue when a track's audio file is replaced;
- atomic job claiming for one or more future processors;
- SHA-256 and Chromaprint storage;
- technical and embedded metadata storage;
- exact internal duplicate detection;
- automated creation of a human-review case for exact matches;
- private rights-document storage and review records;
- append-only moderation event foundation;
- row-level security and service-role-only processor functions;
- an expanded `/admin/rights` dashboard for job health, cases, and reports; and
- a Docker-based Python processor scaffold.

Existing tracks are marked `skipped` instead of flooding an unconnected
processor. Administrators can requeue them after processor deployment.

## What this release does not claim

- It does not search the worldwide commercial music catalog.
- A fingerprint match does not prove ownership or infringement.
- An uploaded license is accepted for the record, not legally verified.
- It does not automatically delete, block, or suspend users.
- It does not deploy the native processor.
- It does not add Dejavu yet.

## Corrections to the supplied proposal

- Suno Bark is a text-to-speech model, not the recommended tool for separating
  vocals from an instrumental.
- A 70% match threshold should not be hard-coded before testing on VYBE's real
  files and receiving provider guidance.
- SHA-256 detects byte-identical files only. Re-encoding changes the hash.
- Chromaprint is useful for VYBE-internal similarity and duplicate signals, but
  it is not a replacement for a licensed commercial reference catalog.
- Dejavu is best treated as an optional evaluation after the first pipeline has
  measurable precision, recall, cost, and operational stability.

## Safe deployment order

1. Deploy V24.16 and apply its Supabase migration.
2. Confirm `/admin/rights` shows the processing monitor.
3. Upload a test track and confirm a `queued` job appears.
4. Select a private container host and configure:
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
5. Deploy one processor instance from `services/rights-processor`.
6. Confirm one authorized test upload reaches `completed`.
7. Upload the exact same file under a controlled test account and confirm:
   `flagged` job → match candidate → moderation case.
8. Test false-positive and appeal workflows before any automated publishing
   restriction.

## Next product phase

Build the creator evidence and moderator decision experience:

- creator rights-document uploader tied to a track;
- creator-facing processing status with plain-language explanations;
- moderator case detail page with both tracks and evidence;
- request-more-information workflow;
- immutable decision and action history;
- documented retention/deletion rules;
- repeat-infringer policy implementation based on reviewed outcomes; and
- notification templates for holds, evidence requests, removals, and appeals.

Before broad public launch, an attorney should review VYBE's terms, copyright
policy, DMCA agent/notice process, repeat-infringer policy, evidence retention,
counter-notice handling, and jurisdiction-specific obligations.
