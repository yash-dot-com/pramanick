import assert from "node:assert/strict"
import { test } from "node:test"
import {
  buildActivityTrace,
  traceCallIds,
  traceState,
  type CallActivity,
  type TraceData,
} from "../lib/voice/activity-trace"

const started = "2026-10-24T09:00:00.000Z"
const finished = "2026-10-24T09:01:00.000Z"
function fixture() {
  return {
    civic: { issues: [{ id: "case-a", title: "Road repair" }] },
    followUpRuns: [
      {
        id: "run-a",
        issueIds: ["case-a"],
        state: "active",
        createdAt: started,
        updatedAt: finished,
        brief: { preparedAt: finished, summary: "Read the evidence" },
      },
    ],
    calls: [
      {
        id: "unrelated",
        issueId: "case-a",
        createdAt: started,
        status: "completed",
      },
      {
        id: "call-a",
        issueId: "case-a",
        createdAt: started,
        status: "in-progress",
        duration: null,
      },
      {
        id: "call-b",
        issueId: "case-a",
        createdAt: finished,
        status: "completed",
        duration: 12,
      },
    ],
    jobs: [
      {
        id: "job-a",
        followUpRunId: "run-a",
        callId: "call-a",
        kind: "outbound_call",
        state: "completed",
        dueAt: "2027-01-01T00:00:00Z",
      },
      {
        id: "job-b",
        followUpRunId: "run-a",
        callId: "call-b",
        kind: "outbound_call",
        state: "completed",
        dueAt: finished,
      },
      {
        id: "extract",
        followUpRunId: null,
        callId: "call-a",
        kind: "extract_outcome",
        state: "needs_review",
        dueAt: finished,
      },
    ],
  } as unknown as TraceData
}

test("only explicit call links establish run membership", () => {
  assert.deepEqual(traceCallIds(fixture(), "run:run-a"), ["call-a", "call-b"])
  const steps = buildActivityTrace(
    fixture(),
    "call:unrelated",
    {},
    Date.parse(finished)
  )
  assert.deepEqual(
    steps.map((step) => step.id),
    ["call:unrelated"]
  )
})

test("scheduled dates never become execution timing", () => {
  const steps = buildActivityTrace(
    fixture(),
    "run:run-a",
    {},
    Date.parse(finished)
  )
  const scheduled = steps.find((step) => step.id === "job:job-a")!
  assert.equal(scheduled.start, null)
  assert.equal(scheduled.end, undefined)
  assert.equal(
    steps.find((step) => step.id === "job:extract")?.state,
    "needs_review"
  )
})

test("paused runs stop growing and terminal calls have no invented end", () => {
  const data = fixture()
  data.followUpRuns[0].state = "paused"
  const steps = buildActivityTrace(
    data,
    "run:run-a",
    {},
    Date.parse(finished) + 60_000
  )
  assert.equal(steps[0].end, Date.parse(finished))
  assert.equal(steps[0].live, false)
  assert.equal(
    steps.find((step) => step.id === "call:call-a")?.end,
    Date.parse(finished) + 60_000
  )
  assert.equal(steps.find((step) => step.id === "call:call-b")?.end, undefined)
})

test("tool events retain input/result or errors without invented durations", () => {
  const activity = {
    call: fixture().calls[1],
    context: {},
    tools: [
      {
        id: "failed",
        tool: "get_issue_timeline",
        state: "failed",
        detail: "Case unavailable",
        createdAt: finished,
      },
      {
        id: "read",
        tool: "get_complaint_details",
        state: "completed",
        detail: JSON.stringify({
          input: { issue_id: "case-a" },
          result: { title: "Road repair" },
        }),
        createdAt: started,
      },
    ],
  } as CallActivity
  const steps = buildActivityTrace(
    fixture(),
    "call:call-a",
    { "call-a": activity },
    Date.parse(finished)
  )
  const tool = steps.find((step) => step.id === "tool:read")!
  assert.deepEqual(tool.detail, {
    input: { issue_id: "case-a" },
    result: { title: "Road repair" },
  })
  assert.equal(tool.end, undefined)
  assert.equal(
    steps.find((step) => step.id === "tool:failed")?.error,
    "Case unavailable"
  )
  assert.equal(traceState("dispatch_unknown"), "error")
  assert.equal(traceState("awaiting_configuration"), "error")
})

test("nested call jobs remain next to their parent call", () => {
  const steps = buildActivityTrace(
    fixture(),
    "run:run-a",
    {},
    Date.parse(finished)
  )
  const callA = steps.findIndex((step) => step.id === "call:call-a")
  assert.equal(steps[callA + 1].parentId, "call:call-a")
  assert.equal(steps[callA + 2].parentId, "call:call-a")
})

test("missing or invalid preparation timestamps stay unmeasured", () => {
  const data = fixture()
  data.followUpRuns[0].brief = {
    summary: "Legacy brief",
    preparedAt: "invalid",
  }
  assert.equal(
    buildActivityTrace(data, "run:run-a", {}, Date.parse(finished)).find(
      (step) => step.kind === "brief"
    )?.end,
    undefined
  )
  assert.deepEqual(
    buildActivityTrace(data, "run:missing", {}, Date.parse(finished)),
    []
  )
})
