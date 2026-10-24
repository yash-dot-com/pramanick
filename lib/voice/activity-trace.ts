import type { CivicSnapshot } from "@/lib/civic/model"
import type { callActivity } from "./bolna"
import type { voiceOperations } from "./operations"

export type TraceData = ReturnType<typeof voiceOperations> & {
  civic: CivicSnapshot
}
export type CallActivity = ReturnType<typeof callActivity>
export type TraceStep = {
  id: string
  parentId?: string
  label: string
  kind: "run" | "brief" | "call" | "tool" | "job"
  state: string
  start: number | null
  end?: number
  live?: boolean
  timing: string
  detail: unknown
  error?: string | null
  callId?: string
}

const activeCalls = new Set([
  "initiating",
  "queued",
  "ringing",
  "in-progress",
  "call-disconnected",
])
export function traceState(state: string) {
  if (
    [
      "failed",
      "error",
      "needs_review",
      "dispatch_unknown",
      "extraction_failed",
      "balance-low",
      "awaiting_configuration",
      "no-answer",
      "busy",
    ].includes(state)
  )
    return "error"
  if (
    [
      "running",
      "in-progress",
      "ringing",
      "initiating",
      "preparing",
      "extracting",
      "call-disconnected",
    ].includes(state)
  )
    return "active"
  if (["completed", "processed"].includes(state)) return "done"
  return "waiting"
}
function timestamp(value: unknown): number | null {
  if (typeof value !== "string") return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}
function parseDetail(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

// Follow-up membership comes from saved job links, never a shared issue ID:
// multiple independent conversations can concern the same case.
export function traceCallIds(data: TraceData, selection: string) {
  if (selection.startsWith("call:")) return [selection.slice(5)]
  const linked = new Set(
    data.jobs
      .filter((job) => job.followUpRunId === selection.slice(4))
      .map((job) => job.callId)
      .filter(Boolean)
  )
  return data.calls.filter((call) => linked.has(call.id)).map((call) => call.id)
}

export function buildActivityTrace(
  data: TraceData,
  selection: string,
  activities: Record<string, CallActivity>,
  now: number
): TraceStep[] {
  const steps: TraceStep[] = []
  const run = selection.startsWith("run:")
    ? data.followUpRuns.find((item) => item.id === selection.slice(4))
    : undefined
  const callIds = traceCallIds(data, selection)
  if (run) {
    const live = ["active", "preparing"].includes(run.state)
    steps.push({
      id: selection,
      label: "Pramanik follow-through",
      kind: "run",
      state: run.state,
      start: timestamp(run.createdAt),
      end: live ? now : (timestamp(run.updatedAt) ?? undefined),
      live,
      timing: "Run window · includes waiting between actions",
      detail: {
        runId: run.id,
        cases: run.issueIds.map((id) => ({
          id,
          title: data.civic.issues.find((issue) => issue.id === id)?.title,
        })),
        state: run.state,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
      },
    })
    if (run.brief)
      steps.push({
        id: `brief:${run.id}`,
        parentId: selection,
        label: "Prepare case brief",
        kind: "brief",
        state: "completed",
        start: timestamp(run.createdAt),
        end: timestamp(run.brief.preparedAt) ?? undefined,
        timing: "Preparation window · includes queue time",
        detail: run.brief,
      })
  }
  for (const id of [...callIds].reverse()) {
    const activity = activities[id]
    const call = activity?.call ?? data.calls.find((item) => item.id === id)
    if (!call) continue
    const live = activeCalls.has(call.status)
    const stepId = `call:${id}`
    steps.push({
      id: stepId,
      parentId: run ? selection : undefined,
      label: "Voice conversation",
      kind: "call",
      state: call.status,
      start: timestamp(call.createdAt),
      end: live ? now : undefined,
      live,
      timing: live
        ? "Elapsed since dispatch · includes connecting and processing"
        : "Dispatch timestamp · conversation duration shown separately",
      detail: activity ? { ...activity.call, context: activity.context } : call,
      error: call.error,
      callId: id,
    })
    for (const tool of [...(activity?.tools ?? [])].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    )) {
      steps.push({
        id: `tool:${tool.id}`,
        parentId: stepId,
        label: tool.tool.replaceAll("_", " "),
        kind: "tool",
        state: tool.state,
        start: timestamp(tool.createdAt),
        timing: "Recorded event · execution duration unavailable",
        detail: parseDetail(tool.detail),
        error: tool.state === "failed" ? tool.detail : null,
        callId: id,
      })
    }
  }
  const jobs = data.jobs.filter((job) =>
    run
      ? job.followUpRunId === run.id ||
        (!!job.callId && callIds.includes(job.callId))
      : !!job.callId && callIds.includes(job.callId)
  )
  for (const job of [...jobs].reverse()) {
    steps.push({
      id: `job:${job.id}`,
      parentId:
        job.callId && callIds.includes(job.callId)
          ? `call:${job.callId}`
          : run
            ? selection
            : undefined,
      label: job.kind.replaceAll("_", " "),
      kind: "job",
      state: job.state,
      start: null,
      timing: "Scheduled work · execution timestamps unavailable",
      detail: job,
      error: job.error,
      callId: job.callId ?? undefined,
    })
  }
  const ordered: TraceStep[] = []
  function append(parentId?: string) {
    for (const step of steps.filter((item) => item.parentId === parentId)) {
      ordered.push(step)
      append(step.id)
    }
  }
  append()
  return ordered
}
