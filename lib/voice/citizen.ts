import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { Agent, Runner, tool } from "@openai/agents"
import { and, eq, gte, inArray } from "drizzle-orm"
import { z } from "zod"
import { CivicError, snapshot, store } from "@/lib/civic/repository"
import { publicText } from "@/lib/civic/dossier"
import { CATEGORIES } from "@/lib/civic/model"
import * as s from "@/lib/db/schema"
import { activityFeed, finishActivity, recordActivity } from "./activity"
import {
  inferenceToolSchema,
  intakeActivity,
  intakeToolSchema,
  saveVoiceDraft,
  updateComplaintInference,
} from "./intake"

const outputSchema = z.object({
  answer: z.string().min(1).max(1600),
  inference: inferenceToolSchema.omit({ pramanik_call_id: true }),
  draftReady: z.boolean(),
})
const turnSchema = z.object({
  answer: z.string(),
  userText: z.string(),
  turnId: z.string().uuid(),
})
const languageCodes: Record<string, string> = {
  mr: "mr-IN",
  hi: "hi-IN",
  en: "en-IN",
}
function requireKeys() {
  if (!process.env.SARVAM_API_KEY || !process.env.OPENAI_API_KEY)
    throw new CivicError(
      "Citizen voice needs SARVAM_API_KEY and OPENAI_API_KEY configured locally",
      503
    )
}
function sessionFor(id: string, editable = false) {
  const session = store()
    .db.select()
    .from(s.intakeSessions)
    .where(eq(s.intakeSessions.id, id))
    .get()
  if (!session || session.provider !== "sarvam")
    throw new CivicError("Voice conversation not found", 404)
  if (Date.now() - Date.parse(session.createdAt) > 30 * 60_000)
    throw new CivicError("This conversation has expired. Start a new one.", 409)
  if (editable && ["ended", "failed", "submitted"].includes(session.state))
    throw new CivicError("This conversation has ended", 409)
  return session
}
function turnKey(id: string, turn: string) {
  return `citizen:${id}:${turn}`
}
export function citizenActivity(id: string, end = false) {
  const session = sessionFor(id)
  if (end && session.state !== "submitted")
    store()
      .db.update(s.intakeSessions)
      .set({ state: "ended", updatedAt: new Date().toISOString() })
      .where(eq(s.intakeSessions.id, id))
      .run()
  return intakeActivity(id)
}
export function createCitizenSession(raw: unknown) {
  requireKeys()
  const input = z
    .object({
      language: z.enum(["mr", "hi", "en"]).default("mr"),
      issueId: z.string().max(100).optional(),
    })
    .parse(raw)
  if (
    input.issueId &&
    !snapshot().issues.some((issue) => issue.id === input.issueId)
  )
    throw new CivicError("Issue not found", 404)
  const { db } = store()
  const id = randomUUID(),
    turnId = randomUUID()
  const greeting =
    input.language === "mr"
      ? input.issueId
        ? "नमस्कार! या तक्रारीबद्दल तुम्हाला काय जाणून घ्यायचं आहे?"
        : "नमस्कार! तुमच्या परिसरात काय अडचण आहे ते सांगा."
      : input.language === "hi"
        ? input.issueId
          ? "नमस्ते! इस शिकायत के बारे में आप क्या जानना चाहते हैं?"
          : "नमस्ते! आपके इलाके में क्या समस्या है?"
        : input.issueId
          ? "Hello! What would you like to know about this issue?"
          : "Hello! Tell me what needs fixing in your neighbourhood."
  db.transaction(
    (tx) => {
      const active = tx
        .select()
        .from(s.intakeSessions)
        .where(
          and(
            eq(s.intakeSessions.provider, "sarvam"),
            inArray(s.intakeSessions.state, ["active", "ready"]),
            gte(
              s.intakeSessions.updatedAt,
              new Date(Date.now() - 30_000).toISOString()
            )
          )
        )
        .get()
      if (active)
        throw new CivicError("Finish the current voice conversation first", 409)
      tx.insert(s.intakeSessions)
        .values({
          id,
          language: input.language,
          provider: "sarvam",
          mode: input.issueId ? "issue" : "intake",
          issueId: input.issueId,
          state: "active",
          transcript: `Pramanik: ${greeting}`,
          updatedAt: new Date().toISOString(),
        })
        .run()
      tx.insert(s.toolExecutions)
        .values({
          id: turnKey(id, turnId),
          tool: "citizen_turn",
          state: "completed",
          detail: JSON.stringify({ answer: greeting, userText: "", turnId }),
        })
        .run()
    },
    { behavior: "immediate" }
  )
  recordActivity({
    intakeSessionId: id,
    action: "connect_voice",
    summary:
      "Created a Sarvam speech conversation with GPT complaint reasoning",
  })
  return {
    ...citizenActivity(id),
    turnId,
    answer: greeting,
    userText: "",
    audioUrl: `/api/voice/citizen/${id}/speech?turn=${turnId}`,
  }
}
export async function citizenTurn(id: string, form: FormData) {
  requireKeys()
  const session = sessionFor(id, true)
  const turnId = z.string().uuid().parse(form.get("turnId"))
  const file = form.get("audio")
  if (!(file instanceof File) || !file.size || file.size > 4_000_000)
    throw new CivicError("Send an audio clip under 25 seconds and 4 MB", 413)
  if (!/^(audio\/|video\/webm|video\/mp4)/.test(file.type))
    throw new CivicError("Unsupported audio format")
  const { db } = store(),
    key = turnKey(id, turnId)
  const prior = db
    .select()
    .from(s.toolExecutions)
    .where(eq(s.toolExecutions.id, key))
    .get()
  if (prior?.state === "completed")
    return {
      ...citizenActivity(id),
      ...turnSchema.parse(JSON.parse(prior.detail)),
      audioUrl: `/api/voice/citizen/${id}/speech?turn=${turnId}`,
    }
  if (prior)
    throw new CivicError(
      "This turn is already processing or failed. Record a fresh turn.",
      409
    )
  db.transaction(
    (tx) => {
      const working = tx
        .select()
        .from(s.toolExecutions)
        .where(
          and(
            eq(s.toolExecutions.tool, `citizen_turn:${id}`),
            eq(s.toolExecutions.state, "running"),
            gte(
              s.toolExecutions.createdAt,
              new Date(Date.now() - 120_000).toISOString()
            )
          )
        )
        .get()
      if (working) throw new CivicError("Wait for the current answer", 409)
      tx.insert(s.toolExecutions)
        .values({
          id: key,
          tool: `citizen_turn:${id}`,
          state: "running",
          detail: "{}",
        })
        .run()
      tx.update(s.intakeSessions)
        .set({ updatedAt: new Date().toISOString() })
        .where(eq(s.intakeSessions.id, id))
        .run()
    },
    { behavior: "immediate" }
  )
  let activity = recordActivity({
    intakeSessionId: id,
    action: "transcribe_speech",
    state: "running",
    summary: "Transcribing your speech in the selected language",
  })
  try {
    const body = new FormData()
    body.set("file", file)
    body.set("model", "saaras:v4")
    body.set("language_code", languageCodes[session.language])
    body.set("mode", "transcribe")
    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: { "api-subscription-key": process.env.SARVAM_API_KEY! },
      body,
      signal: AbortSignal.timeout(35_000),
    })
    if (!response.ok)
      throw new CivicError(
        `Speech recognition returned HTTP ${response.status}. Please record that turn again.`,
        502
      )
    const result = z
      .object({ transcript: z.string().max(8000) })
      .parse(await response.json())
    const userText = result.transcript.trim()
    if (!userText)
      throw new CivicError("No speech was recognized. Please try again.")
    finishActivity(activity, "completed", "Your speech was transcribed")
    db.update(s.intakeSessions)
      .set({
        transcript: `${session.transcript ?? ""}\nResident: ${userText}`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(s.intakeSessions.id, id))
      .run()
    activity = recordActivity({
      intakeSessionId: id,
      action: "understand_request",
      state: "running",
      summary:
        session.mode === "issue"
          ? "Checking your question against the selected case"
          : "Updating the complaint draft and deciding which detail is still missing",
    })
    const readCase = tool({
      name: "read_case_record",
      description:
        "Pass null for issue_id to read the selected case; otherwise use an exact ID from search. Read the case's current registered reports, timeline, commitments and call summaries. Read before answering case questions.",
      parameters: z.object({ issue_id: z.string().max(100).nullable() }),
      execute: async ({ issue_id }) => {
        const requestedIssueId = issue_id || session.issueId
        if (!requestedIssueId) return { error: "No case selected" }
        const issue = snapshot().issues.find(
          (item) => item.id === requestedIssueId
        )
        if (!issue) return { error: "Case no longer found" }
        const record = {
          ...issue,
          evidence: issue.evidence.map(({ id, caption, createdAt }) => ({
            id,
            caption,
            createdAt,
          })),
          complaints: db
            .select({
              description: s.complaints.description,
              createdAt: s.complaints.createdAt,
            })
            .from(s.complaints)
            .where(eq(s.complaints.issueId, issue.id))
            .all(),
        }
        recordActivity({
          intakeSessionId: id,
          action: "get_complaint_details",
          summary:
            "Read the selected case, resident reports, call summaries and follow-up history",
        })
        return JSON.parse(publicText(JSON.stringify(record)))
      },
    })
    const searchCases = tool({
      name: "search_registered_issues",
      description:
        "Find registered civic cases by problem, landmark or area before reading a case. No phone numbers or private identities are returned.",
      parameters: z.object({ query: z.string().max(200) }),
      execute: async ({ query }) => {
        const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean)
        const issues = snapshot()
          .issues.filter(
            (issue) =>
              !terms.length ||
              terms.some((term) =>
                `${issue.title} ${issue.description} ${issue.landmark} ${issue.localityId} ${issue.category}`
                  .toLocaleLowerCase()
                  .includes(term)
              )
          )
          .slice(0, 12)
          .map(({ id, title, landmark, status, complaintCount, isDemo }) => ({
            id,
            title,
            landmark,
            status,
            complaintCount,
            isDemo,
          }))
        recordActivity({
          intakeSessionId: id,
          action: "search_complaints",
          summary: `Found ${issues.length} matching registered case records`,
        })
        return JSON.parse(publicText(JSON.stringify(issues)))
      },
    })
    const agent = new Agent({
      name: "Pramanik citizen conversation v1",
      model: process.env.OPENAI_CITIZEN_MODEL || "gpt-5.4-mini",
      instructions:
        readFileSync(
          resolve(process.cwd(), "prompts/citizen-agent/v1.0.0.md"),
          "utf8"
        ) +
        `\nSelected language: ${session.language}. Mode: ${session.mode}. Supported exact category and issue_type values: ${JSON.stringify(CATEGORIES)}.`,
      tools: session.mode === "issue" ? [readCase, searchCases] : [],
      outputType: outputSchema,
    })
    const conversation = await new Runner({ tracingDisabled: true }).run(
      agent,
      JSON.stringify({
        conversation: `${session.transcript ?? ""}\nResident: ${userText}`,
        priorInference: session.inference,
      }),
      { maxTurns: 4, signal: AbortSignal.timeout(55_000) }
    )
    const output = outputSchema.parse(conversation.finalOutput)
    // A turn can finish after the dialog closes; never resurrect an ended session.
    const current = sessionFor(id)
    if (["ended", "submitted"].includes(current.state))
      throw new CivicError(
        "Conversation ended before this answer was saved",
        409
      )
    if (session.mode === "intake") {
      updateComplaintInference({ ...output.inference, pramanik_call_id: id })
      if (output.draftReady) {
        const draft = intakeToolSchema.safeParse({
          ...output.inference,
          pramanik_call_id: id,
        })
        if (
          draft.success &&
          (CATEGORIES[draft.data.category].types as readonly string[]).includes(
            draft.data.issue_type
          )
        )
          saveVoiceDraft(draft.data)
      } else
        db.update(s.intakeSessions)
          .set({ state: "active", draft: null })
          .where(eq(s.intakeSessions.id, id))
          .run()
    }
    db.update(s.intakeSessions)
      .set({
        transcript: `${session.transcript ?? ""}\nResident: ${userText}\nPramanik: ${output.answer}`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(s.intakeSessions.id, id))
      .run()
    const turn = { answer: output.answer, userText, turnId }
    db.update(s.toolExecutions)
      .set({ state: "completed", detail: JSON.stringify(turn) })
      .where(eq(s.toolExecutions.id, key))
      .run()
    finishActivity(
      activity,
      "completed",
      session.mode === "issue"
        ? "Prepared an answer from the registered case records"
        : "Updated the inferred complaint and next question"
    )
    return {
      ...citizenActivity(id),
      ...turn,
      audioUrl: `/api/voice/citizen/${id}/speech?turn=${turnId}`,
    }
  } catch (error) {
    finishActivity(
      activity,
      "failed",
      error instanceof CivicError
        ? error.message
        : "This conversation turn could not finish. Please try a fresh turn."
    )
    db.update(s.toolExecutions)
      .set({ state: "failed", detail: "Turn failed; record a fresh turn" })
      .where(eq(s.toolExecutions.id, key))
      .run()
    throw error
  }
}
export async function citizenSpeech(
  id: string,
  turn: string,
  signal: AbortSignal
) {
  requireKeys()
  const session = sessionFor(id)
  const turnId = z.string().uuid().parse(turn)
  const record = store()
    .db.select()
    .from(s.toolExecutions)
    .where(eq(s.toolExecutions.id, turnKey(id, turnId)))
    .get()
  if (!record || record.state !== "completed")
    throw new CivicError("Spoken answer is not available", 404)
  const { answer } = turnSchema.parse(JSON.parse(record.detail))
  const activity = recordActivity({
    intakeSessionId: id,
    action: "generate_speech",
    state: "running",
    summary: "Generating the spoken reply with Sarvam in the selected language",
  })
  try {
    const response = await fetch(
      "https://api.sarvam.ai/text-to-speech/stream",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": process.env.SARVAM_API_KEY!,
        },
        body: JSON.stringify({
          text: answer,
          language_code: languageCodes[session.language],
          model: "bulbul:v3",
          speaker: session.language === "hi" ? "shubh" : "ratan",
          output_audio_codec: "mp3",
          pace: 1,
          speech_sample_rate: 22050,
        }),
        signal: AbortSignal.any([signal, AbortSignal.timeout(35_000)]),
      }
    )
    if (!response.ok || !response.body)
      throw new CivicError(
        `Speech generation returned HTTP ${response.status}`,
        502
      )
    finishActivity(
      activity,
      "completed",
      "Speech stream opened; the browser plays the spoken reply"
    )
    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    finishActivity(
      activity,
      "failed",
      "Speech playback could not start; the written answer remains available"
    )
    throw error
  }
}
