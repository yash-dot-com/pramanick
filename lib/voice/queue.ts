import { randomUUID } from "node:crypto"
import { and, asc, eq, inArray, lte, sql } from "drizzle-orm"
import { CivicError, store } from "@/lib/civic/repository"
import * as s from "@/lib/db/schema"

export const TERMINAL_CALL_STATES = new Set([
  "completed",
  "no-answer",
  "busy",
  "failed",
  "canceled",
  "stopped",
  "error",
  "balance-low",
])
export const ACTIVE_CALL_STATES = [
  "initiating",
  "queued",
  "ringing",
  "in-progress",
  "call-disconnected",
  "dispatch_unknown",
]
export type VoiceJob = typeof s.followUpJobs.$inferSelect
type JobInput = Pick<
  typeof s.followUpJobs.$inferInsert,
  "issueId" | "contactId" | "kind" | "dedupeKey"
> &
  Partial<
    Pick<
      typeof s.followUpJobs.$inferInsert,
      "callId" | "dueAt" | "followUpRunId"
    >
  >

export function enqueueJob(input: JobInput, reopen = false) {
  const { db } = store()
  return db.transaction((tx) => {
    const existing = tx
      .select()
      .from(s.followUpJobs)
      .where(eq(s.followUpJobs.dedupeKey, input.dedupeKey))
      .get()
    if (existing) {
      if (reopen && existing.state === "completed") {
        tx.update(s.followUpJobs)
          .set({
            state: "queued",
            dueAt: input.dueAt ?? new Date().toISOString(),
            attempts: 0,
            error: null,
            leaseUntil: null,
          })
          .where(eq(s.followUpJobs.id, existing.id))
          .run()
      } else if (
        reopen &&
        ["queued", "retry_pending"].includes(existing.state) &&
        input.dueAt &&
        input.dueAt < existing.dueAt
      ) {
        tx.update(s.followUpJobs)
          .set({ dueAt: input.dueAt })
          .where(eq(s.followUpJobs.id, existing.id))
          .run()
      }
      return existing.id
    }
    const id = randomUUID()
    tx.insert(s.followUpJobs)
      .values({
        ...input,
        id,
        state: "queued",
        dueAt: input.dueAt ?? new Date().toISOString(),
      })
      .run()
    return id
  })
}

export function enqueueCallSync(callId: string, delayMs = 0) {
  const { db } = store()
  const call = db.select().from(s.calls).where(eq(s.calls.id, callId)).get()
  if (!call) throw new CivicError("Call not found", 404)
  return enqueueJob(
    {
      issueId: call.issueId,
      contactId: call.contactId,
      callId,
      kind: "provider_sync",
      dedupeKey: `sync:${call.id}`,
      dueAt: new Date(Date.now() + delayMs).toISOString(),
    },
    true
  )
}

export function claimJob(): VoiceJob | null {
  const { db } = store()
  const now = new Date().toISOString()
  // An immediate transaction makes claims exclusive across worker processes.
  return db.transaction(
    (tx) => {
      tx.update(s.followUpJobs)
        .set({
          state: sql`CASE WHEN ${s.followUpJobs.attempts} >= CASE WHEN ${s.followUpJobs.kind} = 'provider_sync' THEN 30 ELSE 6 END THEN 'needs_review' ELSE 'retry_pending' END`,
          leaseUntil: null,
          error: "Worker lease expired; recovery attempted",
        })
        .where(
          and(
            eq(s.followUpJobs.state, "running"),
            lte(s.followUpJobs.leaseUntil, now)
          )
        )
        .run()
      const job = tx
        .select()
        .from(s.followUpJobs)
        .where(
          and(
            inArray(s.followUpJobs.state, ["queued", "retry_pending"]),
            lte(s.followUpJobs.dueAt, now)
          )
        )
        .orderBy(asc(s.followUpJobs.dueAt))
        .get()
      if (!job) return null
      const leaseUntil = new Date(Date.now() + 5 * 60_000).toISOString()
      tx.update(s.followUpJobs)
        .set({ state: "running", leaseUntil, attempts: job.attempts + 1 })
        .where(eq(s.followUpJobs.id, job.id))
        .run()
      return {
        ...job,
        state: "running",
        leaseUntil,
        attempts: job.attempts + 1,
      }
    },
    { behavior: "immediate" }
  )
}

export function finishJob(
  job: VoiceJob,
  state:
    "completed" | "retry_pending" | "needs_review" | "cancelled" | "paused",
  error: string | null = null,
  delayMs = 0
) {
  const { db } = store()
  // A stale worker cannot overwrite a job reclaimed after its lease expired.
  db.update(s.followUpJobs)
    .set({
      state,
      error,
      leaseUntil: null,
      ...(state === "retry_pending"
        ? { dueAt: new Date(Date.now() + delayMs).toISOString() }
        : {}),
    })
    .where(
      and(
        eq(s.followUpJobs.id, job.id),
        eq(s.followUpJobs.state, "running"),
        eq(s.followUpJobs.leaseUntil, job.leaseUntil!)
      )
    )
    .run()
}
