# Changelog

## 2026-10-24 — Parallel public agent office and narrated cases

- Added a real coordinator with three concurrent, source-checked specialist agents inside the existing preparation job. Persisted assignments, outputs, failures and handoffs drive the public office view.
- Added two fictional officers and four complete case histories, with eight playable/downloadable synthetic conversations, original transcripts, readable summaries, promises, resident verification and labeled illustrations.
- Kept scripted examples separate from actual phone counts and provider performance records. Added a separate demonstration view to the responsibility leaderboard.
- Preserved the existing queue, recipient checks and real recording publication behavior; no new dependencies.
- Verified the live model-backed coordinator in an isolated database without dialing, 25 focused tests, type checking and browser audio playback. Production build verification is recorded in the task result.

## 2026-10-24 — Clearer issue sidebar, theme controls and citizen speech

- Added a persistent light/dark/device toggle using existing shadcn tokens; maps and pickers follow the theme.
- Reorganized the sidebar into issue overview, progress, next step, and Updates/Photos/Calls; folded exports, versions and raw agent work into Full record.
- Replaced technical public copy with plain-language labels; added visual timeline icons, photo summaries and contextual resident-check actions.
- Added Sarvam speech recognition and streamed speech with GPT reasoning for citizen intake and case questions, visible inferred facts and actual server activity.
- Added cached Marathi/Hindi/English display translation without replacing source evidence.
- Agent action-plan cards reflect prepared questions, saved jobs, calls and resident-check state; locality Start demo resumes eligible paused work.
- Published recordings are served through the existing consent-aware app route.
- Fixed legacy citizen outcome extraction attempting a stakeholder context switch.
- No dependencies added. Formatted edited sources; runtime verification remains with the user.

## 2026-10-24 — Public civic office requirements and case files

- Recorded the requested public office model: coordinator, specialist coordination, autonomous follow-through, shared memory, evidence and continuing response assessment. The current worker remains serial; real parallel orchestration, contact approval and publication choices are pending clarification.
- Connected public dashboard issue cards and conversation records to a read-only public case file with chronological history, actual contact identity/role, reports, photographs, promises, deadlines, and consent-gated transcript/audio evidence.
- Preserved original transcript wording separately from display translation. Response notes require supporting wording in a published phone conversation; missing evidence stays unknown, and browser conversations are excluded from official response assessment.
- No new dependencies, API changes, real-official calls, or deployment. Public/operator access separation remains required before a public launch.
- Checks: TypeScript, lint for new case-file files and six focused public-case tests passed. Browser verification covered opening a saved case and its timeline; published audio was absent from the current demo records.

## 2026-10-24 — Understandable agent progress

- Made the default agent view explain what Pramanik is doing now, its saved plan, prepared questions, blockers, and recorded work in plain language.
- Connected the view to existing saved action and casework-plan records. Plan status follows linked calls and resident verification; an unrelated conversation cannot complete a follow-up's plan.
- Added a simple reports → plan → conversation → resident check path, with technical timing and raw records available on demand.
- Extracted shared status, timeline, state-summary and inspector primitives; added search, attention filtering and a compact list view. Reused consistent status indicators in activity feeds.
- Fixed the existing dashboard query to select the provider field used to count browser conversations. No new dependencies or endpoint changes.
- Validation: 14 focused tests, TypeScript and lint for the new/updated trace files pass; verified saved plans, question expansion, filters and list/inspector views in the browser.

## 2026-10-24 — Interactive agent trace

- Added a reusable trace panel to `/operations` with run/call selection, nested steps, timing windows, tool event markers, worker state, and error indicators.
- Connected five-second activity refresh and step details to existing endpoints, including saved briefs, tool inputs/results, and the call inspector. No API or dependency changes.
- Distinguished recorded events, queue schedules, and elapsed windows; unrecorded tool durations, tokens, and costs remain unavailable.
- Verified saved runs/calls and expand/collapse in the browser; six focused trace tests and lint on the new files pass. Full-project typechecking is affected by concurrent edits outside the trace.

## 2026-10-24 — Observable agent routines and voice feedback

- Replaced the manual migration cache revision with a migration-journal fingerprint; user confirmed the dossier column error is resolved.
- Added persisted agent activity, partial complaint inference, selected-language greetings, Marathi default, and a citizen information mode that cannot create stakeholder promises.
- Applied voice prompt v3 and twelve tools to the existing Bolna agent; no live phone call placed.
- Added a user-started two-minute locality routine: read complaints, find nearby duplicate candidates, search office candidates, refresh dossiers, save plans and queue scoped demo follow-up.
- Added public `/dashboard` with real server activity, agent-plan Kanban, phone/browser metrics, call history, queue and links to issue timelines/calls.
- Start follow-up can prepare a brief without a phone, then wait for a configured consenting recipient.
- Fixed marker tooltip hit interception and resize cursor changes; user confirmed both stable.
- No dependencies added; no build, lint, test or browser automation run. Voice/routine rehearsal remains with the user.

## 2026-10-24 — Follow-through workspace and closing-loop demo

- Implemented scoped issue/locality runs, briefs, pause/resume, remembered promises and bounded autonomous follow-up.
- Added shared versioned dossiers, interactive Kanban, call/tool/job inspection and uncertain-dispatch reconciliation.
- Added responsibility profiles/leaderboard with sourced metrics and explicit attribution limits.
- Added Hindi/Marathi/English voice complaint drafting and explicit resident confirmation; configured eleven Bolna tools.
- Matched the docked locator layout, sidebar width handle and white map pins; added red/amber/green status indicators.
- Added live device location capture, proximity/accuracy metadata, advisory before/after photo assessment and conflict-aware review.
- Added evidence-linked complaint drafts, automatic preparation after overdue promises/repeated unanswered attempts, and separate operator-recorded filing references.
- Updated concise phase status and venue demo script. No new dependencies for these additions.
- No live phone call, build, lint, test or browser verification run; user performs runtime rehearsal.

## 2026-10-24 — Revised product plan

- Replaced the initial concept plan with a concise inventory and incremental build order for the reference map/sidebar, user-started autonomous runs, evidence dossiers, interactive Kanban, responsibility profiles/leaderboard, and voice complaint intake.
- Updated focused phase checklists; separated existing backend primitives from unbuilt orchestration and screens.
- Documentation only; no application changes or runtime checks.

## 2026-10-24 — Core voice backend

- Added a centered issue modal with a title and MapLibre location picker; added subtle rounded map-edge blur.
- Integrated the official Bolna Web Call SDK and configured the existing remote agent with GPT Realtime 2.1 / Marin, Hindi/Hinglish instructions, nine complaint tools, and the public tunnel webhook.
- Added durable SQLite jobs for provider synchronization, OpenAI Agents outcome extraction, commitment deadlines, and consenting demo phone calls.
- Added exclusive job leases, crash recovery, bounded processing retries, tool mutation deduplication, provider execution validation, and delayed-result handling.
- Saved updates and promises feed the case timeline. Completion claims open resident review; they never verify a repair.
- Added operations, queue-management, demo-call, and resident survey endpoints. Kept one fixed account and official contact dialing disabled.
- Backed up the original Bolna configuration privately before updating it. No phone call was placed.
- User verification remains pending; no builds, lint, tests, or browser checks run.
- Sidebar width adjustment is deferred until the core backend review, as requested.

## 2026-10-24 — First map and complaint slice

- Preserved the installed mapcn component and the root route.
- Added eight short implementation checklists in `docs/phases/`.
- Imported the supplied Pune directory into `data/pune/`; preserved source records and the workbook.
- Added SQLite + Drizzle schema and initial migration, with lazy import and fictional issue seeds.
- Replaced the store-locator screen at `/app` with a civic map, filters, directory, issue dossiers, and office profiles.
- Used only supplied GeoJSON office coordinates. Records without coordinates stay searchable without a guessed pin.
- Added structured complaints, deterministic duplicate suggestions, and attaching a report to a shared case.
- Added one fixed demo user, Yash, with no account switching, signup, or authentication flow.
- Added an initial operations overview and read-only case board from the same SQLite records.
- Candidate routing stays tentative. Imported official contacts remain unauthorized for automated calling.
- Added a labeled offline location-list fallback; no invented ward polygons.
- Installed the specified libraries and approved SQLite tooling. npm reported four moderate dependency advisories after the tooling install; no broad dependency rewrites applied.
- Checks not run: user requested to perform verification directly.
- Still pending: live voice calls, durable worker, interactive case transitions, verification UI, analytics, Information Mode, and the landing page.

## 2026-10-24 — Stock dark map workspace

- Restored the original shadcn theme tokens and enabled dark mode for the app and map.
- Removed the full-width header, marketing copy, category legend, and persistent right-hand dossier.
- Kept a compact floating toolbar and the full-viewport map.
- Lists, issues, and office details now share one panel, closed until requested.
- Added a drag handle, right-edge width handle, and corner resize handle with pointer/touch and keyboard support.
- Added stock shadcn Badge, Tabs, Select, and Textarea components; reused stock Button, Input, Sheet, Separator, and map components.
- Replaced the custom report and operations palette with preset tokens.
- No builds, tests, or browser verification run, per user preference.
