"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import {
  ArrowUpRight,
  CalendarClock,
  Check,
  FileText,
  Headphones,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
} from "lucide-react"
import { LocalizedText } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate } from "@/lib/civic/model"
import {
  conversationTurns,
  publicCaseTimeline,
  publicResponseNotes,
  type PublicCaseCall,
  type PublicCaseData,
} from "@/lib/civic/public-case"
import { callLabels } from "@/lib/voice/presentation"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./status-badge"
import { DossierSkeleton } from "./loading-skeletons"

function PublicConversation({ call }: { call: PublicCaseCall }) {
  const notes = publicResponseNotes(call)
  const turns = call.transcript ? conversationTurns(call.transcript) : []
  const audio =
    call.recordingUrl ===
    `/api/voice/calls/${encodeURIComponent(call.id)}/recording`
      ? call.recordingUrl
      : null
  return (
    <article
      id={`conversation-${call.id}`}
      className="space-y-4 rounded-xl border bg-card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <Phone className="size-4 text-muted-foreground" />
            <LocalizedText text={call.person?.name || "Contact not recorded"} />
          </h3>
          <p className="text-xs text-muted-foreground">
            <LocalizedText text={call.person?.role || "Role not recorded"} />
          </p>
          <p className="text-[11px] text-muted-foreground">
            {formatDate(call.createdAt)} ·{" "}
            <LocalizedText
              text={
                call.scriptedDemo
                  ? audio
                    ? "Scripted sample · synthetic voices"
                    : "Scripted sample"
                  : call.phoneAttempt
                    ? "Phone follow-up"
                    : "Browser conversation"
              }
            />
          </p>
        </div>
        <Badge variant="outline">
          <LocalizedText
            text={callLabels[call.status] ?? "Call status awaiting review"}
          />
        </Badge>
      </div>
      <p className="text-sm leading-relaxed">
        <LocalizedText
          text={
            call.summary ||
            "No public summary has been saved for this conversation yet."
          }
        />
      </p>
      {audio ? (
        <div className="space-y-2 rounded-lg border bg-muted/15 p-3">
          <p className="flex items-center gap-2 text-xs font-medium">
            <Headphones className="size-3.5" />
            <LocalizedText text="Listen to the published conversation" />
          </p>
          <audio controls preload="metadata" src={audio} className="w-full" />
          <a
            href={`${audio}?download=1`}
            download
            className="text-xs underline underline-offset-4"
          >
            Download audio
          </a>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          <LocalizedText text="There is no published audio for this conversation. It may be unavailable or awaiting publication permission." />
        </p>
      )}
      {turns.length > 0 ? (
        <details className="rounded-lg border p-3">
          <summary className="cursor-pointer text-xs font-medium">
            <LocalizedText text="Read the original conversation" />
          </summary>
          <p className="mt-2 text-[10px] text-muted-foreground">
            <LocalizedText text="Original saved wording. Speaker labels come from the transcript; individual message times were not supplied." />
          </p>
          <ol className="mt-3 max-h-96 space-y-3 overflow-y-auto">
            {turns.map((turn, index) => (
              <li
                key={index}
                className={cn(
                  "max-w-[92%] rounded-xl border p-3",
                  turn.speaker === "agent"
                    ? "bg-muted/30"
                    : "ml-auto bg-background"
                )}
              >
                <p className="mb-1 text-[10px] font-semibold text-muted-foreground">
                  <LocalizedText
                    text={
                      turn.speaker === "agent"
                        ? "Pramanik"
                        : turn.speaker === "contact"
                          ? call.person?.name || "Other participant"
                          : "Speaker not identified"
                    }
                  />
                </p>
                <p className="text-xs leading-relaxed whitespace-pre-wrap">
                  {turn.text}
                </p>
              </li>
            ))}
          </ol>
        </details>
      ) : (
        <p className="text-xs text-muted-foreground">
          <LocalizedText text="No original transcript is published for this conversation." />
        </p>
      )}
      {notes.eligible && (
        <section className="space-y-3 border-t pt-3">
          <h4 className="text-xs font-semibold">
            <LocalizedText text="What this response establishes" />
          </h4>
          <div className="grid gap-2 sm:grid-cols-3">
            {notes.items.map((item) => (
              <div key={item.key} className="rounded-lg border p-3">
                <p className="text-[11px]">
                  <LocalizedText text={item.label} />
                </p>
                <p
                  className={cn(
                    "mt-2 flex items-center gap-1 text-[10px]",
                    item.state === "documented"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  )}
                >
                  {item.state === "documented" && <Check className="size-3" />}
                  <LocalizedText
                    text={
                      item.state === "documented"
                        ? "Supported by published conversation"
                        : item.state === "not_documented"
                          ? "Not established in these notes"
                          : "Published evidence not available"
                    }
                  />
                </p>
              </div>
            ))}
          </div>
          {notes.quote && (
            <blockquote className="border-l-2 pl-3 text-xs leading-relaxed">
              <p className="mb-1 text-[10px] text-muted-foreground">
                <LocalizedText text="Supporting original wording" />
              </p>
              {notes.quote}
            </blockquote>
          )}
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            <LocalizedText text="AI-assisted response notes, linked to this conversation. These describe documented answers, not a person’s intentions or character." />
          </p>
        </section>
      )}
      {call.nextAction && (
        <p className="rounded-lg bg-muted/20 p-3 text-xs leading-relaxed">
          <span className="font-medium">
            <LocalizedText text="Next follow-up: " />
          </span>
          <LocalizedText text={call.nextAction} />
        </p>
      )}
      {call.person && (call.phoneAttempt || call.scriptedDemo) && (
        <Link
          href={`/leaderboard?profile=${encodeURIComponent(call.person.id)}`}
          className="inline-flex items-center gap-1 text-xs underline underline-offset-4"
        >
          <LocalizedText text="See this contact’s response history" />
          <ArrowUpRight className="size-3" />
        </Link>
      )}
    </article>
  )
}

export function PublicCaseFile({
  issueId,
  initialTab = "timeline",
  onClose,
}: {
  issueId: string
  initialTab?: "timeline" | "conversations"
  onClose: () => void
}) {
  const [data, setData] = useState<PublicCaseData | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    async function read() {
      if (!document.hidden) {
        try {
          const response = await fetch(
            `/api/issues/${encodeURIComponent(issueId)}/dossier`,
            { cache: "no-store", signal: controller.signal }
          )
          const result = await response.json()
          if (!response.ok)
            throw new Error(
              result.error || "This public case file could not be loaded"
            )
          if (controller.signal.aborted) return
          setData(result)
          setError("")
        } catch (error) {
          if (!controller.signal.aborted)
            setError(
              error instanceof Error
                ? error.message
                : "The case file could not refresh"
            )
        }
      }
      if (!controller.signal.aborted)
        timer = setTimeout(() => void read(), 10000)
    }
    void read()
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [issueId])
  const timeline = data ? publicCaseTimeline(data) : []
  const promisedCheck = data?.commitments
    .filter((item) => item.status !== "fulfilled" && item.dueAt)
    .sort((a, b) => a.dueAt!.localeCompare(b.dueAt!))[0]
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            <LocalizedText text={data?.issue.title || "Public case file"} />
          </DialogTitle>
          <DialogDescription>
            <LocalizedText text="The reports, proof, conversations, promises and follow-ups behind this issue." />
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-amber-500/30 p-3 text-xs text-amber-700 dark:text-amber-300"
          >
            <LocalizedText text={error} />
          </p>
        )}
        {!data ? (
          !error && <DossierSkeleton />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={data.issue.status} />
                <Badge variant="outline">
                  {data.issue.complaintCount}{" "}
                  <LocalizedText text="resident reports" />
                </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground">
                <LocalizedText text="Updated" /> {formatDate(data.capturedAt)}
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              <LocalizedText text={data.issue.description} />
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <section className="space-y-2 rounded-xl border p-3">
                <h3 className="flex items-center gap-2 text-xs font-medium">
                  <MapPin className="size-3.5" />
                  <LocalizedText text="Where the problem is" />
                </h3>
                <p className="text-xs">
                  <LocalizedText text={data.issue.landmark} /> ·{" "}
                  <LocalizedText text={data.issue.locality} />
                </p>
                <Link
                  className="text-[11px] underline underline-offset-4"
                  href={`/app?issue=${encodeURIComponent(issueId)}`}
                >
                  <LocalizedText text="See the location on the map" />
                </Link>
              </section>
              <section className="space-y-2 rounded-xl border p-3">
                <h3 className="text-xs font-medium">
                  <LocalizedText text="Responsible office" />
                </h3>
                <p className="text-xs">
                  <LocalizedText
                    text={
                      data.responsibility?.name ||
                      "Responsibility still needs to be confirmed"
                    }
                  />
                </p>
                {data.responsibility && (
                  <p className="text-[10px] text-muted-foreground">
                    <LocalizedText
                      text={
                        data.responsibility.isDemo
                          ? "Demonstration office"
                          : data.responsibility.certainty === "confirmed"
                            ? "Recorded assignment"
                            : "Assignment needs review"
                      }
                    />
                  </p>
                )}
              </section>
              <section className="space-y-2 rounded-xl border p-3">
                <h3 className="flex items-center gap-2 text-xs font-medium">
                  <CalendarClock className="size-3.5" />
                  <LocalizedText text="Next follow-up" />
                </h3>
                <p className="text-xs">
                  <LocalizedText
                    text={
                      data.nextFollowUp
                        ? formatDate(data.nextFollowUp)
                        : promisedCheck?.dueAt
                          ? `Promise deadline: ${formatDate(promisedCheck.dueAt)}`
                          : "No next date has been scheduled"
                    }
                  />
                </p>
                <p className="text-[10px] text-muted-foreground">
                  <LocalizedText
                    text={
                      data.nextFollowUp
                        ? "The case stays open until the repair is checked."
                        : promisedCheck
                          ? "This is the recorded promise. Check the history to see whether it was kept."
                          : "The case history and recorded plan remain available below."
                    }
                  />
                </p>
              </section>
            </div>
            <Tabs defaultValue={initialTab}>
              <TabsList className="h-auto flex-wrap">
                <TabsTrigger value="timeline">
                  <LocalizedText text="Full history" />
                </TabsTrigger>
                <TabsTrigger value="conversations">
                  <LocalizedText text="Conversations" /> ({data.calls.length})
                </TabsTrigger>
                <TabsTrigger value="promises">
                  <LocalizedText text="Promises and deadlines" />
                </TabsTrigger>
                <TabsTrigger value="proof">
                  <LocalizedText text="Reports and proof" />
                </TabsTrigger>
              </TabsList>
              <TabsContent value="timeline">
                <ol className="space-y-4 pt-3">
                  {timeline.map((entry) => (
                    <li key={entry.id} className="border-l-2 pl-4">
                      <p className="mb-2 text-[10px] text-muted-foreground">
                        {formatDate(entry.at)}
                      </p>
                      {entry.kind === "call" ? (
                        <PublicConversation call={entry.call} />
                      ) : (
                        <div className="space-y-1 rounded-xl border p-3">
                          <p className="text-sm font-medium">
                            <LocalizedText text={entry.event.title} />
                          </p>
                          <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                            <LocalizedText text={entry.event.description} />
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            <LocalizedText text={entry.event.source} />
                          </p>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </TabsContent>
              <TabsContent value="conversations">
                <div className="space-y-3 pt-3">
                  {data.calls.length ? (
                    data.calls.map((call) => (
                      <PublicConversation key={call.id} call={call} />
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                      <LocalizedText text="No conversations have been recorded for this issue yet." />
                    </p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="promises">
                <div className="space-y-3 pt-3">
                  {data.commitments.length ? (
                    data.commitments.map((promise) => (
                      <article
                        key={promise.id}
                        className="space-y-2 rounded-xl border p-4"
                      >
                        <p className="text-sm font-medium">
                          <LocalizedText text={promise.action} />
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <LocalizedText
                            text={
                              promise.dueAt
                                ? `Promised date: ${formatDate(promise.dueAt)}`
                                : "No date was promised"
                            }
                          />
                        </p>
                        <Badge variant="outline">
                          <LocalizedText
                            text={
                              promise.status === "fulfilled"
                                ? "Recorded as fulfilled"
                                : promise.status === "overdue"
                                  ? "Deadline has passed"
                                  : "Awaiting follow-through"
                            }
                          />
                        </Badge>
                        <p className="text-[10px] text-muted-foreground">
                          <LocalizedText text="The supporting conversation appears in Full history." />
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                      <LocalizedText text="No specific promise has been saved for this issue yet." />
                    </p>
                  )}
                  <div className="flex items-start gap-2 rounded-lg bg-muted/25 p-3 text-xs text-muted-foreground">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                    <LocalizedText
                      text={
                        data.issue.status === "verified"
                          ? "Residents have verified the repair."
                          : data.issue.status === "awaiting_verification"
                            ? "A completion claim is waiting for residents to check it."
                            : "A verified repair has not been established for this case."
                      }
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="proof">
                <div className="space-y-4 pt-3">
                  <section className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <MessageSquare className="size-4" />
                      <LocalizedText text="Resident reports" />
                    </h3>
                    {data.complaints.map((report) => (
                      <article
                        key={report.id}
                        className="rounded-xl border p-3"
                      >
                        <p className="text-xs leading-relaxed">
                          <LocalizedText
                            text={
                              report.description ||
                              "A resident joined this complaint."
                            }
                          />
                        </p>
                        <p className="mt-2 text-[10px] text-muted-foreground">
                          {formatDate(report.createdAt)}
                        </p>
                      </article>
                    ))}
                  </section>
                  <section className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <FileText className="size-4" />
                      <LocalizedText text="Submitted proof" />
                    </h3>
                    {data.evidence.length ? (
                      data.evidence.map((item) => (
                        <article
                          key={item.id}
                          className="space-y-2 rounded-xl border p-3"
                        >
                          <p className="text-xs">
                            <LocalizedText
                              text={item.caption || "Resident photograph"}
                            />
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            <LocalizedText
                              text={
                                item.phase === "verification"
                                  ? "Submitted to check the repair"
                                  : "Submitted with the complaint"
                              }
                            />{" "}
                            · {formatDate(item.createdAt)}
                          </p>
                          {(/^data:image\/(png|jpeg|webp);base64,/.test(
                            item.url
                          ) ||
                            /^\/demo-office\/evidence\/[a-z-]+\.png$/.test(
                              item.url
                            )) && (
                            <Image
                              src={item.url}
                              alt={
                                item.caption ||
                                "Resident photograph of this issue"
                              }
                              width={960}
                              height={640}
                              unoptimized
                              className="max-h-80 w-full rounded-lg bg-muted/20 object-contain"
                            />
                          )}
                        </article>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        <LocalizedText text="No photographs have been submitted yet." />
                      </p>
                    )}
                  </section>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
              <p className="text-[10px] text-muted-foreground">
                <LocalizedText text="Saved case file, version" /> {data.version}
              </p>
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
                <FileText />
                <LocalizedText text="Download the public case file" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
