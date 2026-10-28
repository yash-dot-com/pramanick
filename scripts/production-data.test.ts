import assert from "node:assert/strict"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"

// Production must stay clean even with an accidentally enabled demo setting.
Object.assign(process.env, {
  NODE_ENV: "production",
  PRAMANIK_SHOWCASE_DATA: "false",
  NEXT_PUBLIC_DEMO_MODE: "true",
})
process.env.DATABASE_PATH = resolve(
  mkdtempSync(resolve(tmpdir(), "pramanik-production-")),
  "test.sqlite"
)
const { store, snapshot } = await import("../lib/civic/repository")
const { publicAgentDashboard } = await import("../lib/voice/dashboard")
const { contactProfile, phoneConfigured } = await import("../lib/voice/contact")
const { responsibilityProfiles } = await import("../lib/civic/profiles")
const { queueEvidenceAssessment } = await import("../lib/civic/evidence")
const { sqlite } = store()
assert.equal(snapshot().issues.length, 0)
assert.ok(snapshot().offices.length > 0)
assert.equal(contactProfile().isDemo, false)
assert.equal(phoneConfigured(), false)
const dashboard = publicAgentDashboard()
const profiles = responsibilityProfiles()
assert.ok(profiles.profiles.length > 0)
assert.ok(
  profiles.profiles.every((profile) => profile.dataMode === "provider_records")
)
assert.equal(dashboard.calls.length, 0)
assert.equal(dashboard.demoOffice.officers.length, 0)
assert.ok(responsibilityProfiles().profiles.length > 0)
assert.ok(responsibilityProfiles().profiles.every((profile) => !profile.isDemo))
for (const table of [
  "issues",
  "calls",
  "commitments",
  "surveys",
  "agent_activities",
])
  assert.equal(
    (
      sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get() as {
        n: number
      }
    ).n,
    0
  )
assert.equal(
  (
    sqlite
      .prepare("SELECT count(*) AS n FROM offices WHERE is_demo = 1")
      .get() as { n: number }
  ).n,
  0
)
assert.deepEqual(sqlite.pragma("foreign_key_check"), [])
sqlite.exec(`
  INSERT INTO issues (id, title, description, category, issue_type, locality_id, landmark, lat, lng, updated_at)
  VALUES ('real-test-case', 'Resident report', 'A reported road issue', 'roads', 'Pothole', 'kothrud', 'Resident pin', 18.5, 73.8, '2026-10-24T00:00:00Z');
  INSERT INTO evidence (id, issue_id, caption, url, phase)
  VALUES ('real-test-photo', 'real-test-case', 'Resident observation', 'data:image/png;base64,AAAA', 'verification');
`)
assert.ok(queueEvidenceAssessment("real-test-photo"))
assert.equal(
  (
    sqlite
      .prepare("SELECT count(*) AS n FROM contacts WHERE is_demo=1")
      .get() as { n: number }
  ).n,
  0
)
assert.equal(
  (
    sqlite
      .prepare(
        "SELECT count(*) AS n FROM follow_up_jobs WHERE kind='assess_evidence'"
      )
      .get() as { n: number }
  ).n,
  1
)
assert.deepEqual(sqlite.pragma("foreign_key_check"), [])
console.log(
  "Production startup and dashboard retain real directory data without creating fixtures or demo contacts"
)
