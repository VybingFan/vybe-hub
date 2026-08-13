# VYBE V24.41H — Membership, Privacy & Access Audit

## Release rule

V24.41H is diagnostic only. It must not alter creator content, membership
assignments, public visibility, continuity choices, seller status, or checkout.

## Source-of-truth review

The audit treats these layers separately and reports disagreement:

1. Product promise — plan names, prices, features, and quotas.
2. Creator experience — visible locks and upgrade explanations.
3. Application authorization — route and action checks.
4. Database enforcement — RLS, triggers, and RPC authorization.
5. Public presentation — only deliberately public, eligible content.
6. Downgrade continuity — 30-day selection and retained-private behavior.
7. Commerce safety — rights approval, permanent editions, seller readiness,
   checkout state, and buyer continuity.
8. Listening continuity — requested content, same-creator continuation,
   optional discovery, queue controls, and access checks for every next item.

## Known review items

- Commerce exists in the product but is not yet a first-class creator
  entitlement in the shared entitlement catalog.
- Commerce products are not yet included in the downgrade continuity selector.
- Public media signing should have one documented duration policy; helper
  parameters and actual signed URL lifetimes must agree.
- Top 5 and playlist playback need a defined continuation contract. VYBE must
  not silently move a listener from one creator to another without an enabled
  discovery choice.
- Every privileged feature needs three protections: creator-facing lock,
  server/database enforcement, and clean public behavior.
- Free and Plus must not be presented as full creator websites.
- Protected sharing, full EPK, creator-mode browsing, analytics depth, team
  access, commerce, Lives, interviews, rewards, and future programs need
  explicit entitlement ownership.

## Privacy vocabulary

| State | Meaning |
|---|---|
| Public | Discoverable on an approved public surface. |
| Unlisted | Available only through its direct link; not discovery. |
| Private | Creator/admin only unless another explicit grant applies. |
| Protected | Password, approved-listener, membership, sign-in, or expiry rules apply. |
| Commerce edition | Immutable sale edition after first purchase; buyers retain granted access. |
| Archived | Retained in the creator workspace but unavailable publicly. |

## Recommended continuous-play contract

### Artist's Top 5

1. Play the selected Top 5 song.
2. Continue through the remaining Top 5 positions without repeating songs.
3. Continue with eligible songs from the same creator.
4. Let the listener sort that same-creator continuation by:
   - newest added;
   - oldest added;
   - newest release;
   - oldest release;
   - title A–Z;
   - title Z–A.
5. Only after the creator catalog ends, offer—not force—one of:
   - similar creators;
   - VYBE Top 50 across all genres;
   - VYBE Top 50 in the current genre;
   - stop playback.

### Creator playlist

1. Preserve the creator's exact playlist order.
2. After the final song, default to more eligible music from that same creator.
3. Offer similar creators and VYBE charts as explicit discovery modes.
4. Never reveal or enqueue a private, expired, archived, no-playback, or
   otherwise unauthorized song.

### Player controls

- Autoplay on/off.
- Queue view with the reason each song was added.
- Same-creator sort control.
- Shuffle and repeat.
- Continue with similar creators toggle.
- Chart continuation choice: all genres or current genre.
- Clear boundary notice before playback changes to another creator.

### Algorithm requirements

- Use only public and playable music unless the listener has a valid grant or
  purchase entitlement.
- Recheck access when each song begins, not only when the queue is created.
- Exclude already-played songs during the session unless repeat is enabled.
- Let creators opt eligible songs out of recommendations.
- Treat Top 50 as a documented chart, not an undisclosed paid placement.
- Label sponsored or promoted placement distinctly.
- Record the queue source without exposing private listener data.

## Corrective sequence after this audit

1. V24.41H1 — unify the entitlement registry and close enforcement gaps.
2. V24.41H2 — normalize privacy, signed-media, and public-page behavior.
3. V24.41H3 — include commerce and all public surfaces in continuity handling.
4. Configure and test Stripe Connect in test mode.
5. V24.41G2D — add checkout, webhook verification, orders, entitlements,
   refunds, and buyer-library fulfillment.

## Acceptance criteria

- The admin audit page opens from Management.
- Only administrators with membership/finance permission can run the audit.
- Results contain counts and corrective guidance, never secrets.
- The audit exposes no passwords, Stripe account IDs, banking data, emails, or
  private media URLs.
- Re-running the audit makes no content or entitlement changes.
- The playback review shows a deterministic path for Top 5, playlists,
  same-creator catalog continuation, similar creators, and VYBE charts.
