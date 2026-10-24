import { eq } from "drizzle-orm"
import { CivicError, store } from "@/lib/civic/repository"
import * as s from "@/lib/db/schema"

export function runIssueIds(runId: string) {
  return store()
    .db.select({ id: s.followUpRunIssues.issueId })
    .from(s.followUpRunIssues)
    .where(eq(s.followUpRunIssues.followUpRunId, runId))
    .all()
    .map((item) => item.id)
}
export function assertRunActive(runId: string | null | undefined) {
  if (!runId)
    throw new CivicError(
      "Start a follow-up run before scheduling phone calls",
      409
    )
  const run = store()
    .db.select()
    .from(s.followUpRuns)
    .where(eq(s.followUpRuns.id, runId))
    .get()
  if (run?.state !== "active")
    throw new CivicError("Follow-up run is paused or inactive", 409)
  return run
}
export function allowedCallIssues(call: typeof s.calls.$inferSelect) {
  return call.followUpRunId ? runIssueIds(call.followUpRunId) : [call.issueId]
}
