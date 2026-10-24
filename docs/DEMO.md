# Pramanik — mentor demo

**One case. Two conversations. One visible outcome.**

## Opening — 15 seconds

> “India has a follow-through problem. Pramanik remembers the promise after the complaint number is issued—and keeps the case open until residents check the result.”

## Before the demo

- Locally set a consenting friend's `BOLNA_DEMO_PHONE` and `BOLNA_DEMO_CALL_AUTHORIZED=true`; restart worker.
- Keep Next.js, worker and public HTTPS tunnel running.
- In Operations, edit the demo role/language; use Hindi or Marathi.
- Enable transcript publication only with the friend's consent.
- Use live GPS at the venue. A phone browser on the HTTPS tunnel is practical for location and camera; reliable Wi-Fi alone does not guarantee precise GPS.
- Use a clearly labeled fictional venue case and actual photographs of a controlled demonstration.
- Have distinct before/after photos under 2MB; don't use generated or unrelated photos as real repair evidence.
- Keep `/app`, `/operations`, `/leaderboard` ready.

## 1 — Report

- Tap microphone; describe a venue demonstration issue in Hindi/Marathi.
- Review the drafted title and details.
- Choose **Use my live location**, adjust the pin if needed.
- Mark **Fictional demo case**, add the before photo and confirm.
- Hover the red pin; click for the case history.

**Say:** “The citizen speaks. They only place the final pin and confirm.”

## 2 — Agent takes ownership of follow-through

- Operations → open case → assign **Pramanik demo civic office**.
- Click **Start follow-up**.
- Show the generated brief/questions and durable call job.
- Friend answers as the explicitly labeled demonstration responsibility holder.
- Friend promises one concrete action at a clear date/time, in Asia/Kolkata.
- Wait for final transcript/outcome; show the promise and next job.

**Say:** “This deadline is now something the system remembers.”

## 3 — Memory becomes action

- After the minimum two-minute call spacing, use **Follow up now**.
- Agent asks about the previous promise using saved context.
- Friend claims completion.
- Show timeline + Kanban + amber pin.

**Say:** “A spoken completion claim does not close the case.”

## 4 — Location-assisted resident check

- Resident review → choose the observed answer.
- Add the distinct after photo → **Capture live location** → save.
- Show distance, GPS accuracy/time, before/after evidence and AI findings/limitations.
- Operations reviews resident findings.
- A supported repair can become green; a conflicting finding stays red/disputed.
- Show the responsibility profile's resulting evidence-backed metrics.

**Say:** “We separate what was promised, what was claimed, and what residents observed.”

## 5 — If the promise is missed

- Let a genuine short demonstration deadline pass to show the overdue event and automatic draft.
- Alternatively use **Escalation → Prepare current complaint draft**; label this as an operator-triggered draft.
- Download the draft and matching dossier version.
- Show dated attempts, source calls, promises and evidence references.
- Official filing is external today. Record a real reference only after actually filing; never invent an acknowledgment.

**Say:** “When follow-up fails, the citizen doesn't have to reconstruct the entire history.”

## End — 10 seconds

> “Pramanik turns a complaint into a persistent public case: remembered commitments, repeated follow-up, resident verification, and evidence that survives escalation.”

## Honest boundaries

- Demonstration person is not a real official; metrics are demo data until actual authorized casework exists.
- GPS accompanies the upload; it doesn't prove photo authenticity or capture location.
- AI findings are advisory; green requires resident/operations review.
- Automated official grievance filing and multi-office calling are future integrations.
- Voice behavior, provider timing, GPS accuracy and UI flow still need your runtime rehearsal.
- No builds/tests/browser checks or live phone call were performed by the implementation agent.

## Optional submission tooling

- Loops CLI is not installed. If needed for submission: `npm install -g loopshouse`, then `loops auth status`.
- No submission, live criteria lookup or external mentor message has been sent.
