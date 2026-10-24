import assert from "node:assert/strict"
import { test } from "node:test"
import {
  conversationTurns,
  publicCaseTimeline,
  publicResponseNotes,
  type PublicCaseCall,
  type PublicCaseData,
} from "../lib/civic/public-case"

function call(overrides: Partial<PublicCaseCall> = {}): PublicCaseCall {
  return {
    id: "call-a",
    phoneAttempt: true,
    transcript:
      "assistant: What happens next?\nuser: We will inspect the road on Monday.",
    responseSignals: {
      evidenceQuote: "We will inspect the road on Monday.",
      uncertainty: "",
      actionPlanGiven: true,
      deadlineGiven: true,
      responsibilityClarified: false,
    },
    ...overrides,
  } as PublicCaseCall
}

test("transcript turns preserve wording and carry multiline answers without inventing times", () => {
  assert.deepEqual(
    conversationTurns(
      "assistant: Hello.\nuser: I visited the road.\nThe repair is pending.\nassistant: When will work begin?"
    ),
    [
      { speaker: "agent", text: "Hello." },
      {
        speaker: "contact",
        text: "I visited the road.\nThe repair is pending.",
      },
      { speaker: "agent", text: "When will work begin?" },
    ]
  )
  assert.equal(
    conversationTurns("An unlabelled saved transcript.")[0].speaker,
    "unattributed"
  )
})

test("response notes require supporting wording in a published transcript", () => {
  const notes = publicResponseNotes(call())
  assert.equal(
    notes.items.find((item) => item.key === "deadlineGiven")?.state,
    "documented"
  )
  assert.equal(
    notes.items.find((item) => item.key === "responsibilityClarified")?.state,
    "not_documented"
  )
  assert.equal(notes.quote, "We will inspect the road on Monday.")
})

test("unpublished or mismatched evidence stays unknown and does not disclose the quote", () => {
  for (const item of [
    call({ transcript: null }),
    call({ transcript: "user: I have no update." }),
  ]) {
    const notes = publicResponseNotes(item)
    assert.equal(notes.quote, null)
    assert.ok(notes.items.every((note) => note.state === "unknown"))
  }
})

test("citizen/browser conversations cannot become official response assessments", () => {
  const notes = publicResponseNotes(call({ phoneAttempt: false }))
  assert.equal(notes.eligible, false)
  assert.equal(notes.quote, null)
  assert.ok(notes.items.every((note) => note.state === "unknown"))
})

test("missing evaluation fields stay unknown rather than becoming negative findings", () => {
  const notes = publicResponseNotes(
    call({
      responseSignals: {
        evidenceQuote: "We will inspect the road on Monday.",
        uncertainty: "",
      },
    })
  )
  assert.ok(notes.items.every((note) => note.state === "unknown"))
})

test("case history combines dated calls and events while retaining stable identities", () => {
  const data = {
    timeline: [
      { id: "same", createdAt: "2026-10-24T09:00:00Z", title: "Reported" },
    ],
    calls: [{ id: "same", createdAt: "2026-10-24T10:00:00Z" }],
  } as PublicCaseData
  const entries = publicCaseTimeline(data)
  assert.deepEqual(
    entries.map((entry) => entry.id),
    ["event:same", "call:same"]
  )
  assert.deepEqual(
    entries.map((entry) => entry.kind),
    ["event", "call"]
  )
})
