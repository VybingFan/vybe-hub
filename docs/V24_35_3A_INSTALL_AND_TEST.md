# V24.35.3A — Music Workspace

This package changes the Music Library from a long catalog into an overview-first workspace.

## Adds

- workspace categories;
- production stages;
- category count cards;
- recently updated songs;
- compact song rows;
- direct category and stage controls;
- mobile-friendly song management;
- search and filtering only after opening a category.

## Categories

- Released
- Upcoming
- Work in progress
- Looking for collaborators
- Rights pending
- Commercial preview
- Archived

## Stages

- Idea
- Writing
- Recording
- Editing
- Mixing
- Mastering
- Ready
- Scheduled
- Released
- Archived

## Install

1. Confirm the working tree is clean:

```powershell
git status
```

2. Create a branch:

```powershell
git switch -c vybe-music-workspace-v24-35-3
```

3. Copy the included `src`, `supabase`, and `docs` files into the matching project folders.

4. Replace the existing file:

```text
src/routes/_authenticated/music.tsx
```

with the included replacement file.

5. Run the SQL migration once in Supabase SQL Editor.

6. Run:

```powershell
npm run build
```

## Test

1. Open Music Library.
2. Confirm it opens on category cards instead of the full song list.
3. Confirm only five recently updated tracks appear.
4. Open Work in progress.
5. Change a song from Idea to Recording.
6. Refresh and confirm the selection remains.
7. Move the song to Looking for collaborators.
8. Refresh and confirm the category remains.
9. Test the page on mobile.

## Existing tracks

Existing active tracks begin as:

- Work in progress
- Idea

Existing archived tracks remain archived.

This avoids guessing whether an older database record represents a real-world released song.

## Next package

After this package is validated:

- add category and stage selection during upload;
- add private creator collections;
- add bulk song actions;
- connect categories to private playlist workflows.
