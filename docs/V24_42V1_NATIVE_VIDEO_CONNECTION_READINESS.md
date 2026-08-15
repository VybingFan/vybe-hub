# V24.42V1 Native Video Connection Readiness

## Included

- Server-side validation for direct-upload filename and 200MB limit.
- Thirty-minute, one-time Cloudflare Stream upload URLs.
- Creator metadata and configurable allowed playback origins.
- Native videos begin in `processing` and `private`, not publishable drafts.
- Authenticated status polling for the video's owner.
- Encoding progress, failure reason, thumbnail, duration, and ready timestamp synchronization.
- Database prevention of publishing before Stream confirms readiness.
- Video Library processing notice.

## Required server secrets

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_STREAM_API_TOKEN` with Stream Write permission
- `CLOUDFLARE_STREAM_ALLOWED_ORIGINS`, comma-separated domains

The API token must never use a `VITE_` prefix or be committed to Git.

## Required public build setting

- `VITE_CLOUDFLARE_STREAM_CUSTOMER_CODE`

This is the customer playback subdomain code, not an API credential.

## Upload boundary

The current basic POST uploader supports files up to 200MB. Cloudflare requires tus/resumable upload for files over 200MB. MP4 and MOV are supported by Stream; MP4/H.264/AAC is the preferred creator guidance.

Private signed playback is intentionally not enabled in this bundle. It will be activated with secure Film Review so VYBE does not generate inaccessible signed-only videos before token playback exists.

## Test before credentials

The native upload button must return the safe Stream-not-configured message and no file may leave the device.

## Test after credentials

1. Upload an authorized MP4 or MOV under 200MB.
2. Confirm it enters Processing and Private state.
3. Confirm progress polling begins.
4. Confirm it becomes Draft only after Stream reports ready.
5. Confirm duration and thumbnail synchronize.
6. Confirm publishing is blocked before readiness.
