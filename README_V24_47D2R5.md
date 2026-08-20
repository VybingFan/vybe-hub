# VYBE V24.47D2R5 — Four-Theme Appearance Repair

Settings > Appearance now shows exactly four choices:

- VYBE Dark
- VYBE Light
- Midnight Blue
- Warm Stage

There is no duplicate device-setting card.

Behavior:
- Clicking any card previews it immediately.
- VYBE Dark/Light use the existing native VYBE Light/Dark classes.
- Midnight Blue/Warm Stage layer direct semantic CSS-variable overrides.
- Save appearance persists the chosen mode to the signed-in VYBE profile and browser.
- Existing `profiles.appearance_theme` supports all four values already, so no migration is required.
- Installer does not stage or commit.
