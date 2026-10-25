# Pramanik accountability showcase

75 seconds · 1440 × 1080 · landscape 4:3 · 30 fps · 2,250 frames.

The new film is separate from the older 60-second showcase.

Delivered export: `../pramanik-accountability-75s-4x3.mp4`. Verified container duration 75.000 seconds, 4:3 display ratio, 2,250 video frames, H.264 video and AAC audio. A nine-scene contact sheet is at `../pramanik-accountability-4x3-contact-sheet.png`.

## Editable source

- `src/accountability-scenes.json`: timings, scene copy, narration and illustrative dialogue.
- `src/accountability-video.tsx`: composition and SnapCN component layouts.
- `src/accountability-captions.json`: estimated word-level timings.
- `prepare-accountability.mjs`: system narration, illustrative dialogue, captions and original synthesized music.
- `public/shots/`: previously captured actual app components with illustrative case records.

All authored foreground visuals use the existing SnapCN TextReveal, ScreenRecording, CursorTrack, AgentSteps, StatusCycle, WordCaptions and AnnounceTitle components. Layout wrappers provide composition geometry.

The background uses the CSS gradient fallback described in the supplied Dither Gradient Shader documentation. The original source requires registry sign-in (HTTP 401); this preview does not include that WebGPU shader or its ordered dithering.

The two-voice exchange is an illustrative script with synthetic voices, labelled in the video. No live phone call is placed during production. AI assessment is shown as advisory, with resident review required.

## Commands

From this folder:

```sh
node prepare-accountability.mjs
npx remotion render src/accountability-index.ts PramanikAccountability75 ../pramanik-accountability-render.mp4 --codec=h264 --crf=18 --concurrency=4 --port=3117
ffmpeg -y -i ../pramanik-accountability-render.mp4 -c:v copy -af atrim=duration=74.95 -c:a aac -b:a 192k -movflags +faststart ../pramanik-accountability-75s-4x3.mp4
```

Narration generation uses the installed macOS speech voices and FFmpeg. The render uses the existing Remotion/SnapCN dependencies. The live app and its APIs are unchanged.
