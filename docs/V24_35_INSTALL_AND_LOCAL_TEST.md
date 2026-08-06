# VYBE V24.35 - Music Privacy & Protected Sharing

## Installation on top of the validated V24.34.1 local branch

This Git bundle contains commit `Add V24.35 music privacy and protected sharing` on branch `vybe-music-privacy-v24-35`.

Because your validated V24.34.1 fixes are local and newer than the downloaded V24.34.1 bundle, import V24.35 and cherry-pick its feature commit instead of replacing your current branch.

```powershell
git fetch "C:\Users\BDPro\Downloads\VYBE_V24.35_Music_Privacy_Protected_Sharing.bundle" vybe-music-privacy-v24-35:vybe-music-privacy-v24-35
git checkout vybe-account-deletion-v24-34-1
git cherry-pick vybe-music-privacy-v24-35
```

Then apply `supabase/migrations/be1eb9d8010000_music_privacy_protected_sharing_v24_35.sql` in the Supabase SQL Editor or through the normal migration workflow.

## Local tests

1. Upload a new track as Public + Full.
2. Upload a new track as Public + Preview, choose 15/30/45/60 seconds and a start point.
3. Confirm a separate WAV file appears in the private `music-previews` bucket.
4. Confirm the public creator page receives the preview URL rather than the original MP3.
5. Set a track to Visible + No Playback and confirm the player shows Playback Restricted.
6. Set a track to Private and confirm it no longer appears on public creator and discovery pages.
7. Edit an existing song and change visibility/playback controls.
8. Set a playlist to Unlisted and confirm it remains accessible by direct link but is not intended for discovery.
9. Set playlist access to Password/Approved listeners and verify the protected-sharing foundation fields save.
10. Run `npm run build` and `npm run lint` locally.

## Important protection notes

- The preview is a separate generated WAV object. The full MP3 is not sent for preview playback.
- Audio URLs use short-lived signed URLs.
- `controlsList="nodownload noremoteplayback"` discourages browser downloads but is not DRM.
- No browser-based system can prevent external recording of audible sound.
- Password verification and approved-listener grant management are represented in the database foundation; the dedicated access-grant UI is the next hardening step before production use of those two modes.
