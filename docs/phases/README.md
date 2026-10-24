# Pramanik — Build phases

**Communities report. AI follows up. Residents verify.**

Build in order. Keep each phase small and complete.

**Current order and implementation status:** [plan.md](../../plan.md) supersedes earlier priorities and design directions.

- [1. Public issue map](01-public-issue-map.md) — P0 · Critical
- [2. SQLite and complaint collection](02-database-and-complaints.md) — P0 · Critical
- [3. Autonomous voice follow-up](03-autonomous-voice.md) — P0 · Critical
- [4. Agent operations dashboard](04-agent-operations.md) — P1 · High
- [5. Issue Kanban board](05-issue-kanban.md) — P1 · High
- [6. Community verification](06-community-verification.md) — P1 · High
- [7. Public accountability metrics](07-accountability-metrics.md) — P2 · Medium
- [8. Conversational Information Mode](08-information-mode.md) — P2 · Optional
- [9. Voice-first complaint intake](09-voice-complaint-intake.md) — Core requested flow

## Rules for every phase

- Preserve the existing app and mapcn setup. Use npm, TypeScript, Tailwind, and shadcn/ui.
- Follow the specified SQLite/Drizzle, Bolna, AI SDK/OpenAI, Zod, Turf, and Recharts stack. No Redis, Docker, PostgreSQL, or hosted databases.
- Stock dark shadcn and mapcn styling. Follow the locator reference for the docked sidebar and white pin markers.
- Keep local reads/writes, saved history, directory, and jobs usable without internet. Label the map fallback.
- Keep calls, model inference, webhooks, and online map tiles explicitly dependent on connectivity.
- Use one hardcoded demo user, already signed in. No authentication, login modals, account switcher, or identity-proof flow.
- Use real supplied civic datasets. Label fictional issues/demo contacts; never invent official records.
- Keep credentials server-side, mutations transactional, events auditable, and external operations idempotent.
- Version prompts in prompts/; record prompt changes and regression results.
- Current user preference: hand off browser verification and test runs to the user; do not run checks automatically.
- Record significant decisions in CHANGELOG.md.

## Dataset inputs

- contacts_master.csv
- contacts_by_location.csv
- contacts_by_location.json
- area_anchors.csv
- area_contact_links.csv
- issue_routing_rules.csv
- pcmc_ward_office_mapping.csv
- map_points.geojson

All eight files have been imported into `data/pune/`, alongside the original README and workbook. The GeoJSON contains 13 points, not ward polygons.

## Demo to prove

- Vanaz/Kothrud fictional pothole → another complaint joins the same case.
- Authorized demo contact → call → commitment → second call remembers the deadline.
- Completion claim → survey → conflicting resident evidence → disputed case.
- Public timeline, operations, and Kanban show the same persisted facts.

## Landing page — later

- Reserve `/` for the landing page; `/app` is the civic map.
- Hero: “Public problems deserve public answers.”
- Message: “Communities report. AI follows up. People verify.”
- CTAs: Explore Your Locality; Report an Issue.
- Keep it short. Build after the core flow.
