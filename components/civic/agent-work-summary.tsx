"use client"

import {
  ArrowRight,
  Check,
  ClipboardList,
  Clock3,
  HelpCircle,
  Loader2,
  MessageSquare,
  TriangleAlert,
} from "lucide-react"
import { LocalizedText } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { formatDate, localityName } from "@/lib/civic/model"
import {
  buildWorkSummary,
  type WorkItem,
  type WorkRecords,
  type WorkState,
} from "@/lib/voice/work-summary"
import type { TraceData, TraceStep } from "@/lib/voice/activity-trace"
import { cn } from "@/lib/utils"

const states: Record<
  WorkState,
  { label: string; icon: typeof Check; color: string }
> = {
  working: {
    label: "Working now",
    icon: Loader2,
    color: "text-sky-600 dark:text-sky-300",
  },
  done: {
    label: "Done",
    icon: Check,
    color: "text-emerald-700 dark:text-emerald-400",
  },
  planned: {
    label: "Planned",
    icon: ClipboardList,
    color: "text-muted-foreground",
  },
  waiting: {
    label: "Waiting",
    icon: Clock3,
    color: "text-violet-600 dark:text-violet-300",
  },
  attention: {
    label: "Needs attention",
    icon: TriangleAlert,
    color: "text-amber-700 dark:text-amber-400",
  },
}

function WorkIcon({
  state,
  className,
}: {
  state: WorkState
  className?: string
}) {
  const Icon = states[state].icon
  return (
    <Icon
      aria-hidden
      className={cn(
        "size-4 shrink-0",
        states[state].color,
        state === "working" && "motion-safe:animate-spin",
        className
      )}
    />
  )
}
function WorkBadge({ state }: { state: WorkState }) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 text-[10px] font-normal", states[state].color)}
    >
      <WorkIcon state={state} className="size-3" />
      <LocalizedText text={states[state].label} />
    </Badge>
  )
}
function PlanCard({ item, index }: { item: WorkItem; index: number }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border bg-background/40 p-4">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] text-muted-foreground">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h4 className="text-sm font-medium">
            <LocalizedText text={item.title} />
          </h4>
          <WorkBadge state={item.state} />
        </div>
        {item.note && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            <LocalizedText text={item.note} />
          </p>
        )}
        {item.dueAt && (
          <p className="flex items-center gap-1.5 text-xs">
            <Clock3 className="size-3" />
            <LocalizedText text="Scheduled for" /> {formatDate(item.dueAt)}
          </p>
        )}
        {!!item.questions?.length && (
          <details className="border-t pt-2">
            <summary className="cursor-pointer text-xs font-medium">
              <LocalizedText
                text={`Questions the agent prepared (${item.questions.length})`}
              />
            </summary>
            <ul className="mt-3 space-y-2">
              {item.questions.map((question, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                >
                  <MessageSquare className="mt-0.5 size-3 shrink-0" />
                  <LocalizedText text={question} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </li>
  )
}

export function AgentWorkSummary({
  data,
  selection,
  steps,
  records,
  loading,
  error,
}: {
  data: TraceData
  selection: string
  steps: TraceStep[]
  records: WorkRecords | null
  loading: boolean
  error: string
}) {
  const summary = buildWorkSummary(data, selection, steps, records)
  const now = summary.now
  const issue = summary.issues[0]
  const reportCount = summary.issues.reduce(
    (count, item) => count + item.complaintCount,
    0
  )
  const hasCall = steps.some((step) => step.kind === "call")
  return (
    <div className="space-y-5 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            <LocalizedText text="Following up on" />
          </p>
          <h3 className="text-base font-semibold tracking-tight">
            <LocalizedText
              text={
                summary.issues.length > 1
                  ? `${summary.issues.length} community issues`
                  : (issue?.title ?? "This conversation")
              }
            />
          </h3>
          {issue && (
            <p className="text-xs text-muted-foreground">
              <LocalizedText text={localityName(issue.localityId)} /> ·{" "}
              {reportCount}{" "}
              <LocalizedText text={reportCount === 1 ? "report" : "reports"} />
              {summary.issues.every((item) => item.isDemo) && (
                <>
                  {" "}
                  · <LocalizedText text="Demo case" />
                </>
              )}
            </p>
          )}
        </div>
        <WorkBadge state={now.state} />
      </div>
      <div
        className={cn(
          "flex items-start gap-4 rounded-xl border p-4 md:p-5",
          now.state === "attention"
            ? "border-amber-500/25 bg-amber-500/5"
            : now.state === "working"
              ? "border-sky-500/25 bg-sky-500/5"
              : now.state === "done"
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "bg-muted/20"
        )}
      >
        <div className="rounded-full border bg-background/60 p-2.5">
          <WorkIcon state={now.state} className="size-5" />
        </div>
        <div role="status" className="min-w-0 space-y-2">
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            <LocalizedText text="Right now" />
          </p>
          <p className="text-base font-medium">
            <LocalizedText text={now.title} />
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            <LocalizedText text={now.note} />
          </p>
        </div>
      </div>
      {!!summary.stages.length && (
        <ol
          aria-label="Follow-up progress"
          className="grid grid-cols-2 gap-2 lg:grid-cols-4"
        >
          {summary.stages.map((stage, index) => (
            <li key={stage.id} className="relative rounded-xl border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full",
                    stage.state === "done" ? "bg-emerald-500/10" : "bg-muted"
                  )}
                >
                  <WorkIcon state={stage.state} className="size-3.5" />
                </span>
                {index < summary.stages.length - 1 && (
                  <ArrowRight className="size-3 text-muted-foreground/50" />
                )}
              </div>
              <p className="text-xs font-medium">
                <LocalizedText text={stage.title} />
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                <LocalizedText text={stage.note} />
              </p>
              <p className={cn("mt-2 text-[10px]", states[stage.state].color)}>
                <LocalizedText text={states[stage.state].label} />
              </p>
            </li>
          ))}
        </ol>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ClipboardList className="size-4 text-muted-foreground" />
              <LocalizedText text="The saved plan" />
            </h3>
            {loading && (
              <Loader2
                aria-label="Refreshing saved plan"
                className="size-3 animate-spin text-muted-foreground"
              />
            )}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            <LocalizedText text="What the agent intends to do. Recorded actions appear alongside it." />
          </p>
          {summary.next.length ? (
            <ol className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {summary.next.map((item, index) => (
                <PlanCard key={item.id} item={item} index={index} />
              ))}
            </ol>
          ) : (
            <div className="flex gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              <HelpCircle className="mt-0.5 size-4 shrink-0" />
              <p>
                <LocalizedText
                  text={
                    selection.startsWith("call:")
                      ? "This is a conversation record. Choose a follow-up above to see its saved plan."
                      : "The agent has not saved a plan for this follow-up yet."
                  }
                />
              </p>
            </div>
          )}
        </section>
        <section className="min-w-0 space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Clock3 className="size-4 text-muted-foreground" />
            <LocalizedText text="What has happened" />
          </h3>
          <p className="text-xs text-muted-foreground">
            <LocalizedText text="Updates from the agent’s actual work, newest first." />
          </p>
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300"
            >
              <LocalizedText text="Some updates could not refresh. The last available records are shown; the agent will try again shortly." />
            </p>
          )}
          {summary.history.length ? (
            <ol className="max-h-[420px] space-y-0 overflow-y-auto pr-1">
              {summary.history.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 border-b py-3 first:pt-0 last:border-b-0"
                >
                  <span className="mt-0.5 rounded-full border bg-muted/20 p-1.5">
                    <WorkIcon state={item.state} className="size-3" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-xs font-medium">
                        <LocalizedText text={item.title} />
                      </p>
                      <WorkBadge state={item.state} />
                    </div>
                    {item.note && (
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        <LocalizedText text={item.note} />
                      </p>
                    )}
                    {item.at && (
                      <p className="text-[10px] text-muted-foreground">
                        {formatDate(item.at)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              <LocalizedText text="No finished steps have been recorded for this follow-up yet." />
            </p>
          )}
        </section>
      </div>
      {hasCall && (
        <p className="flex items-start gap-2 rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
          <MessageSquare className="mt-0.5 size-3.5 shrink-0" />
          <LocalizedText text="A finished conversation means the response was recorded. The repair is only marked as verified after residents check it." />
        </p>
      )}
    </div>
  )
}
