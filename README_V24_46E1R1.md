# VYBE V24.46E1R1 — Now Playing Experience Foundation

E1 extends the existing CreatorContinuationPlayer rather than replacing it.

## Membership ladder

- Creator Free → Standard
- Creator Plus → Immersive
- Creator Pro → Motion
- Creator Studio → Motion+
- Founding Creator → Motion because founding_beta normalizes to Creator Pro

## E1 behavior

- Existing docked audio playback remains the single playback engine.
- Creator Plus, Pro, and Studio public music experiences gain an expand control.
- The expand control opens a larger VYBE Now Playing experience with:
  - large artwork
  - song and creator identity
  - seek/progress
  - previous / play-pause / next / repeat
  - volume
  - follow
  - track support actions
  - an ambient presentation layer ready for artwork-derived color in E2
- Creator Free keeps the standard docked player.
- Pro/Studio entitlement levels are established now, but motion itself is intentionally deferred to E3/E4.
- No database migration is required.

## Safety

The installer:
- requires the current membership entitlement helper
- requires the current public creator route and player anchors
- backs up every existing file it modifies
- adds only one new component
- does not stage files
- does not commit


## R1 installer repair

R1 removes the non-ASCII curly-apostrophe anchor from the PowerShell patch logic and saves the installer with a UTF-8 BOM for Windows PowerShell 5.1 compatibility. Feature behavior is unchanged from E1.
