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

The current implementation has a durable job queue and a serial worker. The choice between a new coordinator/parallel-specialist implementation and an office view over the current workflow is pending user clarification. Existing job lease and idempotency behavior should be preserved.

### Proposed first backend change, for review

Keep SQLite and the existing durable queue. A case-preparation job would become the coordinator's work item. It would start independent report aggregation, history/evidence review and responsibility research in parallel, using the already installed Agents SDK. After those results are saved, the coordinator would prepare the follow-up brief. Calling remains a dependent action, with the existing recipient, spacing, retry and uncertain-dispatch checks.

Record each specialist's assignment, coordinator/parent ID, input record references, start, result, error and handoff in persisted activity records. The office UI would render these records. A specialist is working only while that actual invocation is active; idle desks stay idle. Recovery must preserve completed work and avoid repeating a phone effect.

This is a proposed implementation, not a claim that the current worker already runs those specialists.

## Public case file

- One chronological record of reports, dated evidence, office assignment, conversations, promises, follow-ups, disputes, verification, and escalation.
- Original conversation wording stays available separately from display translation. Speaker labels follow the saved transcript; missing timestamps or identities stay missing.
- Show the actual contact's name and role, with demo and browser-conversation labels where applicable.
- Audio and transcripts follow the existing publication permissions while the requested publication/review policy is being clarified.
- Give residents access to the saved evidence bundle and the case location. Claims and resident-verified outcomes remain distinct.

## Continuous response assessment

Assess observable service behavior: documented response time, whether responsibility was clarified, whether an action and date were stated, what was promised, whether due promises were kept, and what residents verified.

Every assessment must identify its case and conversation, date, supporting wording, and uncertainty. Missing evidence means unknown; an unanswered attempt does not establish refusal, intent, or a blocked number. A recorded conversation does not establish a repaired road. Browser/citizen conversations do not count as an official's service response.

Keep per-conversation notes separate from longitudinal office/person metrics. Existing response profiles already calculate some documented metrics; the future evaluation version and review process need to be recorded with newly introduced assessments.

## Current boundaries to resolve before a public launch

- Only a configured demo recipient is callable today. Per-official responsibility and contact approval is a separate requested capability; no real recipient has been authorized by this product description.
- Existing demo routes have no authentication. Public visibility must be separated from operator mutation access before deployment; a local read-only screen does not secure the backend.
- The deployment destination and public-launch authorization have not been selected.
- Coordinator/parallel execution, real-contact approval, and conversation-publication policy have been asked as explicit decisions. Implementation of those choices depends on the answers.

## Incremental implementation

1. Connect the public case file to existing saved records: chronology, actual contacts, conversations, promises, proof and source-linked response notes.
2. Implement the selected coordinator/worker architecture, persisted assignments and handoffs, and truthful live desk states.
3. Make the office view the public dashboard, with case/locality navigation and a resident-friendly explanation of each current action.
4. Implement the selected contact/publication controls and reviewable response assessments.
5. Separate public and operator access, then prepare a concrete deployment for approval.

No new dependencies or replacement database/queue architecture is assumed by this brief.
