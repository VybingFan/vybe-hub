# VYBE V24.47C1R1 — Onboarding + VYBE Guide Installer Repair

Repairs the original 47C1 installer to match the current VYBE source.

Fixes:
- avoids the PowerShell `R` alias collision;
- matches the current auth.onboarding.tsx block;
- matches the current AppSidebar.tsx Communities anchor;
- preserves the existing auth.redirect.tsx logic and inserts the one-time guide redirect safely.

No database migration is included.
No files are staged and no commit is created.
