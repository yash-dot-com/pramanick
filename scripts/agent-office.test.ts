import assert from "node:assert/strict"
import { test } from "node:test"
import { mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { eq } from "drizzle-orm"

process.env.DATABASE_PATH = resolve(
  mkdtempSync(resolve(tmpdir(), "pramanik-office-test-")),
  "test.sqlite"
)
process.env.PRAMANIK_DEMO_CITY = "false"
const { runSpecialists } = await import("../lib/voice/coordinator")
const { store, surveyFor } = await import("../lib/civic/repository")
const { seed } = await import("../lib/db/seed")
const { demoId } = await import("../lib/db/seed-office")
const { demoOfficeCases } = await import("../lib/civic/demo-office-data")
const { readDossier } = await import("../lib/civic/dossier")
const { publicResponseNotes } = await import("../lib/civic/public-case")
const { publicAgentDashboard } = await import("../lib/voice/dashboard")
const { responsibilityProfiles } = await import("../lib/civic/profiles")
const { GET } = await import("../app/api/voice/calls/[id]/recording/route")
const s = await import("../lib/db/schema")

test("independent specialists all start before any result is released", async () => {
  const started: number[] = []
  const release: (() => void)[] = []
  const result = runSpecialists(
    [0, 1, 2].map((index) => async () => {
      started.push(index)
      await new Promise<void>((done) => release.push(done))
      return index
    })
  )
  assert.deepEqual(started, [0, 1, 2])
  release.forEach((done) => done())
  assert.deepEqual(await result, [0, 1, 2])
})
test("a failing specialist does not leave sibling work running unobserved", async () => {
  let release!: () => void
  let settled = false
  const result = runSpecialists([
    () => {
      throw new Error("failed")
    },
    async () => {
      await new Promise<void>((done) => {
        release = done
      })
      settled = true
      return 2
    },
  ])
  assert.equal(settled, false)
  release()
  await assert.rejects(result, /failed/)
  assert.equal(settled, true)
})
test("fixtures are idempotent, foreign-key complete and never authorize a phone effect", () => {
  const { db, sqlite } = store()
  const before = db.select().from(s.calls).all().length
  seed()
  seed()
  assert.equal(db.select().from(s.calls).all().length, before)
  assert.deepEqual(sqlite.pragma("foreign_key_check"), [])
  const contacts = db
    .select()
    .from(s.contacts)
    .all()
    .filter((contact) => contact.id.startsWith("office-demo-"))
  assert.equal(contacts.length, 2)
  assert.ok(contacts.every((contact) => !contact.phone && !contact.authorized))
  assert.equal(
    db
      .select()
      .from(s.followUpJobs)
      .all()
      .filter((job) => job.state === "queued").length,
    0
  )
  for (const issue of demoOfficeCases) {
    const data = readDossier(issue.id)
    assert.equal(data.calls.length, 2)
    assert.ok(
      data.calls.every(
        (call) =>
          call.scriptedDemo &&
          !call.phoneAttempt &&
          call.recordingUrl &&
          call.duration! > 0
      )
    )
    assert.ok(data.calls.every((call) => publicResponseNotes(call).quote))
    assert.ok(data.evidence.length > 0)
  }
  assert.equal(surveyFor("office-demo-drain")?.conflicting, true)
  const dashboard = publicAgentDashboard()
  assert.equal(dashboard.metrics.phoneAttempts, 0)
  assert.equal(dashboard.metrics.browserConversations, 0)
  assert.equal(dashboard.demoOffice.conversations, 8)
  const profiles = responsibilityProfiles().profiles.filter(
    (person) => person.dataMode === "scripted_demo" && person.kind === "person"
  )
  assert.equal(profiles.length, 2)
  assert.ok(
    profiles.every(
      (person) => person.assignedCases === 2 && person.answeredCalls === 4
    )
  )
})
test("published sample audio plays, seeks, downloads and remains publication-gated", async () => {
  const id = demoId("road-first")
  const params = Promise.resolve({ id })
  const body = readFileSync(resolve("public/demo-office/audio/road-first.mp3"))
  const response = await GET(
    new Request(`http://localhost/api/voice/calls/${id}/recording`),
    { params }
  )
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("content-type"), "audio/mpeg")
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), body)
  const partial = await GET(
    new Request(`http://localhost/api/voice/calls/${id}/recording`, {
      headers: { Range: "bytes=10-99" },
    }),
    { params }
  )
  assert.equal(partial.status, 206)
  assert.equal((await partial.arrayBuffer()).byteLength, 90)
  const suffix = await GET(
    new Request(`http://localhost/api/voice/calls/${id}/recording`, {
      headers: { Range: "bytes=-50" },
    }),
    { params }
  )
  assert.deepEqual(Buffer.from(await suffix.arrayBuffer()), body.subarray(-50))
  const download = await GET(
    new Request(`http://localhost/api/voice/calls/${id}/recording?download=1`),
    { params }
  )
  assert.match(download.headers.get("content-disposition")!, /attachment/)
  const { db } = store()
  db.update(s.contacts)
    .set({ recordingConsent: false })
    .where(eq(s.contacts.id, "office-demo-meera-contact"))
    .run()
  const denied = await GET(
    new Request(`http://localhost/api/voice/calls/${id}/recording`),
    { params }
  )
  assert.equal(denied.status, 403)
})
