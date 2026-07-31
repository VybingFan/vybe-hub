# VYBE V24.21.1 - Back Office Operations and Notifications

## Purpose

V24.21.1 turns the administrator experience into an internal operating
workspace rather than a member/creator navigation experience.

## Added

- Administrator-first sidebar with Back Office, Management, and View VYBE
  sections.
- Member-facing Explore, Creator Studio, and Business Studio moved beneath
  View VYBE for administrators.
- Database-backed admin notifications.
- Automatic high-priority notification for every pending business application.
- Existing pending applications seeded into the work queue.
- Work Queue at `/admin/work-queue`.
- Unread badge in the administrator sidebar.
- Back Office alert card with pending business and campaign counts.
- Read and resolve notification controls.
- Business verification automatically resolves its application alert.

## Source-of-truth boundary

VYBE remains the source of truth for accounts, reviews, campaigns, creative,
placements, documents, analytics, and audit history. A future CRM may manage
prospecting and outreach but should not replace these operational records.
