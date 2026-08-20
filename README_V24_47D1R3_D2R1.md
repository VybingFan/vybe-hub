# VYBE V24.47D1R3 + V24.47D2R1 Repair

This repair addresses two browser-tested issues.

## V24.47D2R1 — Appearance
- Preserves VYBE's existing native Light / Dark / device behavior.
- The added Appearance choices are only Midnight Blue and Warm Stage.
- Extra appearance colors are applied through `data-appearance`, not by replacing `.light` / `.dark`.
- Higher-specificity semantic CSS variables make the preview visibly update immediately.
- Save appearance persists the extra color scheme to the signed-in profile and local browser.
- A "Use standard VYBE colors" action removes the extra scheme and returns control to VYBE's existing appearance.

## V24.47D1R3 — Creator public background
- Keeps creator background separate from the cover image.
- Explicitly supports Founding Creator background rendering.
- Ensures the public creator service hydrates the saved background path into a signed URL.
- Adds a public-page custom-background marker so normal VYBE background surfaces become translucent enough for the image to remain visible.
- Keeps the readability overlay.
- No database migration is added; the D1 and D2 columns are already remote.

The installer backs up modified files and does not stage or commit.
