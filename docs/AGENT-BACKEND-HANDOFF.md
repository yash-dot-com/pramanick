# Agent backend — current handoff

## Confirmed by you

- Dossier opens; missing phase-column error resolved.
- Marker hover and sidebar resize cursor are stable.

## Implemented in code

- **Voice feedback:** actual call/audio states, persisted tool actions, partial inferred complaint card, final editable draft.
- **Language:** Marathi default; selected Marathi/Hindi/English greeting and instructions; twelve tools applied to Bolna.
- **Citizen case voice:** issue sidebar → Talk about this issue → read case/history/deadlines with visible actions.
- **Separate stakeholder mode:** citizen questions cannot create stakeholder promises.
- **Routine:** start a locality once; worker scans every two minutes, with Scan now and Pause.
- **Aggregation:** complaint text, evidence, prior calls and promises feed an AI brief; case summaries cite source complaint IDs.
- **Deduplication:** shared-case reports remain aggregated; nearby same-category/type cases within 100m are flagged as duplicate candidates without deleting histories.
- **Responsibility:** candidate directory matches saved with the plan; real assignments still require review.
- **Follow-through:** scoped brief → sequential demo phone calls → saved response/summary → deadline/retry → resident check or escalation.
- **No-phone behavior:** Start follow-up can prepare the case and wait for a recipient instead of rejecting the whole run.
- **Public /dashboard:** recorded activity, phone/browser counts, agent-plan Kanban, call history, queue, links to issue timeline/calls.
- **Persistence:** 29 SQLite tables; four migrations. Migration cache follows the actual journal.

## Your next verification — in order

1. Open `/app` → microphone → Marathi. Describe a complaint; confirm the inferred card and actions update before final review.
2. Open an issue → **Talk about this issue**. Ask what happened last and what is due next; confirm Marathi and real read actions.
3. Click **Start follow-up** without a demo phone. Confirm brief preparation followed by **awaiting_configuration**, with no phone attempt.
4. Open `/dashboard` → choose locality → **Start monitoring & demo follow-ups** → inspect activity and plan.
5. Add consenting phone/authorization locally and restart worker. Resume the prepared run; monitor actual call → response → promise → next job.
6. Verify dashboard call links open that case's Calls/Timeline tab.

## Still needs live confirmation / future work

- Native-language speech quality, live inference callbacks and finalized transcript timing need your rehearsal.
- Phone calls need `BOLNA_DEMO_PHONE` and `BOLNA_DEMO_CALL_AUTHORIZED=true`; no number was invented.
- Existing separate issues are not silently merged. Broad semantic deduplication/merge review remains future work.
- Real government calling needs established responsibility and recipient authorization; routine dialing currently targets fictional demo cases only.
- Official grievance filing remains external; drafts and operator-recorded references are distinct.
- Real-time word-by-word transcription is not supplied by the installed Bolna browser SDK. Partial structured inference comes from tool callbacks; finalized transcripts arrive from the provider.
- No builds, lint, tests or automated browser checks run.
