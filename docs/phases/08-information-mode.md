# Phase 8 — Conversational Information Mode

**Priority:** P2 · Optional  
**Goal:** Answer office and responsibility questions from the local directory.

## Build

- [ ] Enable the Issue / Information toggle and dedicated chat sidebar.
- [ ] Use Vercel AI SDK + OpenAI with controlled read-only database tools.
- [ ] Tools: getOfficeByLocation, getOfficeDetails, getOfficeResponsibilities, getContactsByJurisdiction.
- [ ] Also expose getIssuesByLocality, getIssueTimeline, getPublicServiceMetrics.
- [ ] Return sources when available and label tentative routing clearly.
- [ ] Never guess office names, phone numbers, emails, or jurisdictions.
- [ ] Display a useful unavailable/offline state when inference cannot run.

## Done when

- Ask who handles roads in Kothrud and receive a sourced answer or an honest gap.

## Needs

- Core demo first. Verified directory + OpenAI credentials.

## Phase handoff

- List changed files, completed features, checks/results, limitations, and the next step.
