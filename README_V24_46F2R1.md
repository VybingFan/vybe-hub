# VYBE V24.46F2R1 — Native Video Publish Visibility Enforcement

This adds a database trigger so unsigned Cloudflare Stream videos cannot remain `private`
when they are published. If a native video is `cloudflare_stream`, `published`, `private`,
and `stream_require_signed_urls = false`, Supabase promotes it to `public`.

Signed/private future video flows remain available when `stream_require_signed_urls = true`.

No automatic backfill is performed. No Cloudflare credentials are changed.
