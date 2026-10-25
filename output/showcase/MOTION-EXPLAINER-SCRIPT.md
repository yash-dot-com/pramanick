> Production update: the approved final copy is now assembled as the 90-second film. See [FOLLOW-THROUGH-90.md](FOLLOW-THROUGH-90.md) and `src/follow-through-frame-plan.json`. The 60-second draft below is retained as development history.

# Pramanik — accountability that follows through

Motion explainer, draft 3. **60 seconds · 1,800 frames · 30 fps · 1280 × 720 (Remocn standard).** This is the detailed production script and frame plan. The six supplied components have isolated studies; the complete film has not been assembled or rendered. Further component choices can fill the diagram, waveform and clock slots.

## The central argument

**India has complaints. What’s missing is follow-through.**

The opening illustrates the gap: reports accumulate, but reporting alone does not deliver a verified repair. Pramanik is an autonomous office that keeps the case moving. Specialists work concurrently, a coordinator combines their findings, a voice agent asks the responsible office for answers, and a persistent worker keeps promises and follow-ups connected to the case’s history. A claim of completion still needs a check on the ground. The public can inspect the conversation and the resulting record.

Use one fictional leaking-water-pipe case throughout. The same sky-blue token links the map, agents, call, promise and follow-up. Never imply that the fictional dialogue happened or that the opening figures are national statistics.

## Exact scene allocation

All frame ranges are **start-inclusive, end-exclusive**. At 30 fps, frame 120 is 4 seconds. The adjacent ranges below cover every frame from 0 through 1799. The machine-readable source is `src/motion-frame-plan.json`; its component layers include exact start frames, durations and props. Frame-accurate here means the authored visual schedule; voice alignment will be finalized when the audio is produced.

| Frames    | Time   | Beat                                    | Main Remocn component        |
| --------- | ------ | --------------------------------------- | ---------------------------- |
| 0–120     | 0–4s   | Reports grow. Verified fixes do not.    | MaskRevealUp + RollingNumber |
| 120–240   | 4–8s   | India needs follow-through              | WordStream                   |
| 240–360   | 8–12s  | Many reports become one case            | MaskRevealUp                 |
| 360–630   | 12–21s | Three specialists work concurrently     | MaskRevealUp                 |
| 630–750   | 21–25s | The coordinator chooses the next step   | WordPush                     |
| 750–1020  | 25–34s | The agent asks with memory              | MaskRevealUp                 |
| 1020–1170 | 34–39s | Conversation becomes durable memory     | BlurOutUp                    |
| 1170–1380 | 39–46s | A worker keeps the case moving          | WordStream                   |
| 1380–1620 | 46–54s | An officer’s claim needs a ground check | BlurOutUp + MaskRevealUp     |
| 1620–1800 | 54–60s | Public accountability, then the brand   | MaskRevealUp + WordPush      |

## Detailed script and frame cues

### 01 · Reports grow. Verified fixes do not.

**Frames 0–120 · 0–4s**

**On screen:** Reports keep coming.

**Visual:** Two unboxed numbers on paper. Reports roll from 0 to 128; verified fixes remain 0. A visible label says “Illustrative backlog · not national statistics.” These are invented demonstration values, not a claim about India’s actual resolution rate.

**Narration:** “The reports keep coming. But who follows through?”

| Frames  | Component / motion layer     | Exact action                                                                                                           |
| ------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 0–23    | MaskRevealUp                 | Only the headline enters; let the eye establish the question.                                                          |
| 23–28   | RollingNumber left group     | Reports group starts at 24 with a local 96-frame Sequence. The zero group follows at 28: a four-frame sibling stagger. |
| 28–101  | RollingNumber groups         | Reports roll toward 128; verified fixes remain zero. The left count settles at global frame 101 (24 + ceil(96 × 0.8)). |
| 101–108 | RollingNumber hold           | Read the settled comparison; the fixed zero did not simulate progress.                                                 |
| 108–120 | Frame-driven opacity wrapper | Fade the entire example to the neutral canvas; the next shot begins at 120.                                            |

**Component setup:**

- `MaskRevealUp`: global start `0`, local duration `120`; Top headline. Props: `{"text": "Reports keep coming.", "fontSize": 64, "fontWeight": 400, "fontFamily": "Instrument Serif", "color": "#171717"}`.
- `RollingNumber`: global start `24`, local duration `96`; Left number, Reports. Props: `{"from": 0, "to": 128, "fontSize": 120, "color": "#0ea5e9"}`.
- `RollingNumber`: global start `28`, local duration `92`; Right number, Verified fixes. Props: `{"from": 0, "to": 0, "fontSize": 120, "color": "#27272a"}`.

### 02 · India needs follow-through

**Frames 120–240 · 4–8s**

**On screen:** India has complaints. | What's missing? | Follow-through.

**Visual:** Only one phrase at a time. The argument replaces the counter illustration. Instrument Serif, dark ink; the last phrase can use a restrained blue underline. No charts behind the words.

**Narration:** “India has complaints. What’s missing is follow-through.”

| Frames  | Component / motion layer                | Exact action                                                            |
| ------- | --------------------------------------- | ----------------------------------------------------------------------- |
| 120–143 | WordStream phrase 1                     | Words arrive at 120, 130, 140; the last resolves at 143.                |
| 143–163 | WordStream phrase 1 hold/exit           | Hold; left run-out occupies 158–163.                                    |
| 163–176 | WordStream phrase 2                     | Words arrive at 163 and 173; complete at 176.                           |
| 176–196 | WordStream phrase 2 hold/exit           | Hold; run-out occupies 191–196.                                         |
| 196–199 | WordStream phrase 3                     | Follow-through appears and resolves.                                    |
| 199–228 | WordStream final hold                   | Keep the point legible; the source stops its final crawl at 219.        |
| 228–240 | Opacity wrapper + case-token continuity | Fade the phrase while a blue point establishes the map’s case location. |

**Component setup:**

- `WordStream`: global start `120`, local duration `120`; Center. Props: `{"text": "India has complaints. | What's missing? | Follow-through.", "wordGap": 10, "hold": 20, "drift": 0.4, "fontSize": 72, "fontFamily": "Instrument Serif", "color": "#171717"}`.

### 03 · Many reports become one case

**Frames 240–360 · 8–12s**

**On screen:** One problem. / One shared case.

**Visual:** Only product footage allowed: tightly cropped map. Three nearby report points converge at one leaking water pipe. Remove navigation, controls and app chrome. Keep the consolidated point as the case token in later shots.

**Narration:** “Pramanik brings reports about one problem into a shared case.”

| Frames  | Component / motion layer       | Exact action                                                          |
| ------- | ------------------------------ | --------------------------------------------------------------------- |
| 240–266 | MaskRevealUp + map crop        | Two lines enter at 240 and 243; all entry opacity settles at 266.     |
| 266–312 | Map + frame-driven paths       | Three report points converge. This illustrates a fictional leak.      |
| 312–342 | Map + case label               | Hold the single case, labelled Water leak.                            |
| 342–360 | Opacity wrapper + shared token | Map fades; the case token remains and travels toward the coordinator. |

**Component setup:**

- `MaskRevealUp`: global start `240`, local duration `120`; Top third, clear of the map case. Props: `{"text": "One problem.\nOne shared case.", "fontSize": 60, "fontWeight": 400, "fontFamily": "Instrument Serif", "distance": 24, "color": "#171717"}`.

### 04 · Three specialists work concurrently

**Frames 360–630 · 12–21s**

**On screen:** Three specialists. / Working in parallel.

**Visual:** A coordinator sits above three labelled specialist endpoints: Reports, History, Responsibility. All work begins together. Result marks return independently and join at the coordinator. Small credit: OpenAI Agents SDK. The flow is a diagram, not three task cards.

**Narration:** “Three specialists work in parallel: checking reports, remembering earlier conversations, and finding the responsible office.”

| Frames  | Component / motion layer                 | Exact action                                                                                                                                                                 |
| ------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 360–390 | MaskRevealUp + flow diagram slot         | Reveal the statement and coordinator.                                                                                                                                        |
| 390–420 | Flow diagram slot: simultaneous fork     | Stage the specialist nodes at 390, 394 and 398. Draw their connections with eased transforms/path strokes. All three work tokens launch together at 420 after the entrances. |
| 420–492 | Flow diagram slot: parallel work         | All three specialists work concurrently from frame 420. Each remains active until its own result returns. Entrance stagger does not imply sequential jobs.                   |
| 492–510 | Flow diagram slot: first result          | Reports returns “Same leak, several reports”; other branches keep working.                                                                                                   |
| 510–528 | Flow diagram slot: second result         | History returns “Earlier repair promised”; Responsibility remains active.                                                                                                    |
| 528–570 | Flow diagram slot: third result and join | Responsibility returns “Water department identified”; join all findings at the coordinator.                                                                                  |
| 570–612 | Flow diagram hold                        | Let the assembled finding marks be read.                                                                                                                                     |
| 612–630 | Topology continuation + title fade       | Preserve the coordinator and case; remove specialist labels as the next-action path extends.                                                                                 |

**Component setup:**

- `MaskRevealUp`: global start `360`, local duration `270`; Top third. Props: `{"text": "Three specialists.\nWorking in parallel.", "fontSize": 60, "fontWeight": 400, "fontFamily": "Instrument Serif", "color": "#171717"}`.

### 05 · The coordinator chooses the next step

**Frames 630–750 · 21–25s**

**On screen:** One clear next step.

**Visual:** Joined findings feed one outward path labelled “Ask for a repair date.” This is a plan, not proof a call has happened. The path becomes a voice baseline at the next cut.

**Narration:** “The coordinator turns their findings into the next action.”

| Frames  | Component / motion layer      | Exact action                                                                    |
| ------- | ----------------------------- | ------------------------------------------------------------------------------- |
| 630–674 | WordPush                      | Four-word phrase builds; allow through 674 for the final source push to settle. |
| 674–714 | Flow diagram slot             | Next-action path draws and its short label arrives.                             |
| 714–738 | WordPush hold + plan hold     | Read the plan with no camera movement.                                          |
| 738–750 | Path-to-waveform continuation | Fade the headline; the path straightens into the conversation baseline.         |

**Component setup:**

- `WordPush`: global start `630`, local duration `120`; Upper center. Props: `{"text": "One clear next step.", "wordGap": 12, "accel": 0.85, "fontSize": 72, "fontFamily": "Instrument Serif", "color": "#171717"}`.

### 06 · The agent asks with memory

**Frames 750–1020 · 25–34s**

**On screen:** Pramanik ↔ Water officer

**Visual:** A simple voice waveform connects two named endpoints. Show the current speaker’s sentence as two short lines, never a transcript panel. Persistent label: Illustrative conversation · synthetic voices. Credit: GPT Realtime · phone connection via Bolna. No real phone call is placed.

**Dialogue only; no narrator over the call:**

- Frames 750–900, Pramanik: “You promised a repair yesterday. When will it be finished?”
- Frames 900–1020, Water officer: “We'll replace the pipe seal tomorrow afternoon.”

| Frames    | Component / motion layer     | Exact action                                                                                   |
| --------- | ---------------------------- | ---------------------------------------------------------------------------------------------- |
| 750–776   | MaskRevealUp + waveform slot | Agent sentence enters in two lines; keep the waveform secondary.                               |
| 776–888   | Held agent dialogue          | Allow speech and a short breath. No narrator over dialogue.                                    |
| 888–900   | Conversation turn            | Waveform settles and the speaker label changes.                                                |
| 900–926   | MaskRevealUp + waveform slot | Officer response enters in two lines.                                                          |
| 926–1002  | Held officer dialogue        | Hold the answer while spoken. Do not invent a precise hour.                                    |
| 1002–1020 | Evidence-word continuity     | Retain “replace the pipe seal” and “tomorrow afternoon” while the surrounding sentence clears. |

**Component setup:**

- `MaskRevealUp`: global start `750`, local duration `150`; Center, agent dialogue. Props: `{"text": "You promised a repair yesterday.\nWhen will it be finished?", "fontSize": 46, "fontWeight": 400, "fontFamily": "Inter", "distance": 16, "color": "#171717"}`.
- `MaskRevealUp`: global start `900`, local duration `120`; Center, officer dialogue. Props: `{"text": "We'll replace the pipe seal\ntomorrow afternoon.", "fontSize": 46, "fontWeight": 400, "fontFamily": "Inter", "distance": 16, "color": "#171717"}`.

### 07 · Conversation becomes durable memory

**Frames 1020–1170 · 34–39s**

**On screen:** The call ends. The work continues.

**Visual:** Retained quote fragments become an action and deadline connected to the saved audio mark and case history. Two simple typographic anchors, no form fields. Use exactly “tomorrow afternoon,” not an invented 4 pm.

**Narration:** “The conversation, promise and deadline become part of the case’s memory.”

| Frames    | Component / motion layer           | Exact action                                                                                       |
| --------- | ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1020–1042 | BlurOutUp + retained quote anchors | Clean six-word entry resolves by 1042.                                                             |
| 1042–1095 | Memory path slot                   | Audio mark, action and deadline settle along a simple line.                                        |
| 1095–1131 | Memory hold                        | Keep the saved promise still and legible.                                                          |
| 1131–1151 | Clock preparation                  | The deadline anchor becomes a clock without erasing the saved action.                              |
| 1151–1170 | BlurOutUp exit                     | Word exits start at 1151 through 1156; each completes after 14 frames. Keep evidence marks intact. |

**Component setup:**

- `BlurOutUp`: global start `1020`, local duration `150`; Top third. Props: `{"text": "The call ends. The work continues.", "fontSize": 60, "fontWeight": 400, "fontFamily": "Instrument Serif", "staggerDelay": 1, "color": "#171717"}`.

### 08 · A worker keeps the case moving

**Frames 1170–1380 · 39–46s**

**On screen:** Deadline arrives. | Review the case. | Plan follow-up.

**Visual:** The saved clock reaches the deadline, a worker reads the case, and a return arc carries its history back to the coordinator. A planned call path activates only after review. Zinc-labelled means awaiting action; no claim of a completed follow-up call.

**Narration:** “At the deadline, a background worker reviews the case and plans the next follow-up.”

| Frames    | Component / motion layer             | Exact action                                                                                    |
| --------- | ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 1170–1185 | WordStream phrase 1 + clock slot     | Deadline arrives: words reveal at 1170 and 1182; complete at 1185.                              |
| 1185–1215 | Phrase 1 hold + deadline marker      | Clock reaches the saved deadline. Run-out begins at 1210.                                       |
| 1215–1242 | WordStream phrase 2 + worker slot    | Review the case: reveals at 1215, 1227, 1239; complete at 1242.                                 |
| 1242–1272 | Phrase 2 hold + memory read          | Worker reviews records; run-out begins at 1267.                                                 |
| 1272–1287 | WordStream phrase 3 + return arc     | Plan follow-up: reveals at 1272 and 1284; complete at 1287.                                     |
| 1287–1356 | Final phrase hold + coordinator slot | History-bearing case returns to the coordinator. Show planning, not an unconditional auto-dial. |
| 1356–1380 | Claim-to-ground-check transition     | Fade the phrase; introduce the officer’s “It’s fixed” as an zinc-labelled claim.                |

**Component setup:**

- `WordStream`: global start `1170`, local duration `210`; Top third. Props: `{"text": "Deadline arrives. | Review the case. | Plan follow-up.", "wordGap": 12, "hold": 30, "drift": 0.25, "fontSize": 64, "fontFamily": "Instrument Serif", "color": "#171717"}`.

### 09 · An officer’s claim needs a ground check

**Frames 1380–1620 · 46–54s**

**On screen:** Saying ‘fixed’ isn't enough.

**Visual:** The zinc-labelled officer claim stops at Ground check. A conditional fork shows “If still leaking → Follow up” and “If repair confirmed → Close case.” These are alternative outcomes, not two contradictory results from the same visit. A green result requires reviewed confirmation, not the call or AI assessment alone.

**Narration:** “Residents check the result. Unresolved cases go back. Only confirmed repairs close the loop.”

| Frames    | Component / motion layer             | Exact action                                                                         |
| --------- | ------------------------------------ | ------------------------------------------------------------------------------------ |
| 1380–1415 | BlurOutUp + pending claim            | Statement arrives; the officer claim waits.                                          |
| 1415–1453 | Ground-check flow slot               | Claim travels toward resident/location marker, with no green check yet.              |
| 1453–1470 | BlurOutUp exit                       | Short headline clears upward.                                                        |
| 1470–1500 | MaskRevealUp + conditional fork slot | Ground check enters; reveal two clearly conditional routes.                          |
| 1500–1545 | Conditional return route             | Trace violet “If still leaking → Follow up” back to the coordinator.                 |
| 1545–1590 | Conditional verified route           | Trace green “If repair confirmed → Close case.” Do not play both as actual outcomes. |
| 1590–1620 | Diagram hold + zoom-out              | Keep both options labelled while the existing flow expands toward the overall loop.  |

**Component setup:**

- `BlurOutUp`: global start `1380`, local duration `90`; Top third. Props: `{"text": "Saying ‘fixed’ isn't enough.", "staggerDelay": 1, "fontSize": 70, "fontFamily": "Instrument Serif", "fontWeight": 400, "color": "#171717"}`.
- `MaskRevealUp`: global start `1470`, local duration `150`; Above conditional branches. Props: `{"text": "Ground check", "fontSize": 56, "fontWeight": 400, "fontFamily": "Instrument Serif", "color": "#171717"}`.

### 10 · Public accountability, then the brand

**Frames 1620–1800 · 54–60s**

**On screen:** Every answer leaves a record. → Accountability that follows through.

**Visual:** Previously introduced nodes resolve into Report → Plan → Call → Track → Check, with the specialist fork above Plan, the open-case return arc, and the conditional verified exit. Audio · Transcript · Promises sits below Call. At 1710, transition to Pramanik and the closing line for the remaining three seconds.

**Narration:** “Every answer leaves a public record.”

| Frames    | Component / motion layer           | Exact action                                                                    |
| --------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| 1620–1643 | MaskRevealUp + full loop slot      | The existing scene expands; no unrelated new diagram is introduced.             |
| 1643–1680 | Loop hold + public evidence labels | Hold the loop and Audio · Transcript · Promises. These were introduced earlier. |
| 1680–1710 | Frame-driven fade to brand         | Diagram fades while the blue token becomes a restrained brand dot.              |
| 1710–1754 | WordPush + stable wordmark         | Closing phrase builds below Pramanik. The final source push settles by 1754.    |
| 1754–1800 | Brand hold                         | Stable final frame. No blurred exit, no confetti.                               |

**Component setup:**

- `MaskRevealUp`: global start `1620`, local duration `90`; Top third. Props: `{"text": "Every answer leaves a record.", "fontSize": 56, "fontWeight": 400, "fontFamily": "Instrument Serif", "color": "#171717"}`.
- `WordPush`: global start `1710`, local duration `90`; Below static Pramanik wordmark. Props: `{"text": "Accountability that follows through.", "wordGap": 12, "accel": 0.85, "fontSize": 70, "fontFamily": "Instrument Serif", "color": "#171717"}`.

## Component roles and local adaptations

| Component          | Story job                                                                               | Integration detail                                                                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rolling Number     | Reports increasing against zero verified fixes in a clearly marked illustrative example | Report group starts at frame 24 (96 local frames, settled by global 101); zero group starts at frame 28 (92 local frames). No animated national statistics or invented impact claims.                                             |
| Word Stream        | Opening argument and deadline → review → plan progression                               | Use gentle drift (0.4 or 0.25), never default constant crawling everywhere. Last phrase holds. The 120-frame thesis completes its last word at global frame 199.                                                                  |
| Word Push          | “One clear next step” and closing tagline                                               | Keep 12-frame first gap, accel 0.85. Allow 44 frames for four-word statements to settle. Remaining frames are a quiet hold.                                                                                                       |
| Mask Reveal Up     | Readable stacked explanations and current-speaker dialogue                              | Source contained blur and an exit despite contradictory docs. Locally adapted to an actual clipped rise, no blur, and a held finish. Two-line entry finishes after 26 frames.                                                     |
| Blur Out Up        | Clear short title, hold, upward blurred exit                                            | Crisp entrance adaptation from draft 1 retained. Bind duration to the local shot. Do not blur promises or evidence out with a title.                                                                                              |
| Infinite Bento Pan | Installed and available as an isolated study                                            | **Reserved, not in the main 60 seconds.** Its source contains Revenue/MRR/Users/code and generated charts. That would bring dashboard clutter and unrelated fake metrics into the story. It does not explain parallel agent work. |

Word Stream and Word Push retain their registry motion. They, Mask Reveal and Blur Out Up accept an optional loaded `fontFamily` so Instrument Serif renders correctly; the default font behavior remains available. Rolling Number keeps its registry JetBrains Mono. Infinite Bento Pan is unchanged.

The Word Push helper’s returned length is one frame short of the source’s last push offset. The schedule allows the extra frame plus a reading hold. The `wordStreamLength` helper is used as a lower bound in its study, not as a substitute for the final audio transcript.

## The real autonomy loop

1. Report + location/evidence → shared case.
2. Coordinator dispatches Reports, History and Responsibility specialists **at the same time**, not as a sequential checklist.
3. Findings return independently → coordinator prepares a next-action brief.
4. GPT Realtime uses the case history and available tools during the voice conversation. Bolna supplies the phone connection and agent number.
5. Save the conversation; extract the documented promises, dates and outcomes into the case history.
6. A persistent queue and worker review due work. A deadline review is not automatically a phone call.
7. No answer or outstanding promise → retry/review → updated coordinator plan, keeping earlier conversations in memory.
8. Completion claim → resident/evidence check. Unresolved or contradicted results return to follow-up; reviewed confirmation can reach a verified outcome.
9. Audio, transcript, promises and documented response assessments support public accountability. A completed call does not prove a completed repair. Assess responses and commitments, not personal honesty or corruption.

The fork/join diagram, waveform, clock and verification branches are explicitly marked **visual slots** in the frame plan. The supplied typography components do not draw those systems. Their geometry and timing are specified here; final visual treatment can use the next components Yash supplies or simple frame-driven SVG paths. No additional diagram library has been introduced.

## Design and pacing

- Motion typography and meaningful diagram movement. The **map is the only product UI**: no dashboard footage, browser chrome, screen-recording components, task cards or simulated cursor actions.
- Canvas `#fafafa`, ink `#171717`, active case sky `#0ea5e9`. Zinc `#27272a` with “Waiting” means pending; violet `#7c3aed` with “Follow up” marks the return path; green `#22c55e` means confirmed. Always pair color with explicit words. Authored elements stay within the supplied palette.
- Instrument Serif 400 for editorial statements; Inter for labels/dialogue. Use loaded Remotion fonts, not application CSS that disappears in export.
- Standard 1280 × 720 canvas at 30 fps. Safe margins: 80 px horizontal, 64 px vertical. Headlines 56–72 px, dialogue 46 px, diagram labels 28–34 px, annotations at least 22 px. Keep long phrases inside the safe width; plan line breaks instead of shrinking text to illegibility.
- One headline and one explanatory action per shot. The specialist graph has three branches because the concurrency itself is the message; other scenes stay simpler.
- Eased movement without added bounce. Stage sibling scene elements 3–6 frames apart. The specialist nodes enter at 390, 394, 398, then all work starts together at 420. Draw connections before tokens travel. Stop the camera and hold when reading matters.
- Transitions preserve the same object: map point → case token → branch/join → voice baseline → saved promise → clock → return arc → ground-check fork → public loop.
- Narration pauses during dialogue. Fictional call audio must carry “Illustrative conversation · synthetic voices.” The dialogue and all speech timing remain draft copy until audio is made.
- Use finite local Remotion Sequences. Use frame-driven opacity/position wrappers to transition components that hold their final state. No wall-clock timers or CSS animations for export timing.
- Final stable brand hold is frames 1754–1800. No final blurred exit or confetti. No new render until the remaining component direction is ready.

## Craft contract for assembly

The supplied motion-principles attachment is reference material for this film. Its instructions are applied to the authored layer with the scope stated in the supplied Design defaults; library effects are not flattened to satisfy defaults for our additions.

- **Typography:** sentence case, default tracking on our own text, solid fills. No all-caps chrome, decorative letter-spacing, gradient text or glow. Retain the registry components’ own effect-specific tracking and blur.
- **Separation:** use empty space first; if needed, a 1 px neutral border or one small neutral shadow. No colored glow, layered drop-shadows, spread or decorative blur blobs. No extra decorative washes behind the diagram.
- **Fonts:** load at module scope before rendering. Instrument Serif remains the project’s editorial brand choice, with Inter body and the registry’s JetBrains Mono counter. No per-frame font fetch.
- **Staging:** headline first, then supporting elements with 3–6 frame offsets. Semantic parallel work is deliberately simultaneous after the graph is established. Secondary motion never competes with the case token or spoken text.
- **Timing:** use source behavior, not natural-length labels alone, to budget each local Sequence. Keep the full entrance, settle, reading hold and exit. Rolling Number is duration-relative; Word Stream/Push helpers provide lower bounds. Do not cut a component off to fit a transition.
- **Layout:** static positions may use top/left/width/height; moving objects use translate/scale, opacity or path progress. No animated layout dimensions or whole-scene jittering zoom.
- **Determinism:** frame-derived motion only. No wall-clock time, random values per render, timers or CSS keyframe animations. No extra package is required for this direction.
- **Background ownership:** prebuilt components stay transparent; the scene container supplies the fill. New colors and canvas dimensions live in `src/motion-theme.ts`.
- **Integration:** use installed direct component exports and supported props; let registry installation resolve dependencies. Do not put `speed` on state-based UI primitives or invent deep helper import paths.
- **Transitions:** the current plan uses zero-overlap frame-driven fades and object continuity, so the film remains exactly 1,800 frames. If a later supplied transition uses TransitionSeries, pass its presentation to `TransitionSeries.Transition`; never mount it as a visual component. Subtract overlaps and update all affected global cues before assembly.
- **Text under drift:** there is no slow text zoom in the current plan. If added later, apply `willChange: "transform"` to one inner text container, not each glyph, the Drift wrapper or the bordered surface.
- **Effect scope:** the existing copied component adaptations remain documented as authored choices. This pass changes scene tokens, canvas and staging; it does not remove designed effects from the prebuilt components.

Reference: [Motion principles](https://remocn.dev/docs/craft/motion-principles), [Design defaults](https://remocn.dev/docs/craft/design-defaults), [Anti-patterns](https://remocn.dev/docs/craft/anti-patterns). Contents were supplied by the user; no new component or dependency is installed by this craft pass.

## Working files

- `src/motion-theme.ts`: standard canvas and authored scene palette.
- `src/motion-frame-plan.json`: global scene boundaries, dialogue, precise cues, component props and reserved visuals.
- `src/motion-index.tsx`: six isolated studies: BlurOutUpStudy, WordStreamStudy, WordPushStudy, MaskRevealUpStudy, ComplaintBacklogStudy and BentoPanStudy.
- `src/components/remocn/`: copied registry source; local font/reveal adaptations documented above.
- `components.json`: video-local Remocn registry configuration; live app configuration is untouched.

Open studies later from `output/showcase` with `npx remotion studio src/motion-index.tsx`. This task does not overwrite the old films or claim a new completed export.
