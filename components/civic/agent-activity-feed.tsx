"use client"

import { LocalizedText } from "@/components/language-provider"

import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/civic/model"
import { TraceStatusBadge, TraceStatusIcon } from "./trace-primitives"

export type AgentActivity = {
  id: string
  action: string
  state: string
  summary: string
  createdAt: string
  detail?: Record<string, unknown> | null
}
const labels: Record<string, string> = {
  transcribe_speech: "Transcribing speech",
  understand_request: "Understanding your request",
  generate_speech: "Speaking in your language",
  scan_complaints: "Reading new community reports",
  aggregate_complaints: "Gathering reports for a shared issue",
  deduplicate_complaints: "Checking for repeated reports",
  search_contacts: "Finding the responsible office",
  plan_next_action: "Planning the next step",
  connect_voice: "Connecting voice",
  infer_complaint: "Understanding complaint",
  draft_complaint: "Preparing draft",
  search_complaints: "Reading registered complaints",
  get_complaint_details: "Reading case details",
  get_issue_timeline: "Reading follow-up history",
  find_responsible_offices: "Matching responsibility",
  search_office_directory: "Searching office directory",
  get_follow_up_schedule: "Checking deadlines",
  record_progress_update: "Saving progress update",
  record_commitment: "Recording commitment",
  select_issue_context: "Selecting case context",
  stop_follow_ups: "Stopping pending calls",
}
export function AgentActivityFeed({
  activities,
  compact = false,
}: {
  activities: AgentActivity[]
  compact?: boolean
}) {
  return (
    <div
      className="space-y-3"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {!activities.length && (
        <p className="text-xs text-muted-foreground">
          <LocalizedText text="Agent actions will appear here when a record is read or updated." />
        </p>
      )}
      {[...activities]
        .reverse()
        .slice(compact ? -8 : -50)
        .map((item) => (
          <article key={item.id} className="flex gap-2 border-l pl-3 text-xs">
            <TraceStatusIcon state={item.state} className="mt-0.5" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  <LocalizedText
                    text={
                      labels[item.action] ?? item.action.replaceAll("_", " ")
                    }
                  />
                </p>
                <TraceStatusBadge state={item.state} />
              </div>
              <p className="leading-relaxed break-words text-muted-foreground">
                <LocalizedText text={item.summary} />
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatDate(item.createdAt)}
              </p>
            </div>
          </article>
        ))}
    </div>
  )
}
export function InferredComplaint({
  inference,
}: {
  inference: Record<string, string> | null
}) {
  if (!inference || !Object.values(inference).some(Boolean))
    return (
      <p className="text-xs text-muted-foreground">
        <LocalizedText text="No complaint details inferred yet. Describe what happened and a nearby landmark." />
      </p>
    )
  return (
    <section className="space-y-3 rounded-xl border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">
          <LocalizedText text="What the agent understood" />
        </p>
        <Badge variant="outline">
          <LocalizedText text="Draft · not submitted" />
        </Badge>
      </div>
      <p className="font-medium">
        <LocalizedText
          text={inference.title || "Title still being understood"}
        />
      </p>
      {inference.description && (
        <p className="text-muted-foreground">
          <LocalizedText text={inference.description} />
        </p>
      )}
      <div className="flex flex-wrap gap-2 text-xs">
        {inference.category && (
          <Badge variant="secondary">
            <LocalizedText text={inference.category} />
          </Badge>
        )}
        {inference.issue_type && (
          <Badge variant="outline">
            <LocalizedText text={inference.issue_type} />
          </Badge>
        )}
      </div>
      {inference.landmark && (
        <p className="text-xs text-muted-foreground">
          <LocalizedText text="Landmark:" />
          <LocalizedText text={inference.landmark} />
        </p>
      )}
      {inference.missing_details && (
        <p className="text-xs text-muted-foreground">
          <LocalizedText text="Still needed:" />
          <LocalizedText text={inference.missing_details} />
        </p>
      )}
    </section>
  )
}
