# Pramanik — Accountability office, revision 2

90 seconds · 1280 × 720 · 30 fps. Narration only; no music.

This revision uses the original landing page’s Instrument Serif, italic emphasis, muted Inter copy, primary blue depth styling and brand horizon. One compact graph replaces the long horizontal strip. Camera zooms explain each region, then the entire graph is visible in the public-accountability shot.

All on-screen demo/illustration labels and the invented backlog counter are removed. No fictional officer quotes, synthetic officer impersonation or fabricated public metrics replace them. The film explains the workflow through an authored diagram.

## Exact narration and visual sequence

### 0–4s — problem

India has a follow-up problem.

Visual: Centered serif statement with italic follow-up emphasis.

### 4–9s — taxes

We pay taxes for basic services. Public officials should answer to the people they serve.

Visual: Taxes and public accountability. Landing-page horizon and typography.

### 9–15s — chasing

A complaint number isn't a repair. Getting answers still means calls, reminders, and time most citizens cannot spare.

Visual: Complaint number versus a completed repair. Word Stream shows calls, reminders and waiting; no invented statistics.

### 15–20s — office

So we built Pramanik: an autonomous accountability office of AI agents.

Visual: Pramanik wordmark and blue depth pill introduce the autonomous office.

### 20–27s — group

Agents bring related reports together, identify duplicates, and build one shared case with locations, photos, and earlier conversations.

Visual: Zoom into citizen report → grouping/de-duplication → shared case. Locations, evidence and history remain connected.

### 27–36s — team

Specialists work in parallel. They review reports, remember past promises, and check responsibility. GPT reasoning helps the coordinator turn their findings into a plan.

Visual: One coordinator dispatches to three specialist paths concurrently. Independent results join into an action plan. Entrances are staggered; actual work packets start together.

### 36–42s — contact

Using public ward directories, the office identifies the responsible officer or local representative and their contact details.

Visual: Zoom to action plan → ward contact. Public ward directories, role and responsibility guide contact lookup.

### 42–52s — voice

We gave agents a voice and a real phone number through Bolna. GPT Realtime powers conversations in Hindi, Marathi, and English. The agent calls with context and asks for action.

Visual: Zoom to voice agent and responsible officer. Hindi, Marathi and English labels; real phone-number provisioning through Bolna. No invented officer dialogue or call audio.

### 52–60s — promises

Every answer and promised date becomes part of the case's memory. Background jobs bring it back for review and the next follow-up.

Visual: Evaluate the response, save promises/dates, and activate the persistent worker. A narrow curved path carries follow-up data back to the voice agent.

### 60–68s — survey

An officer saying done isn't enough. A public survey asks affected residents, including the people who complained, for observations and photos.

Visual: Completion claim → public survey for affected residents → photos and observations.

### 68–77s — reopen

AI helps compare the evidence with the claim, alongside human review. If the ground tells a different story, the case reopens. The agent calls again with every earlier promise.

Visual: AI-assisted evidence comparison and human review. Conditional verified exit; conflicting evidence follows a shallow return loop to the worker and another call.

### 77–84s — public

Calls, promises, evidence, and next steps stay in a public record, so everyone can question progress and verify the result.

Visual: Zoom out to the entire single-page graph. Calls, promises, evidence and next steps are a public accountability record.

### 84–90s — close

Basic services should not require endless chasing. You report the problem. We keep following up. Pramanik.

Visual: Landing-page closing: You report the problem. We keep following up. Serif/italic hierarchy, blue pill and brand horizon.

## Implementation

- Source: `src/accountability-office-index.tsx`.
- Narration and scene boundaries: `src/office-scenes.json`.
- Stems: `public/office-v2/`.
- Captions: `../pramanik-accountability-office-v2.srt` (scene-level captions).
- Narrated export: `../pramanik-accountability-office-v2.mp4`.
- Silent export: `../pramanik-accountability-office-v2-silent.mp4`.
- Remocn components used: MaskRevealUp, WordPush, WordStream, BlurOutUp. RollingNumber and InfiniteBentoPan are deliberately absent from this cut.
- Camera uses frame-driven transforms and cubic easing. Each text container in the zoomed graph gets its own transform layer; borders and the whole graph are not promoted as raster textures.
- Packets use precomputed arc-length samples of the exact arrow curves, with symmetric speed changes. Return routes keep clear of node labels. Loops repeat in roughly 1.3–1.5 seconds during follow-up beats.
- The narration uses the configured model terminology: GPT-5.4 mini reasoning and GPT-Realtime-2.1 voice. Ward lookup is described through public directories rather than claiming an unimplemented live browsing tool. Bolna provides a phone number, not a physical SIM card. Evidence comparison challenges a claim rather than claiming to infer intent or dishonesty.

## Reproduce

Run `npm run prepare:office`, then `npm run render:office`. Edit in `npm run studio:office`. Existing earlier films and their entry points remain intact.
