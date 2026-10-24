# Phase 6 — Close the loop

**Code implemented · live GPS/photo check pending.**

- Completion claim → amber marker → resident review; never automatic closure.
- Resident: Fixed / Partially fixed / Not fixed / Cannot verify.
- Optional after photo + explicit live location capture, time and accuracy.
- Server calculates distance to pin: nearby = within 100m, accuracy ≤50m.
- Observation must be within 10 minutes; raw device coordinates are not retained in the public dossier.
- Worker compares before/after photos: appears fixed / problem visible / inconclusive.
- Scene match, missing evidence and model limitations remain visible.
- Resident/photo conflicts keep the case disputed.
- Review requires a fixed response and no conflicts; attached photos must finish assessment first.
- Distant/imprecise/simulated supplied location cannot support closure review.
- Observation-only review stays manual and does not claim GPS/AI verification.

**Your check:** venue GPS + photo → assessment → review → red or green map state.

**Limits:** client-reported GPS does not authenticate photos; appearance does not establish durability. One response per fixed user per review; later completion claims can open another review after dispute.
