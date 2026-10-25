# Pramanik — Follow-through

90 seconds · 1280 × 720 · 30 fps · 2,700 frames. Narration only, no music.

A single water-leak complaint moves left to right through a continuous diagram. Centered Instrument Serif statements introduce the steps; Inter labels and technical credits explain the implementation. The final approved wording is in `src/follow-through-scenes.json`.

## Exact narration and animation cues

### 0–18s · opening

India has a follow-up problem. Complaints don't fix themselves. Our autonomous voice agents call responsible officers, track promises, and publish progress and evidence on a public dashboard for everyone to inspect and verify.

- WordStream: 0–105
- MaskRevealUp + RollingNumber: 105–210; number groups stagger by 4 frames
- WordPush + MaskRevealUp: 210–405
- MaskRevealUp + three icon labels: 405–540

### 18–28s · case

Reports about the same problem come together in one case file, with locations, photos, earlier conversations, and promises already made.

- MaskRevealUp: 558–816
- Resident: 567; report: 630; cropped map: 704; shared case: 750
- Horizontal camera pan: 828–876

### 28–42s · team

Specialist agents work at the same time. They check what residents reported, what happened before, and which office is responsible. A coordinator brings their findings together and plans the next step.

- MaskRevealUp: 882–1218
- Coordinator: 886; specialist entrances: 928/932/936
- All three work packets start together at 984
- Findings return independently: 1090/1110/1130
- Action plan: 1158; camera pan: 1230–1290

### 42–51s · call

The voice agent calls the designated officer, asks informed questions, revisits earlier promises, and asks what will happen, and by when.

- BlurOutUp: 1298–1490
- Voice agent and officer: 1302/1306
- Waveform: 1350–1510; illustrative promise: 1430
- Camera pan: 1500–1560

### 51–62s · follow-up

The agent saves the answer and promised deadline. Scheduled background work brings the case back for review and further follow-up, without citizens having to remember every date.

- MaskRevealUp: 1568–1808
- Case memory: 1570; deadline: 1630; review worker: 1730
- Curved return packet: 1760–1830
- Camera pan: 1830–1890

### 62–75s · check

An officer saying done doesn't close the case. Residents can share observations and photos. AI helps review the evidence, alongside human checks. If the evidence conflicts, the case stays open.

- BlurOutUp: 1900–2200
- Officer claim: 1902; resident evidence: 1950; human review: 2050
- Conditional confirmed route: 2120; conflicting-evidence return: 2155
- Camera pan: 2220–2280

### 75–85s · public

The public dashboard shows published call recordings, transcripts, promises, evidence, and next steps. Residents can add information and check progress together.

- MaskRevealUp: 2296–2522
- Evidence node entrances: 2310/2314/2318
- Next steps statement: 2410; community participation: 2450
- World fades to the final brand: 2526–2550

### 85–90s · close

Less chasing. More answers. Pramanik. Accountability that follows through.

- WordPush brand: 2550–2700, held through last frame
- WordPush tagline: 2580–2700
- Less chasing. More answers.: 2610; stable closing hold through 2700

## Files and commands

- Output: `../pramanik-follow-through-90s.mp4`.
- Editable film: `src/follow-through-index.tsx`.
- Exact narration: `src/follow-through-scenes.json`.
- Final frame plan: `src/follow-through-frame-plan.json`.
- Narration stems: `public/follow-through/*.mp3`. Native English (India) synthetic voice; no music.
- Optional scene-level subtitles: `../pramanik-follow-through-90s.srt`. These are whole-scene captions, not word-aligned karaoke.
- Run `npm run prepare:motion` to regenerate narration on macOS. Native speech access may require execution outside the sandbox.
- Run `npm run render:motion` for the narrated H.264 export. The composition `PramanikFollowThroughClean` renders the same visuals without narration.
- Run `npm run studio:motion` to edit the motion film.

## Visual scope

No dashboard screenshots, browser frames, cursor demos or actual officer calls. Only the map uses product pixels: the existing map screenshot is cropped to exclude the navigation, issue sidebar and controls. The complaint, case file, parallel branches, call, saved promise, follow-up return and public records are code-native motion illustrations.

The opening numbers are an explicitly illustrative backlog. The call/commitment is labelled as an illustration. A deadline creates review work; it does not prove a call happened. Human review is shown before conditional completion; conflicting evidence returns to follow-up.

Registry effects retain their own styling and documented local font/reveal adaptations. Authored elements use the supplied palette, sentence case, centered labels, subtle borders, frame-driven easing, staged entrances and no decorative glow or music. Existing earlier films remain intact.
