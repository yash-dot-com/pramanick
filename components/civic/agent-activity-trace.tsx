"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  Clock3,
  List,
  Loader2,
  Maximize2,
  Minimize2,
  ScanLine,
  Search,
  Terminal,
  TriangleAlert,
} from "lucide-react"
import { LocalizedText } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate, localityName } from "@/lib/civic/model"
import {
  buildActivityTrace,
  traceCallIds,
  type CallActivity,
  type TraceData,
} from "@/lib/voice/activity-trace"
import {
  activityStatus,
  formatTraceDuration,
  traceRows,
  traceScale,
} from "@/lib/voice/trace-presentation"
import { cn } from "@/lib/utils"
import type { WorkRecords } from "@/lib/voice/work-summary"
import { AgentWorkSummary } from "./agent-work-summary"
import {
  TraceInspector,
  TraceMetric,
  TraceStateSummary,
  TraceTimeline,
} from "./trace-primitives"

export function AgentActivityTrace({
  data,
  onInspectCall,
}: {
  data: TraceData
  onInspectCall: (id: string) => void
}) {
  const options = [
    ...data.followUpRuns.map((run) => ({
      id: `run:${run.id}`,
      createdAt: run.createdAt,
      label: `${run.scope === "locality" ? localityName(run.localityId ?? "") : (data.civic.issues.find((issue) => issue.id === run.issueIds[0])?.title ?? "Case follow-up")} · ${formatDate(run.createdAt)}`,
    })),
    ...data.calls.map((call) => ({
      id: `call:${call.id}`,
      createdAt: call.createdAt,
      label: `Call · ${data.civic.issues.find((issue) => issue.id === call.issueId)?.title ?? "Conversation"} · ${formatDate(call.createdAt)}`,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const [chosen, setChosen] = useState("")
  const selection = options.some((option) => option.id === chosen)
    ? chosen
    : (options.find((option) => option.id.startsWith("run:"))?.id ??
      options[0]?.id ??
      "")
  const [activities, setActivities] = useState<Record<string, CallActivity>>({})
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState("")
  const [query, setQuery] = useState("")
  const [attentionOnly, setAttentionOnly] = useState(false)
  const [view, setView] = useState<"timeline" | "list">("timeline")
  const [records, setRecords] = useState<WorkRecords | null>(null)
  const [workError, setWorkError] = useState("")
  const [workLoading, setWorkLoading] = useState(true)
  const [now, setNow] = useState(() => Date.now())
  const [sync, setSync] = useState<{
    key: string
    at: number
    error: string
    loading: boolean
  }>({ key: "", at: 0, error: "", loading: false })
  const callKey = traceCallIds(data, selection).sort().join(",")

  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    async function read() {
      if (!document.hidden) {
        try {
          const response = await fetch("/api/dashboard", {
            cache: "no-store",
            signal: controller.signal,
          })
          const result = await response.json()
          if (!response.ok)
            throw new Error(result.error || "Saved activity could not refresh")
          if (controller.signal.aborted) return
          setRecords({
            activities: result.activities,
            plans: result.plans,
            capturedAt: result.capturedAt,
          })
          setWorkError("")
        } catch (error) {
          if (!controller.signal.aborted)
            setWorkError(
              error instanceof Error
                ? error.message
                : "Saved activity could not refresh"
            )
        } finally {
          if (!controller.signal.aborted) setWorkLoading(false)
        }
      }
      if (!controller.signal.aborted)
        timer = setTimeout(() => void read(), 5000)
    }
    void read()
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) setNow(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    if (!callKey) return
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    async function read() {
      if (!document.hidden) {
        setSync((current) => ({ ...current, key: callKey, loading: true }))
        const results = await Promise.allSettled(
          callKey.split(",").map(async (id) => {
            const response = await fetch(`/api/voice/calls/${id}`, {
              cache: "no-store",
              signal: controller.signal,
            })
            const result = await response.json()
            if (!response.ok)
              throw new Error(result.error || "Could not load call activity")
            return [id, result] as [string, CallActivity]
          })
        )
        if (controller.signal.aborted) return
        const successful = results.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : []
        )
        const failed = results.some((result) => result.status === "rejected")
        setActivities((current) => ({
          ...current,
          ...Object.fromEntries(successful),
        }))
        setSync((current) => ({
          key: callKey,
          at: successful.length
            ? Date.now()
            : current.key === callKey
              ? current.at
              : 0,
          loading: false,
          error: failed
            ? "Some call activity could not refresh. Showing the last available records; retrying automatically."
            : "",
        }))
      }
      if (!controller.signal.aborted)
        timer = setTimeout(() => void read(), 5000)
    }
    void read()
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [callKey])

  const steps = buildActivityTrace(data, selection, activities, now)
  const scale = traceScale(steps)
  const focused = steps.find((step) => step.id === selected)
  const errors = steps.filter(
    (step) => activityStatus(step.state) === "attention"
  ).length
  const live = steps.some((step) => step.live)
  const currentSync = sync.key === callKey ? sync : null
  const actionSteps = steps.filter((step) => step.kind !== "run")
  const visibleCount = traceRows(steps, collapsed, query, attentionOnly).length
  const stale =
    !!currentSync?.error || (!!currentSync?.at && now - currentSync.at > 20_000)
  const hasFilters = !!query || attentionOnly
  function toggle(id: string) {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section
      aria-label="Pramanik agent activity trace"
      className="overflow-hidden rounded-xl border bg-card text-card-foreground"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="rounded-lg border bg-muted/30 p-1.5">
            <ScanLine className="size-4 text-sky-500" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">
              <LocalizedText text="What Pramanik is doing" />
            </h2>
            <p className="text-[10px] text-muted-foreground">
              <LocalizedText text="The plan, the progress, and what’s waiting" />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentSync?.loading && (
            <Loader2
              aria-label="Refreshing activity"
              className="size-3 animate-spin text-muted-foreground"
            />
          )}
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 text-[10px]",
              stale && "text-amber-600 dark:text-amber-400"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                stale
                  ? "bg-amber-500"
                  : live
                    ? "bg-sky-400 motion-safe:animate-pulse"
                    : "bg-muted-foreground"
              )}
            />
            <LocalizedText
              text={
                stale
                  ? "Refresh delayed"
                  : live
                    ? "Following updates"
                    : "Saved updates"
              }
            />
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            <LocalizedText
              text={data.worker?.online ? "Agent online" : "Agent offline"}
            />
          </Badge>
        </div>
      </div>
      {!options.length ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="rounded-xl border bg-muted/40 p-3">
            <Activity className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">
            <LocalizedText text="A window into the agent’s work" />
          </p>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            <LocalizedText text="Start a follow-up or conversation to see what the agent plans to do and how it is progressing." />
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <Select
              value={selection}
              onValueChange={(value) => {
                if (value) {
                  setChosen(value)
                  setSelected("")
                  setCollapsed(new Set())
                  setQuery("")
                  setAttentionOnly(false)
                }
              }}
            >
              <SelectTrigger
                aria-label="Choose agent trace"
                className="w-full sm:max-w-[460px]"
              >
                <SelectValue>
                  <LocalizedText
                    text={
                      options.find((option) => option.id === selection)?.label
                    }
                  />
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <LocalizedText text={option.label} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AgentWorkSummary
            data={data}
            selection={selection}
            steps={steps}
            records={records}
            loading={workLoading}
            error={workError || currentSync?.error || ""}
          />
          <details className="border-t">
            <summary className="cursor-pointer px-5 py-3 text-xs text-muted-foreground">
              <LocalizedText text="Technical details and timing" />
            </summary>
            <div className="grid grid-cols-2 divide-x divide-border border-b sm:grid-cols-4">
              <TraceMetric
                label="Observed window"
                value={
                  !scale
                    ? "—"
                    : scale.observed === 0
                      ? "Event only"
                      : formatTraceDuration(scale.observed)
                }
                hint="Includes waiting between actions"
                icon={<Clock3 className="size-3.5" />}
              />
              <TraceMetric
                label="Recorded steps"
                value={actionSteps.length}
                hint="Calls, briefs, tools and queue records"
                icon={<Activity className="size-3.5" />}
              />
              <TraceMetric
                label="Tool events"
                value={
                  callKey && !currentSync?.at
                    ? "—"
                    : steps.filter((step) => step.kind === "tool").length
                }
                hint="Saved tool inputs and results"
                icon={<Terminal className="size-3.5" />}
              />
              <TraceMetric
                label="Needs attention"
                value={errors}
                hint="Blocked or unsuccessful steps"
                attention={errors > 0}
                icon={<TriangleAlert className="size-3.5" />}
              />
            </div>
            <TraceStateSummary steps={actionSteps} />
            {currentSync?.error && (
              <p
                role="alert"
                className="border-b bg-amber-500/5 px-4 py-2 text-xs text-amber-700 dark:text-amber-300"
              >
                <LocalizedText text={currentSync.error} />
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-2.5 left-3 size-3.5 text-muted-foreground" />
                  <Input
                    aria-label="Search trace steps"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Find a step…"
                    className="h-8 w-44 pl-8 text-xs"
                  />
                </div>
                <Button
                  variant={attentionOnly ? "secondary" : "ghost"}
                  size="sm"
                  aria-pressed={attentionOnly}
                  onClick={() => setAttentionOnly((current) => !current)}
                >
                  <TriangleAlert className="size-3.5" />
                  <LocalizedText text="Needs attention" />
                </Button>
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuery("")
                      setAttentionOnly(false)
                    }}
                  >
                    <LocalizedText text="Clear" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="mr-2 text-[10px] text-muted-foreground">
                  {visibleCount}/{steps.length} <LocalizedText text="shown" />
                </span>
                <div
                  aria-label="Trace view"
                  className="flex rounded-lg border p-0.5"
                >
                  <Button
                    variant={view === "timeline" ? "secondary" : "ghost"}
                    size="icon-xs"
                    aria-pressed={view === "timeline"}
                    aria-label="Timeline view"
                    onClick={() => setView("timeline")}
                  >
                    <ScanLine />
                  </Button>
                  <Button
                    variant={view === "list" ? "secondary" : "ghost"}
                    size="icon-xs"
                    aria-pressed={view === "list"}
                    aria-label="List view"
                    onClick={() => setView("list")}
                  >
                    <List />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Expand all steps"
                  disabled={hasFilters}
                  onClick={() => setCollapsed(new Set())}
                >
                  <Maximize2 />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Collapse all steps"
                  disabled={hasFilters}
                  onClick={() =>
                    setCollapsed(
                      new Set(
                        steps.flatMap((step) =>
                          step.parentId ? [step.parentId] : []
                        )
                      )
                    )
                  }
                >
                  <Minimize2 />
                </Button>
              </div>
            </div>
            <div
              className={cn(
                "grid",
                focused && "xl:grid-cols-[minmax(0,1fr)_340px]"
              )}
            >
              <TraceTimeline
                steps={steps}
                selectedId={focused?.id}
                onSelect={setSelected}
                collapsed={collapsed}
                onToggle={toggle}
                query={query}
                attentionOnly={attentionOnly}
                view={view}
              />
              {focused && (
                <TraceInspector
                  step={focused}
                  onClose={() => setSelected("")}
                  onInspectCall={onInspectCall}
                />
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5 text-[10px] text-muted-foreground">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-4 rounded-sm border border-violet-400/50 bg-violet-400/20" />
                  <LocalizedText text="Elapsed window" />
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rotate-45 bg-teal-500" />
                  <LocalizedText text="Recorded event" />
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-3" />
                  <LocalizedText text="Scheduled work has no execution timing" />
                </span>
              </div>
              <span>
                <LocalizedText text="Refreshes every 5s" />
                {currentSync?.at
                  ? ` · ${new Date(currentSync.at).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}`
                  : ""}
              </span>
            </div>
            <p className="border-t px-4 py-2.5 text-[10px] leading-relaxed text-muted-foreground">
              <LocalizedText text="Recent saved activity, up to 40 tool events per call. Windows include waiting. Tool durations, model tokens and costs are not recorded." />
            </p>
          </details>
        </>
      )}
    </section>
  )
}
