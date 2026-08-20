# VYBE V24.46C1R3 — Creator Events & Updates

Adds a creator-owned **Events & Updates** workspace and a public-profile **What’s Happening** website menu option/section.

Creators can post shows, appearances, festivals, screenings, podcast/interview appearances, workshops/classes, meet & greets, livestreams, releases/launches, promotions/specials, announcements/updates, and other items.

Each post supports title, details, optional date/time, location, flyer/image, an external destination URL, CTA text, and draft/published status.

The public creator website displays flyer/image, type, title, date/time, location, description, and external CTA. Clicking the flyer opens the full image.

This build intentionally does not introduce another native-video uploader. External media should link to its hosted destination. Native video remains in the existing Video Library.

The installer does not push Supabase, stage Git files, or commit anything.


R3 uses a whitespace-tolerant, line-ending-tolerant regex that must match exactly one Music Library navigation block before inserting Events & Updates.
