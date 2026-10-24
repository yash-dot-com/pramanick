# Phase 1 — Your quick check

**Open:** `/app`  
**User:** Yash, already signed in. No login flow.

## Try these

- Click the Vanaz issue marker → its right sidebar opens.
- Check the title, complaint count, status, candidate office, and timeline.
- Choose each of the six localities and an issue category.
- Hover an issue pin → title, category, locality, complaint count, and status.
- Open Offices → search for a directory entry → inspect its source and caveats.
- Toggle issue/office layers. Wards stay disabled: no polygons were supplied.
- Click the map or Report an issue → structured report form opens.
- Submit near an existing matching issue → choose whether to join it.
- Open Operations → local case/complaint counts and the case board.
- On mobile, use Browse issues; close the case panel with ×.
- Try Offline fallback → local case selection stays available.

## What is real / demo

- Real: imported directory, published sources, supplied office points.
- Demo: six fictional civic issues, seeded resident complaints, fixed user.
- New complaints: saved to local SQLite, with repeat complaints limited per issue/user.
- Official assignments: candidates only, until reviewed.
- Voice: not connected yet; no government calls placed.

## Notes

- Start with `npm run dev`; keep the local server running for SQLite access.
- SQLite imports/migrations initialize on the first API request.
- No browser checks, lint, builds, or tests were run for this slice, as requested.
- Main changes: `components/civic/`, `lib/civic/`, `lib/db/`, `app/api/`, `/app`, `/operations`.
