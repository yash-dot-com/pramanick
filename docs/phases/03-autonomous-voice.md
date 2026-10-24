# Phase 3 — Autonomous follow-through

**Code implemented; Bolna agent configured · live call check pending.**

- Start one issue/locality; saved run scope, brief and targeted questions.
- One configured consenting demo recipient: Aarav Patil by default.
- Bolna browser SDK + outbound API; GPT Realtime 2.1 / Marin.
- Eleven tools: complaint/history/directory reads, updates, promises, schedule, opt-out, scoped case selection, intake draft.
- Prior conversations and promises available to later calls.
- Pause/resume/follow-up-now; pending calls respect run state.
- Deadline jobs; 24-hour default status check without a dated promise.
- Busy/no-answer: at most two retries, after 5/15 minutes.
- Five phone attempts per 24 hours; minimum two-minute spacing.
- Uncertain dispatch needs reconciliation; never blindly redialed.
- Structured outcomes; extracted response quotes checked against transcript.

**Your check:** two real demo calls; second recalls the first promise.
**Needed:** consenting phone in environment, public tunnel and worker.

## Calling playbook

The active provider prompt is `prompts/stakeholder-agent/v1.1.0.md`. After changing it, run `npm run voice:configure` to update the existing Bolna agent (the command backs up its previous configuration). Editing the Markdown alone does not change an already configured provider agent. No call is placed by configuration.

Calls start with a bounded case brief from the existing dossier: registered problem/location, up to 20 resident reports and eight evidence descriptions/assessments, latest resident review, assignment certainty, recent events, previous promises and calls. Image data and prior transcripts are excluded. Live tools refresh case/history/schedule records; a failed refresh should lead to an honest use of the preloaded brief, not repeated holding messages or generic complaint intake. The brief is a call-start snapshot, not a live observation.

The agent seeks an action, accountable office/role, date/time and checkable evidence, one question at a time. It distinguishes reports, advisory assessments, completion claims, resident feedback and reviewed closure. No new tool/API, dependency, authority to contact directory numbers, or automatic escalation is introduced.

Before a live demo, check these conversation cases in Marathi, Hindi or English:

- Interrupt with “wait,” then “get to the point”: agent pauses and resumes with the selected issue and one relevant question; no repeated introduction or holding loop.
- Make case/history tools fail: agent identifies the call-start brief, uses its actual landmark/report, and asks about the outstanding work without claiming a fresh lookup succeeded.
- Say “soon,” “approval pending,” or “another department”: agent seeks the next owned milestone, checks a responsibility lead, and does not invent a deadline or transfer.
- Supply a missed promise and a contradictory dated resident observation: agent asks about the discrepancy and preserves both attributions.
- Say “fixed”: agent requests completion evidence and saves a claim awaiting resident review, never verified completion.
- Give an action without an exact time: agent clarifies, reads it back and saves an empty deadline if still unclear; its summary does not promise a scheduled phone call unless the tool confirms one.
- Say an unclear phrase, then a clear goodbye: agent briefly clarifies the unclear phrase and ends on goodbye. “Do not call again” uses the opt-out tool immediately.
- Switch between authorized cases: each saved statement belongs only to the announced selected case. In citizen mode, no stakeholder writes are permitted.
