# VYBE Platform Constants / Non-Negotiables

Purpose: preserve approved VYBE behavior whenever features, layouts, memberships, mobile views, demos, or infrastructure are changed.

Status key:
- LOCKED = do not change unless explicitly approved.
- VERIFY = regression-test after related work.
- PRINCIPLE = design rule that guides implementation.

## 1. Music / Playback

### LOCKED — Persistent bottom player
When music is actively selected or playing, the player remains fixed/docked at the bottom of the experience while the user scrolls.
It must not scroll away with page content.

Current code confirms this pattern in:
- `src/routes/discover.music.tsx`
- `src/components/music/CreatorContinuationPlayer.tsx`
- `src/components/playlists/SharedPlaylistPlayer.tsx`

### LOCKED — Core playback controls
The persistent player must preserve:
- current track title and creator/artist identity
- previous track
- play/pause
- next track
- mute/unmute
- volume control where screen size allows
- visible playback/progress state
### VERIFY — Queue continuity
Moving between tracks should continue through the eligible queue without unexpectedly restarting already-played content.
End-of-track behavior must respect the intended next-track logic.

### VERIFY — Playback eligibility
A player must never bypass:
- content privacy
- playlist access mode
- sign-in requirements
- membership restrictions
- expiry rules
- creator-set availability

### LOCKED — Shared playlist first view
A shared playlist should present the listening experience immediately.
The supporter should not have to hunt for the player before understanding what was shared.

### VERIFIED — Shared playlist bottom dock
Verified on desktop and mobile: active shared-playlist playback remains fixed to the bottom of the browser viewport while the visitor scrolls.

### LOCKED — Shared-link autoplay contract
When a shared playlist opens, VYBE attempts to start the first eligible song automatically.
If the browser blocks audible autoplay on a fresh page load, VYBE falls back to a clear one-tap Play action while preserving the correct first track, queue, artwork, and fixed bottom dock.
Browser autoplay blocking is not a VYBE regression as long as the autoplay attempt occurs and the fallback remains immediate and obvious.

## 2. Public / Private Content

### LOCKED — Creator controls visibility
Songs, playlists, written work, video, and professional information remain creator-controlled.
Private content must not become public because of a UI redesign.

### LOCKED — Public playlist eligibility
A playlist shown publicly must remain subject to its publishing/access rules.
Public profile display remains separately controlled by `show_on_public_profile`.

### LOCKED — Public ordering
Creator-selected display order remains respected through `profile_display_order`.
### VERIFY — Expiring/restricted access
Password, approved-listener, expiring-link, private, and other restricted modes must remain enforced after changes.

### LOCKED — Purchased access
Removing a purchased/permanent item from future sale must not silently remove access from people who already purchased it.

## 3. Membership / Entitlements

### LOCKED — Membership is enforced in behavior, not just labels
Free, Plus, Pro, and Studio differences must be enforced by entitlements and route/access logic.

### LOCKED — Public presence tiers remain distinct
Creator Free remains a compact creator profile: identity first, selected public items, no full website navigation, and no full website-style layout.

Creator Plus may use a website-style Creator Showcase with banner, identity, navigation-style sections, Top 5, selected catalog, stories, EPK Lite, merch, and public links. It must not inherit the deeper professional Creator Website capabilities reserved for Pro.

Creator Pro unlocks the fuller professional Creator Website, Full EPK, professional access controls, broader capacity, and advanced professional workflow.

Creator Studio builds on Pro with advanced team-managed website/workspace capabilities.

Refactors must preserve these differences rather than flattening the tiers into one public-profile experience.

### VERIFIED — Creator public profile
Verified in localhost review: creator identity remains prominent, music is immediately accessible with the persistent bottom player, public sections remain organized, and desktop/mobile both preserve the creator presentation and playback experience.

### LOCKED — Video access remains entitlement-controlled
Video library access must continue to use membership/capability enforcement.

### LOCKED — Founding beta mapping
Where the current entitlement model maps `founding_beta` to Pro-equivalent creator access, future changes must preserve that rule unless the Founding Creator offer is intentionally revised.

### VERIFY — Membership regression
Any work touching navigation, routing, creator pages, public profiles, media, checkout, or plan catalog must include a membership regression check.

### VERIFIED — Membership tier presentation
Verified in localhost review: Free, Plus, and Pro present clearly different creator experiences, higher-tier value is understandable, and locked features remain visible/educational rather than disappearing without context.

## 4. Identity / Roles
### LOCKED — One account, distinct identities
Supporter, Creator, Business, Partner, and Admin experiences must remain logically distinct even when one account can hold multiple roles/identities.

### LOCKED — Active identity owns the action
Likes, follows, saves, comments, replies, publishing, professional messages, and business/partner actions should be attributed to the active identity where identity-aware behavior applies.

### LOCKED — Workspace separation
Creator Studio, Business Portal/Studio, Partner Studio, Supporter experience, and Back Office must not collapse into one mixed navigation experience.

### LOCKED — Admin/back-office protection
Administrative functionality remains role/permission protected and must not leak into ordinary creator/supporter/business routes.

## 5. Creator Control / Professional Presence

### LOCKED — Creator owns professional exposure
Partners and businesses only see professional information the creator has chosen to expose.

### LOCKED — Private contact information stays private
No redesign should automatically expose private email, phone, management, booking, or other contact information.

### LOCKED — Media Kit / EPK remains reusable
Professional creator information should remain usable across public profile, partner discovery, submissions, opportunities, and professional outreach.

### PRINCIPLE — “Open To” remains creator-controlled
Creators decide which professional conversations they are open to.
## 6. Desktop / Mobile / Responsive Behavior

### LOCKED — Approved desktop behavior is not collateral damage
A mobile fix must not redesign or break a previously approved desktop experience unless the task explicitly includes desktop redesign.

### LOCKED — Responsive, not duplicated
Mobile should adapt the same product behavior through responsive layout rather than becoming a separate product with conflicting rules.

### VERIFY — Both breakpoints after structural UI work
After navigation, player, profile, workspace, or major layout changes:
- verify desktop
- verify mobile
- verify scroll behavior
- verify overlays do not cover critical controls

### VERIFY — Bottom UI collision
Persistent music player, mobile primary navigation, drawers, notices, and modal sheets must not overlap in a way that blocks essential actions.

### VERIFIED — Desktop/mobile navigation
Verified in localhost review: Supporter, Creator, Business, and Admin navigation remain distinct by workspace on desktop and mobile, and active playback does not make essential navigation controls unreachable.

## 7. Navigation / Discoverability

### LOCKED — Public visitor paths remain usable
Creators must be able to understand or preview what supporters/public visitors see.

### VERIFY — Search has a clear reset path
Search inputs that can retain typed state should provide an obvious way to clear/reset where appropriate.

### PRINCIPLE — VYBE should reduce hunting
Important shared content, player state, creator identity, and professional actions should be visible without unnecessary navigation.

## 8. Find It Again / Saved Discovery
### LOCKED — Saved discovery remains retrievable
Content intentionally saved for later should remain discoverable through Find It Again or its successor.

### PRINCIPLE — Short-lived feeds should not erase useful context
Important posts, opportunities, creator discoveries, and saved external/social references should be retrievable later.

## 9. Analytics / Creator Insights

### LOCKED — Self-listening should not inflate creator performance
Creator-owned/self playback should remain excluded where creator analytics are intended to measure audience behavior.

### LOCKED — Qualified play logic cannot be reduced to “audio started”
Retention/progress rules should remain meaningful and should not be weakened by UI changes.

### VERIFY — Analytics changes preserve privacy and access rules
Tracking must not become a reason to bypass content restrictions or expose private user data.

## 10. Safety / Rights / Trust

### LOCKED — Rights and upload safeguards survive redesigns
Upload policy acceptance, copyright declarations, rights checks, and related gating must remain enforced even if the upload UI changes.

### PRINCIPLE — Duplicate-content/permission workflows should favor creator verification
Where the same work can legitimately appear in multiple places, creators need a clear permission/claim path rather than silent acceptance.

### LOCKED — Partner verification before broad professional outreach
Founding/Opportunity partners should not receive broad professional access simply by self-declaring.
## 11. Founding Opportunity Network

### LOCKED — Founding Partner is not an ownership claim
Founding Partner status does not automatically imply legal partnership, equity, revenue share, endorsement, or guaranteed opportunities.

### LOCKED — No forced opportunity quota
Founding Partners are not required to guarantee jobs, referrals, placements, funding, promotion, or a minimum number of opportunities unless separately contracted.

### PRINCIPLE — Two-way professional discovery
VYBE should support:
- partner discovers creator
- creator submits to approved opportunity
- both sides can continue through a structured relationship pipeline

## 12. Deployment / Development Discipline

### LOCKED — Inspect before changing
Before modifying established VYBE behavior, inspect the current implementation and surrounding dependencies.

### LOCKED — Focused staging
Do not use `git add .` in this repo.
Stage only intentional files for the current phase.

### LOCKED — Protect unrelated untracked work
Do not delete, stage, reset, or overwrite unrelated untracked files or prior bundle leftovers during a focused fix.

### LOCKED — Local validation before production
Preferred flow:
inspect → change → local build/test → verify → commit → push → deploy → public verification.
### VERIFY — Production means public verification
A successful build or Git push is not the same as a successful release.
After deployment, verify the actual public route and the intended behavior.

## 13. Change-Control Rule

Any future task that touches a LOCKED item must explicitly answer:

1. Does this change intentionally modify a platform constant?
2. If no, how was the constant regression-tested?
3. If yes, was the change explicitly approved?
4. Which desktop/mobile/public/authenticated views were re-verified?

## Immediate regression checklist

Before calling a major VYBE update complete, verify at minimum:
- bottom music player remains stationary while scrolling
- play/pause/previous/next/mute still work
- shared playlist first view still exposes playback immediately
- public/private content stays correctly separated
- membership restrictions remain enforced
- creator-controlled visibility remains intact
- public playlist show/order controls remain intact
- identity/workspace boundaries remain intact
- mobile changes did not break desktop
- desktop changes did not break mobile
- no unrelated files were staged or deleted
- production route returns expected behavior after deploy

This document should evolve only when a previously approved platform rule is intentionally changed.

## 14. Additional Previously Approved Constants

### LOCKED — Single-audio coordination
VYBE should avoid multiple independent audio sources playing over one another in the same experience.
Starting a new eligible track should coordinate with the active player rather than create competing playback.

### LOCKED — Visitor vs member interactions
Visitors may browse eligible public content.
Account-required actions such as follow, save, heart/like, comment, reply, and community participation must remain gated behind an authenticated account where that rule applies.

### LOCKED — My VYBE is the supporter’s personal home, not a generic discovery feed
My VYBE remains the supporter’s personal dashboard for their identity, followed creators, creator updates, continued listening, saved collections, communities/events, and return-to content.

It may include shortcuts that lead into discovery, but the page itself should stay centered on the supporter’s personal VYBE rather than becoming a generic public discovery feed.

### VERIFIED — My VYBE
Verified in localhost review: My VYBE feels like the supporter’s personal home on desktop and mobile, with followed creators, updates, continue-listening, saved collections, communities/events, and discovery links without turning into a generic public feed.

### LOCKED — Social Discovery remains separate from VYBE Discover
VYBE Discover is for creators and VYBE-hosted content.
External/social-search discovery remains a distinct experience and should not be folded back into the core creator discovery feed without explicit approval.

### LOCKED — Locked features remain understandable
Where a membership feature is locked, VYBE should prefer value-first education explaining what the feature does and why it matters rather than making the feature vanish without explanation.

### LOCKED — Banner/basic public identity is not a premium-only concept
Basic creator identity/presentation remains available at the standard level.
Higher-tier plans may unlock advanced customization, but upgrades must not erase the creator’s basic public identity.

### VERIFY — Public discovery excludes protected content
Private, unlisted, subscriber-only, approved-listener, password-protected, expired, or otherwise restricted content must not enter public discovery unless its access rules explicitly permit it.

### VERIFY — Shared playlist artwork and creator identity
Shared playlist changes must preserve creator identity and intended artwork rather than replacing the experience with generic player chrome.

### PRINCIPLE — Creator control is a cross-platform rule
VYBE should connect existing destinations rather than force creators to abandon them.
Creators decide what is public, private, follower-only, selected-audience, or sold, and VYBE should preserve those choices across discovery, playback, commerce, and professional workflows.

## 15. Creator Entry / Autoplay Contract

### LOCKED — Discover/Explore creator click starts with the creator’s featured music
When a listener opens a creator from VYBE Discover or Explore, the route should request playback immediately.
If no specific song was selected, VYBE starts with the first eligible song in the creator’s Top 5 / featured music queue.

### LOCKED — Top 5 is the first creator queue
Creator playback begins with the selected Top-5 song, then continues through the remaining eligible ranked Top 5 without repeats before moving into other eligible public creator music.

### VERIFY — Mobile/browser autoplay fallback
VYBE should attempt the approved autoplay behavior, but browsers may block audible autoplay after navigation.
If a browser blocks autoplay, the player must remain visible, docked, and ready for a single Play tap; the queue and selected Top-5 track must remain correct.

### LOCKED — Creator public player remains viewport-docked
Motion/reveal wrappers, layout transforms, responsive containers, and redesigns must not change the player from viewport-fixed bottom behavior on desktop or mobile.

## 16. Account Deletion / Administrative Escalation

### LOCKED — Standard account deletion keeps the 7-day cancellation period
A normal self-service deletion request remains pending for 7 days unless the account holder cancels it or requests immediate administrative review.

### LOCKED — Immediate deletion requires administrative review
Request Immediate Deletion does not permanently delete the account by itself.
It creates an urgent Back Office work item for an authorized administrator to review and confirm.

### LOCKED — Permanent deletion remains permission-gated and explicitly confirmed
Immediate permanent deletion requires the appropriate Back Office permission and exact account-email confirmation before execution.

### LOCKED — Work Queue is for administrative authority, not ordinary support
Normal questions, technical problems, and routine support remain in Contact / Report a Problem flows or Creator Help Center tickets.
The Work Queue is reserved for matters requiring an administrative decision, investigation, security/rights review, financial/access review, legal/privacy action, appeal, or irreversible account action.

### VERIFIED — Creator Help Center + Tickets
Verified end to end:
creator submits support ticket → Back Office Support Tickets review → admin reply/status update → creator sees reply/status → routine ticket can resolve without Work Queue involvement.

### LOCKED — All creators receive standard support access
Creator Free must not be blocked from the Creator Help Center.
Plus/Pro/Studio/founding access may receive priority treatment, but membership controls support priority rather than access to the support system itself.

### LOCKED — Routine tickets do not automatically create Work Queue items
Support tickets remain in the Support Tickets workflow by default.
Only an explicit administrator escalation should create a Support Escalation Work Queue item.

### VERIFIED — Support escalation deep-links to exact ticket
Verified with a Priority creator ticket:
admin escalation → high-priority Support Escalation Work Queue item → exact /admin/support?ticket=<ticket-id> source link.

### LOCKED — Work items should deep-link to the affected record when possible
Administrative work should carry enough source context to take the reviewer directly to the affected record.
For account deletion, the Accounts page should scroll to and highlight the account requiring attention.

### LOCKED — Account purge order must respect content dependencies
For creator-account deletion, playlists must be removed before albums/tracks so playlist-owned activity, access grants, playlist items, and track relationships can cascade safely.
Do not reorder account purge steps without checking the live foreign-key dependencies.

### VERIFIED — Immediate account deletion workflow
Verified with a disposable creator account:
7-day deletion request → Request Immediate Deletion → urgent Account work item → exact-account deep link/highlight → authorized Remove Immediately → Auth/content cleanup → related Work Queue item completed.

### VERIFIED — Rights / ownership reports escalate to Back Office
Verified end to end through the public copyright report form:
report submission → high-priority Rights & Ownership Work Queue item → exact report deep-link → focused report review.

### LOCKED — Rights Work Queue opens the exact report
A rights/ownership Work Queue item should not drop the reviewer onto the entire Rights & Protection dashboard.
Open source must deep-link to the exact copyright/ownership report and show only the information needed for that review first.

The focused report review should include the report reference, status, submitted date, reporter identity/email, rights owner, reported VYBE URL, claim description, legal confirmations, electronic signature, admin notes, status controls, and direct access to the reported VYBE content.
Broader Rights & Protection and Copyright Operations remain secondary navigation.
