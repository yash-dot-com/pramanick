# Pramanik — current build

**Product direction:** a public civic office with a coordinating agent, real parallel specialist work, visible handoffs, complete case/conversation history, published evidence and continuous source-linked response records. This is broader than the current serial demo worker. See [public office requirements and open decisions](docs/PUBLIC-CIVIC-OFFICE.md).

**Report → start follow-up → remember promises → check repair → close or escalate.**

## Latest agent work

- Public `/dashboard`: routine monitoring, saved actions, plan Kanban, call history and issue links.
- Live complaint inference, visible tool activity and Marathi/selected-language greetings.
- User-started locality scans every two minutes; actual complaint texts feed sourced case summaries.
- Follow-up preparation works before a phone is configured; dialing waits for the recipient.
- User confirmed dossier loading and map/cursor stability.
- [Current verification handoff](docs/AGENT-BACKEND-HANDOFF.md).

## Implemented in code

- **Map:** stock dark mapcn; white pins with red/amber/green status; hover summary; full-height sidebar with horizontal width handle.
- **Reporting:** voice/text → editable draft → user-selected pin → optional before photo → duplicate matching.
- **Casework:** start for an issue/locality; brief; configured demo phone; pause/resume; remembered promises and deadlines.
- **Evidence:** public timeline; versioned Markdown/JSON dossiers; consent-aware conversation publication.
- **Operations:** interactive Kanban; runs, briefs, calls, tools, jobs and uncertain-call reconciliation.
- **Profiles:** people/office views, sourced response notes and measurable service metrics.
- **Repair check:** live device location + after photo → proximity calculation + advisory AI image assessment → resident/operations review.
- **Escalation:** overdue promises or repeated unanswered attempts prepare a complaint draft; download and record an external filing reference.
- **Access:** fixed Yash user; no login or identity-proof flow.

**Code implementation is separate from demo verification. User runtime verification is pending.**

## Differentiation

- Agent recalls the last promise on its next call.
- “Fixed” becomes amber until residents review it.
- Contradictory evidence keeps the case red; history stays visible.
- GPS shows device proximity; photos assess visible condition; neither establishes authenticity or durability.
- Public map, board, dossier and profile use the same records.
- Escalation carries the evidence forward instead of restarting the complaint.

## Needed for the live demo

- Locally set a consenting friend's phone as `BOLNA_DEMO_PHONE` and `BOLNA_DEMO_CALL_AUTHORIZED=true`.
- Keep Next.js, public HTTPS tunnel and worker running; restart worker after environment changes.
- Use live venue GPS and actual before/after photos of a clearly labeled demonstration.
- Follow [the demo script](docs/DEMO.md); you perform runtime checks.

## Limits / deferred

- One configured demo recipient per run; multi-office calling is future work.
- Imported official contacts remain unverified candidates and unauthorized for dialing.
- Complaint drafts are not official filings; recorded references are operator-provided.
- Green means a resident finding was reviewed; AI does not certify repairs.
- Landing page, Information Mode, ward polygons and government filing integrations remain deferred.

[Phase files](docs/phases/README.md) · [Backend handoff](docs/CORE-BACKEND.md)
