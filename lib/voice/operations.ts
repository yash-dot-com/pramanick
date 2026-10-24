import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { and, desc, eq, inArray } from "drizzle-orm"
import { z } from "zod"
import { CivicError, store } from "@/lib/civic/repository"
import * as s from "@/lib/db/schema"
import { contactProfile } from "./contact"
import { runIssueIds } from "./scope"

export function voiceOperations() {
  const { db } = store()
  let worker: { state: string; updatedAt: string; online: boolean } | null =
    null
  try {
    const saved = z
      .object({ state: z.string(), updatedAt: z.string() })
      .parse(
        JSON.parse(
          readFileSync(
            resolve(process.cwd(), "data/private/voice-worker.json"),
            "utf8"
          )
        )
      )
    worker = {
      ...saved,
      online:
        saved.state === "running" &&
        Date.now() - new Date(saved.updatedAt).getTime() < 3 * 60_000,
    }
  } catch {
    /* The worker has not started yet. */
  }
  return {
    worker,
    phoneDemoConfigured: contactProfile().phoneConfigured,
    contact: contactProfile(),
    followUpRuns: db
      .select()
      .from(s.followUpRuns)
      .orderBy(desc(s.followUpRuns.createdAt))
      .limit(50)
      .all()
      .map((run) => ({ ...run, issueIds: runIssueIds(run.id) })),
    calls: db
      .select({
        id: s.calls.id,
        issueId: s.calls.issueId,
        status: s.calls.status,
        executionId: s.calls.executionId,
        duration: s.calls.duration,
        summary: s.calls.summary,
        outcome: s.calls.outcome,
        error: s.calls.error,
        createdAt: s.calls.createdAt,
      })
      .from(s.calls)
      .orderBy(desc(s.calls.createdAt))
      .limit(50)
      .all(),
    jobs: db
      .select({
        id: s.followUpJobs.id,
        issueId: s.followUpJobs.issueId,
        followUpRunId: s.followUpJobs.followUpRunId,
        kind: s.followUpJobs.kind,
        state: s.followUpJobs.state,
        dueAt: s.followUpJobs.dueAt,
        attempts: s.followUpJobs.attempts,
        callId: s.followUpJobs.callId,
        error: s.followUpJobs.error,
      })
      .from(s.followUpJobs)
      .orderBy(desc(s.followUpJobs.createdAt))
      .limit(100)
      .all(),
    runs: db
      .select({
        id: s.agentRuns.id,
        issueId: s.agentRuns.issueId,
        state: s.agentRuns.state,
        error: s.agentRuns.error,
        createdAt: s.agentRuns.createdAt,
      })
      .from(s.agentRuns)
      .orderBy(desc(s.agentRuns.createdAt))
      .limit(50)
      .all(),
  }
}

export function manageJob(raw: unknown) {
  const input = z
    .object({ jobId: z.string().uuid(), action: z.enum(["cancel", "retry"]) })
    .parse(raw)
  const { db } = store()
  return db.transaction(
    (tx) => {
      const job = tx
        .select()
        .from(s.followUpJobs)
        .where(eq(s.followUpJobs.id, input.jobId))
        .get()
      if (!job) throw new CivicError("Job not found", 404)
      if (["running", "completed"].includes(job.state))
        throw new CivicError("This job is already running or complete", 409)
      if (input.action === "retry") {
        if (
          job.followUpRunId &&
          ["outbound_call", "prepare_run", "deadline_review"].includes(job.kind)
        ) {
          const run = tx
            .select()
            .from(s.followUpRuns)
            .where(eq(s.followUpRuns.id, job.followUpRunId))
            .get()
          if (!run || !["active", "preparing"].includes(run.state))
            throw new CivicError(
              "Resume the parent run before retrying its work",
              409
            )
        }
        if (job.kind === "outbound_call" && job.callId)
          throw new CivicError(
            "A phone attempt already exists. Reconcile it in Bolna; use a new call request only after its final outcome is known.",
            409
          )
        tx.update(s.followUpJobs)
          .set({
            state: "queued",
            attempts: 0,
            error: null,
            leaseUntil: null,
            dueAt: new Date().toISOString(),
          })
          .where(eq(s.followUpJobs.id, job.id))
          .run()
      } else
        tx.update(s.followUpJobs)
          .set({
            state: "cancelled",
            leaseUntil: null,
            error: "Cancelled from operations",
          })
          .where(
            and(
              eq(s.followUpJobs.id, job.id),
              inArray(s.followUpJobs.state, [
                "queued",
                "retry_pending",
                "needs_review",
                "paused",
              ])
            )
          )
          .run()
      return {
        id: job.id,
        state: input.action === "retry" ? "queued" : "cancelled",
      }
    },
    { behavior: "immediate" }
  )
}
