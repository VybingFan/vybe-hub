# V24.45E R5 — Service Worker Clone Repair

## Base
`7f53ada3`

## Why R5
R4 failed because its installer still relied on exact multi-line matching for the navigation cache block.

R5 uses targeted regular-expression replacements for the two remaining cache-write patterns in `public/sw.js`.

## Repair
R5 changes:
- navigation Play-page caching;
- general static-asset network caching;
- service-worker cache version.

In both response-returning branches, the network `Response` is cloned immediately and the cloned copy is passed into an `event.waitUntil(...)` cache write before the original response is returned to the browser.

The activation-time Play cache is intentionally unchanged because that response is not also returned to a browser client.

## Scope
- `public/sw.js`
- this documentation file

No Supabase migration is included or applied.
