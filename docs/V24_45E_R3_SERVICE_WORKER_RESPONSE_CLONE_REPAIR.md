# V24.45E R3 — Service Worker Response Clone Repair

## Base
`30172f66`

## Why R3
The R2 installer expected an exact multi-line text block in `public/sw.js`. The live repository has the same logic, but the exact formatting did not match the R2 anchor.

R3 uses a regular-expression replacement around the actual PWA/static fetch branch instead of relying on exact whitespace formatting.

## Repair
- bumps cache version from `vybe-v24-45e` to `vybe-v24-45e-r3`;
- clones the response synchronously before returning it;
- caches the already-cloned response via `event.waitUntil`;
- leaves the original response for the browser;
- changes no Supabase objects.

## Scope
- `public/sw.js`
- this documentation file
