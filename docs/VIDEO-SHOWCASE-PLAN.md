# Pramanik — 75-second product and technical showcase

Status: rendered and checked. Export: `output/pramanik-accountability-75s-4x3.mp4`. Verified 75.000 seconds, 1440 × 1080, 4:3, 30 fps and 2,250 video frames. Representative frames from all nine scenes were visually reviewed.

## Direction

Follow one illustrative case: water leaking beside a metro footpath. Keep its case identity visible across reports, call history, brief, conversation, commitment, scheduled review and resident verification.

Use two reading levels in the same film:

- Large type and familiar app components tell the public story.
- One short technical annotation per scene explains the mechanism behind it.

The technical layer should move with the relevant component. It should not become a second paragraph or a full architecture slide.

Current delivery: 1440 × 1080 landscape (4:3), 30 fps, exactly 2,250 frames / 75 seconds. The landscape layout supersedes the earlier portrait proposal. Mobile app redesign is queued after the video.

## Timeline and script

| Time / frames      | Typography                                    | Technical mechanism                           | Audio                                                                                                                                                     |
| ------------------ | --------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–6s / 0–179       | You reported it. Who follows up?              | A report is only the beginning.               | Reporting a problem shouldn't mean chasing it forever.                                                                                                    |
| 6–12s / 180–359    | An office of autonomous agents.               | Calls. Commitments. Ground checks.            | Pramanik is an accountability office run by autonomous voice agents.                                                                                      |
| 12–21s / 360–629   | Many reports. One shared case.                | Resident reports + evidence + case history    | Related complaints share one case. Agents bring together resident reports, evidence, and the conversations that came before.                              |
| 21–30s / 630–899   | Every conversation becomes context.           | Persisted history → the next call brief       | Before the next call, the agent recalls the earlier promise and builds a brief with specific questions.                                                   |
| 30–39s / 900–1169  | Specialists investigate. A coordinator plans. | OpenAI Agents SDK · GPT-5.4 mini              | Three specialists review reports, history, and responsibility in parallel. A coordinator combines their findings into an action plan.                     |
| 39–51s / 1170–1529 | Context becomes a conversation.               | GPT-Realtime-2.1 + Bolna · tool calling       | A call grounded in memory. Yesterday you promised a new seal. Has the repair started? The seal has arrived. We'll complete the repair tomorrow afternoon. |
| 51–61s / 1530–1829 | The call ends. The work continues.            | record_commitment → deadline_review → worker  | Tool calls save the exact commitment. A deadline becomes a persistent review job, processed by a worker after the conversation ends.                      |
| 61–69s / 1830–2069 | A claim needs a ground check.                 | Resident observations + photos + human review | Residents check the repair with observations and photos. AI supports human review. Conflicting evidence keeps the case open.                              |
| 69–75s / 2070–2249 | Pramanik                                      | Accountability that follows through.          | Pramanik. Every promise tracked. Every outcome open to scrutiny. Built by Yash.                                                                           |

Narration and the illustrative two-voice exchange are generated. Caption word timings are estimated from each speech segment.

## What a technical viewer should understand

1. **Memory is saved case data.** Retrieve earlier reports, conversations, evidence and commitments into the next brief. Do not depict an unimplemented vector database, embeddings pipeline or knowledge graph.
2. **Coordination has distinct roles.** The reports, history and responsibility specialists run in parallel. Their structured findings feed the coordinator's plan; a responsibility candidate is not automatically a confirmed assignment.
3. **Voice can use application tools.** Show a small `record_commitment` label and the meaningful fields—action, quoted promise and deadline. The application validates and persists the tool input.
4. **Persistence continues beyond a call.** A saved commitment with a deadline can create a persistent `deadline_review` job. The worker processes due work. Do not portray every queued review as an immediate outbound phone call.
5. **Verification has a human checkpoint.** AI photo findings support review. Resident findings and conflicting evidence matter; an officer's statement or a positive AI assessment does not independently close the case.
6. **Activity is inspectable.** Public conversation records, commitments, evidence and state changes remain associated with the case. Show recorded actions and results rather than invented internal reasoning.

## Actual implementation references

| Mechanism                                  | Existing source                                                                                                                                                                                                           | Visual material                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Related complaints and shared case records | `lib/civic/repository.ts`, `lib/civic/dossier.ts`                                                                                                                                                                         | Existing issue-card styling and case-file sections                      |
| Parallel specialist review                 | `lib/voice/coordinator.ts`                                                                                                                                                                                                | Reports / history / responsibility activity branches                    |
| Voice case retrieval and writes            | `lib/voice/tools.ts`                                                                                                                                                                                                      | `get_complaint_details`, `get_issue_timeline`, `record_commitment`      |
| Realtime voice and telephone connection    | `lib/voice/bolna.ts`                                                                                                                                                                                                      | Voice controls, waveform and conversation transcript                    |
| Persistent work and recovery               | `lib/voice/queue.ts`, `scripts/voice-worker.ts`                                                                                                                                                                           | Queued / running / completed job states and due time                    |
| Photo assessment and resident review       | `lib/civic/evidence.ts`, `lib/civic/repository.ts`                                                                                                                                                                        | Evidence photos, advisory findings, review decision                     |
| Public records and app primitives          | `components/civic/public-case-file.tsx`, `components/civic/operations-dashboard.tsx`, `components/civic/agent-work-summary.tsx`, `components/civic/status-badge.tsx`, `components/ui/card.tsx`, `components/ui/badge.tsx` | Real component structure, typography, badges, borders and state colours |

Use shared presentational components where possible. Fetching, polling and phone side effects stay outside the video: stage the view with fixed illustrative records and frame-driven state changes. The removed activity section can supply presentational patterns without being restored to the live operations page.

## Motion and sound

- Match the current app: Instrument Serif headlines, Inter UI text, monospace technical annotations, warm white, dark text, blue emphasis and existing status colours.
- Keep strong curved corners, readable interface crops and restrained surface shadows.
- Preserve object identity through transitions: report → case; remembered promise → brief; spoken deadline → commitment; commitment → job; resident evidence → review.
- Use the existing local SnapCN components in `output/showcase/components/snap-cn/`: TextReveal for statements, AgentSteps for ordered actions, StatusCycle for meaningful state changes and WordCaptions for speech.
- Use the existing Remotion/SnapCN workspace. Leave the previous showcase intact while developing the new compositions separately.
- Let typographic entrances settle before the UI changes. Avoid moving every element at once. Keep technical labels large enough to read on a phone.
- Use restrained music, small UI sounds and a clearly separated call exchange. Captions carry the story when muted.
- Keep illustrative case and conversation labelling in the relevant scenes. Prefer a suitable existing call excerpt if available; otherwise use the planned illustrative exchange.

## Production checks

1. Built frame-driven scenes from this timeline using the existing SnapCN components and actual app captures with illustrative case data.
2. Reviewed preview frames, corrected excessive footage cropping, recomposed the layout for 4:3, separated captions and added narration, illustrative dialogue and music.
3. Rendered the full 4:3 landscape film, inspected one frame from each scene, and checked the export dimensions, duration and frame count. Trimmed the audio tail so AAC padding does not extend the container past 75 seconds.

The seventy-five-second film includes the essential technical explanation. A later developer cut can expand schema validation, queue recovery, tool scope and verification rules using the same scene assets.

## Background source

The user supplied the Dither Gradient Shader documentation. Its registry returned HTTP 401 and the pasted attachment did not contain component source. This preview uses its documented CSS-orb fallback in paper, vermilion and ink colours, driven by video frames. It does not contain the original WGSL / WebGPU shader or its one-bit dithering. The original source can replace this fallback when available.
