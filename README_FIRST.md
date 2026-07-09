# VYBE-HUB Project Overview

## What Is VYBE-HUB?

VYBE-HUB is a next-generation fan engagement platform designed to create deeper connections between fans, creators, brands, communities, and organizations.

The platform focuses on transforming passive audiences into active communities by providing interactive experiences, personalized engagement, content sharing, rewards, and digital community-building tools.

The goal is to create a scalable platform that can support different organizations, creators, teams, brands, and communities while allowing each experience to maintain its own identity.

---

# Core Vision

VYBE-HUB exists to answer one question:

**"How do we turn followers into communities and communities into meaningful experiences?"**

The platform should provide tools that allow organizations to:

* Build stronger relationships with their audiences
* Increase engagement and retention
* Create exclusive experiences
* Understand community behavior
* Reward participation
* Develop long-term fan loyalty

---

# Current Project Stage

## Phase: Foundation & Architecture Setup

Current focus:

* Establishing project structure
* Confirming technology stack
* Setting up database connections
* Creating scalable architecture
* Preparing for feature development

Do not begin large feature development until the foundation is documented and stable.

---

# Technology Stack

## Frontend

Primary framework:

* React
* TypeScript
* Vite

## State Management / Data Handling

Planned:

* TanStack Query for server state management
* TanStack Router for scalable routing (if adopted)

## Backend

Current backend service:

* Supabase

Supabase responsibilities:

* Database
* Authentication
* Storage
* Backend services
* Row Level Security

---

# Project Structure Guidelines

Maintain a clean separation between:

## Components

Reusable UI elements.

Example:

```
src/components
```

## Pages

Application screens and routes.

Example:

```
src/pages
```

## Hooks

Reusable application logic.

Example:

```
src/hooks
```

## Integrations

External services and connections.

Example:

```
src/integrations
```

Supabase files belong here.

---

# Development Rules

Before adding major features:

1. Confirm where the feature belongs.
2. Avoid creating duplicate components.
3. Reuse existing patterns.
4. Document major architectural decisions.
5. Update AI_HANDOFF.md after major milestones.

---

# Coding Philosophy

VYBE-HUB should be built as a scalable SaaS platform.

Prioritize:

* Clean architecture
* Maintainability
* Security
* Performance
* Reusable components
* Multi-client scalability

Avoid:

* Quick hacks
* Hard-coded client-specific solutions
* Features that cannot scale
* Unnecessary dependencies

---

# Future SaaS Goal

The platform should eventually support multiple organizations using the same core application.

Each organization should be able to have:

* Their own branding
* Their own users
* Their own communities
* Their own content
* Their own engagement features

The architecture should support multi-tenant SaaS development.

---

# Important Files

## README_FIRST.md

Purpose:

Provides a high-level understanding of the project.

Update when:

* Project direction changes
* Major technology decisions change
* Core goals change

## AI_HANDOFF.md

Purpose:

Provides continuity between development sessions and AI assistants.

Update when:

* Completing major milestones
* Making architectural decisions
* Changing database structure
* Adding major features
* Resolving important technical issues

---

# Current Development Principle

Build the foundation correctly before building features.

Every feature added should move VYBE-HUB closer to becoming a scalable, professional SaaS platform.


