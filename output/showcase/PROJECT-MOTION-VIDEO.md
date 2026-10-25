# Pramanik — Product motion edition

113 seconds · 1280 × 720 · 30 fps · 3,390 frames. Silent.

The concise, second-person script and Lavender background remain. Three product scenes now show the workflow:

- Resident verification: circular green confirmation controls, a saved observation, a photo attachment, location, photo assessment and reviewer confirmation. Button presses, cursor travel and status changes are deterministic Remotion animation.
- Public dashboard: a capture of the current application inside a rounded frame. The verified-repairs filter selects the same school-gate case used by the timeline.
- Public record: a downward-revealing, scrolling timeline of the community report, saved call and summary, promised deadline, agent follow-up, resident checks and verified result.

## Styling and records

`src/project-motion-theme.json` contains the actual light-mode surface, button and shadow values from `app/globals.css`. Green verification colors match `lib/civic/status-presentation.ts`. `src/project-motion-graphics.tsx` builds frame-driven presentation versions of these surfaces; it does not submit observations or trigger real calls.

`src/public-case-motion.json` holds the public case information used in the timeline, summarized from the local dashboard and dossier endpoints. Dates use Asia/Kolkata. The displayed call duration is rounded from its existing recording duration. The call is represented visually; the film contains no audio track.

The former proof-image banners are not used. The displayed attachments and verification states use clean product graphics. Main narrative sentences remain two lines at most.

## Build

`npm run render:silent-story:product` renders the full composition from `src/silent-story-index.tsx` to `../pramanik-product-motion-final.mp4`.

For this export, existing footage is reused frame-exactly around the two newly rendered sections. Scene metadata retains original source times; the background's clock is mapped through extended scenes, keeping its motion continuous at each edit. The new sections include adjacent transition frames.

Final edit order: old frames 0–2159; new verification frames 2160–2411; old frames 2292–2549; new dashboard/timeline frames 2670–3191; old frames 2832–3029. Total: 3,390 frames.

## Agent presence and directory update

`src/agent-presence-graphics.tsx` adds five polished black agent orbs with staggered spring entrances and small independent orbits. Only the agent introduction scene uses these avatars.

The contact scene scrolls through the project's published ward directory and selects Kothrud–Bavdhan Ward Office. The same office appears on a compact iPhone-style outgoing-call screen beside the voice waveform. `phone-office-contact.json` and `ward-directory-motion.json` are extracted from `data/pune/contacts_master.csv`; no invented official names, phone numbers, connection time, or call result are introduced. These are presentation graphics and do not initiate calls.

The updated silent export is `../pramanik-agent-presence-final.mp4`. It retains the 113-second duration and reuses the product-motion export outside frames 630–761 and 1320–1661 (inclusive).

The refinement export, `../pramanik-agent-presence-refined.mp4`, adds elongated white eyes with staggered blinks. The directory now ends flush with its rows, omits the phone-number footer and heading icon, and softly blurs rows beneath a frosted sticky header. It replaces frames 630–761 and 1320–1451 of the agent-presence export, preserving the call scene and all other footage.
