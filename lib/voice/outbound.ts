import { randomUUID } from "node:crypto"
import { and, eq, gte, inArray } from "drizzle-orm"
import { z } from "zod"
import { CivicError, snapshot, store } from "@/lib/civic/repository"
import { localityName } from "@/lib/civic/model"
import { dossierContent } from "@/lib/civic/dossier"
import * as s from "@/lib/db/schema"
import { bolnaRequest } from "./bolna"
import { canCallDemoContact } from "./contact"
import { languageVariables } from "./language"
export { canCallDemoContact } from "./contact"
import { startFollowUpRun } from "./runs"
import { assertRunActive, runIssueIds } from "./scope"
import { ACTIVE_CALL_STATES, enqueueCallSync, type VoiceJob } from "./queue"

export const phoneCallSchema = z.object({
  issueId: z.string().min(1).max(100),
  requestId: z.string().uuid(),
  dueAt: z.string().datetime({ offset: true }).optional(),
})

export function schedulePhoneCall(raw: unknown) {
  const input = phoneCallSchema.parse(raw)
  const result = startFollowUpRun(input)
  const job = store()
    .db.select()
    .from(s.followUpJobs)
    .where(eq(s.followUpJobs.followUpRunId, result.runId))
    .get()
  return { ...result, jobId: job?.id }
}

export async function dispatchPhoneCall(job: VoiceJob) {
  const { db } = store()
  const followUpRun = assertRunActive(job.followUpRunId)
  const allowedIds = runIssueIds(followUpRun.id)
  const scopedIssues = snapshot().issues.filter((item) =>
    allowedIds.includes(item.id)
  )
  const issue =
    scopedIssues.find(
      (item) =>
        item.id === job.issueId &&
        !["verified", "awaiting_verification"].includes(item.status)
    ) ??
    scopedIssues.find(
      (item) => !["verified", "awaiting_verification"].includes(item.status)
    )
  if (
    !issue ||
    issue.status === "verified" ||
    issue.status === "awaiting_verification"
  )
    throw new CivicError(
      "Case needs resident review or is already closed; phone follow-up skipped",
      409
    )
  const contact = db
    .select()
    .from(s.contacts)
    .where(eq(s.contacts.id, job.contactId))
    .get()
  if (!contact || !canCallDemoContact(contact))
    throw new CivicError(
      "Only the configured consenting demo phone can be called",
      409
    )
  const dossier = dossierContent(issue.id)
  const context = {
    interactionMode: "follow_up",
    issueId: issue.id,
    title: issue.title,
    locality: localityName(issue.localityId),
    status: issue.status,
    isDemo: issue.isDemo,
    complaintCount: issue.complaintCount,
    commitments: dossier.commitments,
    previousCalls: dossier.calls
      .slice(-5)
      .reverse()
      .map(({ id, status, summary, createdAt, progress, nextAction }) => ({
        id,
        status,
        summary,
        createdAt,
        progress,
        nextAction,
      })),
    timeline: dossier.timeline.slice(-15).reverse(),
    caseRecord: {
      issue: dossier.issue,
      responsibility: dossier.responsibility,
      complaints: dossier.complaints.slice(-20),
      evidence: dossier.evidence
        .slice(-8)
        .map(({ id, caption, createdAt, phase, location, assessment }) => ({
          id,
          caption,
          createdAt,
          phase,
          location,
          assessment,
        })),
      verification: dossier.verification,
      gaps: dossier.gaps,
    },
    recipient: {
      role: contact.designation,
      isDemo: contact.isDemo,
      recordingConsent: contact.recordingConsent,
      publicationConsent: contact.publicationConsent,
    },
    activeIssueId: issue.id,
    followUpRunId: followUpRun.id,
    brief: followUpRun.brief,
    relatedCases: scopedIssues.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      description: item.description,
      commitments: item.commitments,
      complaintCount: item.complaintCount,
    })),
  }
  const call = db.transaction(
    (tx) => {
      assertRunActive(job.followUpRunId)
      const currentJob = tx
        .select()
        .from(s.followUpJobs)
        .where(eq(s.followUpJobs.id, job.id))
        .get()
      if (
        !currentJob ||
        currentJob.state !== "running" ||
        currentJob.leaseUntil !== job.leaseUntil
      )
        throw new CivicError("Call job lease expired", 409)
      if (currentJob.callId) {
        const existing = tx
          .select()
          .from(s.calls)
          .where(eq(s.calls.id, currentJob.callId))
          .get()
        if (existing?.executionId) return existing
        // The process may have crashed after Bolna accepted the call. Never blindly redial.
        throw new CivicError(
          "Call dispatch is uncertain. Reconcile its execution in Bolna before another attempt.",
          409
        )
      }
      const active = tx
        .select()
        .from(s.calls)
        .where(
          and(
            inArray(s.calls.status, [
              ...ACTIVE_CALL_STATES,
              "dispatch_unknown",
            ]),
            gte(
              s.calls.createdAt,
              new Date(Date.now() - 12 * 60_000).toISOString()
            )
          )
        )
        .get()
      if (active)
        throw new CivicError(
          "Another conversation is active; retry this job after it finishes",
          429
        )
      const today = new Date(Date.now() - 24 * 60 * 60_000).toISOString()
      const recentCalls = tx
        .select()
        .from(s.calls)
        .where(
          and(eq(s.calls.contactId, contact.id), gte(s.calls.createdAt, today))
        )
        .all()
      if (recentCalls.length >= 5)
        throw new CivicError(
          "Demo phone limit reached: five call attempts per 24 hours",
          409
        )
      if (
        recentCalls.some(
          (call) => Date.now() - new Date(call.createdAt).getTime() < 2 * 60_000
        )
      )
        throw new CivicError(
          "Allow two minutes between demo phone attempts",
          429
        )
      const now = new Date().toISOString()
      const id = randomUUID()
      const runId = randomUUID()
      tx.insert(s.agentRuns)
        .values({
          id: runId,
          issueId: issue.id,
          state: "starting",
          promptVersion: "stakeholder-agent/v1.1.0",
          context,
        })
        .run()
      tx.insert(s.calls)
        .values({
          id,
          issueId: issue.id,
          runId,
          contactId: contact.id,
          followUpRunId: followUpRun.id,
          status: "initiating",
          idempotencyKey: job.dedupeKey,
          updatedAt: now,
        })
        .run()
      tx.insert(s.callIssues)
        .values({ id: randomUUID(), callId: id, issueId: issue.id })
        .run()
      tx.update(s.followUpJobs)
        .set({ callId: id, issueId: issue.id })
        .where(eq(s.followUpJobs.id, job.id))
        .run()
      return tx.select().from(s.calls).where(eq(s.calls.id, id)).get()!
    },
    { behavior: "immediate" }
  )
  if (call.executionId) return call
  try {
    const response = await bolnaRequest("/call", {
      method: "POST",
      body: JSON.stringify({
        agent_id: process.env.BOLNA_AGENT_ID,
        recipient_phone_number: contact.phone,
        ...(process.env.BOLNA_FROM_PHONE
          ? { from_phone_number: process.env.BOLNA_FROM_PHONE }
          : {}),
        user_data: {
          pramanik_call_id: call.id,
          issue_id: issue.id,
          issue_title: issue.title,
          locality_name: localityName(issue.localityId),
          case_context: JSON.stringify(context),
          interaction_mode: "follow_up",
          ...languageVariables(followUpRun.language || contact.language),
          current_time: new Date().toISOString(),
        },
      }),
    })
    const executionId = z.string().uuid().parse(response.execution_id)
    db.transaction((tx) => {
      tx.update(s.calls)
        .set({
          executionId,
          status: "queued",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(s.calls.id, call.id))
        .run()
      tx.update(s.agentRuns)
        .set({ state: "queued" })
        .where(eq(s.agentRuns.id, call.runId))
        .run()
      tx.insert(s.issueEvents)
        .values({
          id: randomUUID(),
          issueId: issue.id,
          kind: "call",
          title: "Demo follow-up call queued",
          description:
            "Bolna accepted a call to the consenting demo participant.",
          source: "Pramanik follow-up worker",
        })
        .run()
      if (["assigned", "disputed"].includes(issue.status))
        tx.update(s.issues)
          .set({ status: "following_up", updatedAt: new Date().toISOString() })
          .where(eq(s.issues.id, issue.id))
          .run()
    })
    enqueueCallSync(call.id, 60_000)
    return { ...call, executionId, status: "queued" }
  } catch {
    db.transaction((tx) => {
      tx.update(s.calls)
        .set({
          status: "dispatch_unknown",
          error:
            "Provider acceptance unknown. Reconcile in Bolna; do not automatically redial.",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(s.calls.id, call.id))
        .run()
      tx.update(s.agentRuns)
        .set({
          state: "needs_review",
          error: "Outbound dispatch requires reconciliation",
        })
        .where(eq(s.agentRuns.id, call.runId))
        .run()
    })
    throw new CivicError(
      "Provider acceptance unknown. This call will not be retried automatically.",
      409
    )
  }
}
