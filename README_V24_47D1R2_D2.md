# VYBE V24.47D1R2 + V24.47D2

Corrects the creator-background interpretation and adds the separate VYBE interface Appearance system.

## V24.47D1R2
- Removes color-preset themes from Profile & Discovery.
- Keeps the public creator full-page image background as a separate creator-branding feature.
- Creator Pro / Founding Creator / Creator Studio may upload the public-page background.
- Adds a persistent sticky Save Profile action bar so profile edits are always saveable.
- Existing remote D1 profile columns remain valid; no second creator-profile migration is needed.

## V24.47D2
Settings > Appearance:
- Use device setting
- VYBE Dark
- VYBE Light
- Midnight Blue
- Warm Stage

Behavior:
- Immediate preview on selection.
- Explicit Save appearance button.
- Signed-in preference saves to public.profiles.appearance_theme.
- Browser persistence remains available and is used for signed-out visitors.
- App startup applies the saved/browser preference through semantic CSS variables.
- Existing `bg-background`, `bg-card`, `text-foreground`, `border-border`, etc. automatically inherit the chosen appearance.

The installer does not push migrations, stage files, or create a commit.
