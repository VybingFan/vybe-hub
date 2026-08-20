# VYBE V24.46F1R1 — Stream Processing & Live Copy Cleanup

This patch improves the existing Cloudflare Stream Video Library experience without changing the upload architecture.

## Changes
- Replaces pre-activation Cloudflare Stream messaging with live-production copy.
- Prevents Cloudflare Stream iframes from rendering while a native video is still processing.
- Shows a clear processing placeholder instead of a black player error.
- Shows a clear failed-processing placeholder when Stream reports a failure.
- Improves status badges so Processing, Failed, Draft, and Published are distinct.
- Disables Publish while a native video is still processing or failed.
- Cleans the visible encoding artifacts in the video UI.
- Keeps YouTube/Vimeo behavior unchanged.
- No database migration.
- No Cloudflare credential changes.
- No files are staged or committed by the installer.
