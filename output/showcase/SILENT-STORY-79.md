# Pramanik — Soft Blur motion story

79 seconds · 1280 × 720 · 30 fps · 2,370 frames. Silent: no voice, music or audio track.

The main conversational sentences use Remocn `SoftBlurIn`. Diagram labels, map annotations and technology credits use a short whole-label opacity fade. They remain unblurred and can wrap naturally inside their cards. The introduction uses the installed Remocn `FogRise` for the large Instrument Serif “Pramanik.” word, with a simple “Introducing” label above it. Its upward exit is disabled so the title holds for the full introduction.

The ground-check card has a fixed icon column, padded edges and a flexible text column. Supporting copy wraps into two readable lines without shrinking the icon.
## Exact on-screen story

### 0–4s — problem

India has a  
follow-up problem.

### 4–8s — taxes

We pay taxes.  
We deserve answers.

### 8–12s — logged

Complaints get logged.  
Repairs still need chasing.

### 12–15s — time

But who has time  
to keep chasing?

### 15–19s — introducing

Introducing Pramanik.

### 19–23s — pramanik

Pramanik follows through  
so you don’t have to.

### 23–30s — merge

We turn repeated complaints  
into one shared case.

### 30–38s — specialists

Then we split the work  
between specialist agents.

Technology credit: OpenAI Agents SDK · GPT-5.4 mini

### 38–42s — ward

We find the right officer  
through public ward directories.

### 42–48s — call

Our agents call in Hindi,  
Marathi and English.

Bolna gives our agents a real phone number.

Technology credit: GPT-Realtime-2.1

### 48–52s — memory

They remember earlier conversations  
and ask about unfinished promises.

Technology credit: GPT-5.4 mini · Case memory + reasoning

### 52–57s — promises

Every promise becomes a deadline  
for the next follow-up.

Technology credit: Tool calling + persistent background jobs

### 57–64s — evidence

When an officer says ‘done’,  
residents check what actually happened.

Technology credit: GPT visual assessment + human review

### 64–69s — reopen

If the evidence disagrees,  
we reopen the case and call again.

### 69–74s — public

We publish the calls, promises  
and evidence for everyone to inspect.

A public record for everyone.

### 74–79s — close

You report the problem.  
We keep following up.

## Visual scenes

- The aggregation scene uses the application's MapLibre engine and Carto Positron basemap at Paud Road, Pune. Three nearby blue water-leak reports converge into one shared case. No unrelated issue markers or dashboard chrome appear. The tile image is captured once by `src/map-capture.tsx`, making the exported movie deterministic. Map attribution remains visible.
- The parallel specialists and resident evidence checks stay as separate explanatory diagrams, with smooth curved data travel. Cards have a modest neutral shadow, bottom edge and restrained surface shading.
- All text stays on stable layers. Sibling lines enter four frames apart. The transitions are 12-frame fades, with sequence overlap accounted for in the total duration.
- The original OpenAI Blossom asset and original SVG sky background are preserved.

## Export

Entry: `src/silent-story-index.tsx`. Exact scene ranges: `src/silent-story-scenes.json`.

Run `npm run render:silent-story:v4` to produce `../pramanik-silent-motion-story-v4.mp4`. Earlier exports remain intact.

## Credit and follow-up revision

Every OpenAI technology credit now begins “Powered by”. The SDK credit continues “with GPT-5.4 mini”, keeping the model connected to its role.

The 52–57s follow-up scene places the sentence on the left and a clockwise four-stage cycle on the right: Promise saved → Deadline set → Follow-up call → Progress checked. A moving dot and blue arc show the sequence, with the current stage highlighted. The center reads “Follow-up continues”; this describes the workflow rather than asserting a case is resolved. Its footer reads “Powered by tool calling and persistent background jobs.”
