# VYBE V24.39.1 — Playlist Protected Sharing

This package completes password-protected playlist access and supporter playlist saves without introducing duplicate access or engagement tables.

## Included

- Playlist owners can set, replace, or remove an eight-character-or-longer password.
- Passwords are hashed server-side with PBKDF2-SHA256, a random salt, and 210,000 iterations. Plain passwords are never stored.
- Listeners receive the existing unique playlist URL and enter the creator-provided password on the protected page.
- Approved-listener playlists continue to validate the signed-in listener's normalized email, expiration, revocation, and play-limit fields.
- Signed-in accounts in Supporter Mode can save or unsave a playlist using `identity_reactions` with `entity_type = 'playlist'`.
- Membership-only selection is disabled until VYBE has listener-to-creator subscription entitlements. Creator plan billing is not used as a substitute.

## Database

No new migration is required. This package uses the existing `playlists.access_password_hash`, `playlist_access_grants`, `media_access_events`, and `identity_reactions` structures.

## Verification

1. Build the app.
2. Create an unlisted playlist and open Manage Playlist.
3. Change access to Password protected, set a password, and save the playlist.
4. Open its link in a private browser window. Confirm a wrong password is rejected and the correct password opens the playlist.
5. Test an approved-listener playlist with the invited and uninvited email accounts.
6. Sign in in Supporter Mode and verify Save playlist and Saved toggle correctly.
7. Confirm protected playlists are not listed on the creator's public profile.

