import assert from "node:assert/strict"
import { test } from "node:test"
import {
  buildActivityTrace,
  type TraceData,
  type TraceStep,
} from "../lib/voice/activity-trace"
import { buildWorkSummary, type WorkRecords } from "../lib/voice/work-summary"
import {
  activityStatus,
  stepTiming,
  traceGeometry,
  traceRows,
  traceScale,
} from "../lib/voice/trace-presentation"

const at = "2026-10-24T09:01:00.000Z"
function fixture() {
  return {
    worker: { online: true },
    civic: {
      issues: [
        {
          id: "case-a",
          title: "Road repair",
          localityId: "kothrud",
          complaintCount: 2,
          isDemo: true,
          status: "following_up",
        },
      ],
    },
    followUpRuns: [
      {
        id: "run-a",
        state: "active",
        issueIds: ["case-a"],
        createdAt: at,
        updatedAt: at,
        brief: {
          preparedAt: at,
          questions: [
            { issueId: "case-a", question: "When will the work begin?" },
          ],
          nextAction: "Ask the contact for the start date.",
        },
      },
    ],
    calls: [],
    jobs: [],
  } as unknown as TraceData
}
function summary(data: TraceData, records: WorkRecords | null = null) {
  return buildWorkSummary(
    data,
    "run:run-a",
    buildActivityTrace(data, "run:run-a", {}, Date.parse(at)),
    records,
    Date.parse(at)
  )
}
function call(data: TraceData, status: string) {
  data.calls.push({
    id: "call-a",
    issueId: "case-a",
    status,
    createdAt: at,
  } as TraceData["calls"][number])
  data.jobs.push({
    id: "call-job",
    followUpRunId: "run-a",
    callId: "call-a",
    state: "completed",
    kind: "outbound_call",
    dueAt: at,
  } as TraceData["jobs"][number])
}

test("a saved plan is shown without claiming that any call happened", () => {
  const result = summary(fixture())
  assert.equal(result.next[0].state, "planned")
  assert.deepEqual(result.next[0].questions, ["When will the work begin?"])
  assert.equal(result.next[1].note, "Ask the contact for the start date.")
  assert.equal(
    result.stages.find((stage) => stage.id === "speak")?.state,
    "planned"
  )
})

test("blocked configuration and pauses have plain-language explanations", () => {
  const data = fixture()
  data.followUpRuns[0].state = "awaiting_configuration"
  assert.equal(
    summary(data).now.title,
    "The call is waiting for a contact to be set up"
  )
  assert.equal(summary(data).next[0].state, "attention")
  data.followUpRuns[0].state = "paused"
  assert.equal(summary(data).now.title, "This follow-up is paused")
  assert.equal(summary(data).next[0].state, "waiting")
})

test("plan progresses from calling to conversation saved; repairs stay unverified", () => {
  const data = fixture()
  call(data, "in-progress")
  assert.equal(summary(data).now.title, "Talking with the contact now")
  assert.equal(summary(data).next[0].state, "working")
  data.calls[0].status = "completed"
  assert.equal(summary(data).next[0].state, "done")
  assert.equal(
    summary(data).stages.find((stage) => stage.id === "verify")?.state,
    "planned"
  )
  data.civic.issues[0].status = "awaiting_verification"
  assert.equal(
    summary(data).now.title,
    "Waiting for residents to check the repair"
  )
  data.civic.issues[0].status = "verified"
  assert.equal(
    summary(data).stages.find((stage) => stage.id === "verify")?.state,
    "done"
  )
})

test("a conversation about the same case does not complete another follow-up's plan", () => {
  const data = fixture()
  data.calls.push({
    id: "unrelated",
    issueId: "case-a",
    status: "completed",
    createdAt: at,
  } as TraceData["calls"][number])
  const records = {
    capturedAt: at,
    plans: [],
    activities: [
      {
        id: "other",
        followUpRunId: "other-run",
        callId: "unrelated",
        issueId: "case-a",
        action: "record_commitment",
        state: "completed",
        createdAt: at,
        updatedAt: at,
      },
    ],
  } as unknown as WorkRecords
  const result = summary(data, records)
  assert.equal(result.next[0].state, "planned")
  assert.equal(
    result.history.some((item) => item.id === "other"),
    false
  )
})

test("live saved actions use human descriptions and offline work is not called running", () => {
  const data = fixture()
  const records = {
    capturedAt: at,
    plans: [],
    activities: [
      {
        id: "read",
        followUpRunId: "run-a",
        action: "get_issue_timeline",
        state: "running",
        createdAt: at,
        updatedAt: at,
      },
    ],
  } as unknown as WorkRecords
  assert.equal(
    summary(data, records).now.title,
    "Checking earlier updates and promises"
  )
  data.worker!.online = false
  assert.equal(summary(data, records).now.title, "The agent is offline for now")
  assert.equal(summary(data, records).now.state, "waiting")
})

test("unknown states, paused work and cancellation are never success", () => {
  assert.equal(activityStatus("something-new"), "unknown")
  assert.equal(activityStatus("paused"), "paused")
  assert.equal(activityStatus("canceled"), "cancelled")
  assert.equal(activityStatus("completed"), "completed")
})

test("nice timeline scales preserve observed duration and exclude schedules", () => {
  const steps = [
    {
      id: "run",
      kind: "run",
      state: "active",
      label: "Run",
      start: 1000,
      end: 5400,
    },
    {
      id: "event",
      kind: "tool",
      state: "completed",
      label: "Read",
      start: 5400,
    },
    {
      id: "job",
      kind: "job",
      state: "queued",
      label: "Next",
      start: null,
      detail: { dueAt: "2027-01-01" },
    },
  ] as TraceStep[]
  const scale = traceScale(steps)!
  assert.equal(scale.observed, 4400)
  assert.equal(scale.extent, 8000)
  assert.equal(stepTiming(steps[2]).kind, "scheduled")
  assert.equal(traceGeometry(steps[0], scale)?.left, 0)
  assert.ok(Math.abs(traceGeometry(steps[0], scale)!.width - 55) < 1e-9)
  assert.equal(traceGeometry(steps[2], scale), null)
  assert.equal(stepTiming({ ...steps[0], end: 0 }).kind, "event")
})

test("search and attention filters keep ancestor context and reveal collapsed errors", () => {
  const steps = [
    {
      id: "parent",
      label: "Follow-up",
      kind: "run",
      state: "active",
      start: 0,
    },
    {
      id: "child",
      parentId: "parent",
      label: "Read complaint",
      kind: "tool",
      state: "failed",
      start: 0,
    },
    {
      id: "other",
      parentId: "parent",
      label: "Saved call",
      kind: "call",
      state: "completed",
      start: 0,
    },
  ] as TraceStep[]
  const collapsed = new Set(["parent"])
  assert.equal(traceRows(steps, collapsed).length, 1)
  const filtered = traceRows(steps, collapsed, "", true)
  assert.deepEqual(
    filtered.map((row) => row.step.id),
    ["parent", "child"]
  )
  assert.equal(filtered[0].context, true)
  assert.equal(filtered[1].depth, 1)
  assert.deepEqual(
    traceRows(steps, collapsed, "complaint").map((row) => row.step.id),
    ["parent", "child"]
  )
})
