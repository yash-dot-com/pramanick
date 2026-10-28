"use client"

import { LocalizedText } from "@/components/language-provider"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  FileText,
  ImageIcon,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  Download,
  Loader2,
  LocateFixed,
  Pause,
  Play,
  Mic,
  Users,
} from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { CATEGORIES, formatDate, type Office } from "@/lib/civic/model"
import type { readDossier } from "@/lib/civic/dossier"
import { IssueJourney } from "./issue-journey"
import { DossierSkeleton } from "./loading-skeletons"
import { callLabels } from "@/lib/voice/presentation"
import { StatusBadge } from "./status-badge"
import { AgentActivityFeed, type AgentActivity } from "./agent-activity-feed"
import { EscalationPanel } from "./escalation-panel"
import {
  captureDeviceLocation,
  type DeviceObservation,
} from "@/lib/civic/device-location"

type Dossier = ReturnType<typeof readDossier>
export function IssueDossier({
  issueId,
  onSupport,
  onUpdated,
  operations = false,
  offices = [],
  onVoice,
  initialTab = "timeline",
}: {
  issueId: string
  onSupport?: () => void
  onUpdated?: () => void
  operations?: boolean
  offices?: Office[]
  onVoice?: () => void
  initialTab?: string
}) {
  const [tab, setTab] = useState(initialTab)
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [data, setData] = useState<Dossier | null>(null)
  const [activities, setActivities] = useState<AgentActivity[]>([])
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState("cannot_verify")
  const [note, setNote] = useState("")
  const [photo, setPhoto] = useState<string>()
  const [observation, setObservation] = useState<DeviceObservation>()
  const [locating, setLocating] = useState(false)
  const [officeId, setOfficeId] = useState("")
  const [assignmentNote, setAssignmentNote] = useState("")
  const requestId = useRef<string | null>(null)
  const tabsAnchor = useRef<HTMLDivElement | null>(null)
  function openTab(value: string) {
    setTab(value)
    requestAnimationFrame(() =>
      tabsAnchor.current?.scrollIntoView({ block: "start", behavior: "smooth" })
    )
  }
  const refresh = useCallback(async () => {
    const response = await fetch(
      `/api/issues/${encodeURIComponent(issueId)}/dossier`,
      { cache: "no-store" }
    )
    const result = await response.json()
    if (!response.ok) throw new Error(result.error)
    setData(result)
  }, [issueId])
  useEffect(() => {
    const controller = new AbortController()
    const read = async () => {
      if (document.visibilityState === "hidden") return
      try {
        const response = await fetch(
          `/api/issues/${encodeURIComponent(issueId)}/activity`,
          { cache: "no-store", signal: controller.signal }
        )
        if (response.ok) setActivities(await response.json())
      } catch {
        /* Case history remains available during a transient activity-feed failure. */
      }
    }
    void read()
    const timer = setInterval(() => void read(), 2500)
    return () => {
      controller.abort()
      clearInterval(timer)
    }
  }, [issueId])
  useEffect(() => {
    let alive = true
    const read = () => {
      if (document.visibilityState === "hidden") return
      void refresh().catch((error) => {
        if (alive)
          setError(
            error instanceof Error ? error.message : "Could not load dossier"
          )
      })
    }
    read()
    const timer = setInterval(read, 8000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [refresh])
  async function mutate(path: string, body: unknown, success: string) {
    if (busy) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setNotice(success)
      await refresh()
      onUpdated?.()
      return true
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save this action"
      )
      return false
    } finally {
      setBusy(false)
    }
  }
  if (!data && !error) return <DossierSkeleton />
  if (!data)
    return (
      <div className="space-y-3 p-4 text-sm text-muted-foreground">
        <LocalizedText text={error} />
        {error && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              void refresh().catch((error) => setError(error.message))
            }
          >
            <LocalizedText text="Try again" />
          </Button>
        )}
      </div>
    )
  const issue = data.issue
  const run = [...data.runs]
    .reverse()
    .find((item) =>
      [
        "preparing",
        "active",
        "paused",
        "awaiting_configuration",
        "needs_review",
      ].includes(item.state)
    )
  const allEvents = [...data.timeline].reverse()
  const publicEvents = allEvents.filter(
    (entry) =>
      !["casework_plan", "agent_brief", "agent_run"].includes(entry.kind)
  )
  const events = showAllEvents ? allEvents : publicEvents.slice(0, 4)
  const runningActivity = activities.find(
    (activity) => activity.state === "running"
  )
  const nextPromise = data.commitments.find(
    (promise) => promise.status !== "fulfilled"
  )
  const headline =
    issue.status === "verified"
      ? "Residents checked the repair"
      : issue.status === "awaiting_verification"
        ? "Does it look fixed to you?"
        : issue.status === "disputed"
          ? "The issue still needs attention"
          : run?.state === "awaiting_configuration"
            ? "The call plan is ready"
            : run?.state === "paused"
              ? "Follow-ups are paused"
              : run?.state === "needs_review"
                ? "The agent needs a quick review"
                : run?.state === "preparing"
                  ? "The agent is reading the reports"
                  : run?.state === "active"
                    ? "The agent is following up"
                    : "Let’s move this forward"
  const explanation =
    issue.status === "verified"
      ? "The repair was reviewed using resident observations. The full history stays available."
      : issue.status === "awaiting_verification"
        ? "The work has been reported as complete. A nearby resident can help check the result."
        : issue.status === "disputed"
          ? "Resident observations show more work is needed. The case remains open."
          : run?.state === "awaiting_configuration"
            ? "Reports and questions are prepared. Phone outreach needs to be configured before the first call."
            : run?.state === "paused"
              ? "The history is saved. Resume when you are ready for the next call."
              : run?.state === "needs_review"
                ? "Open the agent dashboard to review the last attempt and decide the next step."
                : run?.state === "preparing"
                  ? "It is bringing reports, earlier conversations and promised dates together."
                  : run?.state === "active"
                    ? "Calls and responses will appear here. A reported repair stays open until residents check it."
                    : "Start a follow-up so the agent can prepare questions and track the response."
  const friendlyError = error.includes("BOLNA_DEMO_PHONE")
    ? "Phone outreach is not configured. You can continue reading the saved issue and case history."
    : error
  return (
    <section className="space-y-6 p-5 pb-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            <LocalizedText text={CATEGORIES[issue.category].label} />
          </Badge>
        </div>
        <h1 className="text-xl leading-snug font-semibold tracking-tight">
          <LocalizedText text={issue.title} />
        </h1>
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <LocalizedText text={issue.locality} /> ·{" "}
            <LocalizedText text={issue.landmark} />
          </span>
        </p>
        <StatusBadge status={issue.status} />
        <p className="text-sm leading-relaxed text-muted-foreground">
          <LocalizedText text={issue.description} />
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 border-y py-3">
          <span className="flex items-center gap-2 text-xs">
            <Users className="size-4 text-muted-foreground" />
            <span className="font-semibold tabular-nums">
              {issue.complaintCount}
            </span>
            <LocalizedText
              text={
                issue.complaintCount === 1
                  ? "resident report"
                  : "resident reports"
              }
            />
          </span>
          {onSupport && (
            <Button size="sm" variant="ghost" onClick={onSupport}>
              <LocalizedText text="I’m affected too" />
              <ArrowUpRight />
            </Button>
          )}
        </div>
        <IssueJourney status={issue.status} hasRun={!!run} />
      </div>
      <div className="overflow-hidden rounded-xl border bg-muted/25">
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5" />
            <LocalizedText text="What happens next" />
            {runningActivity && (
              <span className="ml-auto size-1.5 animate-pulse rounded-full bg-blue-500" />
            )}
          </div>
          <h2 className="text-sm font-semibold">
            <LocalizedText text={headline} />
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            <LocalizedText text={explanation} />
          </p>
          {data.nextFollowUp && (
            <p className="flex items-center gap-2 text-xs">
              <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" />
              <LocalizedText text="Next follow-up" />:{" "}
              {formatDate(data.nextFollowUp)}
            </p>
          )}
          {issue.status === "awaiting_verification" ? (
            <Button
              size="sm"
              className="w-full"
              onClick={() => openTab("review")}
            >
              <CheckCircle2 />
              <LocalizedText text="Check the repair" />
            </Button>
          ) : (
            issue.status !== "verified" &&
            (!run ? (
              <Button
                size="sm"
                className="w-full"
                disabled={busy}
                onClick={async () => {
                  requestId.current ??= crypto.randomUUID()
                  if (
                    await mutate(
                      "/api/voice/runs",
                      { issueId, requestId: requestId.current },
                      "Follow-up started. The agent is preparing the call plan."
                    )
                  )
                    requestId.current = null
                }}
              >
                <Play />
                <LocalizedText text="Start follow-up" />
              </Button>
            ) : run.state === "awaiting_configuration" ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                nativeButton={false}
                render={<Link href="/dashboard" />}
              >
                <FileText />
                <LocalizedText text="View follow-up plan" />
              </Button>
            ) : run.state === "paused" ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                disabled={busy}
                onClick={() =>
                  void mutate(
                    "/api/voice/runs",
                    { runId: run.id, action: "resume" },
                    "Follow-ups resumed."
                  )
                }
              >
                <Play />
                <LocalizedText text="Resume follow-ups" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={busy}
                  onClick={() =>
                    void mutate(
                      "/api/voice/runs",
                      { runId: run.id, action: "pause" },
                      "Pending calls paused."
                    )
                  }
                >
                  <Pause />
                  <LocalizedText text="Pause" />
                </Button>
                {run.state === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={busy}
                    onClick={() =>
                      void mutate(
                        "/api/voice/runs",
                        { runId: run.id, action: "follow_up_now" },
                        "Next follow-up queued."
                      )
                    }
                  >
                    <Phone />
                    <LocalizedText text="Follow up now" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
        <div className="flex items-start gap-2 border-t bg-background/60 px-4 py-3">
          <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 space-y-1">
            <p className="text-[10px] text-muted-foreground">
              <LocalizedText text="Who we’re following up with" />
            </p>
            {data.responsibility ? (
              <Link
                className="block text-xs font-medium underline-offset-4 hover:underline"
                href={`/leaderboard?profile=${encodeURIComponent(data.responsibility.id)}`}
              >
                <LocalizedText text={data.responsibility.name} />
                {data.responsibility.isDemo && (
                  <span className="ml-1 text-muted-foreground">
                    · <LocalizedText text="demo contact" />
                  </span>
                )}
              </Link>
            ) : (
              <p className="text-xs">
                <LocalizedText text="Finding the right office" />
              </p>
            )}
          </div>
        </div>
      </div>
      {onVoice && (
        <Button
          onClick={onVoice}
          variant="outline"
          className="h-11 w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Mic />
            <LocalizedText text="Ask Pramanik about this issue" />
          </span>
          <ArrowUpRight className="size-3.5 text-muted-foreground" />
        </Button>
      )}
      {nextPromise && (
        <div className="flex gap-3 rounded-xl border p-3">
          <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground">
              <LocalizedText text="Latest promise" />
            </p>
            <p className="text-xs leading-relaxed">
              <LocalizedText text={nextPromise.action} />
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatDate(nextPromise.dueAt)}
            </p>
          </div>
        </div>
      )}
      {friendlyError && (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-xs leading-relaxed"
        >
          <LocalizedText text={friendlyError} />
          <Link
            href="/dashboard"
            className="mt-2 block font-medium underline underline-offset-4"
          >
            <LocalizedText text="Open agent dashboard" />
          </Link>
        </div>
      )}
      {notice && (
        <p
          role="status"
          className="flex items-start gap-2 text-xs leading-relaxed"
        >
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <LocalizedText text={notice} />
        </p>
      )}
      <div ref={tabsAnchor} className="scroll-mt-4" />
      <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
        <TabsList
          variant="line"
          className="grid w-full grid-cols-3 border-b pb-2"
        >
          <TabsTrigger value="timeline" className="gap-1 px-1 text-xs">
            <MessageCircle className="size-3.5" />
            <LocalizedText text="Updates" />
          </TabsTrigger>
          <TabsTrigger value="evidence" className="gap-1 px-1 text-xs">
            <ImageIcon className="size-3.5" />
            <LocalizedText text="Photos" />
          </TabsTrigger>
          <TabsTrigger value="calls" className="gap-1 px-1 text-xs">
            <Phone className="size-3.5" />
            <LocalizedText text="Calls" />
            {data.calls.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {data.calls.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        {(tab === "review" || tab === "escalation") && (
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-xs font-medium">
              <LocalizedText
                text={
                  tab === "review"
                    ? "Check the repair"
                    : "Ask for further action"
                }
              />
            </p>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => openTab("timeline")}
            >
              <LocalizedText text="Back to updates" />
            </Button>
          </div>
        )}
        <TabsContent value="timeline">
          <div className="space-y-5 pt-4">
            {!events.length && (
              <p className="text-xs text-muted-foreground">
                <LocalizedText text="Updates will appear here as the agent follows up." />
              </p>
            )}
            {events.map((entry, index) => {
              const Icon = ["call", "call_outcome", "voice_update"].includes(
                entry.kind
              )
                ? Phone
                : entry.kind === "commitment"
                  ? CalendarClock
                  : ["verification", "review"].includes(entry.kind)
                    ? CheckCircle2
                    : MessageCircle
              return (
                <article key={entry.id} className="relative flex gap-3">
                  {index < events.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute top-8 bottom-[-20px] left-3.5 w-px bg-border"
                    />
                  )}
                  <span className="relative z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background">
                    <Icon className="size-3 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-2 pb-1">
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(entry.createdAt)}
                    </p>
                    <h3 className="text-sm leading-snug font-medium">
                      <LocalizedText text={entry.title} />
                    </h3>
                    <details className="group text-xs leading-relaxed">
                      <summary className="cursor-pointer list-none text-muted-foreground">
                        <span className="line-clamp-2 group-open:hidden">
                          <LocalizedText text={entry.description} />
                        </span>
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-foreground">
                          <LocalizedText text="Read update" />
                          <ChevronDown className="size-3 transition-transform group-open:rotate-180" />
                        </span>
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                        <LocalizedText text={entry.description} />
                      </p>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        <LocalizedText text={entry.source} />
                      </p>
                    </details>
                  </div>
                </article>
              )
            })}
            {allEvents.length > events.length && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowAllEvents(true)}
              >
                <LocalizedText text="Show full history" />
                <ChevronDown />
              </Button>
            )}
            {showAllEvents && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowAllEvents(false)}
              >
                <LocalizedText text="Show key updates" />
              </Button>
            )}
          </div>
        </TabsContent>
        <TabsContent value="evidence">
          <div className="space-y-4 pt-4">
            {!data.evidence.length && (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center">
                <ImageIcon className="size-6 text-muted-foreground" />
                <p className="text-sm font-medium">
                  <LocalizedText text="No photos yet" />
                </p>
                <p className="text-xs text-muted-foreground">
                  <LocalizedText text="A photo helps everyone understand the problem and check the repair later." />
                </p>
              </div>
            )}
            {data.evidence.map((item) => (
              <figure
                key={item.id}
                className="overflow-hidden rounded-xl border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.caption}
                  className="max-h-60 w-full bg-muted/30 object-contain"
                />
                <figcaption className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">
                      <LocalizedText
                        text={
                          item.phase === "verification"
                            ? "After · resident check"
                            : "Before · reported issue"
                        }
                      />
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <LocalizedText text={item.caption} />
                  </p>
                  {item.assessment && (
                    <div className="rounded-lg bg-muted/40 p-3 text-xs">
                      <p className="mb-1 flex items-center gap-1.5 font-medium">
                        <Sparkles className="size-3" />
                        <LocalizedText
                          text={
                            item.assessment.finding === "appears_fixed"
                              ? "The photo suggests a repair"
                              : item.assessment.finding === "problem_visible"
                                ? "The problem is still visible"
                                : "A closer check is needed"
                          }
                        />
                      </p>
                      <p className="leading-relaxed text-muted-foreground">
                        <LocalizedText text={item.assessment.explanation} />
                      </p>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        <LocalizedText text="AI guidance · a resident still needs to confirm." />
                      </p>
                    </div>
                  )}
                  {item.location?.source === "demo" && (
                    <Badge variant="outline">
                      <LocalizedText text="Simulated location · demo only" />
                    </Badge>
                  )}
                  {!item.assessment && item.phase === "verification" && (
                    <p className="text-xs text-muted-foreground">
                      <LocalizedText text="The agent is waiting to review this photo." />
                    </p>
                  )}
                  {(item.location || item.assessment) && (
                    <details className="text-[10px] text-muted-foreground">
                      <summary className="cursor-pointer">
                        <LocalizedText text="Location & photo details" />
                      </summary>
                      <div className="mt-2 space-y-2 leading-relaxed">
                        {item.location && (
                          <>
                            <p>
                              {Math.round(item.location.distanceMeters)}{" "}
                              <LocalizedText text="metres from the issue pin" />{" "}
                              · ±{Math.round(item.location.accuracy)}m
                            </p>
                            <p>
                              <LocalizedText text="This is the device’s reported location when uploading, not proof of where the photo was taken." />
                            </p>
                          </>
                        )}
                        {item.assessment && (
                          <>
                            <p>
                              <LocalizedText
                                text={item.assessment.limitations}
                              />
                            </p>
                            <p>
                              <LocalizedText text="Scene comparison" />:{" "}
                              <LocalizedText
                                text={item.assessment.sameScene.replaceAll(
                                  "_",
                                  " "
                                )}
                              />
                            </p>
                          </>
                        )}
                      </div>
                    </details>
                  )}
                </figcaption>
              </figure>
            ))}
            {data.complaints.length > 0 && (
              <h3 className="pt-2 text-sm font-medium">
                <LocalizedText text="What residents reported" />
              </h3>
            )}
            {data.complaints.map(
              (complaint) =>
                complaint.description && (
                  <article
                    key={complaint.id}
                    className="space-y-1 rounded-lg border p-3 text-xs"
                  >
                    <p className="text-muted-foreground">
                      <LocalizedText text="Resident report ·" />
                      {formatDate(complaint.createdAt)}
                    </p>
                    <p>
                      <LocalizedText text={complaint.description} />
                    </p>
                  </article>
                )
            )}
            {data.gaps.length > 0 && (
              <div className="space-y-2 rounded-lg border p-3 text-xs">
                <p className="font-medium">
                  <LocalizedText text="What’s still needed" />
                </p>
                {data.gaps.map((gap) => (
                  <p key={gap} className="text-muted-foreground">
                    <LocalizedText text={gap} />
                  </p>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="calls">
          <div className="space-y-4 pt-4">
            {!data.calls.length && (
              <p className="text-sm text-muted-foreground">
                <LocalizedText text="No conversations for this issue yet." />
              </p>
            )}
            {[...data.calls].reverse().map((call) => (
              <article
                key={call.id}
                className="space-y-3 rounded-xl border p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      <LocalizedText
                        text={call.person?.name || "Participant"}
                      />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(call.createdAt)} ·{" "}
                      <LocalizedText
                        text={
                          call.duration == null
                            ? "Duration pending"
                            : `${Math.round(call.duration)}s`
                        }
                      />
                    </p>
                  </div>
                  <Badge variant="secondary">
                    <LocalizedText
                      text={callLabels[call.status] ?? call.status}
                    />
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  <LocalizedText
                    text={call.summary || "No published outcome yet."}
                  />
                </p>
                {call.nextAction && (
                  <p className="text-xs">
                    <LocalizedText text="Next step:" />{" "}
                    <LocalizedText text={call.nextAction} />
                  </p>
                )}
                {call.person && (
                  <Link
                    href={`/leaderboard?profile=${encodeURIComponent(call.person.id)}`}
                    className="text-xs underline underline-offset-4"
                  >
                    <LocalizedText text="View service record" />
                    <LocalizedText text={call.person.isDemo ? " · demo" : ""} />
                  </Link>
                )}
                {call.transcript && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">
                      <LocalizedText text="Read conversation" />
                    </summary>
                    <p className="mt-2 leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      <LocalizedText text={call.transcript} />
                    </p>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-muted-foreground">
                        <LocalizedText text="Original wording" />
                      </summary>
                      <p className="mt-2 leading-relaxed whitespace-pre-wrap">
                        {call.transcript}
                      </p>
                    </details>
                  </details>
                )}
                {call.recordingUrl && (
                  <audio controls src={call.recordingUrl} className="w-full" />
                )}
              </article>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="review">
          <div className="space-y-4 pt-4">
            {!data.verification ? (
              <p className="text-sm text-muted-foreground">
                <LocalizedText text="Once the work is reported as complete, you can add a photo and tell us whether it is really fixed." />
              </p>
            ) : (
              <>
                <Badge variant="outline">
                  <LocalizedText text="Review" />
                  <LocalizedText text={data.verification.state} />
                </Badge>
                {data.verification.responses.map((response, index) => (
                  <article
                    key={`${response.createdAt}-${index}`}
                    className="space-y-1 rounded-lg border p-3 text-xs"
                  >
                    <p className="font-medium">
                      {response.answer.replaceAll("_", " ")}
                    </p>
                    <p>
                      <LocalizedText text={response.note} />
                    </p>
                    <p className="text-muted-foreground">
                      {formatDate(response.createdAt)}
                    </p>
                    {response.evidenceId &&
                      (() => {
                        const evidence = data.evidence.find(
                          (item) => item.id === response.evidenceId
                        )
                        return (
                          <p className="text-muted-foreground">
                            <LocalizedText text="Photo:" />{" "}
                            <LocalizedText
                              text={
                                evidence?.assessment?.finding.replaceAll(
                                  "_",
                                  " "
                                ) ?? "assessment pending"
                              }
                            />{" "}
                            <LocalizedText text="· device observation:" />{" "}
                            <LocalizedText
                              text={
                                evidence?.location?.proximity.replaceAll(
                                  "_",
                                  " "
                                ) ?? "not supplied"
                              }
                            />
                            <LocalizedText text=". See Evidence for details." />
                          </p>
                        )
                      })()}
                  </article>
                ))}
                {data.verification.state === "open" && (
                  <div className="space-y-3">
                    {data.verification.responses.length === 0 ? (
                      <>
                        <p className="text-sm font-medium">
                          <LocalizedText text="What do you see at the location?" />
                        </p>
                        <Select
                          value={answer}
                          onValueChange={(value) => {
                            if (value) setAnswer(value)
                          }}
                        >
                          <SelectTrigger
                            className="w-full"
                            aria-label="Resident observation"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">
                              <LocalizedText text="Fixed" />
                            </SelectItem>
                            <SelectItem value="partially_fixed">
                              <LocalizedText text="Partially fixed" />
                            </SelectItem>
                            <SelectItem value="not_fixed">
                              <LocalizedText text="Not fixed" />
                            </SelectItem>
                            <SelectItem value="cannot_verify">
                              <LocalizedText text="Cannot verify" />
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          maxLength={2000}
                          placeholder="Your observation (optional)"
                        />
                        <Input
                          type="file"
                          capture="environment"
                          aria-label="Optional resident photograph"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (!file) {
                              setPhoto(undefined)
                              return
                            }
                            if (
                              file.size > 2_000_000 ||
                              ![
                                "image/png",
                                "image/jpeg",
                                "image/webp",
                              ].includes(file.type)
                            ) {
                              setError(
                                "Choose a JPG, PNG, or WebP photo under 2 MB"
                              )
                              return
                            }
                            const reader = new FileReader()
                            reader.onload = () =>
                              setPhoto(String(reader.result))
                            reader.readAsDataURL(file)
                          }}
                        />
                        <div className="space-y-2 rounded-lg border p-3 text-xs">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy || locating}
                            onClick={async () => {
                              setLocating(true)
                              setError("")
                              try {
                                setObservation(await captureDeviceLocation())
                              } catch (error) {
                                setError(
                                  error instanceof Error
                                    ? error.message
                                    : "Could not capture location"
                                )
                              } finally {
                                setLocating(false)
                              }
                            }}
                          >
                            {locating ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <LocateFixed />
                            )}
                            <LocalizedText text="Capture live location" />
                          </Button>
                          <p className="text-muted-foreground">
                            <LocalizedText
                              text={
                                observation
                                  ? `Captured ${formatDate(observation.observedAt)} · ±${Math.round(observation.accuracy)}m. The server compares this with the issue pin.`
                                  : "Add a fresh device location with the photo for a location-assisted repair check."
                              }
                            />
                          </p>
                        </div>
                        <Button
                          disabled={busy || locating}
                          onClick={() =>
                            void mutate(
                              "/api/surveys",
                              {
                                surveyId: data.verification!.id,
                                answer,
                                note,
                                photo,
                                observation: photo ? observation : undefined,
                              },
                              photo
                                ? "Observation saved. The agent will assess the photograph; it cannot close the case itself."
                                : "Resident observation saved."
                            )
                          }
                        >
                          {busy && <Loader2 className="animate-spin" />}
                          <LocalizedText text="Save observation" />
                        </Button>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        <LocalizedText text="Your observation is saved for this review. A disputed review can be followed by a new completion claim and another resident check." />
                      </p>
                    )}
                    {operations && (
                      <div className="flex flex-wrap gap-2 border-t pt-3">
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            void mutate(
                              "/api/operations",
                              {
                                action: "review",
                                issueId,
                                decision: "verified",
                                note:
                                  note.trim() ||
                                  "Reviewed resident findings and linked evidence.",
                              },
                              "Repair verified from resident findings."
                            )
                          }
                        >
                          <LocalizedText text="Verify repair" />
                        </Button>
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            void mutate(
                              "/api/operations",
                              {
                                action: "review",
                                issueId,
                                decision: "disputed",
                                note:
                                  note.trim() ||
                                  "Resident findings require further follow-through.",
                              },
                              "Case remains disputed."
                            )
                          }
                        >
                          <LocalizedText text="Keep disputed" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
        <TabsContent value="escalation">
          <EscalationPanel
            issueId={issueId}
            entries={data.escalations ?? []}
            busy={busy}
            operations={operations}
            verified={issue.status === "verified"}
            mutate={mutate}
          />
        </TabsContent>
      </Tabs>
      <div className="space-y-2 border-t pt-4">
        <Button
          variant="ghost"
          className="h-auto w-full justify-between px-2 py-2 text-xs"
          onClick={() => openTab("review")}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5" />
            <LocalizedText text="Check the repair" />
          </span>
          <ArrowUpRight className="size-3" />
        </Button>
        <Button
          variant="ghost"
          className="h-auto w-full justify-between px-2 py-2 text-xs"
          onClick={() => openTab("escalation")}
        >
          <span className="flex items-center gap-2">
            <FileText className="size-3.5" />
            <LocalizedText text="No progress? Ask for further action" />
          </span>
          <ArrowUpRight className="size-3" />
        </Button>
      </div>
      <details className="group rounded-xl border text-xs">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3 font-medium">
          <span className="flex items-center gap-2">
            <FileText className="size-3.5 text-muted-foreground" />
            <LocalizedText text="Full record & agent activity" />
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-5 border-t p-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={
                <a
                  href={`/api/issues/${encodeURIComponent(issueId)}/dossier?format=md`}
                />
              }
            >
              <Download />
              <LocalizedText text="Download full record" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              nativeButton={false}
              render={
                <a
                  href={`/api/issues/${encodeURIComponent(issueId)}/dossier?format=json`}
                />
              }
            >
              <LocalizedText text="Export data (JSON)" />
            </Button>
          </div>
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">
                <LocalizedText text="Agent activity" />
              </p>
              <Link
                className="text-[10px] underline underline-offset-4"
                href="/dashboard"
              >
                <LocalizedText text="See dashboard" />
              </Link>
            </div>
            <AgentActivityFeed activities={activities} compact />
          </section>
          {data.commitments.length > 0 && (
            <section className="space-y-2">
              <p className="font-medium">
                <LocalizedText text="All recorded promises" />
              </p>
              {data.commitments.map((promise) => (
                <div key={promise.id} className="space-y-1 border-l pl-3">
                  <p>
                    <LocalizedText text={promise.action} />
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDate(promise.dueAt)} ·{" "}
                    <LocalizedText text={promise.status} />
                  </p>
                </div>
              ))}
            </section>
          )}
          <details>
            <summary className="cursor-pointer text-muted-foreground">
              <LocalizedText text="Earlier versions" /> ({data.versions.length})
            </summary>
            <div className="mt-2 space-y-2">
              {data.versions.map((version) => (
                <a
                  key={version.version}
                  className="block text-[10px] underline underline-offset-4"
                  href={`/api/issues/${encodeURIComponent(issueId)}/dossier?version=${version.version}&format=md`}
                >
                  <LocalizedText text="Version" /> {version.version} ·{" "}
                  {formatDate(version.createdAt)}
                </a>
              ))}
            </div>
          </details>
        </div>
      </details>
      {operations && (
        <section className="space-y-3 border-t pt-4">
          <h2 className="text-sm font-medium">
            <LocalizedText text="Review office assignment" />
          </h2>
          <Select
            value={officeId}
            onValueChange={(value) => {
              if (value) setOfficeId(value)
            }}
          >
            <SelectTrigger className="w-full" aria-label="Responsible office">
              <SelectValue placeholder="Choose an office" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRAMANIK-DEMO">
                <LocalizedText text="Pramanik demo civic office" />
              </SelectItem>
              {offices.map((office) => (
                <SelectItem key={office.id} value={office.id}>
                  <LocalizedText text={office.name} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={assignmentNote}
            maxLength={2000}
            placeholder="Why is this office responsible?"
            onChange={(event) => setAssignmentNote(event.target.value)}
          />
          <Button
            variant="outline"
            disabled={busy || !officeId || assignmentNote.trim().length < 3}
            onClick={() =>
              void mutate(
                "/api/operations",
                { action: "assign", issueId, officeId, note: assignmentNote },
                "Assignment saved."
              )
            }
          >
            <LocalizedText text="Save assignment" />
          </Button>
        </section>
      )}
    </section>
  )
}
