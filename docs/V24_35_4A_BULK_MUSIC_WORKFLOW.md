# V24.35.4A — Bulk Music Workflow Management

## Adds

- song selection inside All music and category workspaces;
- Select visible;
- bulk move to category;
- bulk change production stage;
- combined category and stage updates;
- mobile-compatible selection and controls;
- immediate React Query cache updates.

## Does not change

- upload settings;
- privacy;
- playback authorization;
- playlists;
- rights;
- database schema.

## Install

The installer requires:

- branch `vybe-music-workspace-v24-35-3`;
- a clean Git working tree.

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\INSTALL_VYBE_V24_35_4A.ps1
```

Then:

```powershell
npm run build
```

## Test on localhost

1. Open Music Library.
2. Open All music or a category.
3. Select two test songs.
4. Choose another category.
5. Click Apply.
6. Confirm both songs move.
7. Select songs again.
8. Change the production stage.
9. Refresh.
10. Confirm the category and stage persist.
11. Test Select visible and Clear selection.
12. Check the same controls on a mobile-width browser.

## Commit after validation

```powershell
git status --short
git add src/routes/_authenticated/music.tsx
git add src/services/music/trackWorkflowService.ts
git add src/hooks/useTrackWorkflow.ts
git add docs/V24_35_4A_BULK_MUSIC_WORKFLOW.md
git commit -m "Add bulk music workspace actions"
git push
```
