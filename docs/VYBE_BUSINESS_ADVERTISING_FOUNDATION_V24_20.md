# VYBE V24.20 - Business Advertising Foundation

## Purpose

V24.20 establishes the secure, admin-managed operating foundation required for
the Founding Business Preview, Founding Business Partner package, custom
campaigns, advertising measurement, and partner records.

## Added

- Business packages seeded as:
  - Founding Business Preview: free for 60 days.
  - Founding Business Partner: $499 annually.
  - Custom Campaign or Sponsorship: manually scoped.
- Business profiles and verification states.
- Business offers and redemption records.
- Campaigns, creatives, placements, and approval states.
- Campaign analytics events with session deduplication for impressions.
- Partner document records.
- Business audit history.
- Admin-only Business Operations route at `/admin/businesses`.
- Business summary metrics in the Back Office.
- Admin flows to create and verify a partner and open a draft campaign.

## Release boundary

This bundle does not publish advertisements to members. Public rendering must
only be connected after:

1. A business is verified.
2. Its campaign is approved or scheduled.
3. Its creative is approved.
4. Its placement is approved, scheduled, and within its active window.
5. The public surface includes the sponsored-content disclosure.
6. Impression and click calls are connected to the placement event RPC.

## Security

- Business operational tables use row-level security.
- Authenticated administrators are the only browser users allowed to manage
  business records.
- Public event recording accepts a limited list of event types and rejects
  placements that are not approved and in schedule.
- Business documents remain administrative records until partner-scoped access
  is implemented.

## Next bundle

V24.20.1 should add the campaign-detail workflow:

- Offer editor.
- Creative editor and asset approval.
- Placement scheduler.
- Partner document upload records.
- Status transition controls and approval history.
- Verified analytics detail and report export.

Public placement rendering should follow in a separate controlled bundle after
V24.20.1 is verified.
