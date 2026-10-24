"use client"

import Link from "next/link"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useCallback, useEffect, useState } from "react"
import { ArrowUpRight, Loader2, Pause, Play, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LOCALITIES, formatDate, localityName } from "@/lib/civic/model"
import type { PublicAgentDashboard as Dashboard } from "@/lib/voice/dashboard"
import { LanguageSwitcher, LocalizedText } from "@/components/language-provider"
import { LANGUAGE_LABELS, type VoiceLanguage } from "@/lib/voice/language"
import { jobLabels, callLabels } from "@/lib/voice/presentation"
import { AgentActivityFeed } from "./agent-activity-feed"
import { StatusBadge } from "./status-badge"
import { PublicCaseFile } from "./public-case-file"
import { AgentOffice } from "./agent-office"

const columns = [
  { id: "planned", title: "Next steps" },
  { id: "running", title: "Working now" },
  { id: "scheduled", title: "Waiting for follow-up" },
  { id: "needs_attention", title: "Needs attention" },
  { id: "completed", title: "Completed actions" },
]
export function PublicAgentDashboard() {
  const [callLanguage, setCallLanguage] = useState<VoiceLanguage>("mr")
  const [publish, setPublish] = useState(false)
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [localityId, setLocalityId] = useState("kothrud")
  const [selectedCall, setSelectedCall] = useState<string | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null)
  const refresh = useCallback(async () => {
    const response = await fetch("/api/dashboard", { cache: "no-store" })
    const next = await response.json()
    if (!response.ok) throw new Error(next.error)
    setData(next)
    setError("")
  }, [])
  useEffect(() => {
    const read = () => {
      if (document.visibilityState !== "hidden")
        void refresh().catch((error) =>
          setError(
            error instanceof Error
              ? error.message
              : "Could not load agent activity"
          )
        )
    }
    read()
    const timer = setInterval(read, 2500)
    return () => clearInterval(timer)
  }, [refresh])
  async function action(kind: "start_demo" | "pause" | "scan_now") {
    setBusy(true)
    setError("")
    try {
      const response = await fetch("/api/voice/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localityId,
          action: kind,
          language: callLanguage,
          publishDemoConversation: publish,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      await refresh()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not update monitoring"
      )
    } finally {
      setBusy(false)
    }
  }
  const routine = data?.routines.find((item) => item.localityId === localityId)
  const actions =
    data?.actions.filter(
      (action) =>
        data.issues.find((issue) => issue.id === action.issueId)?.localityId ===
        localityId
    ) ?? []
  const working =
    data?.activities.filter(
      (activity) =>
        activity.state === "running" &&
        (!activity.issueId ||
          data.issues.find((issue) => issue.id === activity.issueId)
            ?.localityId === localityId)
    ) ?? []
  const call = data?.calls.find((item) => item.id === selectedCall)
  return (
    <main className="min-h-dvh bg-background p-4 text-foreground md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              <LocalizedText text="The public agent office" />
            </h1>
            <p className="text-sm text-muted-foreground">
              <LocalizedText text="Public follow-through: what the agent read, planned, called and recorded." />
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/app" />}
            >
              <LocalizedText text="Issue map" />
            </Button>
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link href="/operations" />}
            >
              <LocalizedText text="Operations" />
            </Button>
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link href="/leaderboard" />}
            >
              <LocalizedText text="Responsibility record" />
            </Button>
          </div>
        </header>
        {error && (
          <p
            role="alert"
            className="rounded-lg border p-3 text-sm text-destructive"
          >
            <LocalizedText text={error} />
          </p>
        )}
        {!data ? (
          <p className="text-sm text-muted-foreground">
            <LocalizedText text="Loading saved agent activity…" />
          </p>
        ) : (
          <>
            <AgentOffice data={data} onOpenCase={setSelectedIssue} />
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ["Phone attempts", data.metrics.phoneAttempts],
                ["Completed calls", data.metrics.completedCalls],
                ["Active runs", data.metrics.activeRuns],
                ["Queued work", data.metrics.queuedJobs],
                ["No answer / busy", data.metrics.unansweredCalls],
                ["Overdue promises", data.metrics.overduePromises],
                ["Awaiting resident check", data.metrics.awaitingVerification],
                ["Verified cases", data.metrics.verifiedIssues],
              ].map(([label, value]) => (
                <Card key={label}>
                  <CardContent className="space-y-2 pt-4">
                    <p className="text-xs text-muted-foreground">
                      <LocalizedText text={label} />
                    </p>
                    <p className="text-2xl font-semibold tabular-nums">
                      <LocalizedText text={value} />
                    </p>
                  </CardContent>
                </Card>
              ))}
            </section>
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>
                    <LocalizedText text="Locality routine" />
                  </CardTitle>
                  <Badge
                    variant={data.worker?.online ? "secondary" : "outline"}
                  >
                    <LocalizedText text="Worker" />
                    <LocalizedText
                      text={data.worker?.online ? "online" : "offline / stale"}
                    />
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  <LocalizedText text="Read new complaints → aggregate shared cases → check duplicate candidates → search responsibility → update dossier and plan → call one contact at a time → save response and next deadline." />
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={localityId}
                    onValueChange={(value) => {
                      if (value) setLocalityId(value)
                    }}
                  >
                    <SelectTrigger
                      className="w-52"
                      aria-label="Monitoring locality"
                    >
                      <SelectValue>{localityName(localityId)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {LOCALITIES.map((place) => (
                        <SelectItem key={place.id} value={place.id}>
                          <LocalizedText text={place.name} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label className="flex items-center gap-2 text-xs">
                    <LocalizedText text="Call language" />
                    <select
                      className="h-9 rounded-lg border bg-background px-2"
                      value={callLanguage}
                      disabled={routine?.state === "active"}
                      onChange={(event) =>
                        setCallLanguage(event.target.value as VoiceLanguage)
                      }
                    >
                      {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void action(
                        routine?.state === "active" ? "pause" : "start_demo"
                      )
                    }
                  >
                    {busy ? (
                      <Loader2 className="animate-spin" />
                    ) : routine?.state === "active" ? (
                      <Pause />
                    ) : (
                      <Play />
                    )}
                    <LocalizedText
                      text={
                        routine?.state === "active"
                          ? "Pause routine & pending calls"
                          : "Start demo"
                      }
                    />
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy || routine?.state !== "active"}
                    onClick={() => void action("scan_now")}
                  >
                    <RefreshCw />
                    <LocalizedText text="Scan now" />
                  </Button>
                  <Badge variant="outline">
                    <LocalizedText text={routine?.state ?? "Not started"} />
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  <LocalizedText
                    text={
                      routine
                        ? `Last scan: ${routine.lastScanAt ? formatDate(routine.lastScanAt) : "queued"} · Next: ${formatDate(routine.nextScanAt)} · every ${routine.intervalMinutes} minutes.`
                        : "Start once to activate this locality's routine. Newly registered cases will be picked up on later scans."
                    }
                  />
                </p>
                <label className="flex items-start gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-primary"
                    checked={publish || !!data.publication.recording}
                    disabled={
                      !!data.publication.recording ||
                      routine?.state === "active"
                    }
                    onChange={(event) => setPublish(event.target.checked)}
                  />
                  <LocalizedText text="The demo recipient has agreed to recording and public sharing of this demonstration conversation." />
                </label>
                <p className="text-xs text-muted-foreground">
                  <LocalizedText text="Demo responsibility holder:" />
                  <LocalizedText text={data.recipient.name} />.{" "}
                  <LocalizedText
                    text={
                      data.demoPhoneConfigured
                        ? "Consenting demo phone configured."
                        : "No demo phone configured. Reading, planning and dossiers can run; dialing waits for the recipient."
                    }
                  />
                </p>
                <p className="text-xs text-muted-foreground">
                  <LocalizedText text="Pausing keeps history and stops pending locality calls. Starting again resumes eligible paused runs." />
                  <LocalizedText text={data.limits} />
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 pt-4">
                <p className="text-xs text-muted-foreground">
                  <LocalizedText text="What the agent is doing now" />
                </p>
                {working.length ? (
                  <AgentActivityFeed activities={working.slice(0, 3)} compact />
                ) : (
                  <p className="text-sm">
                    <LocalizedText
                      text={
                        !data.worker?.online
                          ? "The worker is offline. Saved history is available; new work waits for the worker."
                          : routine?.state !== "active"
                            ? "The routine is paused. Start demo to gather reports and begin the saved plan."
                            : actions.some(
                                  (action) => action.state === "needs_attention"
                                )
                              ? "The scan is active. Some actions need attention; open their cards below."
                              : "No action is running right now. The agent will pick up the next scheduled job and scan for new complaints."
                      }
                    />
                  </p>
                )}
              </CardContent>
            </Card>
            <Tabs defaultValue="plan">
              <TabsList className="h-auto flex-wrap">
                <TabsTrigger value="activity">
                  <LocalizedText text="Live activity" />
                </TabsTrigger>
                <TabsTrigger value="plan">
                  <LocalizedText text="Agent plan" />
                </TabsTrigger>
                <TabsTrigger value="calls">
                  <LocalizedText text="Call history (" />
                  {data.calls.length})
                </TabsTrigger>
                <TabsTrigger value="issues">
                  <LocalizedText text="Issues & timelines" />
                </TabsTrigger>
                <TabsTrigger value="queue">
                  <LocalizedText text="Work queue" />
                </TabsTrigger>
              </TabsList>
              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <LocalizedText text="Recorded agent actions" />
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      <LocalizedText text="Actual server events, tool results and short decision summaries. Updated every few seconds." />
                    </p>
                  </CardHeader>
                  <CardContent>
                    <AgentActivityFeed activities={data.activities} />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="plan">
                <p className="mb-3 text-xs text-muted-foreground">
                  <LocalizedText text="The agent prepares questions from registered complaints. Cards move when saved jobs, calls and resident checks change. A completed call does not mean the repair is verified." />
                </p>
                <div className="flex gap-3 overflow-x-auto pb-3">
                  {columns.map((column) => (
                    <section
                      key={column.id}
                      className="w-72 shrink-0 space-y-3 rounded-xl border bg-muted/20 p-3"
                    >
                      <h2 className="flex items-center justify-between text-sm font-medium">
                        <LocalizedText text={column.title} />
                        <Badge variant="outline">
                          {
                            actions.filter(
                              (action) => action.state === column.id
                            ).length
                          }
                        </Badge>
                      </h2>
                      {actions
                        .filter((action) => action.state === column.id)
                        .map((action) => (
                          <Card key={action.id}>
                            <CardContent className="space-y-3 pt-4">
                              <p className="text-sm font-medium">
                                <LocalizedText text={action.title} />
                              </p>
                              <Link
                                className="block text-xs underline-offset-4 hover:underline"
                                href={`/app?issue=${encodeURIComponent(action.issueId)}`}
                              >
                                <LocalizedText
                                  text={
                                    data.issues.find(
                                      (issue) => issue.id === action.issueId
                                    )?.title ?? action.issueId
                                  }
                                />
                              </Link>
                              <p className="text-xs leading-relaxed text-muted-foreground">
                                <LocalizedText text={action.reason} />
                              </p>
                              {action.question && (
                                <blockquote className="border-l-2 pl-3 text-xs leading-relaxed">
                                  <LocalizedText text={action.question} />
                                </blockquote>
                              )}
                              {action.kind === "call_contact" && (
                                <p className="text-xs text-muted-foreground">
                                  <LocalizedText text={action.person} />
                                </p>
                              )}
                              {action.dueAt && (
                                <p className="text-[10px] text-muted-foreground">
                                  <LocalizedText text="Next follow-up" />:{" "}
                                  {formatDate(action.dueAt)}
                                </p>
                              )}
                              {!!action.sourceComplaintIds.length && (
                                <p className="text-[10px] text-muted-foreground">
                                  {action.sourceComplaintIds.length}{" "}
                                  <LocalizedText text="source reports used" />
                                </p>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedIssue(action.issueId)}
                              >
                                <LocalizedText text="Public case file" />
                                <ArrowUpRight />
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                    </section>
                  ))}
                </div>
                {!actions.length && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    <LocalizedText text="No saved plan for this locality yet. Start demo to populate it." />
                  </p>
                )}
              </TabsContent>
              <TabsContent value="calls">
                <div className="space-y-3">
                  {!data.calls.length && (
                    <p className="text-sm text-muted-foreground">
                      <LocalizedText text="No calls recorded yet." />
                    </p>
                  )}
                  {data.calls.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            <LocalizedText
                              text={item.person?.name ?? "Participant"}
                            />{" "}
                            <LocalizedText
                              text={item.person?.isDemo ? "· demo" : ""}
                            />
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <LocalizedText text={item.issueTitle} /> ·{" "}
                            {formatDate(item.createdAt)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <LocalizedText
                              text={
                                item.kind === "scripted_demo"
                                  ? "Scripted demonstration · synthetic voices"
                                  : item.kind === "phone"
                                    ? "Stakeholder phone call"
                                    : "Browser conversation"
                              }
                            />{" "}
                            · {callLabels[item.status] ?? item.status} ·{" "}
                            <LocalizedText
                              text={
                                item.duration == null
                                  ? "duration pending"
                                  : `${Math.round(item.duration)}s`
                              }
                            />
                            <LocalizedText
                              text={
                                !item.providerConfirmed
                                  ? " · provider acceptance unconfirmed"
                                  : ""
                              }
                            />
                          </p>
                          <p className="max-w-2xl text-xs text-muted-foreground">
                            <LocalizedText
                              text={item.summary || "No saved summary yet."}
                            />
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedCall(item.id)}
                          >
                            <LocalizedText text="Conversation" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            nativeButton={false}
                            render={
                              <Link
                                href={`/app?issue=${encodeURIComponent(item.issueId)}&tab=calls`}
                              />
                            }
                          >
                            <LocalizedText text="Issue calls" />
                            <ArrowUpRight />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="issues">
                <div className="grid gap-3 md:grid-cols-2">
                  {data.issues.map((issue) => (
                    <Card key={issue.id}>
                      <CardContent className="space-y-3 pt-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium">
                            <LocalizedText text={issue.title} />
                          </p>
                          <StatusBadge status={issue.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {localityName(issue.localityId)} ·{" "}
                          {issue.complaintCount}
                          <LocalizedText text="complaints" />
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <LocalizedText text={issue.latestUpdate} />
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <LocalizedText text="Next:" />
                          {formatDate(issue.nextFollowUp)}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedIssue(issue.id)}
                        >
                          <LocalizedText text="Open public case file" />
                          <ArrowUpRight />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="queue">
                <div className="space-y-2">
                  {!data.jobs.length && (
                    <p className="text-sm text-muted-foreground">
                      <LocalizedText text="No jobs yet." />
                    </p>
                  )}
                  {data.jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex flex-wrap justify-between gap-3 rounded-lg border p-3 text-xs"
                    >
                      <div>
                        <Link
                          className="font-medium underline-offset-4 hover:underline"
                          href={`/app?issue=${encodeURIComponent(job.issueId)}`}
                        >
                          <LocalizedText
                            text={
                              jobLabels[job.kind] ??
                              job.kind.replaceAll("_", " ")
                            }
                          />
                        </Link>
                        <p className="mt-1 text-muted-foreground">
                          <LocalizedText text="Due" />
                          {formatDate(job.dueAt)}
                          <LocalizedText text="· attempt" />
                          {job.attempts}
                        </p>
                        {job.error && (
                          <p className="mt-1 text-muted-foreground">
                            <LocalizedText text={job.error} />
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">
                        <LocalizedText text={job.state} />
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            <p className="text-[10px] text-muted-foreground">
              <LocalizedText text="Saved state as of" />
              {formatDate(data.capturedAt)}
              <LocalizedText text=". Browser conversations:" />
              <LocalizedText text={data.metrics.browserConversations} />
              <LocalizedText text="; they are separate from stakeholder phone metrics." />
            </p>
          </>
        )}
      </div>
      {call && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setSelectedCall(null)
          }}
        >
          <DialogContent className="max-h-[88dvh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                <LocalizedText text={call.person?.name ?? "Conversation"} />
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                {callLabels[call.status] ?? call.status} ·{" "}
                {formatDate(call.createdAt)}
              </p>
              <p>
                <LocalizedText
                  text={
                    call.summary ||
                    "Summary will appear after provider synchronization and extraction."
                  }
                />
              </p>
              {call.nextAction && (
                <p>
                  <LocalizedText text="Next action:" />
                  <LocalizedText text={call.nextAction} />
                </p>
              )}
              {call.transcript ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    <LocalizedText text="Display translation follows your language choice. Open the original wording for the audit record." />
                  </p>
                  <details>
                    <summary className="cursor-pointer text-xs">
                      <LocalizedText text="Original transcript" />
                    </summary>
                    <p className="mt-2 text-xs whitespace-pre-wrap">
                      {call.transcript}
                    </p>
                  </details>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                    <LocalizedText text={call.transcript} />
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  <LocalizedText text="No public transcript available. It may still be processing or publication consent is absent." />
                </p>
              )}
              {call.recordingUrl && (
                <audio controls src={call.recordingUrl} className="w-full" />
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedIssue(call.issueId)
                  setSelectedCall(null)
                }}
              >
                <LocalizedText text="Open public case file" />
                <ArrowUpRight />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {selectedIssue && (
        <PublicCaseFile
          key={selectedIssue}
          issueId={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </main>
  )
}
