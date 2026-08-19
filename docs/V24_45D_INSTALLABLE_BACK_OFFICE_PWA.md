# V24.45D — Installable Back Office PWA

## Base
`4002de14`

## Goal
Give VYBE Operations a dedicated installable Back Office experience on desktop, phone, and tablet without replacing or disrupting the existing VYBE Creator PWA.

## Existing PWA foundation reviewed
The current app already has:
- a root VYBE Creator manifest;
- a root service worker at `/sw.js`;
- install-prompt context support;
- service-worker update handling.

V24.45D reuses those foundations instead of adding a competing PWA library.

## Back Office identity
Back Office routes (`/operations/*` and `/admin*`) switch the active manifest identity to:
- Name: `VYBE Back Office`
- Manifest: `/back-office.webmanifest`
- App ID: `/operations`
- Start URL: `/admin?source=back-office-pwa`
- Dedicated Back Office icons
- Shortcuts to Back Office Home and Work Queue

Public/Creator routes continue using the existing VYBE Creator manifest.

## Security
The PWA does not bypass Operations authentication.
Opening the installed app at `/admin` still passes through the existing protected Back Office/Operations session boundary.
If staff authorization is unavailable or expired, the existing gate sends staff back to the authorized Operations entrance.

## Devices
- Chrome / Edge desktop: installable app window when browser install criteria are met.
- Android Chrome: installable/add-to-home-screen experience.
- iPhone/iPad Safari: Add to Home Screen guidance is displayed.
- Tablet behavior follows the supported browser's PWA behavior.

## Service worker
The existing root service worker remains authoritative. V24.45D only expands its static PWA cache to include the Back Office manifest/icons and increments the cache version.

## Notifications
This version does not yet request push-notification permission. It creates the installable device identity needed before V24.45E notification registration is added.
