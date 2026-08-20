# VYBE V24.46F2 — Native Video Public Publish Repair

## Problem
Cloudflare Stream native uploads begin with `visibility = private` while processing. The existing Publish action only changed `status` to `published`, leaving the native video private. Public `/video/:id` retrieval correctly requires `visibility` to be `public` or `unlisted`, so signed-out visitors saw "This video is not available."

## Repair
- When publishing:
  - preserve `public`
  - preserve `unlisted`
  - promote `private` to `public`
- When moving back to draft:
  - only change `status`
  - keep the current visibility value
- No database migration.
- No Cloudflare credential changes.
- No files are staged or committed by the installer.
