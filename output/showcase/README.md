# Pramanik — 60-second showcase

Editable Remotion source with SnapCN TextReveal, ScreenRecording and WordCaptions components, retrieved from the official snapcn registry (MIT; source attribution remains in each file).

- `src/scenes.json`: narration, timing, and scene copy.
- `src/video.tsx`: landscape and vertical compositions.
- `public/shots/`: actual project UI captured before fixture cleanup. These illustrative cases remain labelled in the film.
- `public/voice-*.mp3`: system-generated English narration, separate from officer call audio.
- `public/music.wav`: original programmatically synthesized soundtrack.
- `../pramanik-showcase.srt`: phrase captions; within-phrase word timestamps are estimated from speech duration.

Run `node prepare.mjs` to regenerate narration and captions on macOS, then `npm run render` or `npm run render:reel`. If the app is already using port 3000, add `-- --port=3115`.

The film shows the real implementation with labelled demonstration records. It does not claim real government outreach or verified civic outcomes.
