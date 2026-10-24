"use client"

import type { ReactNode } from "react"
import {
  Activity,
  Ban,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  HelpCircle,
  Loader2,
  Pause,
  Phone,
  ScanLine,
  Terminal,
  TriangleAlert,
  X,
} from "lucide-react"
import { LocalizedText } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/civic/model"
import type { TraceStep } from "@/lib/voice/activity-trace"
import {
  activityStatus,
  formatTraceDuration,
  stepTiming,
  traceFieldLabel,
  traceGeometry,
  traceRecord,
  traceRows,
  traceScale,
  traceStatusCounts,
  traceStatusLabels,
  type TraceStatus,
} from "@/lib/voice/trace-presentation"
import { cn } from "@/lib/utils"

const statusStyles: Record<
  TraceStatus,
  { color: string; fill: string; icon: typeof Check }
> = {
  running: {
    color: "text-sky-600 dark:text-sky-300",
    fill: "bg-sky-500",
    icon: Loader2,
  },
  completed: {
    color: "text-emerald-700 dark:text-emerald-400",
    fill: "bg-emerald-500",
    icon: Check,
  },
  attention: {
    color: "text-amber-700 dark:text-amber-400",
    fill: "bg-amber-500",
    icon: TriangleAlert,
  },
  waiting: {
    color: "text-muted-foreground",
    fill: "bg-slate-400",
    icon: Clock3,
  },
  paused: {
    color: "text-violet-600 dark:text-violet-300",
    fill: "bg-violet-400",
    icon: Pause,
  },
  cancelled: {
    color: "text-muted-foreground",
    fill: "bg-slate-500",
    icon: Ban,
  },
  unknown: {
    color: "text-muted-foreground",
    fill: "bg-slate-600",
    icon: HelpCircle,
  },
}
const kindIcons = {
  run: ScanLine,
  brief: FileText,
  call: Phone,
  tool: Terminal,
  job: Activity,
}

export function TraceStatusIcon({
  state,
  className,
}: {
  state: string
  className?: string
}) {
  const status = activityStatus(state)
  const { icon: Icon, color } = statusStyles[status]
  return (
    <Icon
      aria-hidden
      className={cn(
        "size-3.5 shrink-0",
        color,
        status === "running" && "motion-safe:animate-spin",
        className
      )}
    />
  )
}

export function TraceStatusBadge({ state }: { state: string }) {
  const status = activityStatus(state)
  return (
    <Badge
      variant="outline"
      title={state.replaceAll("_", " ")}
      className={cn(
        "gap-1.5 border-current/15 bg-current/5 text-[10px] font-normal",
        statusStyles[status].color
      )}
    >
      <TraceStatusIcon state={state} />
      <LocalizedText text={traceStatusLabels[status]} />
    </Badge>
  )
}

export function TraceMetric({
  label,
  value,
  hint,
  icon,
  attention = false,
}: {
  label: string
  value: ReactNode
  hint: string
  icon: ReactNode
  attention?: boolean
}) {
  return (
    <div className="min-w-0 border-b px-4 py-3 sm:border-b-0">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <LocalizedText text={label} />
        {icon}
      </div>
      <p
        className={cn(
          "mt-2 font-mono text-xl tracking-tight tabular-nums",
          attention && "text-amber-600 dark:text-amber-400"
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">
        <LocalizedText text={hint} />
      </p>
    </div>
  )
}

export function TraceStateSummary({ steps }: { steps: TraceStep[] }) {
  const counts = traceStatusCounts(steps)
  const entries = (Object.entries(counts) as [TraceStatus, number][]).filter(
    ([, count]) => count > 0
  )
  if (!steps.length) return null
  return (
    <div className="space-y-2 border-b px-4 py-3">
      <div
        className="flex h-1.5 gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={entries
          .map(([status, count]) => `${count} ${traceStatusLabels[status]}`)
          .join(", ")}
      >
        {entries.map(([status, count]) => (
          <span
            key={status}
            title={`${count} ${traceStatusLabels[status]}`}
            className={cn("min-w-1 rounded-full", statusStyles[status].fill)}
            style={{ flex: count }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        {entries.map(([status, count]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span
              className={cn("size-1.5 rounded-full", statusStyles[status].fill)}
            />
            {count} <LocalizedText text={traceStatusLabels[status]} />
          </span>
        ))}
      </div>
    </div>
  )
}

function TimingMark({
  step,
  scale,
  selected,
}: {
  step: TraceStep
  scale: ReturnType<typeof traceScale>
  selected: boolean
}) {
  const timing = stepTiming(step)
  if (!scale || timing.kind === "scheduled" || timing.kind === "unknown") {
    const due = traceRecord(step.detail).dueAt
    return (
      <span className="px-3 text-[10px] text-muted-foreground">
        <LocalizedText
          text={
            timing.kind === "scheduled"
              ? typeof due === "string"
                ? `Scheduled · ${formatDate(due)}`
                : "Schedule details"
              : "Timing not recorded"
          }
        />
      </span>
    )
  }
  const geometry = traceGeometry(step, scale)!
  const status = activityStatus(step.state)
  const accent =
    status === "attention"
      ? "border-amber-500/60 bg-amber-500/20"
      : step.live
        ? "border-sky-400/60 bg-sky-400/20"
        : "border-violet-400/45 bg-violet-400/20"
  return (
    <div className="absolute inset-x-4 inset-y-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex justify-between"
      >
        {scale.ticks.map((tick) => (
          <span key={tick} className="h-full border-l border-border/40" />
        ))}
      </div>
      {timing.kind === "window" ? (
        <span
          className={cn(
            "absolute top-3 h-4 min-w-px rounded-sm border",
            accent,
            selected && "ring-1 ring-current/20"
          )}
          style={{ left: `${geometry.left}%`, width: `${geometry.width}%` }}
        />
      ) : (
        <span
          className={cn(
            "absolute top-3.5 size-2.5 -translate-x-1/2 rotate-45 rounded-[2px] border",
            status === "attention"
              ? "border-amber-500 bg-amber-500/30"
              : "border-teal-500/70 bg-teal-500/30"
          )}
          style={{ left: `${geometry.left}%` }}
        />
      )}
      {step.live && (
        <span
          aria-hidden
          className="absolute inset-y-1 right-0 border-l border-dashed border-sky-400/70"
          style={{ right: `${100 - geometry.left - geometry.width}%` }}
        />
      )}
    </div>
  )
}

export function TraceTimeline({
  steps,
  selectedId,
  onSelect,
  collapsed,
  onToggle,
  query = "",
  attentionOnly = false,
  view = "timeline",
}: {
  steps: TraceStep[]
  selectedId?: string
  onSelect: (id: string) => void
  collapsed: Set<string>
  onToggle: (id: string) => void
  query?: string
  attentionOnly?: boolean
  view?: "timeline" | "list"
}) {
  const scale = traceScale(steps)
  const rows = traceRows(steps, collapsed, query, attentionOnly)
  const timeline = view === "timeline"
  const grid = timeline
    ? "grid-cols-[minmax(220px,1fr)_130px_minmax(240px,1.4fr)_80px]"
    : "grid-cols-[minmax(180px,1fr)_130px_80px]"
  return (
    <div
      className="min-w-0 overflow-x-auto"
      tabIndex={0}
      aria-label="Agent steps; scroll horizontally to see the full timeline"
    >
      <div className={timeline ? "min-w-[700px]" : "min-w-[410px]"}>
        <div
          className={cn(
            "grid border-b bg-muted/20 text-[10px] tracking-wide text-muted-foreground",
            grid
          )}
        >
          <div className="px-4 py-2 uppercase">
            <LocalizedText text="Step" />
          </div>
          <div className="py-2 uppercase">
            <LocalizedText text="Status" />
          </div>
          {timeline && (
            <div className="relative flex justify-between border-l px-4 py-2 font-mono tracking-normal">
              {scale && scale.observed > 0 ? (
                scale.ticks.map((tick) => (
                  <span key={tick}>+{formatTraceDuration(tick)}</span>
                ))
              ) : (
                <LocalizedText text="Recorded timestamps" />
              )}
            </div>
          )}
          <div className="py-2 pr-4 text-right uppercase">
            <LocalizedText text="Timing" />
          </div>
        </div>
        <div className="max-h-[440px] overflow-y-auto">
          {!rows.length && (
            <p className="p-8 text-center text-xs text-muted-foreground">
              <LocalizedText text="No steps match these filters." />
            </p>
          )}
          {rows.map(({ step, depth, children, context }) => {
            const Icon = kindIcons[step.kind]
            const timing = stepTiming(step)
            const focused = selectedId === step.id
            const filtering = !!query.trim() || attentionOnly
            return (
              <div
                key={step.id}
                data-step-id={step.id}
                className={cn(
                  "grid min-h-10 border-b border-border/30 last:border-b-0 hover:bg-muted/30",
                  grid,
                  focused && "bg-accent/70",
                  context && "text-muted-foreground"
                )}
              >
                <div
                  className="flex min-w-0 items-center pr-2"
                  style={{ paddingLeft: 8 + Math.min(depth, 6) * 14 }}
                >
                  {children ? (
                    <button
                      type="button"
                      disabled={filtering}
                      aria-expanded={filtering || !collapsed.has(step.id)}
                      aria-label={`${!filtering && collapsed.has(step.id) ? "Expand" : "Collapse"} ${step.label}`}
                      onClick={() => onToggle(step.id)}
                      className="shrink-0 rounded p-1 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30"
                    >
                      {!filtering && collapsed.has(step.id) ? (
                        <ChevronRight className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      )}
                    </button>
                  ) : (
                    <span className="w-5 shrink-0" />
                  )}
                  <button
                    type="button"
                    aria-pressed={focused}
                    onClick={() => onSelect(step.id)}
                    title={step.label}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded py-2 text-left text-xs focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon
                      className={cn(
                        "size-3.5 shrink-0",
                        step.kind === "tool"
                          ? "text-teal-500"
                          : "text-muted-foreground"
                      )}
                    />
                    <span className="truncate">
                      <LocalizedText text={step.label} />
                    </span>
                  </button>
                </div>
                <div className="flex items-center">
                  <TraceStatusBadge state={step.state} />
                </div>
                {timeline && (
                  <button
                    type="button"
                    aria-label={`Inspect ${step.label}: ${step.state}`}
                    title={step.timing}
                    onClick={() => onSelect(step.id)}
                    className="relative min-h-10 overflow-hidden border-l text-left focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <TimingMark step={step} scale={scale} selected={focused} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelect(step.id)}
                  aria-label={`Inspect timing for ${step.label}`}
                  title={step.timing}
                  className="flex items-center justify-end pr-4 font-mono text-[10px] text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {timing.kind === "window" ? (
                    <span className={cn(step.live && "text-sky-500")}>
                      {formatTraceDuration(timing.duration)}
                      {step.live && " ↗"}
                    </span>
                  ) : (
                    <LocalizedText
                      text={timing.kind === "event" ? "Event" : "—"}
                    />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TraceValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined)
    return (
      <span className="text-muted-foreground">
        <LocalizedText text="Not recorded" />
      </span>
    )
  if (typeof value !== "object") return <LocalizedText text={String(value)} />
  if (depth > 2)
    return (
      <pre className="overflow-auto text-[11px] break-words whitespace-pre-wrap">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  if (Array.isArray(value))
    return value.length ? (
      <ul className="space-y-2">
        {value.slice(0, 30).map((item, index) => (
          <li key={index} className="rounded-lg border bg-background/50 p-2.5">
            <TraceValue value={item} depth={depth + 1} />
          </li>
        ))}
        {value.length > 30 && (
          <li className="text-muted-foreground">
            <LocalizedText
              text={`${value.length - 30} more items in raw record`}
            />
          </li>
        )}
      </ul>
    ) : (
      <span className="text-muted-foreground">
        <LocalizedText text="None recorded" />
      </span>
    )
  return (
    <dl className="space-y-2">
      {Object.entries(value).map(([key, item]) => (
        <div key={key} className="space-y-1">
          <dt className="text-[10px] text-muted-foreground">
            <LocalizedText text={traceFieldLabel(key)} />
          </dt>
          <dd className="leading-relaxed break-words whitespace-pre-wrap">
            <TraceValue value={item} depth={depth + 1} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function TraceInspector({
  step,
  onClose,
  onInspectCall,
}: {
  step: TraceStep
  onClose: () => void
  onInspectCall?: (id: string) => void
}) {
  const record = traceRecord(step.detail)
  const timing = stepTiming(step)
  const fields: Record<TraceStep["kind"], string[]> = {
    brief: ["summary", "questions", "missingEvidence", "nextAction"],
    tool: ["input", "result", "summary", "cases"],
    call: ["summary", "duration", "transcript", "outcome", "context"],
    job: ["dueAt", "attempts"],
    run: ["cases"],
  }
  const sections = fields[step.kind].filter(
    (field) => record[field] !== null && record[field] !== undefined
  )
  return (
    <aside
      aria-label="Trace step details"
      className="min-w-0 border-t bg-muted/10 xl:border-t-0 xl:border-l"
    >
      <div className="flex items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0 space-y-2">
          <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
            <LocalizedText text={`${step.kind} details`} />
          </p>
          <h3 className="text-sm font-medium break-words">
            <LocalizedText text={step.label} />
          </h3>
          <TraceStatusBadge state={step.state} />
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Close trace details"
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
      <div className="max-h-[540px] space-y-4 overflow-y-auto p-4 text-xs">
        <div className="space-y-1.5 rounded-lg border bg-background/50 p-3">
          <p className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <LocalizedText
              text={
                timing.kind === "window"
                  ? step.live
                    ? "Elapsed window"
                    : "Recorded window"
                  : timing.kind === "event"
                    ? "Recorded event"
                    : "Schedule"
              }
            />
            {timing.kind === "window" && (
              <span className="font-mono text-foreground">
                {formatTraceDuration(timing.duration)}
              </span>
            )}
          </p>
          {(timing.kind === "window" || timing.kind === "event") && (
            <p className="font-mono text-[10px]">
              {new Date(timing.start).toLocaleTimeString("en-IN", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                fractionalSecondDigits: 3,
                timeZone: "Asia/Kolkata",
              })}{" "}
              IST
            </p>
          )}
          <p className="leading-relaxed text-muted-foreground">
            <LocalizedText text={step.timing} />
          </p>
        </div>
        {step.error && (
          <div
            role="note"
            className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-amber-700 dark:text-amber-300"
          >
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            <p className="break-words">
              <LocalizedText text={step.error} />
            </p>
          </div>
        )}
        {sections.length ? (
          sections.map((field) => {
            const value =
              field === "duration" && typeof record.duration === "number"
                ? formatTraceDuration(record.duration * 1000)
                : field === "dueAt" && typeof record.dueAt === "string"
                  ? formatDate(record.dueAt)
                  : record[field]
            return field === "transcript" || field === "context" ? (
              <details
                key={`${step.id}:${field}`}
                className="rounded-lg border p-3"
              >
                <summary className="cursor-pointer font-medium">
                  <LocalizedText text={traceFieldLabel(field)} />
                </summary>
                <div className="mt-3">
                  <TraceValue value={value} />
                </div>
              </details>
            ) : (
              <section key={field} className="space-y-2">
                <h4 className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  <LocalizedText text={traceFieldLabel(field)} />
                </h4>
                <div className="rounded-lg border bg-background/40 p-3 leading-relaxed break-words whitespace-pre-wrap">
                  <TraceValue value={value} />
                </div>
              </section>
            )
          })
        ) : (
          <TraceValue value={step.detail} />
        )}
        <details key={`raw:${step.id}`} className="border-t pt-3">
          <summary className="cursor-pointer text-[10px] text-muted-foreground">
            <LocalizedText text="Raw record" />
          </summary>
          <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-background p-3 text-[10px] leading-relaxed break-words whitespace-pre-wrap">
            {JSON.stringify(
              { id: step.id, state: step.state, detail: step.detail },
              null,
              2
            )}
          </pre>
        </details>
        {step.callId && onInspectCall && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onInspectCall(step.callId!)}
          >
            <Phone />
            <LocalizedText text="Open call inspector" />
          </Button>
        )}
      </div>
    </aside>
  )
}
