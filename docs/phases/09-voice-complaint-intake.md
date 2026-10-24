# Phase 9 — Voice-first reporting

**Sarvam + GPT path implemented · user listening check pending.**

- Browser microphone → Sarvam transcription → GPT reasoning → streamed Sarvam speech.
- Marathi default; Hindi/English selection; short targeted questions.
- Draft title, category/type, description and landmark.
- Spoken corrections update the draft; no silent publication.
- Resident reviews text, chooses final map pin, adds optional photo and confirms.
- Existing complaint saving and duplicate detection reused.
- Session idempotency prevents repeated confirmation duplicating a submitted case.
- Text fallback; intake never starts outbound follow-up.

**Your check:** speak → review → place pin → confirm → find case on map.

- Inferred details update after each speaking turn, before the final draft.
- Pause detection or Send turn submits a clip; 24-second cap. The microphone pauses during replies.
- Visible transcription, reading, inference and speech events reflect server activity.
- Original resident wording stays saved; the final map pin is always chosen on screen.
