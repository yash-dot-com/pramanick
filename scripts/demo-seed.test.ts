import assert from "node:assert/strict"
import { test } from "node:test"

test("demo seed covers every area and workflow stage, is idempotent, and cannot dial its contacts", async () => {
  process.env.DATABASE_PATH = ":memory:"
  const { store, snapshot } = await import("../lib/civic/repository")
  const { seed } = await import("../lib/db/seed")
  const { sqlite } = store()
  const before = sqlite.prepare("SELECT count(*) AS total FROM issues").get()
  seed()
  assert.deepEqual(
    sqlite.prepare("SELECT count(*) AS total FROM issues").get(),
    before
  )
  assert.equal(sqlite.pragma("integrity_check", { simple: true }), "ok")
  assert.deepEqual(sqlite.pragma("foreign_key_check"), [])
  const city = snapshot().issues.filter((issue) =>
    issue.id.startsWith("city-demo-")
  )
  assert.equal(city.length, 72)
  assert.equal(new Set(city.map((issue) => issue.localityId)).size, 6)
  assert.equal(new Set(city.map((issue) => issue.status)).size, 6)
  assert.ok(
    city.every(
      (issue) =>
        issue.isDemo && issue.complaintCount >= 3 && issue.evidence.length
    )
  )
  assert.equal(
    (
      sqlite
        .prepare(
          "SELECT count(*) AS total FROM contacts WHERE id LIKE 'city-demo-%' AND (authorized = 1 OR phone <> '')"
        )
        .get() as { total: number }
    ).total,
    0
  )
  assert.equal(
    (
      sqlite
        .prepare(
          "SELECT count(*) AS total FROM calls WHERE idempotency_key LIKE 'scripted:%' AND execution_id IS NOT NULL"
        )
        .get() as { total: number }
    ).total,
    0
  )
  assert.equal(
    (
      sqlite
        .prepare(
          "SELECT count(*) AS total FROM survey_responses WHERE answer NOT IN ('fixed','partially_fixed','not_fixed','cannot_verify') AND survey_id IN (SELECT id FROM surveys WHERE issue_id LIKE 'city-demo-%')"
        )
        .get() as { total: number }
    ).total,
    0
  )
})
