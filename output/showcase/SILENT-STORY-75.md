# Pramanik — Silent motion story

75 seconds · 1280 × 720 · 30 fps · 2,250 frames. No narration, music, sound effects or audio track.

The supplied Socratica reference was inspected as a contact sheet. This cut adopts its editorial rhythm: complete sentences, large centered serif type, quiet sky backgrounds and isolated explanatory visuals. None of the supplied reference footage or UI is used in the export.

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

### 15–19s — pramanik

Pramanik follows through  
so you don’t have to.

### 19–26s — merge

We turn repeated complaints  
into one shared case.

### 26–34s — specialists

Then we split the work  
between specialist agents.

Technology credit: OpenAI Agents SDK · GPT-5.4 mini

### 34–38s — ward

We find the right officer  
through public ward directories.

### 38–44s — call

Our agents call in Hindi,  
Marathi and English.

Bolna gives our agents a real phone number.

Technology credit: GPT-Realtime-2.1

### 44–48s — memory

They remember earlier conversations  
and ask about unfinished promises.

Technology credit: GPT-5.4 mini · Case memory + reasoning

### 48–53s — promises

Every promise becomes a deadline  
for the next follow-up.

Technology credit: Tool calling + persistent background jobs

### 53–60s — evidence

When an officer says ‘done’,  
residents check what actually happened.

Technology credit: GPT visual assessment + human review

### 60–65s — reopen

If the evidence disagrees,  
we reopen the case and call again.

### 65–70s — public

We publish the calls, promises  
and evidence for everyone to inspect.

A public record for everyone.

### 70–75s — close

You report the problem.  
We keep following up.

## Three isolated diagrams

1. **Complaints become one case.** Three short reports converge, fade and merge into one shared case file. The case ends centered on screen.
2. **Work splits between agents.** The case fans out to Reports, Memory and Responsibility in parallel. Their results join at a coordinator and become one action plan.
3. **Residents provide ground evidence.** A public survey, resident photos and location/time observations converge into a ground check, supported by GPT visual assessment and human review.

There is no persistent graph, camera tour, dashboard capture, fabricated statistic, purported officer recording or demo badge. Other steps are explained through sentences instead of additional diagram nodes.

## Motion and timing

- Mask Reveal Up introduces sentences in composed lines. The second line is staggered by four frames and uses the established Instrument Serif italic.
- Word Push builds the opening and reopening statements. Word Stream presents two complete sentences about registering complaints and chasing repairs.
- Blur Out Up supplies restrained exits for the taxes and promised-deadline statements. Each line receives a finite local Sequence duration.
- Scene changes use the existing Remotion fade presentation through TransitionSeries. Every outgoing sequence receives 12 extra frames, offset by its 12-frame transition overlap; the final duration remains exactly 2,250 frames.
- The sky background is an original code-native SVG with fixed-seed turbulence, rasterized by the browser as an image. Only a slow deterministic transform moves the background; text remains on a stable layer.

## Original OpenAI logo

Source: [OpenAI design guidelines](https://openai.com/brand/). The page’s OpenAI Blossom image points to [Blossom_Light.svg](https://images.ctfassets.net/kftzwdyauwt9/3hUGLn3ypllZ0oa01qOYVq/28e8188e6f11b84c3e876569d492734f/Blossom_Light.svg?w=3840&q=90).

The original construction worksheet is retained at `public/brands/openai-blossom-official-source.svg`. The displayed asset contains its first black-filled Blossom path, copied verbatim, without the surrounding construction guides. The mark is not redrawn, recolored, distorted, used as Pramanik branding, or combined with an OpenAI wordmark. It appears only with the actual technology credits. OpenAI owns the mark.

## Files

- Entry: `src/silent-story-index.tsx`.
- Exact copy and nominal frame ranges: `src/silent-story-scenes.json`.
- Export: `../pramanik-silent-motion-story.mp4`.
- Run `npm run render:silent-story` to reproduce, or `npm run studio:silent-story` to edit.
- Earlier narrated cuts remain intact; this is a newly authored silent film, not the old graph with its soundtrack removed.
