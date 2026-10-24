import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { test } from "node:test"
import { eq } from "drizzle-orm"
import { agentConfiguration, createWebCall } from "../lib/voice/bolna"
import { dispatchPhoneCall } from "../lib/voice/outbound"
import { demoContact } from "../lib/voice/contact"
import { snapshot, store } from "../lib/civic/repository"
import * as s from "../lib/db/schema"

test("phone and browser payloads carry usable, attributed case evidence without image data", async () => {
  // An isolated database and a mocked provider: this test cannot place a call.
  process.env.DATABASE_PATH = ":memory:"
  process.env.BOLNA_API_KEY = "test-key"
  process.env.BOLNA_AGENT_ID = randomUUID()
  process.env.APP_BASE_URL = "https://example.test"
  process.env.BOLNA_TOOL_SECRET = "test-secret"
  process.env.BOLNA_DEMO_PHONE = "+12025550123"
  process.env.BOLNA_DEMO_CALL_AUTHORIZED = "true"
  const { db } = store()
  const issue = snapshot().issues.find(
    (item) => !["verified", "awaiting_verification"].includes(item.status)
  )!
  const participantId = randomUUID()
  db.insert(s.participants)
    .values({ id: participantId, tokenHash: randomUUID() })
    .run()
  db.insert(s.complaints)
    .values({
      id: randomUUID(),
      issueId: issue.id,
      participantId,
      description:
        "Overflow reaches the crossing. Contact +919876543210 or resident@example.test",
    })
    .run()
  const evidenceId = randomUUID()
  db.insert(s.evidence)
    .values({
      id: evidenceId,
      issueId: issue.id,
      participantId,
      caption: "Resident reports the crossing remains blocked",
      url: "data:image/png;base64,PRIVATE_IMAGE_BYTES",
      phase: "verification",
      assessment: {
        finding: "problem_visible",
        sameScene: "unclear",
        explanation: "Possible obstruction",
        limitations: "Scene could not be confirmed",
        baselineIds: [],
        assessedAt: new Date().toISOString(),
        model: "test",
        promptVersion: "test",
      },
    })
    .run()
  const surveyId = randomUUID()
  db.insert(s.surveys)
    .values({ id: surveyId, issueId: issue.id, state: "open" })
    .run()
  db.insert(s.surveyResponses)
    .values({
      id: randomUUID(),
      surveyId,
      participantId,
      answer: "not_fixed",
      note: "The reported obstruction remains",
      evidenceId,
    })
    .run()
  const contact = demoContact()
  const runId = randomUUID()
  db.insert(s.followUpRuns)
    .values({
      id: runId,
      contactId: contact.id,
      scope: "issue",
      state: "active",
      requestId: randomUUID(),
      updatedAt: new Date().toISOString(),
      language: "mr",
    })
    .run()
  db.insert(s.followUpRunIssues)
    .values({ id: randomUUID(), followUpRunId: runId, issueId: issue.id })
    .run()
  const jobId = randomUUID()
  db.insert(s.followUpJobs)
    .values({
      id: jobId,
      issueId: issue.id,
      contactId: contact.id,
      followUpRunId: runId,
      kind: "outbound_call",
      state: "running",
      dedupeKey: randomUUID(),
      dueAt: new Date().toISOString(),
      leaseUntil: new Date(Date.now() + 60_000).toISOString(),
    })
    .run()
  const originalFetch = globalThis.fetch
  const requests: Array<{ user_data: Record<string, string> }> = []
  globalThis.fetch = async (url, init) => {
    const path = new URL(String(url)).pathname
    assert.ok(["/call", "/web-call/freeswitch-session"].includes(path))
    requests.push(JSON.parse(String(init?.body)))
    return Response.json({ execution_id: randomUUID(), run_id: randomUUID() })
  }
  try {
    const configuration = agentConfiguration()
    assert.ok(
      configuration.agent_prompts.task_1.system_prompt.startsWith(
        "# Pramanik civic calling assistant — v1.1.0"
      )
    )
    const configuredTools =
      configuration.agent_config.tasks[0].tools_config.api_tools.tools
    assert.ok(
      configuredTools.some((tool) => tool.name === "get_complaint_details")
    )
    assert.ok(configuredTools.some((tool) => tool.name === "stop_follow_ups"))

    await dispatchPhoneCall(
      db
        .select()
        .from(s.followUpJobs)
        .where(eq(s.followUpJobs.id, jobId))
        .get()!
    )
    await createWebCall(issue.id, "en")
    assert.equal(requests.length, 2)
    for (const [index, request] of requests.entries()) {
      const serialized = request.user_data.case_context
      const context = JSON.parse(serialized)
      assert.equal(context.caseRecord.issue.id, issue.id)
      assert.equal(context.caseRecord.issue.landmark, issue.landmark)
      assert.equal(context.caseRecord.verification.state, "open")
      assert.equal(context.caseRecord.verification.conflicting, true)
      assert.equal(
        context.caseRecord.verification.responses[0].answer,
        "not_fixed"
      )
      const evidence = context.caseRecord.evidence.find(
        (item: { id: string }) => item.id === evidenceId
      )
      assert.equal(evidence.assessment.finding, "problem_visible")
      assert.equal(evidence.assessment.sameScene, "unclear")
      assert.equal(evidence.url, undefined)
      assert.ok(!serialized.includes("PRIVATE_IMAGE_BYTES"))
      assert.ok(!serialized.includes("9876543210"))
      assert.ok(!serialized.includes("resident@example.test"))
      assert.ok(serialized.includes("Overflow reaches the crossing"))
      const run = db
        .select()
        .from(s.agentRuns)
        .where(
          eq(
            s.agentRuns.id,
            db
              .select()
              .from(s.calls)
              .where(eq(s.calls.id, request.user_data.pramanik_call_id))
              .get()!.runId
          )
        )
        .get()!
      assert.equal(run.promptVersion, "stakeholder-agent/v1.1.0")
      assert.equal(
        request.user_data.interaction_mode,
        index === 0 ? "follow_up" : "citizen"
      )
    }
    const phoneContext = JSON.parse(requests[0].user_data.case_context)
    assert.equal(phoneContext.recipient.recordingConsent, false)
    assert.equal(phoneContext.recipient.publicationConsent, false)
    assert.equal(phoneContext.recipient.isDemo, true)
  } finally {
    globalThis.fetch = originalFetch
  }
})
