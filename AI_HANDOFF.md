# VYBE-HUB AI Development Handoff

## Current Verified Development Checkpoint

**Branch:** `vybe-creator-pwa-foundation-v24-13`

**Base:** V24.12.1 / `573baac`

**Play routes:** public `/experience/play`; signed-in `/play`

V24.13 adds the first installable VYBE Creator Progressive Web App foundation without separating
the platform onto a new domain. The manifest launches through `/auth/redirect`, so an authenticated
creator reaches `/dashboard` while expired sessions, invitations, and onboarding continue through
the existing role-aware flow.

The creator-only installation message supports native browser installation where available and
Add to Home Screen guidance on iPhone and iPad. The service worker provides a branded offline
screen and caches only same-origin static application assets. It does not cache API responses,
Supabase authentication, private creator data, or audio. Public fan browsing remains unchanged.
No Supabase migration is required.

V24.13.1 moves browser install-event capture to a root-level provider. This preserves the event
across public navigation, sign-in, and the transition into Creator Studio so the creator-only
installation banner can appear reliably on the dashboard.

V24.14 adds `/creator` as the designated creator entry point. It offers direct creator account
creation, creator sign-in, Studio access for authenticated creators, install controls, an explicit
iOS Add to Home Screen guide, and an overview of creator tools. Creator-facing navigation and the
homepage creator CTA now lead to this page. Creator intent is preserved through sign-up and
onboarding. No Supabase migration is required.

V24.15 establishes VYBE's first database-backed legal and content-rights workflow. Policy acceptance
is versioned and recorded for both new and existing users. Music uploads require a rights category
and explicit certification, and published tracks are protected by a database constraint. A public
copyright-report form feeds an administrator-only review queue with preserved status and private
notes. The four legal pages contain substantive interim beta drafts but explicitly remain subject to
attorney review. Apply `20260728210000_legal_rights_foundation_v24_15.sql` before deploying the app
code. No ACR vendor or DMCA-agent registration is included.

V24.11 unifies both routes around `src/features/play/PlayExperience.tsx`. Public visitors retain
the marketing navigation and footer. Signed-in supporters, creators, and administrators use the
same Play experience inside the authenticated VYBE application shell.

The shared Play experience includes:

- Music Trivia
- Build Your VYBE
- Daily VYBE Poll
- Nova Vale Creator Spotlight
- Play Home destination cards
- Surprise Me using approved public-safe destinations

V24.12 adds the Daily VYBE operating foundation, an honest Mixed VYBE-first genre selector, a
shared Play content registry, and an administrator-only `/admin/play` release board. The board is
read-only until the Knowledge Engine architecture approves the production record template.

No Play progress, paid entitlement, rewards, multiplayer, or subscription system is active. No
Supabase migration is required for V24.12.

V24.12.1 corrects the genre-selector interaction: selecting an available genre now confirms the
selection and moves the visitor directly into that trivia round.

## Project Status

**Project:** VYBE-HUB
**Milestone:** Foundation Setup Complete
**Version:** 0.1 Foundation
**Status:** Ready for Application Development

---

# Project Overview

VYBE-HUB is a scalable fan engagement platform designed to connect fans, creators, brands, teams, and communities through interactive digital experiences.

The long-term vision is to create a SaaS platform where multiple organizations can use the same core system while maintaining their own branding, communities, users, and experiences.

---

# Completed Work

## Project Initialization

Completed:

- React application created
- TypeScript configured
- Vite development environment established
- Dependencies installed successfully
- Development server tested successfully

Current status:

Application loads correctly in the browser.

---

# Current Technology Stack

## Frontend

- React
- TypeScript
- Vite

## Styling

Planned/Current:

- Tailwind CSS
- shadcn/ui component system

## Data Management

Planned:

- TanStack Query for server state
- TanStack Router for scalable routing

## Backend

Supabase configured as the backend platform.

Supabase will provide:

- Authentication
- Database
- Storage
- API services
- Row Level Security

---

# Current Architecture Direction

VYBE-HUB will be built as a scalable SaaS application.

Development priorities:

1. Clean architecture
2. Reusable components
3. Secure data handling
4. Multi-tenant readiness
5. Mobile responsiveness
6. Professional user experience

---

# Folder Structure Decisions

Current important folders:

```
src/
│
├── components/
│   Purpose: Reusable UI components
│
├── pages/
│   Purpose: Application screens
│
├── hooks/
│   Purpose: Shared React logic
│
├── integrations/
│   Purpose: External services
│
└── integrations/supabase/
    Purpose: Supabase configuration
```

Do not create duplicate folders without confirming their purpose.

---

# Development Rules

Before adding major features:

1. Confirm where the feature belongs.
2. Reuse existing components.
3. Avoid hard-coded solutions.
4. Keep future SaaS scalability in mind.
5. Update this document after major milestones.

---

# Decisions Already Made

## Architecture

The application will be built with a scalable structure instead of a single-purpose app.

## Backend

Supabase will be the primary backend service.

## Frontend Strategy

Components should be reusable and designed for future expansion.

## SaaS Direction

The application should eventually support:

- Multiple organizations
- Different branding
- Separate user communities
- Organization-specific content
- Subscription-based access

---

# Current Development Phase

## Phase 1: Foundation

Completed:

✅ Project setup
✅ Dependencies installed
✅ Application tested
✅ Documentation created

---

# Next Development Phase

## Phase 2: Application Foundation

Next tasks:

1. Confirm Tailwind CSS setup
2. Confirm shadcn/ui setup
3. Configure routing
4. Create application layout
5. Create navigation system
6. Establish VYBE-HUB design system

---

# Future Milestones

## Phase 3: User System

Planned:

- User authentication
- Profiles
- Roles
- Permissions

## Phase 4: Community Features

Planned:

- Communities
- Fan groups
- Creator pages
- Engagement tools

## Phase 5: SaaS Features

Planned:

- Organization accounts
- Subscription management
- Admin dashboards
- Analytics

---

# Important Instruction for Future AI Assistance

Do not rebuild existing architecture without reviewing this document first.

Preserve:

- Current folder organization
- Technology choices
- Scalability goals
- SaaS direction

When making changes:

Explain:

1. What is changing
2. Why it is changing
3. What files are affected
4. Any future impact

---

# Current State Summary

VYBE-HUB has successfully completed the foundation phase.

The application runs correctly and is ready for UI architecture and feature development.

---

# V24.8 Stripe Membership Billing

V24.8 adds a controlled Stripe sandbox integration for Creator Plus, Creator Pro, and Creator
Studio monthly and annual subscriptions.

Implemented:

- Stripe-hosted subscription Checkout
- server-only Stripe key and Price ID configuration
- signed webhook verification using Stripe's Web Crypto provider
- webhook-controlled Supabase entitlement changes
- out-of-order and duplicate event safeguards
- Stripe Customer Portal access from Creator Settings
- cancellation-at-period-end handling
- return to Creator Free without automatic content deletion
- 30-day paid-to-Free adjustment period
- a server-side `STRIPE_CHECKOUT_ENABLED` launch switch

Preserved:

- Founding Creator remains invitation-only Creator Pro access
- Stripe cannot overwrite a Founding Creator entitlement
- VYBE Pioneer enrollment and discounted Stripe prices are postponed
- no Stripe secret or Price ID is stored in source control or Supabase

Required before testing:

1. Apply `supabase/migrations/20260725230000_stripe_membership_billing_v24_8.sql`.
2. Add sandbox secrets and the six standard sandbox Price IDs to Cloudflare.
3. Register `/api/stripe/webhook` in the Stripe sandbox.
4. Enable checkout only for controlled verification.

See `STRIPE_V24_8_SETUP.md` for the exact environment variable and webhook checklist.
