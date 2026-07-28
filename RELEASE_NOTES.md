# V24.8 — Stripe membership checkout

- Added sandbox-ready Stripe Checkout for the three public paid creator plans.
- Added signed subscription webhooks that control Supabase entitlements.
- Added Customer Portal access in Creator Settings.
- Preserved Founding Creator access and postponed Pioneer pricing.
- Added a safe checkout launch switch and full setup guide.

# V24.10 — Public homepage, demo creator, and Play activation

- Made the homepage music-world panel and all three community cards lead to public destinations.
- Routed Stories and Merch to a guided fictional creator example instead of forcing registration.
- Routed Create your VYBE through the public creator explanation page.
- Added the Nova Vale guided demo creator with music, playlists, access examples, stories, video,
  merchandise, community, and events.
- Added original fictional demo artwork and three short original synthesized music demonstrations.
- Activated public Play with music trivia, Build Your VYBE, a daily poll, and a creator spotlight.
- Kept future subscriptions, saved scores, comments, purchases, and rewards clearly labeled.
- Requires no Supabase migration and does not alter existing creator accounts.

# V24.10.1 — Functional demo experiences and light-mode refinement

- Added a public light/dark theme control to desktop and mobile marketing navigation.
- Strengthened light-mode contrast for the homepage music-world panel, play control, and Play
  experience label.
- Expanded Build Your VYBE from one choice to a selectable blend of up to three choices.
- Turned Community into a readable Nova Vale sample discussion with account-gated participation.
- Turned Events into three realistic fictional examples with account-gated saving and reservations.
- Made all four Nova Vale story cards open complete fictional sample articles.
- Connected Nova Vale music, stories, community, events, and Play with clearer navigation.
- Requires no Supabase migration and does not alter existing creator accounts.

# V24.10.2 — Saved-theme transition correction

- Applies the saved light or dark theme before styles are painted.
- Prevents the dark-screen flash when a light-mode visitor opens another VYBE page.
- Keeps native browser controls aligned with the selected color scheme.
- Requires no Supabase migration and does not alter existing creator accounts.

# V24.11 — Unified Play Home and Surprise Me

- Replaced the older signed-in Play preview with the same functional Play experience available
  publicly.
- Extracted Play into a shared feature so `/experience/play` and `/play` stay aligned while using
  their appropriate public or signed-in VYBE navigation.
- Added a mobile-first Play Home with Games, Explore Music, Discover, Learn, Spotlight, and
  Challenges destinations.
- Added honest Available Now, Demo, and Coming Soon labels.
- Added Surprise Me using only eligible public activities and destinations.
- Preserved Music Trivia, Build Your VYBE, Daily VYBE Poll, Nova Vale Spotlight, theme behavior,
  and public no-account access.
- Kept member progress, saved scores, paid access, rewards, and subscriptions clearly identified
  as future phases.
- Requires no Supabase migration and does not alter existing creator accounts.

# V24.12 — Daily VYBE operating foundation

- Added an honest genre-selection experience with Mixed VYBE active for the pilot.
- Added planned genre choices that remain clearly labeled until approved content is deep enough.
- Added a stronger Daily VYBE area for trivia, polls, Spotlight, and weekly discovery.
- Added a shared Play content registry so public Play and the administration view use one definition.
- Added an admin-only Play release board with inventory, release gates, and build dependencies.
- Kept the administration board read-only until the Knowledge Engine production schema is approved.
- Kept multiplayer, lyric, audio-recognition, prizes, and persistent streaks in future phases.
- Requires no Supabase migration and does not alter existing creator accounts.

# V24.12.1 — Play genre action correction

- Makes an available genre selection visibly open its corresponding trivia round.
- Adds an accessible confirmation message when Mixed VYBE is selected.
- Respects reduced-motion preferences when moving to the game.
- Requires no Supabase migration.

# V24.13 — VYBE Creator installable app foundation

- Adds an installable Progressive Web App identity named VYBE Creator on the existing VYBE domain.
- Launches installed sessions through `/auth/redirect`, preserving sign-in, invitations, onboarding,
  and creator routing to `/dashboard`.
- Shows installation guidance only inside signed-in creator experiences.
- Supports the native install prompt in compatible Chromium browsers and Add to Home Screen
  guidance on iPhone and iPad.
- Adds VYBE app icons, standalone display metadata, a safe service worker, and an offline screen.
- Caches only same-origin static application assets and deliberately excludes API responses,
  Supabase authentication, private creator data, and audio.
- Preserves the public website and fan browsing experience.
- Requires no Supabase migration, new domain, or app-store account.

# V24.13.1 — Creator install prompt continuity

- Captures the browser installation event at the application root before sign-in.
- Preserves the event while the creator moves from the public homepage into Creator Studio.
- Makes the creator-only VYBE installation banner available without relying on a dashboard refresh.
- Does not change the manifest, service worker cache policy, public fan experience, or production
  routing.

# V24.14 — Direct creator entry

- Adds `/creator` as the designated public starting point for creator account creation, sign-in,
  Studio access, and VYBE Creator installation.
- Adds a direct Creators link to desktop navigation and Creator Start to mobile navigation, the
  Build on VYBE menu, the homepage creator CTA, and the footer.
- Carries creator intent into sign-up and onboarding so Creator is already selected.
- Gives iPhone and iPad creators a visible three-step Add to Home Screen guide.
- Clarifies that the iOS Studio banner is an instruction because Apple requires installation
  through the Share menu.
- Keeps fan browsing on the existing public website and requires no Supabase migration.

# V24.15 — Legal and content rights foundation

- Replaces placeholder Terms, Privacy, Copyright, and Community Guidelines pages with substantive
  interim beta policies that are visibly identified as pending attorney review.
- Requires new users to affirmatively accept the versioned policy set during account creation and
  records that acceptance through the signup trigger.
- Requires existing signed-in users to review and accept the same versioned policy set before
  continuing into authenticated VYBE areas.
- Adds required rights classification and certification to single-track and album uploads.
- Records the selected rights basis, confirmation, policy version, and confirmation time on every
  new track and prevents uncertified tracks from being published.
- Adds a public `/copyright/report` intake form with good-faith, accuracy, and electronic-signature
  statements.
- Adds an administrator-only `/admin/rights` queue for reviewing reports and preserving private
  workflow notes.
- Adds the `20260728210000_legal_rights_foundation_v24_15.sql` Supabase migration. This migration
  must be applied before deploying the V24.15 application code.
- Does not add automatic content recognition, paid rights vendors, legal verification, or a
  registered DMCA agent.
