# V24.43B Playback Event Foundation

Adds privacy-safe listening-progress collection to shared VYBE playlists.

## Recorded

- Anonymous listener session and individual playback session
- Track, playlist, creator, duration, accumulated listening seconds, and maximum position
- 25%, 50%, 75%, and 90% listening thresholds
- Qualified and completed playback timestamps
- Repeat listening can be calculated without exposing listener identity

## Integrity controls

- Only published playlists and tracks belonging to the playlist are accepted.
- Each progress request can add no more than 15 seconds.
- Browser seeking is excluded from accumulated listening time.
- Completion requires sufficient accumulated listening plus reaching the end region.
- Signed-in creator self-plays are marked so reporting can exclude them.
- Raw anonymous session rows are not exposed to creators; V24.43C will return only owner-scoped aggregates.

V24.43C will aggregate these records into the Creator Insights Music and retention views.
