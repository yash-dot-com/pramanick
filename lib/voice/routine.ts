import { createHash, randomUUID } from "node:crypto"
import { and, asc, eq, inArray, lte } from "drizzle-orm"
import distance from "@turf/distance"
import { point } from "@turf/helpers"
import { z } from "zod"
import * as s from "@/lib/db/schema"
import {
  assignOffice,
  candidates,
  CivicError,
  snapshot,
  store,
} from "@/lib/civic/repository"
import { LOCALITIES } from "@/lib/civic/model"
import { persistDossier } from "@/lib/civic/dossier"
import { demoContact, phoneConfigured } from "./contact"
import { startFollowUpRun, manageFollowUpRun } from "./runs"
import { recordActivity, finishActivity } from "./activity"

export function manageRoutine(raw: unknown) {
  const input = z
    .object({
      localityId: z
        .string()
        .refine((id) => LOCALITIES.some((item) => item.id === id)),
      action: z.enum(["start", "start_demo", "pause", "scan_now"]),
      language: z.enum(["mr", "hi", "en"]).default("mr"),
      publishDemoConversation: z.boolean().optional(),
    })
    .parse(raw)
  const { db } = store()
  const now = new Date().toISOString()
  if (input.action === "start_demo") {
    const contact = demoContact(false)
    db.update(s.contacts)
      .set({
        language: input.language,
        ...(input.publishDemoConversation
          ? { recordingConsent: true, publicationConsent: true }
          : {}),
      })
      .where(eq(s.contacts.id, contact.id))
      .run()
  }
  return db.transaction(
    (tx) => {
      const prior = tx
        .select()
        .from(s.agentRoutines)
        .where(eq(s.agentRoutines.localityId, input.localityId))
        .get()
      if (input.action === "scan_now" && prior?.state !== "active")
        throw new CivicError("Start the routine before requesting a scan", 409)
      const id = prior?.id ?? randomUUID()
      if (!prior)
        tx.insert(s.agentRoutines)
          .values({
            id,
            localityId: input.localityId,
            state: input.action === "pause" ? "paused" : "active",
            nextScanAt: now,
            updatedAt: now,
            language: input.language,
          })
          .run()
      else
        tx.update(s.agentRoutines)
          .set({
            state: input.action === "pause" ? "paused" : "active",
            nextScanAt: now,
            updatedAt: now,
            ...(input.action === "start_demo" || input.action === "start"
              ? { language: input.language }
              : {}),
          })
          .where(eq(s.agentRoutines.id, id))
          .run()
      if (input.action === "pause") {
        const runs = tx
          .select()
          .from(s.followUpRuns)
          .where(
            and(
              eq(s.followUpRuns.localityId, input.localityId),
              inArray(s.followUpRuns.state, ["preparing", "active"])
            )
          )
          .all()
        for (const run of runs) {
          tx.update(s.followUpRuns)
            .set({ state: "paused", updatedAt: now })
            .where(eq(s.followUpRuns.id, run.id))
            .run()
          tx.update(s.followUpJobs)
            .set({ state: "paused", error: "Locality routine paused" })
            .where(
              and(
                eq(s.followUpJobs.followUpRunId, run.id),
                inArray(s.followUpJobs.kind, [
                  "prepare_run",
                  "outbound_call",
                  "deadline_review",
                ]),
                inArray(s.followUpJobs.state, ["queued", "retry_pending"])
              )
            )
            .run()
        }
      }
      if (
        (input.action === "start_demo" || input.action === "start") &&
        phoneConfigured()
      ) {
        const pausedRuns = tx
          .select()
          .from(s.followUpRuns)
          .where(
            and(
              eq(s.followUpRuns.localityId, input.localityId),
              eq(s.followUpRuns.state, "paused")
            )
          )
          .all()
        for (const run of pausedRuns) {
          tx.update(s.followUpRuns)
            .set({ language: input.language })
            .where(eq(s.followUpRuns.id, run.id))
            .run()
          // Resume uses the existing scope and refuses uncertain dispatches.
          try {
            manageFollowUpRun({ runId: run.id, action: "resume" })
          } catch (error) {
            recordActivity({
              followUpRunId: run.id,
              action: "resume_needs_review",
              state: "needs_review",
              summary:
                error instanceof CivicError
                  ? error.message
                  : "This paused run needs review before it can continue",
            })
          }
        }
      }
      recordActivity({
        action:
          input.action === "pause" ? "routine_paused" : "routine_activated",
        summary:
          input.action === "pause"
            ? "Routine and pending locality calls paused. In-progress conversations may finish saving."
            : "Locality monitoring activated: scan complaints, group nearby candidates, refresh dossiers, plan and follow up with the configured demo recipient.",
        detail: { localityId: input.localityId },
      })
      return { id, state: input.action === "pause" ? "paused" : "active" }
    },
    { behavior: "immediate" }
  )
}

export function scanOneRoutine() {
  const { db } = store()
  const now = new Date().toISOString()
  const routine = db.transaction(
    (tx) => {
      const row = tx
        .select()
        .from(s.agentRoutines)
        .where(
          and(
            eq(s.agentRoutines.state, "active"),
            lte(s.agentRoutines.nextScanAt, now)
          )
        )
        .orderBy(asc(s.agentRoutines.nextScanAt))
        .get()
      if (!row) return null
      tx.update(s.agentRoutines)
        .set({
          lastScanAt: now,
          nextScanAt: new Date(
            Date.now() + row.intervalMinutes * 60_000
          ).toISOString(),
          updatedAt: now,
        })
        .where(eq(s.agentRoutines.id, row.id))
        .run()
      return row
    },
    { behavior: "immediate" }
  )
  if (!routine) return false
  const activity = recordActivity({
    action: "scan_complaints",
    state: "running",
    summary: "Reading registered complaints and current case states",
    detail: { localityId: routine.localityId },
  })
  try {
    const issues = snapshot().issues.filter(
      (issue) => issue.localityId === routine.localityId
    )
    const contact = demoContact(false)
    const activeRuns = db
      .select()
      .from(s.followUpRuns)
      .where(
        inArray(s.followUpRuns.state, [
          "preparing",
          "active",
          "paused",
          "needs_review",
          "awaiting_configuration",
        ])
      )
      .all()
    const links = db.select().from(s.followUpRunIssues).all()
    const ready: string[] = []
    for (const issue of issues) {
      const related = issues
        .filter(
          (other) =>
            other.id !== issue.id &&
            other.isDemo === issue.isDemo &&
            other.category === issue.category &&
            other.issueType === issue.issueType &&
            other.status !== "verified" &&
            distance(
              point([issue.lng, issue.lat]),
              point([other.lng, other.lat]),
              { units: "meters" }
            ) <= 100
        )
        .map((item) => item.id)
      const routing = candidates(issue.id)
      const existingRun = activeRuns.find((run) =>
        links.some(
          (link) => link.followUpRunId === run.id && link.issueId === issue.id
        )
      )
      if (
        existingRun?.state === "awaiting_configuration" &&
        phoneConfigured() &&
        !contact.revokedAt
      ) {
        manageFollowUpRun({ runId: existingRun.id, action: "resume" })
        existingRun.state = "active"
      }
      const state =
        issue.status === "verified"
          ? "closed"
          : issue.status === "awaiting_verification"
            ? "verification"
            : existingRun
              ? ["needs_review", "awaiting_configuration", "paused"].includes(
                  existingRun.state
                )
                ? existingRun.state
                : "in_run"
              : !issue.isDemo
                ? "responsibility_review"
                : !phoneConfigured() || contact.revokedAt
                  ? "awaiting_configuration"
                  : "planned"
      const nextAction =
        state === "closed"
          ? "Resident-reviewed repair recorded; retain the evidence history."
          : state === "verification"
            ? "Await a resident observation and review; no completion assumption."
            : state === "in_run"
              ? "Continue the existing scoped run and its saved deadlines."
              : state === "paused"
                ? "This run was paused by the operator. Resume it explicitly to continue calls."
                : state === "needs_review"
                  ? "Review the existing run or uncertain call before another attempt."
                  : state === "responsibility_review"
                    ? "Confirm responsibility and a calling authorization before contacting real stakeholders."
                    : state === "awaiting_configuration"
                      ? "Configure the consenting demo phone and authorization; no call is possible yet."
                      : "Prepare the shared conversation brief and call the consenting demo responsibility holder."
      const fingerprint = createHash("sha256")
        .update(
          JSON.stringify({
            complaints: db
              .select()
              .from(s.complaints)
              .where(eq(s.complaints.issueId, issue.id))
              .all(),
            evidence: issue.evidence.map((item) => item.id),
            status: issue.status,
            officeId: issue.officeId,
            promises: issue.commitments,
            calls: issue.calls,
            related,
            state,
          })
        )
        .digest("hex")
      const prior = db
        .select()
        .from(s.caseworkPlans)
        .where(eq(s.caseworkPlans.issueId, issue.id))
        .get()
      if (prior?.inputFingerprint !== fingerprint) {
        db.transaction((tx) => {
          const plan = {
            issueId: issue.id,
            inputFingerprint: fingerprint,
            state,
            relatedIssueIds: related,
            contactCandidates: routing.offices,
            nextAction,
            followUpRunId: existingRun?.id ?? null,
            updatedAt: now,
          }
          tx.insert(s.caseworkPlans)
            .values({ id: prior?.id ?? randomUUID(), ...plan })
            .onConflictDoUpdate({ target: s.caseworkPlans.issueId, set: plan })
            .run()
          recordActivity({
            issueId: issue.id,
            action: "aggregate_complaints",
            summary: `Gathered ${issue.complaintCount} resident complaints and ${issue.evidence.length} photographs for the shared case`,
            detail: {
              complaintCount: issue.complaintCount,
              evidenceCount: issue.evidence.length,
            },
          })
          recordActivity({
            issueId: issue.id,
            action: "deduplicate_complaints",
            summary: related.length
              ? `Found ${related.length} nearby matching case candidates. Histories retained for responsibility/duplicate review.`
              : "Reports are aggregated under this issue; no additional nearby matching case found.",
            detail: { relatedIssueIds: related, radiusMeters: 100 },
          })
          recordActivity({
            issueId: issue.id,
            action: "search_contacts",
            summary: `Found ${routing.offices.length} directory candidates. Candidate relevance is not confirmed responsibility.`,
            detail: {
              candidates: routing.offices.map(({ id, name }) => ({ id, name })),
            },
          })
          recordActivity({
            issueId: issue.id,
            action: "plan_next_action",
            state: state === "planned" ? "completed" : "waiting",
            summary: nextAction,
          })
          tx.insert(s.issueEvents)
            .values({
              id: randomUUID(),
              issueId: issue.id,
              kind: "casework_plan",
              title: "Casework plan updated",
              description: nextAction,
              source: "Pramanik locality routine · registered records",
            })
            .run()
        })
        persistDossier(issue.id)
      }
      if (
        !existingRun &&
        issue.isDemo &&
        ["planned", "awaiting_configuration"].includes(state)
      )
        ready.push(issue.id)
    }
    // Recheck the persisted switch immediately before starting external-action work.
    if (
      ready.length &&
      db
        .select()
        .from(s.agentRoutines)
        .where(eq(s.agentRoutines.id, routine.id))
        .get()?.state === "active"
    ) {
      for (const id of ready) {
        const issue = issues.find((item) => item.id === id)!
        if (!issue.officeId)
          assignOffice(
            id,
            contact.officeId,
            "Fictional case assigned to the configured demonstration role; no government responsibility asserted."
          )
      }
      const run = startFollowUpRun(
        {
          localityId: routine.localityId,
          requestId: randomUUID(),
          language: routine.language,
        },
        ready
      )
      for (const id of ready)
        db.update(s.caseworkPlans)
          .set({ state: "in_run", followUpRunId: run.runId, updatedAt: now })
          .where(eq(s.caseworkPlans.issueId, id))
          .run()
      recordActivity({
        followUpRunId: run.runId,
        action: "queue_follow_up",
        summary: `Queued one scoped brief for ${ready.length} cases with the configured demo recipient`,
        detail: { issueIds: ready },
      })
    }
    finishActivity(
      activity,
      "completed",
      `Scanned ${issues.length} cases; refreshed casework plans and evidence dossiers`,
      {
        localityId: routine.localityId,
        issueCount: issues.length,
        queuedCases: ready.length,
      }
    )
  } catch (error) {
    finishActivity(
      activity,
      "needs_review",
      error instanceof CivicError
        ? error.message
        : "Routine could not complete; saved records are preserved for the next scan"
    )
  }
  return true
}
