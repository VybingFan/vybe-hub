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
