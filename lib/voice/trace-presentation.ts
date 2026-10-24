import type { TraceStep } from "./activity-trace"

export type TraceStatus =
  | "running"
  | "completed"
  | "attention"
  | "waiting"
  | "paused"
  | "cancelled"
  | "unknown"
export const traceStatusLabels: Record<TraceStatus, string> = {
  running: "Running",
  completed: "Completed",
  attention: "Needs attention",
  waiting: "Waiting",
  paused: "Paused",
  cancelled: "Cancelled",
  unknown: "Unknown",
}

export function activityStatus(state: string): TraceStatus {
  if (
    [
      "running",
      "in-progress",
      "ringing",
      "initiating",
      "preparing",
      "extracting",
      "call-disconnected",
      "starting",
    ].includes(state)
  )
    return "running"
  if (["completed", "processed", "succeeded"].includes(state))
    return "completed"
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
    return "attention"
  if (state === "paused") return "paused"
  if (["cancelled", "canceled", "stopped"].includes(state)) return "cancelled"
  if (
    ["queued", "waiting", "active", "retry_pending", "scheduled"].includes(
      state
    )
  )
    return "waiting"
  return "unknown"
}

export function formatTraceDuration(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return "—"
  if (ms < 1000) return `${Math.round(ms)}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`
  if (seconds < 86400)
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
}

// A due date is a scheduling fact, never a measured execution start.
export function stepTiming(step: TraceStep) {
  if (step.start === null || !Number.isFinite(step.start))
    return {
      kind: step.kind === "job" ? ("scheduled" as const) : ("unknown" as const),
    }
  if (
    step.end !== undefined &&
    Number.isFinite(step.end) &&
    step.end >= step.start
  )
    return {
      kind: "window" as const,
      start: step.start,
      end: step.end,
      duration: step.end - step.start,
    }
  return { kind: "event" as const, start: step.start }
}

export function traceScale(steps: TraceStep[]) {
  const timestamps = steps.flatMap((step) => {
    const timing = stepTiming(step)
    if (timing.kind === "window") return [timing.start, timing.end]
    if (timing.kind === "event") return [timing.start]
    return []
  })
  if (!timestamps.length) return null
  const start = Math.min(...timestamps)
  const observed = Math.max(...timestamps) - start
  // Use a readable 1/2/5 scale. Padding the axis doesn't inflate the observed window.
  const rawTick = Math.max(1000, observed) / 4
  const magnitude = 10 ** Math.floor(Math.log10(rawTick))
  const tick = [1, 2, 5, 10]
    .map((factor) => factor * magnitude)
    .find((value) => value >= rawTick)!
  const extent = tick * 4
  return {
    start,
    observed,
    extent,
    ticks: Array.from({ length: 5 }, (_, i) => tick * i),
  }
}

export function traceGeometry(
  step: TraceStep,
  scale: NonNullable<ReturnType<typeof traceScale>>
) {
  const timing = stepTiming(step)
  if (timing.kind !== "window" && timing.kind !== "event") return null
  const left = Math.max(
    0,
    Math.min(100, ((timing.start - scale.start) / scale.extent) * 100)
  )
  const width =
    timing.kind === "window"
      ? Math.max(
          0,
          Math.min(100 - left, (timing.duration / scale.extent) * 100)
        )
      : 0
  return { left, width }
}

export function traceRows(
  steps: TraceStep[],
  collapsed: Set<string>,
  query = "",
  attentionOnly = false
) {
  const byId = new Map(steps.map((step) => [step.id, step]))
  const children = new Set(
    steps.flatMap((step) => (step.parentId ? [step.parentId] : []))
  )
  const matches = new Set(
    steps
      .filter(
        (step) =>
          (!attentionOnly || activityStatus(step.state) === "attention") &&
          `${step.label} ${step.state} ${step.kind}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())
      )
      .map((step) => step.id)
  )
  const included = new Set(matches)
  const filtering = !!query.trim() || attentionOnly
  for (const id of matches) {
    let parent = byId.get(id)?.parentId
    const seen = new Set<string>([id])
    while (parent && !seen.has(parent)) {
      included.add(parent)
      seen.add(parent)
      parent = byId.get(parent)?.parentId
    }
  }
  return steps.flatMap((step) => {
    if (filtering && !included.has(step.id)) return []
    let depth = 0
    let parent = step.parentId
    const seen = new Set<string>([step.id])
    while (parent && !seen.has(parent)) {
      if (!filtering && collapsed.has(parent)) return []
      seen.add(parent)
      if (!byId.has(parent)) break
      depth++
      parent = byId.get(parent)?.parentId
    }
    return [
      {
        step,
        depth,
        children: children.has(step.id),
        context: filtering && !matches.has(step.id),
      },
    ]
  })
}

export function traceStatusCounts(steps: TraceStep[]) {
  const counts: Record<TraceStatus, number> = {
    running: 0,
    completed: 0,
    attention: 0,
    waiting: 0,
    paused: 0,
    cancelled: 0,
    unknown: 0,
  }
  for (const step of steps) counts[activityStatus(step.state)]++
  return counts
}

export function traceRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

const fieldLabels: Record<string, string> = {
  input: "Input",
  result: "Result",
  summary: "Summary",
  questions: "Questions to ask",
  missingEvidence: "Missing evidence",
  nextAction: "Next action",
  cases: "Cases",
  context: "Call context",
  outcome: "Recorded outcome",
  dueAt: "Scheduled for",
  attempts: "Attempts",
  duration: "Conversation duration",
}
export function traceFieldLabel(field: string) {
  return (
    fieldLabels[field] ??
    field
      .replaceAll("_", " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (letter) => letter.toUpperCase())
  )
}
