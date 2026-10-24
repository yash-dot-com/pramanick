import { createHash, randomUUID } from "node:crypto"
import { and, desc, eq, inArray } from "drizzle-orm"
import { z } from "zod"
import * as s from "@/lib/db/schema"
import { candidates, CivicError, snapshot, store } from "@/lib/civic/repository"
import { localityName } from "@/lib/civic/model"
import { allowedCallIssues } from "./scope"
import {
  intakeToolSchema,
  saveVoiceDraft,
  inferenceToolSchema,
  updateComplaintInference,
} from "./intake"
import { recordActivity, finishActivity } from "./activity"

const callId = z
  .string()
  .min(1)
  .describe(
    "Use pramanik_call_id from the current call context. Never ask the caller for it."
  )
export const voiceTools = {
  update_complaint_inference: {
    description:
      "During intake, update the complaint facts understood so far after each meaningful user answer. Unknown fields must be empty strings. This is visible feedback, not a complaint submission. Do not send private reasoning.",
    schema: inferenceToolSchema,
  },
  save_complaint_draft: {
    description:
      "INTAKE MODE ONLY: save the resident's spoken complaint as an editable draft after reading it back. Use exact category/type values from case_context. The resident must still choose the map pin and confirm on screen. Never invent coordinates or submit a report automatically.",
    schema: intakeToolSchema,
  },
  select_issue_context: {
    description:
      "FOLLOW-UP MODE: select a registered issue within this call's authorized run before saving its updates or commitments. Read the issue title aloud when switching. Cannot expand the authorized scope.",
    schema: z.object({ pramanik_call_id: callId, issue_id: z.string().min(1) }),
  },
  search_complaints: {
    description:
      "Find registered collective issues by words, locality, or status. Returns real database results and complaint counts. Use empty strings for unused filters.",
    schema: z.object({
      pramanik_call_id: callId,
      query: z.string().max(200),
      locality: z.string().max(100),
      status: z.string().max(40),
    }),
  },
  get_complaint_details: {
    description:
      "Read a case, individual resident complaints, commitments, previous conversations, and evidence captions. Use the exact issue ID from search or the call context.",
    schema: z.object({ pramanik_call_id: callId, issue_id: z.string().min(1) }),
  },
  get_issue_timeline: {
    description:
      "Read dated progress and promises for an issue before answering questions about what happened.",
    schema: z.object({ pramanik_call_id: callId, issue_id: z.string().min(1) }),
  },
  find_responsible_offices: {
    description:
      "Look up candidate offices from the supplied jurisdiction and routing directory. Candidates are not confirmed assignments.",
    schema: z.object({ pramanik_call_id: callId, issue_id: z.string().min(1) }),
  },
  search_office_directory: {
    description:
      "Search supplied government office records. Read back only published facts and sources. Use an empty query to browse.",
    schema: z.object({ pramanik_call_id: callId, query: z.string().max(200) }),
  },
  record_progress_update: {
    description:
      "Only when the caller explicitly asks to save an update or supplies a progress report: record the statement as unverified, never as an independently verified repair. Repeat updates are deduplicated within this call.",
    schema: z.object({
      pramanik_call_id: callId,
      issue_id: z.string().min(1),
      statement: z.string().min(3).max(2000),
      progress: z.enum([
        "unknown",
        "not_started",
        "in_progress",
        "completion_claimed",
      ]),
    }),
  },
  record_commitment: {
    description:
      "Record a specific action the caller actually commits to. Use their exact words. due_at must be an ISO timestamp with timezone or an empty string if no clear date was promised. Never invent a deadline.",
    schema: z.object({
      pramanik_call_id: callId,
      issue_id: z.string().min(1),
      action: z.string().min(3).max(1000),
      quote: z.string().min(3).max(2000),
      due_at: z.string().max(50),
    }),
  },
  get_follow_up_schedule: {
    description:
      "Read pending follow-ups and overdue commitments for the current issue. Distinguish phone calls from review reminders.",
    schema: z.object({ pramanik_call_id: callId, issue_id: z.string().min(1) }),
  },
  stop_follow_ups: {
    description:
      "Immediately honor a caller asking not to receive further calls. Revoke this contact's calling permission and cancel its pending phone follow-ups. Do not ask for personal information.",
    schema: z.object({
      pramanik_call_id: callId,
      reason: z.string().min(1).max(500),
    }),
  },
} satisfies Record<string, { description: string; schema: z.ZodObject }>
export type VoiceToolName = keyof typeof voiceTools
export function executeVoiceTool(name: string, raw: unknown) {
  if (!Object.hasOwn(voiceTools, name))
    throw new CivicError("Unknown voice tool", 404)
  const definition = voiceTools[name as VoiceToolName]
  const input: Record<string, string> = definition.schema.parse(raw)
  const { db } = store()
  if (name === "save_complaint_draft") return saveVoiceDraft(input)
  if (name === "update_complaint_inference")
    return updateComplaintInference(input)
  const call = db
    .select()
    .from(s.calls)
    .where(eq(s.calls.id, input.pramanik_call_id))
    .get()
  if (!call) throw new CivicError("Unknown call context", 404)
  const operationId = createHash("sha256")
    .update(`${call.id}:${name}:${JSON.stringify(input)}`)
    .digest("hex")
  const mutation = [
    "record_progress_update",
    "record_commitment",
    "stop_follow_ups",
    "select_issue_context",
  ].includes(name)
  const context =
    db.select().from(s.agentRuns).where(eq(s.agentRuns.id, call.runId)).get()
      ?.context ?? {}
  if (
    context.interactionMode === "citizen" &&
    [
      "record_progress_update",
      "record_commitment",
      "select_issue_context",
      "stop_follow_ups",
    ].includes(name)
  )
    throw new CivicError(
      "A citizen information conversation cannot create stakeholder commitments or change follow-up permission",
      409
    )
  if (
    mutation &&
    "issue_id" in input &&
    (!allowedCallIssues(call).includes(input.issue_id) ||
      (name !== "select_issue_context" &&
        input.issue_id !== (context.activeIssueId ?? call.issueId)))
  )
    throw new CivicError(
      "Select a case within this call's authorized scope before saving its updates",
      409
    )
  const activityId = recordActivity({
    callId: call.id,
    issueId: allowedCallIssues(call).includes(input.issue_id)
      ? input.issue_id
      : call.issueId,
    followUpRunId: call.followUpRunId,
    action: name,
    state: "running",
    summary: `Agent is using ${name.replaceAll("_", " ")}`,
  })
  try {
    const result = db.transaction(
      (tx) => {
        if (
          mutation &&
          name !== "select_issue_context" &&
          tx
            .select()
            .from(s.toolExecutions)
            .where(eq(s.toolExecutions.id, operationId))
            .get()
        )
          return {
            saved: true,
            duplicate: true,
            message: "This statement was already recorded during this call.",
          }
        const currentContext =
          tx
            .select()
            .from(s.agentRuns)
            .where(eq(s.agentRuns.id, call.runId))
            .get()?.context ?? {}
        if (
          mutation &&
          "issue_id" in input &&
          name !== "select_issue_context" &&
          input.issue_id !== (currentContext.activeIssueId ?? call.issueId)
        )
          throw new CivicError(
            "Active case changed; select the intended case before saving",
            409
          )
        let result: unknown
        if (name === "select_issue_context") {
          const latest = tx
            .select()
            .from(s.agentRuns)
            .where(eq(s.agentRuns.id, call.runId))
            .get()!
          tx.update(s.agentRuns)
            .set({
              context: { ...latest.context, activeIssueId: input.issue_id },
            })
            .where(eq(s.agentRuns.id, call.runId))
            .run()
          tx.insert(s.callIssues)
            .values({
              id: randomUUID(),
              callId: call.id,
              issueId: input.issue_id,
            })
            .onConflictDoNothing()
            .run()
          result = {
            selected: input.issue_id,
            title: tx
              .select()
              .from(s.issues)
              .where(eq(s.issues.id, input.issue_id))
              .get()?.title,
          }
        } else if (name === "stop_follow_ups") {
          tx.update(s.contacts)
            .set({ authorized: false, revokedAt: new Date().toISOString() })
            .where(eq(s.contacts.id, call.contactId))
            .run()
          tx.update(s.followUpRuns)
            .set({ state: "paused", updatedAt: new Date().toISOString() })
            .where(
              and(
                eq(s.followUpRuns.contactId, call.contactId),
                inArray(s.followUpRuns.state, ["preparing", "active"])
              )
            )
            .run()
          tx.update(s.followUpJobs)
            .set({ state: "cancelled", error: "Caller opted out" })
            .where(
              and(
                eq(s.followUpJobs.contactId, call.contactId),
                inArray(s.followUpJobs.kind, [
                  "prepare_run",
                  "outbound_call",
                  "deadline_review",
                  "manual_review",
                ]),
                inArray(s.followUpJobs.state, [
                  "queued",
                  "retry_pending",
                  "paused",
                ])
              )
            )
            .run()
          result = {
            saved: true,
            message:
              "Calling permission revoked for this contact. Pending follow-up calls cancelled.",
          }
        } else if (
          name === "search_complaints" &&
          "query" in input &&
          "locality" in input &&
          "status" in input
        ) {
          const matches = snapshot().issues.filter(
            (issue) =>
              `${issue.title} ${issue.description} ${issue.landmark}`
                .toLowerCase()
                .includes(input.query.toLowerCase()) &&
              (!input.locality ||
                `${issue.localityId} ${localityName(issue.localityId)}`
                  .toLowerCase()
                  .includes(input.locality.toLowerCase())) &&
              (!input.status || issue.status === input.status)
          )
          result = {
            count: matches.length,
            issues: matches
              .slice(0, 15)
              .map(
                ({
                  id,
                  title,
                  localityId,
                  status,
                  complaintCount,
                  isDemo,
                }) => ({
                  id,
                  title,
                  locality: localityName(localityId),
                  status,
                  complaintCount,
                  isDemo,
                })
              ),
          }
        } else if (name === "search_office_directory" && "query" in input) {
          const query = input.query.toLowerCase()
          result = {
            offices: snapshot()
              .offices.filter((office) =>
                `${office.name} ${office.governmentBody} ${office.designation} ${office.jurisdiction}`
                  .toLowerCase()
                  .includes(query)
              )
              .slice(0, 12),
            limitation:
              "Published directory only; responsibility requires review.",
          }
        } else if ("issue_id" in input) {
          const issue = tx
            .select()
            .from(s.issues)
            .where(eq(s.issues.id, input.issue_id))
            .get()
          if (!issue) throw new CivicError("Issue not found", 404)
          if (
            issue.status === "verified" &&
            ["record_progress_update", "record_commitment"].includes(name)
          )
            throw new CivicError(
              "This case is verified. A new problem needs a reopened case before saving new follow-up claims.",
              409
            )
          if (name === "get_complaint_details") {
            const full = snapshot().issues.find((item) => item.id === issue.id)!
            result = {
              ...full,
              locality: localityName(issue.localityId),
              evidence: full.evidence.map(({ id, caption, createdAt }) => ({
                id,
                caption,
                createdAt,
              })),
              complaints: tx
                .select({
                  description: s.complaints.description,
                  createdAt: s.complaints.createdAt,
                })
                .from(s.complaints)
                .where(eq(s.complaints.issueId, issue.id))
                .limit(20)
                .all(),
              survey: tx
                .select()
                .from(s.surveys)
                .where(eq(s.surveys.issueId, issue.id))
                .orderBy(desc(s.surveys.createdAt))
                .limit(1)
                .all(),
            }
          } else if (name === "get_issue_timeline")
            result = {
              issueId: issue.id,
              title: issue.title,
              events: tx
                .select()
                .from(s.issueEvents)
                .where(eq(s.issueEvents.issueId, issue.id))
                .orderBy(desc(s.issueEvents.createdAt))
                .limit(25)
                .all(),
            }
          else if (name === "get_follow_up_schedule")
            result = {
              issueId: issue.id,
              commitments: tx
                .select()
                .from(s.commitments)
                .where(eq(s.commitments.issueId, issue.id))
                .all(),
              jobs: tx
                .select({
                  kind: s.followUpJobs.kind,
                  dueAt: s.followUpJobs.dueAt,
                  state: s.followUpJobs.state,
                })
                .from(s.followUpJobs)
                .where(
                  and(
                    eq(s.followUpJobs.issueId, issue.id),
                    inArray(s.followUpJobs.kind, [
                      "outbound_call",
                      "deadline_review",
                      "manual_review",
                    ])
                  )
                )
                .orderBy(desc(s.followUpJobs.createdAt))
                .limit(15)
                .all(),
            }
          else if (name === "find_responsible_offices")
            result = candidates(issue.id)
          else if (
            name === "record_progress_update" &&
            "statement" in input &&
            "progress" in input
          ) {
            tx.insert(s.issueEvents)
              .values({
                id: randomUUID(),
                issueId: issue.id,
                kind: "voice_update",
                title:
                  input.progress === "completion_claimed"
                    ? "Completion claimed in demo conversation"
                    : "Voice conversation update",
                description: input.statement,
                source: "Demo call participant · unverified statement",
              })
              .run()
            if (input.progress === "in_progress" && issue.status === "assigned")
              tx.update(s.issues)
                .set({ status: "following_up" })
                .where(eq(s.issues.id, issue.id))
                .run()
            if (
              input.progress === "completion_claimed" &&
              issue.status !== "verified"
            ) {
              tx.update(s.issues)
                .set({ status: "awaiting_verification" })
                .where(eq(s.issues.id, issue.id))
                .run()
              if (
                !tx
                  .select()
                  .from(s.surveys)
                  .where(
                    and(
                      eq(s.surveys.issueId, issue.id),
                      eq(s.surveys.state, "open")
                    )
                  )
                  .get()
              )
                tx.insert(s.surveys)
                  .values({
                    id: randomUUID(),
                    issueId: issue.id,
                    sourceCallId: call.id,
                  })
                  .run()
            }
            tx.update(s.issues)
              .set({ updatedAt: new Date().toISOString() })
              .where(eq(s.issues.id, issue.id))
              .run()
            result = {
              saved: true,
              issueId: issue.id,
              verified: false,
              message:
                "Recorded as the caller's statement. No repair has been independently verified.",
            }
          } else if (
            name === "record_commitment" &&
            "action" in input &&
            "due_at" in input &&
            "quote" in input
          ) {
            const dueAt = input.due_at
              ? new Date(
                  z.string().datetime({ offset: true }).parse(input.due_at)
                ).toISOString()
              : null
            const commitmentId = randomUUID()
            tx.insert(s.commitments)
              .values({
                id: commitmentId,
                issueId: issue.id,
                sourceCallId: call.id,
                action: input.action,
                dueAt,
              })
              .run()
            tx.insert(s.issueEvents)
              .values({
                id: randomUUID(),
                issueId: issue.id,
                kind: "commitment",
                title: "Commitment recorded from conversation",
                description: `${input.action}${dueAt ? ` · due ${dueAt}` : " · no deadline specified"}. Caller quote: ${input.quote}`,
                source: "Demo call participant",
              })
              .run()
            const contact = tx
              .select()
              .from(s.contacts)
              .where(eq(s.contacts.id, call.contactId))
              .get()!
            const run = call.followUpRunId
              ? tx
                  .select()
                  .from(s.followUpRuns)
                  .where(eq(s.followUpRuns.id, call.followUpRunId))
                  .get()
              : null
            const phoneFollowUp =
              run?.state === "active" &&
              contact.isDemo &&
              contact.authorized &&
              !contact.revokedAt &&
              !!contact.phone &&
              contact.phone === process.env.BOLNA_DEMO_PHONE?.trim() &&
              process.env.BOLNA_DEMO_CALL_AUTHORIZED === "true"
            if (dueAt && !contact.revokedAt)
              tx.insert(s.followUpJobs)
                .values({
                  id: randomUUID(),
                  issueId: issue.id,
                  contactId: call.contactId,
                  callId: call.id,
                  followUpRunId: call.followUpRunId,
                  kind: "deadline_review",
                  dueAt,
                  state: run?.state === "paused" ? "paused" : "queued",
                  dedupeKey: `commitment:${commitmentId}`,
                })
                .onConflictDoNothing()
                .run()
            result = {
              saved: true,
              dueAt,
              followUpTaskQueued: !!dueAt && !contact.revokedAt,
              phoneFollowUp: !!dueAt && phoneFollowUp,
              message: contact.revokedAt
                ? "Commitment saved. Follow-up calls remain disabled because this contact opted out."
                : run?.state === "paused"
                  ? "Commitment saved. Its follow-up stays paused until the user resumes the run."
                  : phoneFollowUp
                    ? "Commitment saved. At the deadline, an open case will trigger a follow-up to this consenting demo phone."
                    : "Commitment saved. The deadline will create a review reminder; browser conversations cannot receive phone calls.",
            }
          }
        }
        if (result === undefined)
          throw new CivicError("Invalid voice tool request")
        tx.insert(s.toolExecutions)
          .values({
            id:
              mutation && name !== "select_issue_context"
                ? operationId
                : randomUUID(),
            runId: call.runId,
            tool: name,
            state: "completed",
            detail: JSON.stringify({ input, result }).slice(0, 24000),
          })
          .run()
        return result
      },
      { behavior: "immediate" }
    )
    finishActivity(
      activityId,
      "completed",
      `Completed ${name.replaceAll("_", " ")}`
    )
    return result
  } catch (error) {
    finishActivity(
      activityId,
      "failed",
      `${name.replaceAll("_", " ")} could not be completed`
    )
    db.transaction((tx) =>
      tx
        .insert(s.toolExecutions)
        .values({
          id: randomUUID(),
          runId: call.runId,
          tool: name,
          state: "failed",
          detail: error instanceof Error ? error.message : "Tool failed",
        })
        .run()
    )
    throw error
  }
}
