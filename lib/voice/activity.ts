import { randomUUID } from "node:crypto"
import { desc, eq, sql } from "drizzle-orm"
import { store } from "@/lib/civic/repository"
import { publicText } from "@/lib/civic/dossier"
import * as s from "@/lib/db/schema"

type ActivityInput = Pick<
  typeof s.agentActivities.$inferInsert,
  "action" | "summary"
> &
  Partial<
    Pick<
      typeof s.agentActivities.$inferInsert,
      | "issueId"
      | "intakeSessionId"
      | "followUpRunId"
      | "callId"
      | "state"
      | "detail"
      | "dedupeKey"
    >
  >
export function recordActivity(input: ActivityInput) {
  const { db } = store()
  const id = randomUUID()
  const entry = {
    ...input,
    id,
    state: input.state ?? "completed",
    summary: publicText(input.summary).slice(0, 2000),
    updatedAt: new Date().toISOString(),
  }
  db.insert(s.agentActivities).values(entry).onConflictDoNothing().run()
  return input.dedupeKey
    ? db
        .select({ id: s.agentActivities.id })
        .from(s.agentActivities)
        .where(eq(s.agentActivities.dedupeKey, input.dedupeKey))
        .get()!.id
    : id
}
export function finishActivity(
  id: string,
  state: string,
  summary: string,
  detail?: Record<string, unknown>
) {
  store()
    .db.update(s.agentActivities)
    .set({
      state,
      summary: publicText(summary).slice(0, 2000),
      ...(detail ? { detail } : {}),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(s.agentActivities.id, id))
    .run()
}
export function activityFeed(filter?: {
  intakeSessionId?: string
  issueId?: string
  callId?: string
}) {
  const field = filter?.intakeSessionId
    ? eq(s.agentActivities.intakeSessionId, filter.intakeSessionId)
    : filter?.callId
      ? eq(s.agentActivities.callId, filter.callId)
      : filter?.issueId
        ? eq(s.agentActivities.issueId, filter.issueId)
        : undefined
  return store()
    .db.select()
    .from(s.agentActivities)
    .where(field)
    .orderBy(desc(sql`rowid`))
    .limit(120)
    .all()
}
