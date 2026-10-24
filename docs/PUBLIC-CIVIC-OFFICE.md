# Pramanik: the public civic office

## Product requirement

Residents report a problem once, add its location and available proof, and follow its public case file. Pramanik owns the ongoing casework: gather reports, establish responsibility, read the history, contact the right person, remember their answers and promises, follow up, and request resident verification.

The dashboard is the office residents look into. It must show actual work and coordination, the reason for the next action, the person contacted, and the evidence behind every progress claim. A technical execution trace is supporting detail.

## What every resident should be able to answer

1. What is happening to my complaint now, and which desk is handling it?
2. What is the coordinator planning, and what work has it handed off?
3. Who is the responsible office or person? Is that assignment confirmed?
4. Who was actually contacted, when, and what did both sides say?
5. What proof and location information are in the case file?
6. What was promised, when is it due, and did the next conversation remember it?
7. What is the next follow-up, and why is the case waiting?
8. Has a resident checked the repair, or is completion only being claimed?
9. What does the documented response history show about that office or person?

## Office view

The requested office has a coordinator and specialist work for report aggregation, evidence and history, responsibility research, conversations and follow-up, resident verification, and response assessment.

Each desk needs real assigned work, a current state, a dated result, and a visible handoff. Independent work may run in parallel; a call must wait for its case brief, approved recipient, and relevant evidence. Animating desks cannot establish that parallel specialist agents exist.

The user selected a real coordinator and parallel specialists. The existing durable queue remains intact. Each preparation job now starts three independent Agents SDK invocations together; the coordinator waits for their persisted findings before producing the brief. External calls remain dependent jobs with the existing lease, idempotency and recipient checks.

### Implemented coordinator

`lib/voice/coordinator.ts` starts report aggregation, history/evidence review and responsibility research in parallel. Each result cites source IDs from its assigned case. Successful specialist work is reused on a retry when the case fingerprint is unchanged. One failed specialist prevents handoff until recovery; all sibling results settle and remain recorded. The coordinator receives recent original transcripts as well as complaint texts, commitments, location, evidence captions and directory candidates.

Record each specialist's assignment, coordinator/parent ID, input record references, start, result, error and handoff in persisted activity records. The office UI would render these records. A specialist is working only while that actual invocation is active; idle desks stay idle. Recovery must preserve completed work and avoid repeating a phone effect.

`/dashboard` renders these persisted assignments and results as a public office. Running indicators require a recent activity, an active run and an online worker. Historical examples remain labeled. The real model-backed validation script confirmed overlapping specialist execution followed by a saved coordinator plan; its isolated fictional contact has no phone and no call was placed.

## Public case file

- One chronological record of reports, dated evidence, office assignment, conversations, promises, follow-ups, disputes, verification, and escalation.
- Original conversation wording stays available separately from display translation. Speaker labels follow the saved transcript; missing timestamps or identities stay missing.
- Show the actual contact's name and role, with demo and browser-conversation labels where applicable.
- Real audio and transcripts retain the existing publication behavior. Fictional fixtures are pre-published with clearly identified scripted text and synthetic voices.
- Give residents access to the saved evidence bundle and the case location. Claims and resident-verified outcomes remain distinct.

## Continuous response assessment

Assess observable service behavior: documented response time, whether responsibility was clarified, whether an action and date were stated, what was promised, whether due promises were kept, and what residents verified.

Every assessment must identify its case and conversation, date, supporting wording, and uncertainty. Missing evidence means unknown; an unanswered attempt does not establish refusal, intent, or a blocked number. A recorded conversation does not establish a repaired road. Browser/citizen conversations do not count as an official's service response.

Keep per-conversation notes separate from longitudinal office/person metrics. Existing response profiles already calculate some documented metrics; the future evaluation version and review process need to be recorded with newly introduced assessments.

## Demonstration and deployment

- Two fictional contacts, Meera Deshmukh (roads/drainage) and Nikhil Jadhav (water/lighting), have responsibilities but no invented phone numbers or dialing authorization.
- Four narrated cases cover verified repair, an open deadline, a late completion claim awaiting residents, and a disputed clearance. Eight MP3s, original speaker-by-speaker scripts, summaries, promises, resident responses and illustrative proof are bundled in `public/demo-office/`.
- The recording proxy supports playback, seeking and downloading for the bundled audio; the production tracing configuration includes these files. Fixtures do not receive fabricated Bolna execution IDs and are excluded from real phone/browser counts. Scripted profile measures are shown separately from provider/directory records.
- Seed data is additive and repeat-safe. `PRAMANIK_DEMO_OFFICE=false` disables new office fixture creation. It does not delete existing examples. The existing worker still runs separately from the web server; serverless instances do not run a permanent worker automatically.
- [Bolna's execution API](https://www.bolna.ai/docs/api-reference/executions/get_execution) provides `transcript`, `summary` and `telephony_data.recording_url` after final completion. A call-disconnected event is not final completion; summary generation depends on the agent configuration. The app's existing sync/proxy handles provider media, and the audio download link uses the same app route.

## Remaining production boundaries

- Only a configured demo recipient is callable today. Per-official responsibility and contact approval is a separate requested capability; no real recipient has been authorized by this product description.
- Existing demo routes have no authentication. Public visibility must be separated from operator mutation access before deployment; a local read-only screen does not secure the backend.
- Real multi-official dialing remains separate from the two fictional demonstration personas. No real official recipient has been supplied.

## Incremental implementation

1. Connect the public case file to existing saved records: chronology, actual contacts, conversations, promises, proof and source-linked response notes.
2. Implemented the selected coordinator/worker architecture, persisted assignments and handoffs, and truthful live desk states.
3. Implemented the office view on the public dashboard, with case navigation and a resident-friendly explanation of each desk.
4. Implement the selected contact/publication controls and reviewable response assessments.
5. Separate public and operator access, then prepare a concrete deployment for approval.

No new dependencies or replacement database/queue architecture is assumed by this brief.
