import { randomUUID } from "node:crypto"
import { and, eq, inArray, isNull } from "drizzle-orm"
import { CivicError, store } from "@/lib/civic/repository"
import * as s from "@/lib/db/schema"
import { syncCall } from "./bolna"
import { extractCallOutcome } from "./extraction"
import { canCallDemoContact, dispatchPhoneCall } from "./outbound"
import { prepareFollowUpRun } from "./runs"
import { runIssueIds } from "./scope"
import { persistDossier } from "@/lib/civic/dossier"
import {
  assessEvidence,
  recoverEvidenceAssessments,
} from "@/lib/civic/evidence"
import { prepareEscalation } from "@/lib/civic/escalation"
import { recordActivity, finishActivity } from "./activity"
import { jobLabels } from "./presentation"
import { scanOneRoutine } from "./routine"
import {
  ACTIVE_CALL_STATES,
  claimJob,
  enqueueCallSync,
  enqueueJob,
  finishJob,
  TERMINAL_CALL_STATES,
  type VoiceJob,
} from "./queue"

function deadlineReview(job: VoiceJob) {
  const { db } = store()
  return db.transaction(
    (tx) => {
      const issue = tx
        .select()
        .from(s.issues)
        .where(eq(s.issues.id, job.issueId))
        .get()
      const contact = tx
        .select()
        .from(s.contacts)
        .where(eq(s.contacts.id, job.contactId))
        .get()
      if (
        !issue ||
        issue.status === "verified" ||
        !contact ||
        contact.revokedAt
      )
        return "cancelled" as const
      const commitmentId = job.dedupeKey.startsWith("commitment:")
        ? job.dedupeKey.slice("commitment:".length)
        : null
      const commitment = commitmentId
        ? tx
            .select()
            .from(s.commitments)
            .where(eq(s.commitments.id, commitmentId))
            .get()
        : null
      if (commitment?.status === "fulfilled") return "cancelled" as const
      if (commitment)
        tx.update(s.commitments)
          .set({ status: "overdue" })
          .where(eq(s.commitments.id, commitment.id))
          .run()
      const run = job.followUpRunId
        ? tx
            .select()
            .from(s.followUpRuns)
            .where(eq(s.followUpRuns.id, job.followUpRunId))
            .get()
        : null
      const phoneFollowUp =
        run?.state === "active" &&
        canCallDemoContact(contact) &&
        issue.status !== "awaiting_verification"
      const recorded = tx
        .insert(s.toolExecutions)
        .values({
          id: `deadline:${job.id}`,
          tool: "review_commitment_deadline",
          state: "completed",
          detail: JSON.stringify({ jobId: job.id, phoneFollowUp }),
        })
        .onConflictDoNothing()
        .run()
      if (recorded.changes)
        tx.insert(s.issueEvents)
          .values({
            id: randomUUID(),
            issueId: issue.id,
            kind: "follow_up",
            title: commitment
              ? "Promised deadline reached"
              : "Scheduled status check due",
            description: phoneFollowUp
              ? "A follow-up to the consenting demo phone has been queued."
              : "A review is due. Check the reported work and decide the next follow-up.",
            source: "Pramanik deadline worker",
          })
          .run()
      if (phoneFollowUp) {
        const pending = tx
          .select()
          .from(s.followUpJobs)
          .where(
            and(
              eq(s.followUpJobs.followUpRunId, run!.id),
              eq(s.followUpJobs.kind, "outbound_call"),
              inArray(s.followUpJobs.state, [
                "queued",
                "retry_pending",
                "running",
              ])
            )
          )
          .get()
        // Several deadlines in one run share a single pending conversation brief.
        if (!pending)
          enqueueJob({
            issueId: issue.id,
            contactId: contact.id,
            followUpRunId: run!.id,
            kind: "outbound_call",
            dedupeKey: `deadline-call:${run!.id}:${Math.floor(Date.now() / (15 * 60_000))}`,
          })
      }
      return phoneFollowUp ? ("completed" as const) : ("needs_review" as const)
    },
    { behavior: "immediate" }
  )
}

export function reconcilePendingCalls() {
  const { db } = store()
  recoverEvidenceAssessments()
  for (const run of db
    .select()
    .from(s.followUpRuns)
    .where(
      inArray(s.followUpRuns.state, [
        "active",
        "paused",
        "preparing",
        "awaiting_configuration",
      ])
    )
    .all()) {
    const ids = runIssueIds(run.id)
    const cases = ids.length
      ? db.select().from(s.issues).where(inArray(s.issues.id, ids)).all()
      : []
    if (cases.length && cases.every((issue) => issue.status === "verified"))
      db.transaction((tx) => {
        tx.update(s.followUpRuns)
          .set({ state: "completed", updatedAt: new Date().toISOString() })
          .where(eq(s.followUpRuns.id, run.id))
          .run()
        tx.update(s.followUpJobs)
          .set({ state: "cancelled", error: "All scoped cases verified" })
          .where(
            and(
              eq(s.followUpJobs.followUpRunId, run.id),
              inArray(s.followUpJobs.kind, [
                "prepare_run",
                "outbound_call",
                "deadline_review",
              ]),
              inArray(s.followUpJobs.state, [
                "queued",
                "retry_pending",
                "paused",
              ])
            )
          )
          .run()
      })
  }
  // Recovery catches a missed webhook or a crash between storing an execution and enqueuing it.
  const active = db
    .select()
    .from(s.calls)
    .where(inArray(s.calls.status, ACTIVE_CALL_STATES))
    .all()
  for (const call of active) {
    if (call.executionId) enqueueCallSync(call.id, 30_000)
    else if (Date.now() - new Date(call.createdAt).getTime() > 5 * 60_000) {
      db.update(s.calls)
        .set({
          status: "dispatch_unknown",
          error:
            "Execution ID was not saved. Reconcile in Bolna before retrying.",
          updatedAt: new Date().toISOString(),
        })
        .where(and(eq(s.calls.id, call.id), isNull(s.calls.executionId)))
        .run()
    }
  }
  const finished = db
    .select()
    .from(s.calls)
    .where(and(eq(s.calls.status, "completed"), isNull(s.calls.outcome)))
    .all()
  for (const call of finished)
    enqueueJob({
      issueId: call.issueId,
      contactId: call.contactId,
      callId: call.id,
      kind: "extract_outcome",
      dedupeKey: `extract:${call.id}`,
    })
}

function retryUnansweredDemoCall(call: typeof s.calls.$inferSelect) {
  if (!["busy", "no-answer"].includes(call.status)) return
  const { db } = store()
  const contact = db
    .select()
    .from(s.contacts)
    .where(eq(s.contacts.id, call.contactId))
    .get()
  if (!contact || !canCallDemoContact(contact)) return
  const source = db
    .select()
    .from(s.followUpJobs)
    .where(
      and(
        eq(s.followUpJobs.callId, call.id),
        eq(s.followUpJobs.kind, "outbound_call")
      )
    )
    .get()
  if (!source) return
  const retryNumber =
    Number(source.dedupeKey.match(/:retry:(\d+)$/)?.[1] ?? 0) + 1
  if (retryNumber > 2) return
  const root = source.dedupeKey.replace(/:retry:\d+$/, "")
  if (!call.followUpRunId) return
  const run = db
    .select()
    .from(s.followUpRuns)
    .where(eq(s.followUpRuns.id, call.followUpRunId))
    .get()
  if (!run || run.state === "completed") return
  const id = enqueueJob({
    issueId: call.issueId,
    contactId: call.contactId,
    followUpRunId: run.id,
    kind: "outbound_call",
    dedupeKey: `${root}:retry:${retryNumber}`,
    dueAt: new Date(
      Date.now() + (retryNumber === 1 ? 5 : 15) * 60_000
    ).toISOString(),
  })
  if (run.state === "paused")
    db.update(s.followUpJobs)
      .set({ state: "paused" })
      .where(and(eq(s.followUpJobs.id, id), eq(s.followUpJobs.state, "queued")))
      .run()
}

function scheduleStatusCheck(callId: string) {
  const { db } = store()
  const call = db.select().from(s.calls).where(eq(s.calls.id, callId)).get()
  if (!call?.followUpRunId) return
  const run = db
    .select()
    .from(s.followUpRuns)
    .where(eq(s.followUpRuns.id, call.followUpRunId))
    .get()
  const contact = db
    .select()
    .from(s.contacts)
    .where(eq(s.contacts.id, call.contactId))
    .get()
  if (
    !run ||
    run.state === "completed" ||
    !contact ||
    !canCallDemoContact(contact)
  )
    return
  const linked = db
    .select({ id: s.callIssues.issueId })
    .from(s.callIssues)
    .where(eq(s.callIssues.callId, call.id))
    .all()
    .map((item) => item.id)
  const hours = Math.min(
    168,
    Math.max(1, Number(process.env.FOLLOW_UP_DEFAULT_HOURS) || 24)
  )
  for (const issueId of new Set([call.issueId, ...linked])) {
    const issue = db
      .select()
      .from(s.issues)
      .where(eq(s.issues.id, issueId))
      .get()
    if (!issue || ["verified", "awaiting_verification"].includes(issue.status))
      continue
    const pending = db
      .select()
      .from(s.followUpJobs)
      .where(
        and(
          eq(s.followUpJobs.followUpRunId, run.id),
          inArray(s.followUpJobs.kind, ["outbound_call", "deadline_review"]),
          inArray(s.followUpJobs.state, [
            "queued",
            "retry_pending",
            "running",
            "paused",
          ])
        )
      )
      .get()
    if (pending) continue
    const jobId = enqueueJob({
      issueId,
      contactId: call.contactId,
      followUpRunId: run.id,
      callId: call.id,
      kind: "deadline_review",
      dueAt: new Date(Date.now() + hours * 3_600_000).toISOString(),
      dedupeKey: `status-check:${call.id}:${issueId}`,
    })
    if (run.state === "paused")
      db.update(s.followUpJobs)
        .set({ state: "paused" })
        .where(
          and(eq(s.followUpJobs.id, jobId), eq(s.followUpJobs.state, "queued"))
        )
        .run()
  }
}

export async function workOneJob() {
  scanOneRoutine()
  const job = claimJob()
  if (!job) return false
  const activity = recordActivity({
    issueId: job.issueId,
    callId: job.callId,
    followUpRunId: job.followUpRunId,
    action: job.kind,
    state: "running",
    summary:
      jobLabels[job.kind] ?? `Processing ${job.kind.replaceAll("_", " ")}`,
    detail: { jobId: job.id, attempt: job.attempts },
  })
  try {
    if (
      ["prepare_run", "outbound_call", "deadline_review"].includes(job.kind) &&
      job.followUpRunId
    ) {
      const run = store()
        .db.select()
        .from(s.followUpRuns)
        .where(eq(s.followUpRuns.id, job.followUpRunId))
        .get()
      if (run?.state === "paused" || run?.state === "awaiting_configuration") {
        finishJob(job, "paused", "Run paused by user")
        return true
      }
      if (!run || run.state === "completed") {
        finishJob(job, "cancelled", "Run closed")
        return true
      }
    }
    if (job.kind === "assess_evidence") {
      if (!job.dedupeKey.startsWith("assess:"))
        throw new CivicError("Invalid evidence job", 409)
      await assessEvidence(job.dedupeKey.slice("assess:".length))
      finishJob(job, "completed")
    } else if (job.kind === "prepare_run") {
      if (!job.followUpRunId)
        throw new CivicError("Preparation has no run scope", 409)
      await prepareFollowUpRun(job.followUpRunId)
      finishJob(job, "completed")
    } else if (job.kind === "provider_sync") {
      if (!job.callId) throw new CivicError("Provider sync has no call", 409)
      const call = await syncCall(job.callId)
      if (call.status === "completed") {
        enqueueJob({
          issueId: call.issueId,
          contactId: call.contactId,
          callId: call.id,
          kind: "extract_outcome",
          dedupeKey: `extract:${call.id}`,
        })
        // Bolna can make the completed record visible just before its transcript is populated.
        if (!call.transcript && job.attempts < 30) {
          finishJob(
            job,
            "retry_pending",
            "Waiting for finalized transcript",
            15_000
          )
          return true
        }
      } else if (!TERMINAL_CALL_STATES.has(call.status)) {
        finishJob(
          job,
          job.attempts < 30 ? "retry_pending" : "needs_review",
          job.attempts < 30
            ? null
            : "Call did not finalize within the reconciliation window",
          60_000
        )
        return true
      }
      retryUnansweredDemoCall(call)
      finishJob(job, "completed")
    } else if (job.kind === "extract_outcome") {
      if (!job.callId) throw new CivicError("Extraction has no call", 409)
      await extractCallOutcome(job.callId)
      scheduleStatusCheck(job.callId)
      finishJob(job, "completed")
    } else if (job.kind === "outbound_call") {
      await dispatchPhoneCall(job)
      finishJob(job, "completed")
    } else if (["deadline_review", "manual_review"].includes(job.kind)) {
      finishJob(job, deadlineReview(job), "Deadline reviewed")
    } else finishJob(job, "needs_review", "Unknown job kind")
  } catch (error) {
    // Phone dispatch has its own durable reservation. Only preflight concurrency can retry safely.
    const retryable =
      job.kind !== "outbound_call" ||
      (error instanceof CivicError && error.status === 429)
    const attempts = job.kind === "provider_sync" ? 30 : 6
    const retry = retryable && job.attempts < attempts
    const detail =
      error instanceof CivicError
        ? error.message
        : `${job.kind} failed; inspect provider settings and retry the job`
    finishJob(
      job,
      retry ? "retry_pending" : "needs_review",
      detail,
      Math.min(5 * 60_000, 15_000 * 2 ** Math.min(job.attempts - 1, 5))
    )
    if (!retry && job.kind === "prepare_run" && job.followUpRunId)
      store()
        .db.update(s.followUpRuns)
        .set({ state: "needs_review", updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(s.followUpRuns.id, job.followUpRunId),
            eq(s.followUpRuns.state, "preparing")
          )
        )
        .run()
  } finally {
    const saved = store()
      .db.select()
      .from(s.followUpJobs)
      .where(eq(s.followUpJobs.id, job.id))
      .get()
    if (saved)
      finishActivity(
        activity,
        saved.state === "completed"
          ? "completed"
          : saved.state === "needs_review"
            ? "needs_review"
            : "waiting",
        saved.error || `${job.kind.replaceAll("_", " ")}: ${saved.state}`,
        {
          jobId: job.id,
          callId: saved.callId,
          state: saved.state,
          nextAttemptAt: saved.state === "retry_pending" ? saved.dueAt : null,
        }
      )
  }
  try {
    const linked = job.callId
      ? store()
          .db.select({ id: s.callIssues.issueId })
          .from(s.callIssues)
          .where(eq(s.callIssues.callId, job.callId))
          .all()
          .map((item) => item.id)
      : []
    const ids = job.followUpRunId
      ? runIssueIds(job.followUpRunId)
      : [...new Set([job.issueId, ...linked])]
    for (const id of ids) {
      const issue = store()
        .db.select({ status: s.issues.status })
        .from(s.issues)
        .where(eq(s.issues.id, id))
        .get()
      if (issue && issue.status !== "verified") prepareEscalation(id, true)
      persistDossier(id)
    }
  } catch {
    /* Dossier snapshots can be regenerated from canonical records on the next read. */
  }
  return true
}
