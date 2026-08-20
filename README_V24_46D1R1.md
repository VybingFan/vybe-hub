# VYBE V24.46D1R1 — Engagement Notification Sound Wiring

This is a small follow-up to V24.46D1.

## What it changes

VYBE already has:
- a Notification preferences tab in Settings
- a toggle labeled **Play a chime for new activity while VYBE is open**
- `playNotificationChime()` Web Audio support
- existing sound behavior for playlist/activity notifications

D1R1 extends that same existing sound system to the new creator identity notifications introduced in D1:
- new follower
- new comment
- track like
- track save

## Behavior

- The user's existing `sound` preference remains the single source of truth.
- No new sound setting is created.
- No new audio file is added.
- No database migration is required.
- Old notifications loaded when the page first opens do not chime.
- A genuinely new notification received while VYBE is open can chime when sound is enabled.

## Safety

The installer:
- verifies the exact current D1 TopNav sound block before changing it
- backs up `TopNav.tsx`
- changes only `src/components/layout/TopNav.tsx`
- does not stage files
- does not commit
