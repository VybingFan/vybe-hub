# VYBE rights processor

This is the native audio-analysis worker for the VYBE rights-monitoring control
plane. It runs separately from the React/TanStack application and Cloudflare
Worker because FFmpeg and `fpcalc` require native executables.

It currently:

- claims queued jobs atomically through Supabase RPC;
- downloads the private VYBE audio object with a service-role credential;
- calculates the canonical SHA-256 hash;
- extracts technical and embedded metadata with FFprobe;
- generates a Chromaprint fingerprint with `fpcalc`;
- completes or fails the job through restricted RPC functions; and
- opens a human-review case when an exact VYBE-internal hash match is found.

Required secrets:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Optional settings:

```text
PROCESSOR_VERSION=vybe-rights-processor-v1
POLL_SECONDS=15
```

Build the container from this directory. Do not put the service-role key in the
browser, the main VYBE repository's public environment variables, or a bundle
shared outside the trusted development team.

The processor is deliberately not deployed by the V24.16 application release.
Choose a private container host, configure secrets there, run one worker first,
and verify the moderation queue before increasing concurrency.

Chromaprint matches similarity; it does not establish copyright ownership.
VYBE must treat every automated result as a review signal, not a legal decision.
