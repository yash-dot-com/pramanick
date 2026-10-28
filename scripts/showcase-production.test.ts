import assert from "node:assert/strict"

Object.assign(process.env, {
  NODE_ENV: "production",
  NEXT_PUBLIC_DEMO_MODE: "false",
  PRAMANIK_SHOWCASE_DATA: "true",
  DATABASE_PATH: ":memory:",
  BOLNA_DEMO_CALL_AUTHORIZED: "true",
  BOLNA_DEMO_PHONE: "+919999999999",
})
const { DEMO_MODE, SHOWCASE_DATA } = await import("../lib/demo-mode")
const { store, snapshot } = await import("../lib/civic/repository")
const { seed } = await import("../lib/db/seed")
const { publicAgentDashboard } = await import("../lib/voice/dashboard")
const { responsibilityProfiles } = await import("../lib/civic/profiles")
const { phoneConfigured } = await import("../lib/voice/contact")
const { sqlite } = store()
assert.equal(DEMO_MODE, false)
assert.equal(SHOWCASE_DATA, true)
assert.equal(phoneConfigured(), false)
const before = snapshot()
assert.equal(
  before.issues.filter((issue) => issue.id.startsWith("city-demo-")).length,
  72
)
assert.ok(before.issues.some((issue) => issue.id === "office-demo-pothole"))
assert.ok(before.offices.length > 0)
seed()
assert.equal(snapshot().issues.length, before.issues.length)
const dashboard = publicAgentDashboard()
assert.ok(dashboard.issues.length > 0)
assert.ok(dashboard.calls.some((call) => call.summary))
assert.ok(
  responsibilityProfiles().profiles.some(
    (profile) => profile.dataMode === "scripted_demo"
  )
)
assert.equal(
  (
    sqlite
      .prepare(
        "SELECT count(*) AS n FROM contacts WHERE is_demo=1 AND (authorized=1 OR phone <> '')"
      )
      .get() as { n: number }
  ).n,
  0
)
assert.equal(
  (
    sqlite
      .prepare("SELECT count(*) AS n FROM calls WHERE execution_id IS NOT NULL")
      .get() as { n: number }
  ).n,
  0
)
assert.equal(
  (
    sqlite
      .prepare(
        "SELECT count(*) AS n FROM follow_up_jobs WHERE kind='outbound_call' AND state IN ('queued','retry_pending')"
      )
      .get() as { n: number }
  ).n,
  0
)
assert.equal(sqlite.pragma("integrity_check", { simple: true }), "ok")
assert.deepEqual(sqlite.pragma("foreign_key_check"), [])
sqlite.close()
console.log(
  "Production showcase populates public cases, calls and profiles without enabling phone outreach"
)
