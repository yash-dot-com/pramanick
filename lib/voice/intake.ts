import { randomUUID } from "node:crypto"
import { and, eq, gte, inArray, lte, isNotNull } from "drizzle-orm"
import { z } from "zod"
import { CivicError, store } from "@/lib/civic/repository"
import { CATEGORIES } from "@/lib/civic/model"
import * as s from "@/lib/db/schema"
import { activityFeed, recordActivity, finishActivity } from "./activity"
import { languageVariables } from "./language"

export const inferenceToolSchema = z.object({
  pramanik_call_id: z.string().uuid(),
  title: z.string().max(160),
  category: z.enum(["", "roads", "water", "drainage", "lighting"]),
  issue_type: z.string().max(80),
  landmark: z.string().max(200),
  description: z.string().max(2000),
  missing_details: z.string().max(1000),
})
export function updateComplaintInference(raw: unknown) {
  const input = inferenceToolSchema.parse(raw)
  const { db } = store()
  const session = db
    .select()
    .from(s.intakeSessions)
    .where(eq(s.intakeSessions.id, input.pramanik_call_id))
    .get()
  if (
    !session ||
    session.submittedIssueId ||
    Date.now() - Date.parse(session.createdAt) > 30 * 60_000
  )
    throw new CivicError(
      "This reporting conversation is no longer editable",
      409
    )
  const { pramanik_call_id: id, ...inference } = input
  db.transaction((tx) => {
    tx.update(s.intakeSessions)
      .set({ inference, updatedAt: new Date().toISOString() })
      .where(eq(s.intakeSessions.id, id))
      .run()
    recordActivity({
      intakeSessionId: id,
      action: "infer_complaint",
      summary: "Updated the complaint details understood so far",
      detail: inference,
    })
  })
  return {
    saved: true,
    inference,
    message:
      "These are inferred draft details, not a submitted complaint. Ask about missing information in the selected language.",
  }
}

export const intakeToolSchema = z.object({
  pramanik_call_id: z.string().uuid(),
  title: z.string().trim().min(4).max(160),
  category: z.enum(["roads", "water", "drainage", "lighting"]),
  issue_type: z.string().max(80),
  landmark: z.string().trim().min(3).max(200),
  description: z.string().trim().min(3).max(2000),
})
export type IntakeDraft = {
  title: string
  category: keyof typeof CATEGORIES
  issueType: string
  landmark: string
  description: string
  intakeSessionId: string
}

export function saveVoiceDraft(raw: unknown) {
  const input = intakeToolSchema.parse(raw)
  if (
    !(CATEGORIES[input.category].types as readonly string[]).includes(
      input.issue_type
    )
  )
    throw new CivicError("Use an exact supported issue type for this category")
  const { db } = store()
  const session = db
    .select()
    .from(s.intakeSessions)
    .where(eq(s.intakeSessions.id, input.pramanik_call_id))
    .get()
  if (
    !session ||
    session.submittedIssueId ||
    Date.now() - new Date(session.createdAt).getTime() > 30 * 60_000
  )
    throw new CivicError(
      "This reporting conversation is no longer editable",
      409
    )
  const draft = {
    title: input.title,
    category: input.category,
    issueType: input.issue_type,
    landmark: input.landmark,
    description: input.description,
    intakeSessionId: session.id,
  }
  db.update(s.intakeSessions)
    .set({ state: "ready", draft, updatedAt: new Date().toISOString() })
    .where(eq(s.intakeSessions.id, session.id))
    .run()
  recordActivity({
    intakeSessionId: session.id,
    action: "draft_complaint",
    summary: "Prepared an editable complaint draft for your review",
    detail: draft,
  })
  return {
    saved: true,
    draft,
    message:
      "Draft ready. Ask the resident to choose the final map pin and confirm submission on screen. No complaint has been submitted and no phone follow-up has started.",
  }
}

export async function createIntakeSession(raw: unknown) {
  const { language } = z
    .object({ language: z.enum(["hi", "mr", "en"]).default("mr") })
    .parse(raw)
  const { db } = store()
  const id = randomUUID()
  const now = new Date().toISOString()
  db.transaction(
    (tx) => {
      const active = tx
        .select()
        .from(s.intakeSessions)
        .where(
          and(
            inArray(s.intakeSessions.state, ["connecting", "active"]),
            gte(
              s.intakeSessions.createdAt,
              new Date(Date.now() - 12 * 60_000).toISOString()
            )
          )
        )
        .get()
      if (active)
        throw new CivicError(
          "Finish the current reporting conversation first",
          409
        )
      tx.insert(s.intakeSessions)
        .values({ id, language, state: "connecting", updatedAt: now })
        .run()
    },
    { behavior: "immediate" }
  )
  const connecting = recordActivity({
    intakeSessionId: id,
    action: "connect_voice",
    state: "running",
    summary: "Connecting the voice conversation in your selected language",
    dedupeKey: `intake-connect:${id}`,
  })
  try {
    const { bolnaRequest } = await import("./bolna")
    const session = await bolnaRequest("/web-call/freeswitch-session", {
      method: "POST",
      body: JSON.stringify({
        agent_id: process.env.BOLNA_AGENT_ID,
        user_data: {
          interaction_mode: "intake",
          ...languageVariables(language, true),
          pramanik_call_id: id,
          issue_id: "not_applicable",
          issue_title: "New complaint draft",
          locality_name: "User will select a map pin",
          case_context: JSON.stringify({ supportedIssueTypes: CATEGORIES }),
          current_time: now,
        },
      }),
    })
    z.string().uuid().parse(session.run_id)
    db.update(s.intakeSessions)
      .set({
        executionId: session.run_id,
        state: "active",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(s.intakeSessions.id, id))
      .run()
    finishActivity(
      connecting,
      "completed",
      "Voice session created in the selected language. Waiting for the microphone connection."
    )
    return { session, intakeSessionId: id }
  } catch (error) {
    finishActivity(connecting, "failed", "Voice session could not be created")
    db.update(s.intakeSessions)
      .set({ state: "failed", updatedAt: new Date().toISOString() })
      .where(eq(s.intakeSessions.id, id))
      .run()
    throw error
  }
}

export function intakeActivity(id: string, end = false) {
  const { db } = store()
  const session = db
    .select()
    .from(s.intakeSessions)
    .where(eq(s.intakeSessions.id, id))
    .get()
  if (!session) throw new CivicError("Reporting conversation not found", 404)
  if (end) {
    db.update(s.intakeSessions)
      .set({
        providerStatus: "pending_sync",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(s.intakeSessions.id, id))
      .run()
    recordActivity({
      intakeSessionId: id,
      action: "end_voice",
      summary:
        "Voice conversation ended. Waiting for the provider's finalized transcript.",
      state: "waiting",
      dedupeKey: `intake-end:${id}`,
    })
  }
  if (end && !["submitted", "ready"].includes(session.state))
    db.update(s.intakeSessions)
      .set({ state: "ended", updatedAt: new Date().toISOString() })
      .where(eq(s.intakeSessions.id, id))
      .run()
  return {
    id: session.id,
    state:
      end && !["submitted", "ready"].includes(session.state)
        ? "ended"
        : session.state,
    draft: session.draft as unknown as IntakeDraft | null,
    submittedIssueId: session.submittedIssueId,
    language: session.language,
    inference: session.inference,
    transcript: session.transcript,
    activities: activityFeed({ intakeSessionId: id }),
  }
}

export async function reconcileIntakeSessions() {
  const { db } = store()
  const sessions = db
    .select()
    .from(s.intakeSessions)
    .where(
      and(
        eq(s.intakeSessions.provider, "bolna"),
        isNotNull(s.intakeSessions.executionId),
        isNotNull(s.intakeSessions.providerStatus),
        gte(
          s.intakeSessions.createdAt,
          new Date(Date.now() - 30 * 60_000).toISOString()
        ),
        lte(
          s.intakeSessions.updatedAt,
          new Date(Date.now() - 20_000).toISOString()
        )
      )
    )
    .all()
    .filter(
      (session) =>
        !session.transcript &&
        !["failed", "canceled", "no-answer", "error"].includes(
          session.providerStatus ?? ""
        )
    )
    .slice(0, 2)
  for (const session of sessions) {
    db.update(s.intakeSessions)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(s.intakeSessions.id, session.id))
      .run()
    try {
      const { bolnaRequest } = await import("./bolna")
      const result = await bolnaRequest(
        `/executions/${encodeURIComponent(session.executionId!)}`
      )
      if (
        result.agent_id !== process.env.BOLNA_AGENT_ID ||
        result.id !== session.executionId
      )
        continue
      const transcript =
        typeof result.transcript === "string" && result.transcript
          ? result.transcript
          : null
      db.update(s.intakeSessions)
        .set({
          transcript,
          providerStatus: String(result.status ?? "pending_sync"),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(s.intakeSessions.id, session.id))
        .run()
      if (transcript)
        recordActivity({
          intakeSessionId: session.id,
          action: "save_transcript",
          summary: "Saved the provider conversation transcript",
          dedupeKey: `intake-transcript:${session.id}`,
        })
    } catch {
      /* Provider execution may become available after the browser call ends. */
    }
  }
}
