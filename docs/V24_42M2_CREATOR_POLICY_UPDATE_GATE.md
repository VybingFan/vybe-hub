# VYBE V24.42M2 Creator Policy Update Gate

Connects the existing creator compliance acceptance to the authenticated VYBE policy gate.

Creator accounts with an outdated Creator Upload or Repeat Infringer acceptance are stopped after sign-in and shown the current documents, a separate confirmation checkbox, and an acceptance action before continuing.

General account-policy acceptance and creator-policy acceptance remain separate. Optional announcements and marketing consent are not bundled with required legal acceptance.

The database remains the source of truth for the current creator-policy versions. When a future migration changes a required version, the gate automatically appears again for creator accounts that have not accepted it.

No database migration is included in this bundle.

