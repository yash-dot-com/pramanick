"use client"

import { LocalizedText } from "@/components/language-provider"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
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
  if (!data)
    return (
      <div className="space-y-3 p-4 text-sm text-muted-foreground">
        <LocalizedText text={error || "Loading issue dossier…"} />
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
  return (
    <section className="space-y-5 p-4 pb-8">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            <LocalizedText text={CATEGORIES[issue.category].label} />
          </Badge>
          {issue.isDemo && (
            <Badge variant="secondary">
              <LocalizedText text="Fictional demo" />
            </Badge>
          )}
          <StatusBadge status={issue.status} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          <LocalizedText text={issue.title} />
        </h1>
        <p className="text-xs text-muted-foreground">
          <LocalizedText text={issue.locality} /> ·{" "}
          <LocalizedText text={issue.landmark} />
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <LocalizedText text={issue.description} />
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-sm">
            <Users className="size-4" />
            {issue.complaintCount}
            <LocalizedText text="complaints" />
          </span>
          {onSupport && (
            <Button size="sm" variant="outline" onClick={onSupport}>
              <LocalizedText text="I’m affected too" />
              <ArrowUpRight />
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {onVoice && (
          <Button onClick={onVoice}>
            <Mic />
            <LocalizedText text="Talk about this issue" />
          </Button>
        )}
        {issue.status !== "verified" &&
          (!run ? (
            <Button
              disabled={busy || issue.status === "awaiting_verification"}
              onClick={async () => {
                requestId.current ??= crypto.randomUUID()
                if (
                  await mutate(
                    "/api/voice/runs",
                    { issueId, requestId: requestId.current },
                    "Follow-up started. The agent is preparing the case brief."
                  )
                )
                  requestId.current = null
              }}
            >
              <Play />
              <LocalizedText text="Start follow-up" />
            </Button>
          ) : (
            <>
              <Badge variant="outline">
                <LocalizedText text="Run" />
                <LocalizedText text={run.state} />
              </Badge>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void mutate(
                    "/api/voice/runs",
                    {
                      runId: run.id,
                      action: ["paused", "awaiting_configuration"].includes(
                        run.state
                      )
                        ? "resume"
                        : "pause",
                    },
                    ["paused", "awaiting_configuration"].includes(run.state)
                      ? "Run resumed."
                      : "Pending calls paused."
                  )
                }
              >
                {["paused", "awaiting_configuration"].includes(run.state) ? (
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
              {run.state === "active" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void mutate(
                      "/api/voice/runs",
                      { runId: run.id, action: "follow_up_now" },
                      "Next demo follow-up queued."
                    )
                  }
                >
                  <LocalizedText text="Follow up now" />
                </Button>
              )}
            </>
          ))}
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <a
              href={`/api/issues/${encodeURIComponent(issueId)}/dossier?format=md`}
            />
          }
        >
          <Download />
          <LocalizedText text="Dossier" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={
            <a
              href={`/api/issues/${encodeURIComponent(issueId)}/dossier?format=json`}
            />
          }
        >
          <LocalizedText text="JSON · v" />
          {data.version}
        </Button>
      </div>
      {run?.state === "awaiting_configuration" && (
        <p className="rounded-lg border p-3 text-xs text-muted-foreground">
          <LocalizedText text="Case brief prepared. Phone follow-up is waiting for a consenting demo recipient. Add the local phone configuration, then resume this run. No call has been placed." />
        </p>
      )}
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">
          <LocalizedText text="Evidence file history ·" />
          {data.versions.length}
          <LocalizedText text="captured versions" />
        </summary>
        <div className="mt-2 space-y-2">
          {data.versions.map((version) => (
            <a
              key={version.version}
              className="block underline underline-offset-4"
              href={`/api/issues/${encodeURIComponent(issueId)}/dossier?version=${version.version}&format=md`}
            >
              <LocalizedText text="Version" />
              {version.version} · {formatDate(version.createdAt)}
            </a>
          ))}
        </div>
      </details>
      <div className="space-y-2 rounded-xl border p-3 text-xs">
        <p className="flex items-center gap-1.5 font-medium">
          <Building2 className="size-4" />
          <LocalizedText text="Responsibility" />
        </p>
        {data.responsibility ? (
          <Link
            className="underline underline-offset-4"
            href={`/leaderboard?profile=${encodeURIComponent(data.responsibility.id)}`}
          >
            <LocalizedText text={data.responsibility.name} />
            <LocalizedText
              text={data.responsibility.isDemo ? " · demo office" : ""}
            />
          </Link>
        ) : (
          <p className="text-muted-foreground">
            <LocalizedText text="Office assignment requires review." />
          </p>
        )}
        <p className="flex items-start gap-1.5 text-muted-foreground">
          <CalendarClock className="size-3.5 shrink-0" />
          <LocalizedText
            text={
              data.nextFollowUp
                ? `Next review/follow-up: ${formatDate(data.nextFollowUp)}`
                : "No next follow-up scheduled."
            }
          />
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          <LocalizedText text={error} />
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      <section className="space-y-3 rounded-xl border p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">
            <LocalizedText text="Agent actions" />
          </h2>
          <Link
            href="/dashboard"
            className="text-xs underline underline-offset-4"
          >
            <LocalizedText text="Public dashboard" />
          </Link>
        </div>
        <AgentActivityFeed activities={activities} compact />
      </section>
      <Tabs defaultValue={initialTab}>
        <TabsList className="flex h-auto w-full flex-wrap">
          <TabsTrigger value="timeline">
            <LocalizedText text="Timeline" />
          </TabsTrigger>
          <TabsTrigger value="evidence">
            <LocalizedText text="Evidence" />
          </TabsTrigger>
          <TabsTrigger value="calls">
            <LocalizedText text="Calls" />
          </TabsTrigger>
          <TabsTrigger value="review">
            <LocalizedText text="Resident review" />
          </TabsTrigger>
          <TabsTrigger value="escalation">
            <LocalizedText text="Escalation" />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="timeline">
          <div className="space-y-5 pt-4">
            {[...data.timeline].reverse().map((entry) => (
              <article key={entry.id} className="space-y-1 border-l-2 pl-3">
                <p className="text-xs text-muted-foreground">
                  {formatDate(entry.createdAt)}
                </p>
                <h3 className="text-sm font-medium">
                  <LocalizedText text={entry.title} />
                </h3>
                <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  <LocalizedText text={entry.description} />
                </p>
                <p className="text-[11px] break-words text-muted-foreground">
                  <LocalizedText text={entry.source} />
                </p>
              </article>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="evidence">
          <div className="space-y-4 pt-4">
            {data.evidence.map((item) => (
              <figure key={item.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.caption}
                  className="w-full rounded-lg border"
                />
                <figcaption className="mt-2 text-xs text-muted-foreground">
                  <LocalizedText
                    text={
                      item.phase === "verification"
                        ? "After / resident check"
                        : "Before / report"
                    }
                  />{" "}
                  · <LocalizedText text={item.caption} /> ·{" "}
                  {formatDate(item.createdAt)}
                </figcaption>
                {item.location && (
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <Badge variant="outline">
                      <LocalizedText
                        text={
                          item.location.proximity === "near"
                            ? "Nearby device observation"
                            : item.location.proximity.replaceAll("_", " ")
                        }
                      />
                    </Badge>
                    <p>
                      <LocalizedText text={item.location.distanceMeters} />
                      <LocalizedText text="m from issue pin · ±" />
                      <LocalizedText text={item.location.accuracy} />
                      <LocalizedText text="m accuracy ·" />{" "}
                      {formatDate(item.location.observedAt)}
                    </p>
                    <p>
                      <LocalizedText text="Device location accompanies the upload; it does not establish the photo’s capture location or authenticity." />
                    </p>
                  </div>
                )}
                {item.assessment ? (
                  <div className="mt-2 space-y-1 rounded-lg border p-3 text-xs">
                    <p className="font-medium">
                      <LocalizedText text="AI:" />
                      {item.assessment.finding.replaceAll("_", " ")}
                    </p>
                    <p>
                      <LocalizedText text={item.assessment.explanation} />
                    </p>
                    <p className="text-muted-foreground">
                      <LocalizedText text={item.assessment.limitations} />
                    </p>
                    <p className="text-muted-foreground">
                      <LocalizedText text="Scene:" />
                      {item.assessment.sameScene.replaceAll("_", " ")} ·{" "}
                      <LocalizedText text={item.assessment.promptVersion} />
                    </p>
                  </div>
                ) : (
                  item.phase === "verification" && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <LocalizedText text="Photo assessment pending. Its job appears in Operations." />
                    </p>
                  )
                )}
              </figure>
            ))}
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
                  <LocalizedText text="Still to establish" />
                </p>
                {data.gaps.map((gap) => (
                  <p key={gap} className="text-muted-foreground">
                    {gap}
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
                    <LocalizedText text={call.status} />
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  <LocalizedText
                    text={call.summary || "No published outcome yet."}
                  />
                </p>
                {call.nextAction && (
                  <p className="text-xs">
                    <LocalizedText text="Next:" />
                    <LocalizedText text={call.nextAction} />
                  </p>
                )}
                {call.person && (
                  <Link
                    href={`/leaderboard?profile=${encodeURIComponent(call.person.id)}`}
                    className="text-xs underline underline-offset-4"
                  >
                    <LocalizedText text="Responsibility profile" />
                    <LocalizedText text={call.person.isDemo ? " · demo" : ""} />
                  </Link>
                )}
                {call.transcript && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">
                      <LocalizedText text="Published transcript" />
                    </summary>
                    <p className="mt-2 leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      <LocalizedText text={call.transcript} />
                    </p>
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
                <LocalizedText text="A completion claim will open a resident review." />
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
      {data.commitments.length > 0 && (
        <section className="space-y-2 border-t pt-4">
          <h2 className="text-sm font-medium">
            <LocalizedText text="Recorded promises" />
          </h2>
          {data.commitments.map((promise) => (
            <article
              key={promise.id}
              className="space-y-1 rounded-lg border p-3 text-xs"
            >
              <p>
                <LocalizedText text={promise.action} />
              </p>
              <p className="text-muted-foreground">
                {formatDate(promise.dueAt)} ·{" "}
                <LocalizedText text={promise.status} />
              </p>
            </article>
          ))}
        </section>
      )}
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
