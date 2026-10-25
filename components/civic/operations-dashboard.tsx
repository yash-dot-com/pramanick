"use client"
import { DEMO_MODE } from "@/lib/demo-mode"

import { LocalizedText } from "@/components/language-provider"

import Link from "next/link"
import { SettingsDropdown } from "@/components/settings-dropdown"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useState } from "react"
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  Mic,
  Pause,
  PhoneCall,
  Play,
  RefreshCw,
  Trophy,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  STATUSES,
  formatDate,
  localityName,
  type CivicSnapshot,
  type IssueStatus,
} from "@/lib/civic/model"
import type { voiceOperations } from "@/lib/voice/operations"
import type { callActivity } from "@/lib/voice/bolna"
import { IssueDossier } from "./issue-dossier"
import { StatusBadge } from "./status-badge"

const VoiceAgentDialog = dynamic(
  () =>
    import("./voice-agent-dialog").then((module) => module.VoiceAgentDialog),
  { ssr: false }
)
type DashboardData = ReturnType<typeof voiceOperations> & {
  civic: CivicSnapshot
}
const transitions: Record<IssueStatus, IssueStatus[]> = {
  reported: ["assigned"],
  assigned: ["following_up", "reported"],
  following_up: ["awaiting_verification", "assigned"],
  awaiting_verification: ["verified", "disputed"],
  verified: ["disputed"],
  disputed: ["following_up", "awaiting_verification"],
}

export function OperationsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [scope, setScope] = useState("locality:kothrud")
  const [selected, setSelected] = useState<string | null>(null)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [call, setCall] = useState<Awaited<
    ReturnType<typeof callActivity>
  > | null>(null)
  const [profileDraft, setProfileDraft] = useState<
    DashboardData["contact"] | null
  >(null)
  const [executionId, setExecutionId] = useState("")
  const [noCallConfirmed, setNoCallConfirmed] = useState(false)
  const refresh = useCallback(async () => {
    const response = await fetch("/api/operations", { cache: "no-store" })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error)
    setData(result)
    setProfileDraft((current) =>
      current?.id === result.contact.id ? current : result.contact
    )
  }, [])
  const notifyRefresh = useCallback(() => {
    void refresh().catch((error) => setError(error.message))
  }, [refresh])
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const issue = params.get("issue")
    const locality = params.get("locality")
    if (issue) setScope(`issue:${issue}`)
    else if (locality) setScope(`locality:${locality}`)
    const read = () => {
      if (document.visibilityState !== "hidden")
        void refresh().catch((error) => setError(error.message))
    }
    read()
    const timer = setInterval(read, 5000)
    return () => clearInterval(timer)
  }, [refresh])
  async function perform(path: string, body: unknown, message: string) {
    if (busy) return false
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
      setNotice(message)
      await refresh()
      return true
    } catch (error) {
      setError(error instanceof Error ? error.message : "Action failed")
      return false
    } finally {
      setBusy(false)
    }
  }
  async function inspectCall(id: string) {
    try {
      const response = await fetch(`/api/voice/calls/${id}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setCall(result)
      setExecutionId(result.call.executionId ?? "")
      setNoCallConfirmed(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not read call")
    }
  }
  function moveIssue(id: string, status: IssueStatus) {
    if (status === "verified") {
      setSelected(id)
      setNotice("Review the resident findings before verifying the repair.")
      return
    }
    void perform(
      "/api/operations",
      {
        action: "status",
        issueId: id,
        status,
        note: "Case moved from the operations board.",
      },
      "Case updated."
    )
  }
  if (!data)
    return (
      <main className="mx-auto max-w-7xl space-y-4 p-6">
        <Link href="/app" className="text-sm underline">
          <LocalizedText text="Back to map" />
        </Link>
        <p className="text-sm text-muted-foreground">
          <LocalizedText text={error || "Loading accountability office…"} />
        </p>
        <Button
          variant="outline"
          onClick={() =>
            void refresh().catch((error) => setError(error.message))
          }
        >
          <LocalizedText text="Refresh" />
        </Button>
      </main>
    )
  const issues = data.civic.issues
  const activeRuns = data.followUpRuns.filter((run) =>
    ["active", "preparing"].includes(run.state)
  )
  const pending = data.jobs.filter(
    (job) =>
      ["queued", "retry_pending"].includes(job.state) &&
      ["outbound_call", "deadline_review"].includes(job.kind)
  )
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            nativeButton={false}
            render={<Link href="/app" />}
            aria-label="Back to map"
          >
            <ArrowLeft />
          </Button>
          <h1 className="text-lg font-semibold">
            <LocalizedText text="Accountability office" />
          </h1>
          <Badge variant="outline">
            <LocalizedText text="Case coordination & follow-through" />
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <SettingsDropdown />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/leaderboard" />}
          >
            <Trophy />
            <LocalizedText text="Leaderboard" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVoiceOpen(true)}
          >
            <Mic />
            <LocalizedText text="Talk in browser" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              void refresh().catch((error) => setError(error.message))
            }
            aria-label="Refresh accountability office"
          >
            <RefreshCw />
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            { label: "Community issues", value: issues.length, icon: FileText },
            {
              label: "Follow-ups in progress",
              value: activeRuns.length,
              icon: Activity,
            },
            {
              label: "Recent conversations",
              value: data.calls.length,
              icon: PhoneCall,
            },
            {
              label: "Queued follow-ups",
              value: pending.length,
              icon: CalendarIcon,
            },
            {
              label: "Resident-verified fixes",
              value: issues.filter((issue) => issue.status === "verified")
                .length,
              icon: CheckCircle2,
            },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="gap-3 py-4">
              <CardContent className="space-y-2 px-4">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="size-4" />
                  {label}
                </p>
                <p className="text-2xl font-semibold tabular-nums">
                  <LocalizedText text={value} />
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-destructive/30 p-3 text-sm text-destructive"
          >
            {error}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X />
            </Button>
          </div>
        )}
        {notice && (
          <p role="status" className="text-sm">
            {notice}
          </p>
        )}
        <Tabs defaultValue="board">
          <TabsList className="flex h-auto flex-wrap">
            <TabsTrigger value="board">
              <LocalizedText text="Case board" />
            </TabsTrigger>
            <TabsTrigger value="runs">
              <LocalizedText text="Follow-ups (" />
              {data.followUpRuns.length})
            </TabsTrigger>
            <TabsTrigger value="calls">
              <LocalizedText text="Calls" />
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <LocalizedText text="Queue" />
            </TabsTrigger>
            {DEMO_MODE && (
              <TabsTrigger value="contact">
                <LocalizedText text="Demo person" />
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="board">
            <div className="mt-4 flex gap-3 overflow-x-auto pb-4">
              {Object.entries(STATUSES).map(([status, label]) => (
                <section
                  key={status}
                  className="min-h-80 w-72 shrink-0 space-y-3 rounded-xl border bg-muted/20 p-3"
                  onDragOver={(event) => {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = "move"
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    const id = event.dataTransfer.getData("text/pramanik-issue")
                    if (id && !busy) moveIssue(id, status as IssueStatus)
                  }}
                >
                  <h2 className="flex items-center justify-between text-sm font-medium">
                    {label}
                    <Badge variant="outline">
                      {issues.filter((issue) => issue.status === status).length}
                    </Badge>
                  </h2>
                  {issues
                    .filter((issue) => issue.status === status)
                    .map((issue) => (
                      <Card
                        key={issue.id}
                        className="gap-0 rounded-xl py-0"
                        draggable={!busy}
                        onDragStart={(event) => {
                          event.dataTransfer.setData(
                            "text/pramanik-issue",
                            issue.id
                          )
                          event.dataTransfer.effectAllowed = "move"
                        }}
                      >
                        <details className="group/case">
                          <summary className="cursor-pointer list-none rounded-xl p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                            <span className="mb-2 flex items-center justify-between gap-2">
                              <StatusBadge status={issue.status} />
                              <ChevronDown
                                aria-hidden="true"
                                className="size-4 shrink-0 text-muted-foreground group-open/case:rotate-180"
                              />
                            </span>
                            <span className="line-clamp-2 text-sm leading-snug font-medium">
                              <LocalizedText text={issue.title} />
                            </span>
                            <span className="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                              <span className="truncate">
                                {localityName(issue.localityId)}
                              </span>
                              <span className="shrink-0">
                                {issue.complaintCount}{" "}
                                <LocalizedText
                                  text={
                                    issue.complaintCount === 1
                                      ? "report"
                                      : "reports"
                                  }
                                />
                              </span>
                            </span>
                          </summary>
                          <CardContent className="space-y-3 border-t px-3 py-3">
                            <p className="text-xs text-muted-foreground">
                              <LocalizedText
                                text={
                                  data.civic.offices.find(
                                    (office) => office.id === issue.officeId
                                  )?.name ??
                                  (issue.officeId === "PRAMANIK-DEMO"
                                    ? "Pramanik demo civic office"
                                    : "Office review pending")
                                }
                              />
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {Math.max(
                                0,
                                Math.floor(
                                  (Date.now() -
                                    new Date(issue.createdAt).getTime()) /
                                    86_400_000
                                )
                              )}{" "}
                              <LocalizedText text="days open ·" />{" "}
                              <LocalizedText text={issue.events[0]?.title} />
                            </p>
                            {issue.nextFollowUp && (
                              <p className="text-xs">
                                <LocalizedText text="Next:" />{" "}
                                {formatDate(issue.nextFollowUp)}
                              </p>
                            )}
                            <Select
                              value={issue.status}
                              disabled={busy}
                              onValueChange={(value) => {
                                if (value && value !== issue.status)
                                  moveIssue(issue.id, value as IssueStatus)
                              }}
                            >
                              <SelectTrigger
                                className="w-full"
                                size="sm"
                                aria-label={`Move ${issue.title}`}
                              >
                                <SelectValue>
                                  <LocalizedText
                                    text={STATUSES[issue.status]}
                                  />
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={issue.status}>
                                  {STATUSES[issue.status]}
                                </SelectItem>
                                {transitions[issue.status].map((next) => (
                                  <SelectItem key={next} value={next}>
                                    <LocalizedText
                                      text={
                                        next === "verified"
                                          ? "Review before verifying"
                                          : STATUSES[next]
                                      }
                                    />
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelected(issue.id)}
                            >
                              <FileText />
                              <LocalizedText text="Open dossier" />
                            </Button>
                          </CardContent>
                        </details>
                      </Card>
                    ))}
                  {!issues.some((issue) => issue.status === status) && (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      <LocalizedText text="No cases here." />
                    </p>
                  )}
                </section>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="runs">
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {!data.followUpRuns.length && (
                <Empty text="No follow-up runs yet." />
              )}
              {data.followUpRuns.map((run) => {
                const jobs = data.jobs.filter(
                  (job) => job.followUpRunId === run.id
                )
                const running = jobs.find((job) => job.state === "running")
                return (
                  <Card key={run.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">
                          <LocalizedText
                            text={
                              run.scope === "locality"
                                ? localityName(run.localityId ?? "")
                                : (issues.find(
                                    (issue) => issue.id === run.issueIds[0]
                                  )?.title ?? "Case follow-up")
                            }
                          />
                        </CardTitle>
                        <Badge variant="secondary">
                          <LocalizedText text={run.state} />
                        </Badge>
                      </div>
                      <CardDescription>
                        {run.issueIds.length}
                        <LocalizedText text="cases ·" />{" "}
                        {formatDate(run.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm">
                        <LocalizedText
                          text={
                            running
                              ? running.kind.replaceAll("_", " ")
                              : jobs.some((job) => job.state === "needs_review")
                                ? "Processing needs attention — inspect the queue"
                                : run.state === "paused"
                                  ? "Pending calls are paused"
                                  : jobs.some((job) => job.state === "queued")
                                    ? "Next action queued"
                                    : "Waiting for the next action or resident review"
                          }
                        />
                      </p>
                      {run.brief && (
                        <p className="text-sm text-muted-foreground">
                          {String(run.brief.summary ?? "")}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {run.state !== "completed" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                void perform(
                                  "/api/voice/runs",
                                  {
                                    runId: run.id,
                                    action: [
                                      "paused",
                                      "awaiting_configuration",
                                    ].includes(run.state)
                                      ? "resume"
                                      : "pause",
                                  },
                                  "Run updated."
                                )
                              }
                            >
                              {["paused", "awaiting_configuration"].includes(
                                run.state
                              ) ? (
                                <Play />
                              ) : (
                                <Pause />
                              )}
                              <LocalizedText
                                text={
                                  run.state === "awaiting_configuration"
                                    ? "Connect recipient & resume"
                                    : run.state === "paused"
                                      ? "Resume"
                                      : "Pause"
                                }
                              />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                void perform(
                                  "/api/voice/runs",
                                  { runId: run.id, action: "follow_up_now" },
                                  "Demo follow-up queued."
                                )
                              }
                            >
                              <LocalizedText text="Follow up now" />
                            </Button>
                          </>
                        )}
                      </div>
                      <details className="text-xs">
                        <summary className="cursor-pointer font-medium">
                          <LocalizedText text="Cases and prepared questions" />
                        </summary>
                        <div className="mt-3 space-y-2">
                          {run.issueIds.map((id) => (
                            <button
                              key={id}
                              className="block text-left underline"
                              onClick={() => setSelected(id)}
                            >
                              {issues.find((issue) => issue.id === id)?.title ??
                                id}
                            </button>
                          ))}
                          {run.brief && (
                            <pre className="max-h-72 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
                              {JSON.stringify(
                                {
                                  questions: run.brief.questions,
                                  missingEvidence: run.brief.missingEvidence,
                                  nextAction: run.brief.nextAction,
                                },
                                null,
                                2
                              )}
                            </pre>
                          )}
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
          <TabsContent value="calls">
            <div className="mt-4 space-y-3">
              {!data.calls.length && (
                <Empty text="No conversations yet. Start a phone run or talk to the browser agent." />
              )}
              {data.calls.map((item) => (
                <Card key={item.id} className="py-4">
                  <CardContent className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-sm font-medium">
                        <LocalizedText
                          text={
                            issues.find((issue) => issue.id === item.issueId)
                              ?.title ?? "Case"
                          }
                        />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.createdAt)} ·{" "}
                        <LocalizedText
                          text={
                            item.duration == null
                              ? "Duration pending"
                              : `${Math.round(item.duration)} seconds`
                          }
                        />
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <LocalizedText
                          text={
                            item.summary ||
                            item.error ||
                            "Waiting for a finalized result."
                          }
                        />
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <LocalizedText text={item.status} />
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void inspectCall(item.id)}
                      >
                        <LocalizedText text="Inspect" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                          void perform(
                            `/api/voice/calls/${item.id}`,
                            { action: "sync" },
                            "Provider result refreshed."
                          )
                        }
                      >
                        <RefreshCw />
                        <LocalizedText text="Sync" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="jobs">
            <div className="mt-4 space-y-3">
              {!data.jobs.length && <Empty text="The queue is empty." />}
              {data.jobs.map((job) => (
                <Card key={job.id} className="py-4">
                  <CardContent className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {job.kind.replaceAll("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <LocalizedText
                          text={
                            issues.find((issue) => issue.id === job.issueId)
                              ?.title
                          }
                        />{" "}
                        · {formatDate(job.dueAt)} · {job.attempts}
                        <LocalizedText text="attempts" />
                      </p>
                      {job.error && (
                        <p className="max-w-xl text-xs text-muted-foreground">
                          <LocalizedText text={job.error} />
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        <LocalizedText text={job.state} />
                      </Badge>
                      {!["running", "completed", "cancelled"].includes(
                        job.state
                      ) && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() =>
                              void perform(
                                "/api/voice/jobs",
                                { jobId: job.id, action: "retry" },
                                "Job requeued."
                              )
                            }
                          >
                            <LocalizedText text="Retry" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() =>
                              void perform(
                                "/api/voice/jobs",
                                { jobId: job.id, action: "cancel" },
                                "Job cancelled."
                              )
                            }
                          >
                            <LocalizedText text="Cancel" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="contact">
            {DEMO_MODE && profileDraft && (
              <Card className="mt-4 max-w-xl">
                <CardHeader>
                  <CardTitle className="text-base">
                    <LocalizedText text="Demo responsibility holder" />
                  </CardTitle>
                  <CardDescription>
                    <LocalizedText text="Fictional display details for your consenting friend. The phone stays in local environment settings." />
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="block space-y-2 text-sm">
                    <span>
                      <LocalizedText text="Display name" />
                    </span>
                    <Input
                      value={profileDraft.displayName}
                      maxLength={100}
                      onChange={(event) =>
                        setProfileDraft({
                          ...profileDraft,
                          displayName: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="block space-y-2 text-sm">
                    <span>
                      <LocalizedText text="Role" />
                    </span>
                    <Input
                      value={profileDraft.designation}
                      maxLength={150}
                      onChange={(event) =>
                        setProfileDraft({
                          ...profileDraft,
                          designation: event.target.value,
                        })
                      }
                    />
                  </label>
                  <Select
                    value={profileDraft.language}
                    onValueChange={(value) => {
                      if (value)
                        setProfileDraft({ ...profileDraft, language: value })
                    }}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-label="Demo conversation language"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hi">
                        <LocalizedText text="हिन्दी / Hinglish" />
                      </SelectItem>
                      <SelectItem value="mr">मराठी</SelectItem>
                      <SelectItem value="en">
                        <LocalizedText text="English" />
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 accent-foreground"
                      checked={profileDraft.publicationConsent}
                      onChange={(event) =>
                        setProfileDraft({
                          ...profileDraft,
                          publicationConsent: event.target.checked,
                        })
                      }
                    />
                    <LocalizedText text="Demo participant consents to publishing their transcript." />
                  </label>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 accent-foreground"
                      checked={profileDraft.recordingConsent}
                      onChange={(event) =>
                        setProfileDraft({
                          ...profileDraft,
                          recordingConsent: event.target.checked,
                        })
                      }
                    />
                    <LocalizedText text="Demo participant consents to retaining/publishing a provider recording when available." />
                  </label>
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void perform(
                        "/api/voice/contact",
                        profileDraft,
                        "Demo profile saved."
                      )
                    }
                  >
                    <LocalizedText text="Save demo profile" />
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    <LocalizedText
                      text={profileDraft.recipient ?? "Phone not configured"}
                    />
                    <LocalizedText
                      text={
                        profileDraft.revoked
                          ? " · Calling consent revoked by participant"
                          : ""
                      }
                    />
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      {selected && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setSelected(null)
          }}
        >
          <DialogContent className="max-h-[92dvh] overflow-y-auto p-0 sm:max-w-2xl">
            <DialogHeader className="border-b px-5 pt-5 pb-3">
              <DialogTitle>
                <LocalizedText text="Issue dossier" />
              </DialogTitle>
              <DialogDescription>
                <LocalizedText text="Shared evidence, follow-through, and resident review." />
              </DialogDescription>
            </DialogHeader>
            <IssueDossier
              key={selected}
              issueId={selected}
              operations
              offices={data.civic.offices}
              onUpdated={notifyRefresh}
            />
          </DialogContent>
        </Dialog>
      )}
      {call && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setCall(null)
          }}
        >
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                <LocalizedText text="Conversation record" />
              </DialogTitle>
              <DialogDescription>
                {formatDate(call.call.createdAt)} · {call.call.status}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm">
                <LocalizedText text={call.call.summary || "Summary pending."} />
              </p>
              {call.call.status === "dispatch_unknown" &&
                !call.call.executionId && (
                  <div className="space-y-3 rounded-xl border p-3">
                    <p className="text-sm font-medium">
                      <LocalizedText text="Reconcile the uncertain dispatch" />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <LocalizedText text="Check Bolna call history first. Attach an execution only when its provider metadata matches this local call." />
                    </p>
                    <Input
                      value={executionId}
                      onChange={(event) => setExecutionId(event.target.value)}
                      placeholder="Bolna execution UUID"
                      aria-label="Execution to reconcile"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy || !executionId}
                      onClick={async () => {
                        if (
                          await perform(
                            `/api/voice/calls/${call.call.id}`,
                            { action: "reconcile", executionId },
                            "Execution reconciled."
                          )
                        )
                          await inspectCall(call.call.id)
                      }}
                    >
                      <LocalizedText text="Attach execution" />
                    </Button>
                    <label className="flex items-start gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={noCallConfirmed}
                        onChange={(event) =>
                          setNoCallConfirmed(event.target.checked)
                        }
                      />
                      <LocalizedText text="I checked Bolna and confirmed that no call was placed." />
                    </label>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy || !noCallConfirmed}
                      onClick={async () => {
                        if (
                          await perform(
                            `/api/voice/calls/${call.call.id}`,
                            {
                              action: "not_placed",
                              confirmed: true,
                              note: "Operator checked Bolna call history and confirmed no call was placed.",
                            },
                            "Uncertain attempt resolved by operator."
                          )
                        )
                          await inspectCall(call.call.id)
                      }}
                    >
                      <LocalizedText text="Record no call placed" />
                    </Button>
                  </div>
                )}
              <div className="space-y-2">
                {call.tools.map((tool) => (
                  <details
                    key={tool.id}
                    className="rounded-lg border p-2 text-xs"
                  >
                    <summary className="cursor-pointer">
                      {tool.tool.replaceAll("_", " ")} ·{" "}
                      <LocalizedText text={tool.state} />
                    </summary>
                    <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap text-muted-foreground">
                      {tool.detail}
                    </pre>
                  </details>
                ))}
              </div>
              <details>
                <summary className="cursor-pointer text-sm font-medium">
                  <LocalizedText text="Saved case brief and context" />
                </summary>
                <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
                  {JSON.stringify(call.context, null, 2)}
                </pre>
              </details>
              {call.call.transcript && (
                <details open>
                  <summary className="cursor-pointer text-sm font-medium">
                    <LocalizedText text="Transcript" />
                  </summary>
                  <p className="mt-3 text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                    <LocalizedText text={call.call.transcript} />
                  </p>
                </details>
              )}
              {call.call.outcome && (
                <details>
                  <summary className="cursor-pointer text-sm font-medium">
                    <LocalizedText text="Structured outcome" />
                  </summary>
                  <pre className="mt-3 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
                    {JSON.stringify(call.call.outcome, null, 2)}
                  </pre>
                </details>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelected(call.call.issueId)
                  setCall(null)
                }}
              >
                <ArrowUpRight />
                <LocalizedText text="Open issue dossier" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {voiceOpen && (
        <VoiceAgentDialog
          issues={issues}
          selectedIssueId={
            scope.startsWith("issue:") ? scope.slice(6) : selected
          }
          onClose={() => setVoiceOpen(false)}
          onUpdated={notifyRefresh}
        />
      )}
    </main>
  )
}
function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
      {text}
    </div>
  )
}
function CalendarIcon({ className }: { className?: string }) {
  return <Activity className={className} />
}
