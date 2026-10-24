import { randomUUID } from "node:crypto"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import assert from "node:assert/strict"
import { eq } from "drizzle-orm"

// Isolated database; the fictional contact has no phone and cannot be dispatched.
process.env.DATABASE_PATH = resolve(
  mkdtempSync(resolve(tmpdir(), "pramanik-coordinator-")),
  "test.sqlite"
)
process.env.PRAMANIK_DEMO_CITY = "false"
const { store } = await import("../lib/civic/repository")
const { prepareFollowUpRun } = await import("../lib/voice/runs")
const s = await import("../lib/db/schema")
const { db } = store()
const runId = randomUUID()
db.insert(s.followUpRuns)
  .values({
    id: runId,
    requestId: runId,
    contactId: "office-demo-nikhil-contact",
    scope: "issue",
    localityId: "pcmc",
    state: "preparing",
    language: "en",
    updatedAt: new Date().toISOString(),
  })
  .run()
db.insert(s.followUpRunIssues)
  .values({
    id: randomUUID(),
    followUpRunId: runId,
    issueId: "office-demo-water",
  })
  .run()
await prepareFollowUpRun(runId)
const activities = db
  .select()
  .from(s.agentActivities)
  .where(eq(s.agentActivities.followUpRunId, runId))
  .all()
const specialists = activities.filter((entry) =>
  ["reports", "history", "responsibility"].includes(
    String(entry.detail?.officeRole)
  )
)
assert.equal(specialists.length, 3)
assert.ok(specialists.every((entry) => entry.state === "completed"))
assert.ok(
  Math.max(
    ...specialists.map((entry) => Date.parse(String(entry.detail?.startedAt)))
  ) <
    Math.min(
      ...specialists.map((entry) =>
        Date.parse(String(entry.detail?.finishedAt))
      )
    )
)
const run = db
  .select()
  .from(s.followUpRuns)
  .where(eq(s.followUpRuns.id, runId))
  .get()!
assert.equal(run.state, "awaiting_configuration")
assert.ok(Array.isArray(run.brief?.actionPlan) && run.brief.actionPlan.length)
assert.ok(
  db
    .select()
    .from(s.followUpJobs)
    .all()
    .every((job) => job.state === "paused")
)
console.log(
  JSON.stringify(
    {
      runId,
      state: run.state,
      specialistStates: specialists.map((entry) => ({
        role: entry.detail?.officeRole,
        state: entry.state,
        startedAt: entry.detail?.startedAt,
        finishedAt: entry.detail?.finishedAt,
      })),
      summary: run.brief?.summary,
      callsPlaced: 0,
    },
    null,
    2
  )
)
