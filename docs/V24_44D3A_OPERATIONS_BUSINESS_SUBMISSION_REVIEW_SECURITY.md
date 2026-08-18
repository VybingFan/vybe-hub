# V24.44D3A — Operations Business Submission Review Security

## Base
`068758df32eb2858233122efdba53ca6f0b8c246`

## Purpose
Create the server-controlled review boundary before adding Operations review buttons.

## Changes
- Adds `business_submission_review_events` as staff-readable audit history.
- Removes the broad `Business administrators manage submissions` ALL policy.
- Keeps staff SELECT access through the existing `admin.business.read` policy.
- Adds `review_business_submission(...)`, requiring `admin.business.manage`.
- Permits controlled actions: `start_review`, `approve`, `decline`, `update_response`, `update_internal_notes`.
- Prevents Operations review of business drafts and withdrawn requests.
- Enforces submitted → under_review → approved/declined transitions.
- Records reviewer identity and review timestamp.
- Keeps `business_response` separate from private `internal_notes`.

## Important
The business-owner policies and `submit_my_business_submission()` remain unchanged.

D3A intentionally contains no Operations UI. D3B should consume the controlled RPC only after D3A is deployed and verified.
