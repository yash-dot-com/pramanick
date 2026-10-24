# Phase 9 — Voice-first reporting

**Code implemented; remote draft tool configured · live conversation check pending.**

- Microphone opens official Bolna browser SDK.
- Marathi default; Hindi/English selection; short targeted questions.
- Draft title, category/type, description and landmark.
- Spoken corrections update the draft; no silent publication.
- Resident reviews text, chooses final map pin, adds optional photo and confirms.
- Existing complaint saving and duplicate detection reused.
- Session idempotency prevents repeated confirmation duplicating a submitted case.
- Text fallback; intake never starts outbound follow-up.

**Your check:** speak → review → place pin → confirm → find case on map.

- Live inferred details update through the partial-inference tool, before the final draft.
- Connection/listening/speaking states come from the SDK; read/write actions come from persisted server events.
