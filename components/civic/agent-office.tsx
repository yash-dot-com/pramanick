"use client"
import { DEMO_MODE } from "@/lib/demo-mode"

import Link from "next/link"
import {
  ArrowDown,
  ArrowRight,
  AudioLines,
  Brain,
  CalendarClock,
  CheckCheck,
  Headset,
  Network,
  Search,
  UsersRound,
} from "lucide-react"
import { useState } from "react"
import type { PublicAgentDashboard } from "@/lib/voice/dashboard"
import { formatDate } from "@/lib/civic/model"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./status-badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const desks = [
  {
    role: "reports",
    name: "Community desk",
    job: "Bring together reports about the same problem.",
    icon: UsersRound,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  },
  {
    role: "history",
    name: "Memory & evidence",
    job: "Remember what was said, promised and shown.",
    icon: Brain,
    color:
      "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  },
  {
    role: "responsibility",
    name: "Find the right office",
    job: "Check whose responsibility the problem is.",
    icon: Search,
    color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  },
  {
    role: "outreach",
    name: "Follow-up desk",
    job: "Ask the officer for an action and a date.",
    icon: Headset,
    color: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200",
  },
  {
    role: "evaluation",
    name: "Promise tracker",
    job: "Compare the response with the earlier promise.",
    icon: CalendarClock,
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  },
  {
    role: "verification",
    name: "Resident check",
    job: "Ask people on the ground if it is actually fixed.",
    icon: CheckCheck,
    color:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  },
] as const
type Activity = PublicAgentDashboard["activities"][number]
function roleOf(activity: Activity) {
  if (typeof activity.detail?.officeRole === "string")
    return activity.detail.officeRole
  if (/call|outreach|dispatch/.test(activity.action)) return "outreach"
  if (/commitment|deadline|evaluate|outcome/.test(activity.action))
    return "evaluation"
  if (/survey|verification|resident/.test(activity.action))
    return "verification"
  return null
}
export function AgentOffice({
  data,
  onOpenCase,
}: {
  data: PublicAgentDashboard
  onOpenCase: (id: string) => void
}) {
  const [caseId, setCaseId] = useState(
    data.issues.some((issue) => issue.id === "office-demo-water")
      ? "office-demo-water"
      : "all"
  )
  const activities = [
    ...(data.officeActivities ?? []),
    ...data.activities.filter((entry) => !entry.detail?.officeRole),
  ].filter(
    (entry) =>
      caseId === "all" ||
      entry.issueId === caseId ||
      (Array.isArray(entry.detail?.issueIds) &&
        entry.detail.issueIds.includes(caseId))
  )
  const isWorking = (entry: Activity | undefined) =>
    !!entry &&
    entry.state === "running" &&
    !!data.worker?.online &&
    Date.parse(data.capturedAt) - Date.parse(entry.updatedAt) < 180_000 &&
    (!entry.followUpRunId ||
      data.runs.some(
        (run) =>
          run.id === entry.followUpRunId &&
          ["active", "preparing"].includes(run.state)
      ))
  const latest = (role: string) =>
    activities
      .filter((entry) => roleOf(entry) === role)
      .sort(
        (a, b) =>
          Number(isWorking(b)) - Number(isWorking(a)) ||
          b.updatedAt.localeCompare(a.updatedAt)
      )[0]
  const coordinator = latest("coordinator")
  const running = activities.filter(isWorking)
  const demoCases = data.issues.filter((issue) =>
    issue.id.startsWith("office-demo-")
  )
  function output(entry: Activity | undefined) {
    const result = entry?.detail?.result
    return result &&
      typeof result === "object" &&
      "summary" in result &&
      typeof result.summary === "string"
      ? result.summary
      : entry?.summary
  }
  function renderDesk(desk: (typeof desks)[number]) {
    const entry = latest(desk.role)
    const Icon = desk.icon
    const issueId =
      entry?.issueId ||
      (Array.isArray(entry?.detail?.issueIds)
        ? entry.detail.issueIds.find(
            (id): id is string => typeof id === "string"
          )
        : null)
    return (
      <article
        key={desk.role}
        className={cn(
          "rounded-xl border bg-background p-4 shadow-sm",
          isWorking(entry) && "border-teal-500 ring-2 ring-teal-500/10"
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-lg",
              desk.color
            )}
          >
            <Icon className="size-4" />
          </span>
          <div className="flex-1">
            <h3 className="text-xs font-semibold">{desk.name}</h3>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {isWorking(entry)
                ? "Working now"
                : entry?.state === "running"
                  ? "Awaiting worker update"
                  : entry?.state === "needs_review"
                    ? "Needs help"
                    : entry
                      ? "Last completed work"
                      : "Waiting for work"}
            </p>
          </div>
          {isWorking(entry) && (
            <span className="size-2 animate-pulse rounded-full bg-teal-500" />
          )}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">{desk.job}</p>
        <div className="mt-3 min-h-16 rounded-lg bg-muted/35 p-3 text-xs leading-relaxed">
          {output(entry) ||
            "No work has been recorded at this desk for this case yet."}
        </div>
        {entry && (
          <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <span>
              {entry.detail?.provenance === "scripted_demo"
                ? "Scripted example"
                : "Agent record"}
            </span>
            {issueId && (
              <button
                onClick={() => onOpenCase(issueId)}
                className="flex items-center gap-1 underline underline-offset-2"
              >
                Open case <ArrowRight className="size-3" />
              </button>
            )}
          </div>
        )}
      </article>
    )
  }
  return (
    <section
      aria-label="Public agent office"
      className="overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b p-5 md:px-7">
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            <span
              className={cn(
                "size-2 rounded-full",
                running.length ? "animate-pulse bg-emerald-500" : "bg-slate-400"
              )}
            />
            Pramanik · Public office
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Your complaint. A whole team on it.
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            See who is doing what, what was promised, and what happens next.
          </p>
        </div>
        <label className="space-y-1 text-xs text-muted-foreground">
          <span className="block">Look inside a case</span>
          <Select
            value={caseId}
            onValueChange={(value) => {
              if (value) setCaseId(value)
            }}
          >
            <SelectTrigger aria-label="Office case" className="w-72 max-w-full">
              <SelectValue>
                {caseId === "all"
                  ? "All casework"
                  : data.issues.find((issue) => issue.id === caseId)?.title}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <SelectItem value="all">All casework</SelectItem>
              {data.issues.map((issue) => (
                <SelectItem key={issue.id} value={issue.id}>
                  {issue.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      <div className="relative bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:18px_18px] p-5 md:p-7">
        <div className="mx-auto max-w-lg rounded-xl border border-teal-700/30 bg-background p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-800 text-white">
              <Network className="size-5" />
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">
                Pramanik · Office coordinator
              </h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Sets the plan · assigns work · brings the answers together
              </p>
            </div>
            <span className="rounded-full border px-2 py-1 text-[10px]">
              {isWorking(coordinator)
                ? "Coordinating"
                : coordinator?.state === "running"
                  ? "Awaiting update"
                  : coordinator
                    ? "Plan saved"
                    : "Ready"}
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed">
            {output(coordinator) ||
              "The coordinator starts when a case is prepared. Specialist findings and hand-offs appear here as they are saved."}
          </p>
          {coordinator && (
            <p className="mt-2 text-[10px] text-muted-foreground">
              {coordinator.detail?.provenance === "scripted_demo"
                ? "Scripted example"
                : "Saved agent activity"}{" "}
              · {formatDate(coordinator.updatedAt)}
            </p>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 py-4 text-[10px] text-muted-foreground">
          <ArrowDown className="size-4" /> Assigns three specialists to work in
          parallel <ArrowDown className="size-4" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {desks.slice(0, 3).map(renderDesk)}
        </div>
        <div className="flex items-center justify-center gap-2 py-4 text-center text-[10px] text-muted-foreground">
          <ArrowDown className="size-4 shrink-0" /> Findings return to the
          coordinator → plan moves through the desks below
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {desks.slice(3).map(renderDesk)}
        </div>
        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          {running.length
            ? `${running.length} saved activities are in progress`
            : "No agent is shown as busy unless a saved task is running."}
        </p>
      </div>
      {DEMO_MODE && demoCases.length > 0 && (
        <div className="space-y-4 border-t p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">
                Walk through the demonstration
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Two fictional officers · {demoCases.length} cases ·{" "}
                {data.demoOffice.conversations} scripted conversations with
                synthetic audio
              </p>
            </div>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/5 px-3 py-1 text-[10px] text-amber-800 dark:text-amber-200">
              Illustrative data · no real official was called
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {demoCases.map((issue) => (
              <button
                key={issue.id}
                onClick={() => onOpenCase(issue.id)}
                className="group flex flex-col items-start gap-3 rounded-xl border bg-muted/10 p-4 text-left transition-colors hover:border-teal-600/50 hover:bg-teal-500/5"
              >
                <StatusBadge status={issue.status} />
                <h4 className="text-sm leading-snug font-medium">
                  {issue.title}
                </h4>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {issue.complaintCount} resident reports ·{" "}
                  {
                    data.calls.filter((call) => call.issueId === issue.id)
                      .length
                  }{" "}
                  conversations
                </p>
                <span className="mt-auto flex items-center gap-1 text-[11px] font-medium text-primary">
                  <AudioLines className="size-3.5" /> Listen & inspect the
                  history <ArrowRight className="size-3" />
                </span>
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.demoOffice.officers.map((officer) => (
              <Link
                key={officer.id}
                href={`/leaderboard?profile=${officer.id}-contact`}
                className="flex items-center gap-3 rounded-lg border border-dashed p-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {officer.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium">
                    {officer.name}{" "}
                    <span className="font-normal text-muted-foreground">
                      · fictional
                    </span>
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {officer.role} · {officer.responsibilities}
                  </p>
                </div>
                <ArrowRight className="size-3 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
