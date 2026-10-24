# Core backend — quick handoff

**Code implemented; user runtime checks pending. No build/lint/tests/browser verification run.**

## What exists

- SQLite/Drizzle, 30 tables, five migrations; one fixed Yash user.
- Citizen voice: Sarvam transcription/speech + GPT reasoning; no browser API keys.
- Stakeholder voice: Bolna outbound API, GPT Realtime 2.1 / Marin, twelve tools.
- User-started issue/locality runs, case briefs, scoped writes, pause/resume.
- Persistent calls, transcripts, summaries, promises, deadlines, jobs and tool history.
- Shared public dossiers, interactive Kanban, responsibility profiles/leaderboard.
- Marathi-default voice intake → editable draft → user-selected pin → explicit save.
- Live GPS observation + after photo → queued OpenAI visual assessment → resident review.
- Automatic escalation drafts after overdue promises or repeated unanswered contact attempts.

## Run

```bash
npm run dev
npm run worker
```

- Keep an HTTPS tunnel to port 3000; `APP_BASE_URL` must match.
- After changing tools/prompts/provider/tunnel: `npm run voice:configure`.
- Agent updates back up the existing configuration under ignored `data/private/`.
- Restart the worker after code/environment changes; same directory/database as Next.js.
- Migrations apply when the database opens; JSON evidence exports are derived from SQLite.

## Environment

- Required: `OPENAI_API_KEY`, `BOLNA_API_KEY`, `BOLNA_AGENT_ID`, `APP_BASE_URL`, `BOLNA_TOOL_SECRET`.
- Agent ID means the provider UUID, not its name or key label.
- Outbound demo: `BOLNA_DEMO_PHONE=+91...`, `BOLNA_DEMO_CALL_AUTHORIZED=true`.
- Optional: `BOLNA_FROM_PHONE`, `BOLNA_DEMO_NAME`.
- Brief/extraction model: `OPENAI_EXTRACTION_MODEL`; photo model: `OPENAI_EVIDENCE_MODEL`.
- Default status check: `FOLLOW_UP_DEFAULT_HOURS=24`, bounded 1–168 hours.
- Private recipient numbers stay local; default demo name/role is editable in Operations.

## Lifecycle

1. Voice/text report saved after resident confirmation.
2. Start follow-up queues a brief, then a call to the consenting demo recipient.
3. Tools save attributed updates/promises; worker synchronizes and extracts final outcomes.
4. Deadlines trigger later scoped follow-up; pause stops pending business work.
5. Completion claim opens resident review; red → amber.
6. GPS/photo assessment is advisory. Reviewed resident evidence can make the case green; conflicts keep it disputed.
7. Overdue promise or two finalized unanswered provider attempts can create a complaint draft.
8. Operator files through an official channel and records a reference separately; no automatic government filing.

## Main APIs

| Endpoint | Purpose |
| --- | --- |
| `GET /api/civic` | Map cases and directory |
| `POST /api/complaints` | Create/join complaint; optional title/photo/intake session/demo label |
| `GET /api/issues/:id` | Candidates and survey |
| `GET /api/issues/:id/dossier` | Current dossier; optional version and format=md/json |
| `GET/POST /api/issues/:id/escalations` | Draft history/download; prepare or record submission |
| `POST /api/voice/runs` | Start scope or pause/resume/follow_up_now |
| `GET/POST /api/voice/contact` | Safe demo profile metadata |
| `POST /api/voice/intake` | Voice complaint session |
| `GET/POST /api/voice/intake/:id` | Draft status/end |
| `POST /api/voice/session` | Existing-case browser conversation |
| `POST /api/voice/calls` | Compatibility path to queue scoped phone follow-up |
| `GET/POST /api/voice/calls/:id` | Activity, sync/end/failed, reconcile/not_placed |
| `GET/POST /api/voice/jobs` | Worker/jobs; retry/cancel |
| `GET/POST /api/operations` | Operations snapshot; assignment/status/resident review |
| `GET /api/profiles` | Derived responsibility metrics |
| `POST /api/surveys` | Fixed user's observation; optional photo/device observation |

## Payloads

- Start: `{ issueId, requestId }` OR `{ localityId, requestId }`; UUID request ID is idempotent.
- Run action: `{ runId, action: "pause" | "resume" | "follow_up_now" }`.
- Assign: `{ action: "assign", issueId, officeId, note }`.
- Move: `{ action: "status", issueId, status, note }`.
- Review: `{ action: "review", issueId, decision: "verified" | "disputed", note }`.
- Resident: `{ surveyId, answer, note, photo?, observation?: { lat, lng, accuracy, observedAt, source: "device" } }`.
- Prepare draft: `{ action: "prepare" }` to issue escalation endpoint.
- Record external filing: `{ action: "record_submission", id, channel, reference }`.
- Download draft: escalation endpoint with `?draft=UUID`.

## Practical limits

- Only one configured demo recipient; directory phone numbers cannot be dialed.
- Five phone attempts/day; minimum two-minute spacing; max two busy/no-answer retries at 5/15 minutes.
- Unknown provider acceptance needs reconciliation; no blind retry.
- Source transcript publication requires consent; recording publication also needs recording consent.
- Photo assessment never autonomously marks Verified.
- Supplied GPS must be fresh within ten minutes; “near” requires ≤100m and accuracy ≤50m.
- Client-reported location is not cryptographic photo provenance; absent GPS remains visibly manual.
- Complaint draft is not a filing; operator references are not independently confirmed.
- No fabricated call outcomes, photos or government acknowledgments were seeded.

[Live demo](DEMO.md) · [Vision input reference](https://developers.openai.com/api/docs/guides/images-vision) · [Bolna Web Call SDK](https://github.com/bolna-ai/web-call)

## Latest monitoring and voice changes

- `/dashboard` and `GET /api/dashboard`: public monitoring.
- `POST /api/voice/routines`: `{ localityId, action: "start" | "pause" | "scan_now" }`.
- `GET /api/issues/:id/activity`: persisted action feed.
- Intake status now includes inference and actions; existing-case session accepts an optional language.
- Pending-recipient runs prepare a brief first; configured calling remains separate.
- [Current verification sequence](AGENT-BACKEND-HANDOFF.md).

## Citizen speech and display languages

- `POST /api/voice/citizen` creates an intake or selected-case conversation.
- `POST /api/voice/citizen/:id/turn` accepts one audio turn; duplicate completed turn IDs replay the saved result.
- `GET /api/voice/citizen/:id` returns transcript, inferred draft and observable actions.
- `GET /api/voice/citizen/:id/speech?turn=...` streams Sarvam audio for a saved answer.
- `POST /api/voice/citizen/:id` ends the conversation; the editable draft is retained.
- `.env.local`: `SARVAM_API_KEY` plus the configured `OPENAI_API_KEY`.
- `POST /api/translations` caches Marathi/Hindi/English display translations; canonical evidence remains unchanged.
- No new dependency. Short audio turns; not full-duplex or live word-level transcription.
