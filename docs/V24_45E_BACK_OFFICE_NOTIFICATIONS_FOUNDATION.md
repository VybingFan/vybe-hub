# V24.45E — Back Office Notifications Foundation

## Base
`eafb985a`

## Purpose
Add controlled, opt-in Back Office device notifications on top of the V24.45C work assignment system and V24.45D installable Back Office PWA.

## Notification scope
The first notification set is intentionally focused:
- new work assigned to the current administrator;
- urgent assigned work;
- overdue assigned work.

Each administrator can independently enable/disable those categories.

## Permission model
The browser/device notification permission is requested only after the administrator presses **Enable device alerts**.

VYBE does not request notification permission automatically.

Per-administrator preferences are stored in `admin_notification_preferences` and require `admin.work_queue.read`.

## Delivery in V24.45E
While the Back Office is open or minimized, the notification monitor checks active assigned work at a conservative one-minute interval.

Notifications are delivered through the existing VYBE service worker and use the dedicated Back Office icon.

Notifications are deduplicated per device and capped to three new notifications per polling cycle.

Tapping a notification opens the work item's source path (or the Work Queue fallback).

## Security
Notifications do not contain credentials or privileged record payloads.
Opening a notification still enters the normal `/admin` Operations authorization boundary.

## Important: fully closed app delivery
V24.45E does **not yet** create a Web Push subscription/server delivery pipeline.

Therefore notifications are reliable while the installed PWA/browser is running or minimized, but a fully closed Back Office cannot yet be awakened by a remote push.

A following V24.45E2 can add standards-based Web Push subscriptions and server-side delivery once VAPID keys/secrets are provisioned securely outside the repository.

## Service worker
Adds:
- `BACK_OFFICE_NOTIFY` message handling;
- `notificationclick` handling;
- focused-window navigation or new-window opening;
- cache version bump to V24.45E.
