import { createHash, randomUUID, timingSafeEqual } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { and, desc, eq, inArray, sql } from "drizzle-orm"
import { z } from "zod"
import { CivicError, snapshot, store } from "@/lib/civic/repository"
import { localityName } from "@/lib/civic/model"
import { dossierContent } from "@/lib/civic/dossier"
import * as s from "@/lib/db/schema"
import { voiceTools } from "./tools"
import { languageVariables, voiceLanguage } from "./language"
import { activityFeed } from "./activity"
import { allowedRecordingUrl } from "./recording"
import {
  ACTIVE_CALL_STATES,
  enqueueCallSync,
  TERMINAL_CALL_STATES,
} from "./queue"

export const voiceModel = () =>
  process.env.BOLNA_VOICE_MODEL || "gpt-realtime-2.1"
export const voiceName = () => process.env.BOLNA_VOICE || "marin"
export function voiceSettings() {
  return {
    configured: !!(process.env.BOLNA_API_KEY && process.env.BOLNA_AGENT_ID),
    toolsConfigured: !!(
      process.env.APP_BASE_URL && process.env.BOLNA_TOOL_SECRET
    ),
    model: voiceModel(),
    voice: voiceName(),
    agentId: process.env.BOLNA_AGENT_ID || null,
    missing: [
      "BOLNA_API_KEY",
      "BOLNA_AGENT_ID",
      "APP_BASE_URL",
      "BOLNA_TOOL_SECRET",
    ].filter((name) => !process.env[name]),
  }
}
export async function bolnaRequest(path: string, init: RequestInit = {}) {
  if (!process.env.BOLNA_API_KEY)
    throw new CivicError("Add BOLNA_API_KEY to .env.local", 503)
  const response = await fetch(`https://api.bolna.ai${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.BOLNA_API_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(25000),
  })
  if (!response.ok)
    throw new CivicError(
      `Bolna returned HTTP ${response.status}. Check the agent configuration and account balance.`,
      502
    )
  return response.json()
}
export function requireToolSecret(request: Request) {
  const expected = process.env.BOLNA_TOOL_SECRET
  const received =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? ""
  if (
    !expected ||
    Buffer.byteLength(expected) !== Buffer.byteLength(received) ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(received))
  )
    throw new CivicError("Invalid provider callback credential", 401)
}
export function agentConfiguration() {
  if (!process.env.APP_BASE_URL || !process.env.BOLNA_TOOL_SECRET)
    throw new CivicError(
      "Set APP_BASE_URL to your HTTPS tunnel URL and set BOLNA_TOOL_SECRET",
      503
    )
  const base = new URL(process.env.APP_BASE_URL)
  if (
    base.protocol !== "https:" ||
    ["localhost", "127.0.0.1"].includes(base.hostname)
  )
    throw new CivicError(
      "Bolna needs a public HTTPS APP_BASE_URL for complaint tools"
    )
  const definitions = Object.entries(voiceTools).map(([name, definition]) => {
    const parameters = z.toJSONSchema(definition.schema)
    const param = Object.fromEntries(
      Object.keys(definition.schema.shape).map((key) => [key, `%(${key})s`])
    )
    return {
      name,
      description: definition.description,
      key: "custom_task",
      parameters,
      value: {
        method: "POST",
        url: new URL(`/api/voice/tools/${name}`, base).toString(),
        api_token: `Bearer ${process.env.BOLNA_TOOL_SECRET}`,
        headers: {},
        param,
      },
    }
  })
  return {
    agent_config: {
      agent_name: "Pramanik Civic Assistant",
      agent_welcome_message: "{{voice_greeting}}",
      call_summary_enabled: true,
      webhook_url: new URL("/api/voice/webhook", base).toString(),
      tasks: [
        {
          task_type: "conversation",
          toolchain: { execution: "parallel", pipelines: [["s2s"]] },
          tools_config: {
            input: { provider: "plivo", format: "wav" },
            output: { provider: "plivo", format: "wav" },
            s2s: {
              provider: "openai_realtime",
              provider_config: {
                model: voiceModel(),
                voice: voiceName(),
                turn_detection_type: "semantic_vad",
                eagerness: "auto",
              },
            },
            api_tools: {
              tools: definitions,
              tools_params: Object.fromEntries(
                definitions.map((definition) => [
                  definition.name,
                  {
                    ...definition.value,
                    param: JSON.stringify(definition.value.param),
                  },
                ])
              ),
            },
          },
          task_config: {
            hangup_after_silence: 30,
            call_terminate: 600,
            auto_reschedule: false,
          },
        },
      ],
    },
    agent_prompts: {
      task_1: {
        system_prompt: readFileSync(
          resolve(process.cwd(), "prompts/stakeholder-agent/v1.1.0.md"),
          "utf8"
        ),
      },
    },
  }
}
export async function configureAgent() {
  if (!process.env.BOLNA_AGENT_ID)
    throw new CivicError("Set BOLNA_AGENT_ID to the agent UUID", 503)
  z.string().uuid().parse(process.env.BOLNA_AGENT_ID)
  const configuration = agentConfiguration()
  const current = await bolnaRequest(
    `/v2/agent/${encodeURIComponent(process.env.BOLNA_AGENT_ID)}`
  )
  const backupDirectory = resolve(process.cwd(), "data/private")
  mkdirSync(backupDirectory, { recursive: true, mode: 0o700 })
  writeFileSync(
    resolve(backupDirectory, `bolna-agent-${Date.now()}.json`),
    JSON.stringify(current, null, 2),
    { mode: 0o600 }
  )
  // Retain configured input/output telephony primitives when updating this existing agent.
  const oldTools = current.tasks?.find(
    (task: { task_type: string }) => task.task_type === "conversation"
  )?.tools_config
  const nextTools = configuration.agent_config.tasks[0].tools_config
  if (oldTools?.input) nextTools.input = oldTools.input
  if (oldTools?.output) nextTools.output = oldTools.output
  await bolnaRequest(
    `/v2/agent/${encodeURIComponent(process.env.BOLNA_AGENT_ID)}`,
    { method: "PUT", body: JSON.stringify(configuration) }
  )
  return {
    configured: true,
    model: voiceModel(),
    voice: voiceName(),
    tools: Object.keys(voiceTools),
  }
}
export async function createWebCall(
  issueId: string,
  language = voiceLanguage(process.env.BOLNA_LANGUAGE)
) {
  if (!voiceSettings().configured)
    throw new CivicError(
      "Configure BOLNA_API_KEY and BOLNA_AGENT_ID first",
      503
    )
  if (!voiceSettings().toolsConfigured)
    throw new CivicError(
      "Configure APP_BASE_URL and BOLNA_TOOL_SECRET so the agent can read complaints",
      503
    )
  const { db } = store()
  const issue = snapshot().issues.find((item) => item.id === issueId)
  if (!issue)
    throw new CivicError(
      "Select an existing issue before starting the voice agent",
      404
    )
  const now = new Date().toISOString()
  const id = randomUUID()
  const runId = randomUUID()
  const dossier = dossierContent(issue.id)
  const context = {
    interactionMode: "citizen",
    issueId: issue.id,
    title: issue.title,
    locality: localityName(issue.localityId),
    status: issue.status,
    isDemo: issue.isDemo,
    complaintCount: issue.complaintCount,
    commitments: dossier.commitments,
    previousCalls: dossier.calls
      .slice(-5)
      .reverse()
      .map(({ id, status, summary, createdAt, progress, nextAction }) => ({
        id,
        status,
        summary,
        createdAt,
        progress,
        nextAction,
      })),
    timeline: dossier.timeline.slice(-15).reverse(),
    caseRecord: {
      issue: dossier.issue,
      responsibility: dossier.responsibility,
      complaints: dossier.complaints.slice(-20),
      evidence: dossier.evidence
        .slice(-8)
        .map(({ id, caption, createdAt, phase, location, assessment }) => ({
          id,
          caption,
          createdAt,
          phase,
          location,
          assessment,
        })),
      verification: dossier.verification,
      gaps: dossier.gaps,
    },
  }
  db.transaction(
    (tx) => {
      const existing = tx
        .select()
        .from(s.calls)
        .where(
          and(
            eq(s.calls.contactId, "demo-browser"),
            inArray(s.calls.status, ACTIVE_CALL_STATES)
          )
        )
        .orderBy(desc(s.calls.createdAt))
        .get()
      if (
        existing &&
        Date.now() - new Date(existing.createdAt).getTime() < 12 * 60 * 1000
      )
        throw new CivicError(
          "A demo conversation is already active. End it before starting another.",
          409
        )
      tx.insert(s.offices)
        .values({
          id: "PRAMANIK-DEMO",
          name: "Pramanik demonstration",
          governmentBody: "Fictional demo contact",
          address: "Local browser session",
          designation: "Consenting demo participant",
          areaIds: [],
          jurisdiction: "No government authority",
          topics: "demo",
          source: "Local demo",
          sourceAsOf: now,
          verificationStatus: "DEMO",
          isDemo: true,
        })
        .onConflictDoNothing()
        .run()
      tx.insert(s.contacts)
        .values({
          id: "demo-browser",
          officeId: "PRAMANIK-DEMO",
          designation: "Browser demo participant",
          phone: "",
          authorized: true,
          recordingConsent: false,
          isDemo: true,
        })
        .onConflictDoNothing()
        .run()
      tx.insert(s.agentRuns)
        .values({
          id: runId,
          issueId: issue.id,
          state: "starting",
          promptVersion: "stakeholder-agent/v1.1.0",
          context,
        })
        .run()
      tx.insert(s.calls)
        .values({
          id,
          issueId: issue.id,
          runId,
          contactId: "demo-browser",
          idempotencyKey: id,
          status: "initiating",
          updatedAt: now,
        })
        .run()
    },
    { behavior: "immediate" }
  )
  try {
    const session = await bolnaRequest("/web-call/freeswitch-session", {
      method: "POST",
      body: JSON.stringify({
        agent_id: process.env.BOLNA_AGENT_ID,
        user_data: {
          pramanik_call_id: id,
          issue_id: issue.id,
          issue_title: issue.title,
          locality_name: localityName(issue.localityId),
          case_context: JSON.stringify(context),
          interaction_mode: "citizen",
          ...languageVariables(language),
          current_time: now,
        },
      }),
    })
    if (typeof session.run_id !== "string")
      throw new CivicError("Bolna did not return a Web Call session ID", 502)
    db.transaction((tx) => {
      tx.update(s.calls)
        .set({
          executionId: session.run_id,
          status: "queued",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(s.calls.id, id))
        .run()
      tx.update(s.agentRuns)
        .set({ state: "queued" })
        .where(eq(s.agentRuns.id, runId))
        .run()
    })
    enqueueCallSync(id, 60_000)
    return { session, callId: id }
  } catch (error) {
    db.transaction((tx) => {
      tx.update(s.calls)
        .set({
          status: "failed",
          error: "Could not create a Bolna session",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(s.calls.id, id))
        .run()
      tx.update(s.agentRuns)
        .set({ state: "failed", error: "Session creation failed" })
        .where(eq(s.agentRuns.id, runId))
        .run()
    })
    throw error
  }
}
export async function syncCall(id: string) {
  const { db } = store()
  const call = db.select().from(s.calls).where(eq(s.calls.id, id)).get()
  if (!call?.executionId)
    throw new CivicError("Call is not connected to a provider execution", 404)
  const execution = await bolnaRequest(
    `/executions/${encodeURIComponent(call.executionId)}`
  )
  if (
    execution.agent_id !== process.env.BOLNA_AGENT_ID ||
    execution.id !== call.executionId
  )
    throw new CivicError("Provider execution does not match this agent", 409)
  const status = String(execution.status || call.status)
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        id: execution.id,
        status,
        transcript: execution.transcript ?? "",
        summary: execution.summary ?? "",
        duration: execution.conversation_duration ?? null,
      })
    )
    .digest("hex")
  db.transaction((tx) => {
    if (
      tx
        .select()
        .from(s.webhookEvents)
        .where(eq(s.webhookEvents.fingerprint, fingerprint))
        .get()
    ) {
      tx.update(s.webhookEvents)
        .set({ repeats: sql`${s.webhookEvents.repeats} + 1` })
        .where(eq(s.webhookEvents.fingerprint, fingerprint))
        .run()
      return
    }
    tx.insert(s.webhookEvents)
      .values({
        id: randomUUID(),
        executionId: call.executionId!,
        fingerprint,
        status,
      })
      .run()
    const current = tx.select().from(s.calls).where(eq(s.calls.id, id)).get()!
    const contact = tx
      .select()
      .from(s.contacts)
      .where(eq(s.contacts.id, current.contactId))
      .get()
    if (
      (current.status === "completed" && status !== "completed") ||
      (TERMINAL_CALL_STATES.has(current.status) &&
        !TERMINAL_CALL_STATES.has(status))
    )
      return
    const recording = execution.telephony_data?.recording_url
    tx.update(s.calls)
      .set({
        status,
        transcript:
          typeof execution.transcript === "string" && execution.transcript
            ? execution.transcript
            : current.transcript,
        duration: Number.isFinite(execution.conversation_duration)
          ? execution.conversation_duration
          : current.duration,
        recordingUrl:
          contact?.recordingConsent &&
          contact.publicationConsent &&
          allowedRecordingUrl(recording)
            ? recording
            : null,
        error: execution.error_message
          ? "Provider reported a call error; review the execution in Bolna."
          : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(s.calls.id, id))
      .run()
    if (!current.outcome)
      tx.update(s.agentRuns)
        .set({ state: status })
        .where(eq(s.agentRuns.id, call.runId))
        .run()
    if (status === "completed" && current.status !== "completed")
      tx.insert(s.issueEvents)
        .values({
          id: randomUUID(),
          issueId: call.issueId,
          kind: "call",
          title: "Demo voice conversation completed",
          description:
            "A conversation with the demo participant was saved in local call history. Statements require independent review.",
          source: "Bolna execution record",
        })
        .run()
  })
  return db.select().from(s.calls).where(eq(s.calls.id, id)).get()!
}
export function callActivity(id: string) {
  const { db } = store()
  const call = db.select().from(s.calls).where(eq(s.calls.id, id)).get()
  if (!call) throw new CivicError("Call not found", 404)
  return {
    call: {
      id: call.id,
      issueId: call.issueId,
      status: call.status,
      executionId: call.executionId,
      duration: call.duration,
      transcript: call.transcript,
      summary: call.summary,
      outcome: call.outcome,
      error: call.error,
      createdAt: call.createdAt,
    },
    context:
      db.select().from(s.agentRuns).where(eq(s.agentRuns.id, call.runId)).get()
        ?.context ?? {},
    activities: activityFeed({ callId: id }),
    tools: db
      .select({
        id: s.toolExecutions.id,
        tool: s.toolExecutions.tool,
        state: s.toolExecutions.state,
        detail: s.toolExecutions.detail,
        createdAt: s.toolExecutions.createdAt,
      })
      .from(s.toolExecutions)
      .where(eq(s.toolExecutions.runId, call.runId))
      .orderBy(desc(s.toolExecutions.createdAt))
      .limit(40)
      .all(),
  }
}

export async function reconcileCall(id: string, executionId: string) {
  z.string().uuid().parse(executionId)
  const { db } = store()
  const call = db.select().from(s.calls).where(eq(s.calls.id, id)).get()
  if (!call) throw new CivicError("Call not found", 404)
  if (call.executionId && call.executionId !== executionId)
    throw new CivicError(
      "This call is already attached to another execution",
      409
    )
  const execution = await bolnaRequest(`/executions/${executionId}`)
  const matchesContext = (value: unknown, depth = 0): boolean => {
    if (depth > 5 || !value) return false
    if (typeof value === "string") {
      try {
        return matchesContext(JSON.parse(value), depth + 1)
      } catch {
        return false
      }
    }
    if (typeof value !== "object") return false
    const object = value as Record<string, unknown>
    return (
      object.pramanik_call_id === id ||
      ["user_data", "context_details", "recipient_data", "variables"].some(
        (key) => matchesContext(object[key], depth + 1)
      )
    )
  }
  if (
    execution.id !== executionId ||
    execution.agent_id !== process.env.BOLNA_AGENT_ID ||
    (!call.executionId && !matchesContext(execution))
  )
    throw new CivicError(
      "Provider metadata does not establish that this execution belongs to this local call",
      409
    )
  db.update(s.calls)
    .set({ executionId, updatedAt: new Date().toISOString() })
    .where(eq(s.calls.id, id))
    .run()
  enqueueCallSync(id)
  return syncCall(id)
}

export function confirmCallNotPlaced(id: string, note: string) {
  const { db } = store()
  db.transaction(
    (tx) => {
      const call = tx.select().from(s.calls).where(eq(s.calls.id, id)).get()
      if (!call || call.executionId || call.status !== "dispatch_unknown")
        throw new CivicError(
          "Only an uncertain call without a saved execution can be resolved this way",
          409
        )
      tx.update(s.calls)
        .set({
          status: "failed",
          error: "Operator checked Bolna and confirmed no call was placed",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(s.calls.id, id))
        .run()
      tx.update(s.agentRuns)
        .set({ state: "failed", error: "Operator-confirmed: no provider call" })
        .where(eq(s.agentRuns.id, call.runId))
        .run()
      tx.insert(s.issueEvents)
        .values({
          id: randomUUID(),
          issueId: call.issueId,
          kind: "call_review",
          title: "Uncertain call reviewed by operator",
          description: note,
          source: "Operator confirmation after checking Bolna",
        })
        .run()
    },
    { behavior: "immediate" }
  )
}
