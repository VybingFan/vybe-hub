# VYBE V24.46D1 — Creator Engagement Center

This build closes the creator/supporter engagement gaps identified during live testing.

## Public creator comments
Comments now display:
- supporter profile photo (with initials fallback)
- supporter display name
- @username/tag when available
- comment text
- date/time

## Creator Insights → Engagement
Followers, Likes, Saves, and Comments become clickable.
Selecting a card shows the actual supporter activity behind the number.

The database activity summary is also corrected so:
- track likes are attributed through `tracks.creator_id`
- saves are based on actual additions to supporter saved-music lists
- comments remain tied to the creator profile
- follows remain tied to the creator identity

## Creator notifications
The existing `identity_notifications` foundation is reused.

Already-existing follower notifications remain intact.

New notifications are generated for:
- supporter comments on the creator profile
- track likes
- track saves

The existing TopNav playlist activity remains in place, so shared-playlist opens/playback continue to surface through the bell/activity system.

The creator bell also gains the identity-aware notifications above, including supporter name/tag and avatar.

## Safety
The installer:
- backs up every existing file before changing it
- adds one migration
- does not push Supabase
- does not stage files
- does not commit
