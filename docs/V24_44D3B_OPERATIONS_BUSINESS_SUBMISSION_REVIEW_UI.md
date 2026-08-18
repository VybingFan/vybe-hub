# V24.44D3B — Operations Business Submission Review UI

## Base
`5d8c2368c180e3c06ff556d81ded450ed05b6d7c`

Dependency: V24.44D3A deployed and verified.

## Purpose
Connect the existing VYBE Business Operations workspace to the controlled D3A review boundary.

## Operations workflow
Staff with `admin.business.read` can:
- see submitted, under-review, approved, declined, and withdrawn external business requests;
- inspect the business, request type, summary, request details, timestamps, business-visible response, and internal notes;
- inspect immutable review-event history.

Staff with `admin.business.manage` can:
- start review of a submitted request;
- save/update the business-visible response after review begins;
- save/update private internal notes after review begins;
- approve a request that is under review;
- decline a request that is under review.

All mutations use `review_business_submission(...)`. The browser does not directly update review-controlled columns.

## Preserved
- Existing Business Operations page and business directory.
- Existing business verification/package/campaign workflows.
- Existing Business Portal external submission flow.
- D3A audit history.
- Dedicated Operations authentication boundary.
- No Supabase migration in D3B.

## Production verification
1. Operations `/admin/businesses` loads normally.
2. A Business Portal submitted request appears in `Incoming business requests`.
3. Read-only business staff can view but do not receive management controls.
4. Authorized staff can start review.
5. Status becomes `under review`.
6. Business-visible response can be saved.
7. Internal notes can be saved independently.
8. Audit history records each action.
9. Under-review request can be approved or declined.
10. Approved/declined status persists after refresh.
11. The business sees only `business_response`, never `internal_notes`.
12. Existing business directory/campaign operations remain normal.
