# V24.42B2A2A Public Creator Profile Access Repair

Base commit: `b670a386`

- Allows the anonymous restrictive video policy to evaluate creator membership.
- Does not allow Creator Free video access.
- Prevents a video-query denial from making an otherwise public creator profile appear missing.
- Restores public `/artist/:username` and `/creator/:username` pages.
