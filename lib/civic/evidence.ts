import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { Agent, Runner } from "@openai/agents"
import { and, asc, eq, isNull } from "drizzle-orm"
import { z } from "zod"
import * as s from "@/lib/db/schema"
import { enqueueJob } from "@/lib/voice/queue"
import { demoContact } from "@/lib/voice/contact"
import { CivicError, store } from "./repository"
import { publicText } from "./dossier"
import { DEMO_MODE } from "@/lib/demo-mode"

const assessmentSchema = z.object({
  finding: z.enum(["appears_fixed", "problem_visible", "inconclusive"]),
  sameScene: z.enum(["consistent", "different", "unclear", "no_baseline"]),
  explanation: z.string(),
  limitations: z.string(),
})
const imagePattern = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/

export function queueEvidenceAssessment(id: string) {
  const { db } = store()
  const item = db.select().from(s.evidence).where(eq(s.evidence.id, id)).get()
  if (!item || item.phase !== "verification" || item.assessment) return
  // Assessment never dials this contact or attributes a repair to it. The
  // existing job FK can use a directory record without inventing a person.
  const contact = DEMO_MODE
    ? demoContact(false)
    : db
        .select()
        .from(s.contacts)
        .where(and(eq(s.contacts.isDemo, false), isNull(s.contacts.revokedAt)))
        .get()
  if (!contact) return
  return enqueueJob({
    issueId: item.issueId,
    contactId: contact.id,
    kind: "assess_evidence",
    dedupeKey: `assess:${item.id}`,
  })
}

export function recoverEvidenceAssessments() {
  for (const item of store()
    .db.select({ id: s.evidence.id })
    .from(s.evidence)
    .where(
      and(eq(s.evidence.phase, "verification"), isNull(s.evidence.assessment))
    )
    .all())
    queueEvidenceAssessment(item.id)
}

export async function assessEvidence(id: string) {
  const { db } = store()
  const after = db.select().from(s.evidence).where(eq(s.evidence.id, id)).get()
  if (!after || after.assessment) return
  const issue = db
    .select()
    .from(s.issues)
    .where(eq(s.issues.id, after.issueId))
    .get()
  if (!issue || after.phase !== "verification" || !imagePattern.test(after.url))
    throw new CivicError("No supported resident verification photo", 409)
  if (!process.env.OPENAI_API_KEY)
    throw new CivicError(
      "OPENAI_API_KEY is required for photograph assessment",
      503
    )
  const before = db
    .select()
    .from(s.evidence)
    .where(
      and(eq(s.evidence.issueId, issue.id), eq(s.evidence.phase, "report"))
    )
    .orderBy(asc(s.evidence.createdAt))
    .all()
    .filter((item) => imagePattern.test(item.url))
    .slice(0, 2)
  const model =
    process.env.OPENAI_EVIDENCE_MODEL ||
    process.env.OPENAI_EXTRACTION_MODEL ||
    "gpt-5.4-mini"
  const promptVersion = "evidence-review/v1.0.0"
  const content: Array<
    | { type: "input_text"; text: string }
    | { type: "input_image"; image: string; detail: string }
  > = [
    {
      type: "input_text",
      text: JSON.stringify({
        issue: {
          title: issue.title,
          category: issue.category,
          description: issue.description,
        },
        baselineCount: before.length,
        observation: after.caption,
      }),
    },
  ]
  for (const photo of before)
    content.push(
      { type: "input_text", text: `BEFORE · evidence ${photo.id}` },
      { type: "input_image", image: photo.url, detail: "auto" }
    )
  content.push(
    { type: "input_text", text: "AFTER · resident observation" },
    { type: "input_image", image: after.url, detail: "auto" }
  )
  const agent = new Agent({
    name: "Pramanik evidence review v1",
    model,
    instructions: readFileSync(
      resolve(process.cwd(), `prompts/${promptVersion}.md`),
      "utf8"
    ),
    outputType: assessmentSchema,
  })
  const duplicate = before.some((item) => item.url === after.url)
  const result = duplicate
    ? null
    : await new Runner({ tracingDisabled: true }).run(
        agent,
        [{ role: "user", content }],
        { maxTurns: 2, signal: AbortSignal.timeout(90_000) }
      )
  const finding = duplicate
    ? {
        finding: "inconclusive" as const,
        sameScene: "unclear" as const,
        explanation: "The submitted image is identical to a report image.",
        limitations:
          "A distinct after photograph is needed to assess a repair.",
      }
    : assessmentSchema.parse(result!.finalOutput)
  db.transaction(
    (tx) => {
      const saved = tx
        .update(s.evidence)
        .set({
          assessment: {
            ...finding,
            explanation: publicText(finding.explanation),
            limitations: publicText(finding.limitations),
            baselineIds: before.map((item) => item.id),
            assessedAt: new Date().toISOString(),
            model: duplicate ? "duplicate-image-check" : model,
            promptVersion,
          },
        })
        .where(and(eq(s.evidence.id, id), isNull(s.evidence.assessment)))
        .run()
      if (!saved.changes) return
      tx.insert(s.issueEvents)
        .values({
          id: randomUUID(),
          issueId: issue.id,
          kind: "evidence_assessment",
          title: `Photo assessment: ${finding.finding.replaceAll("_", " ")}`,
          description: `${publicText(finding.explanation)}\nLimits: ${publicText(finding.limitations)}${after.location ? `\nDevice observation: ${after.location.proximity}; ${after.location.distanceMeters}m from pin; ±${after.location.accuracy}m accuracy.` : "\nNo device location supplied."}\nResident review is required for closure.`,
          source: `${promptVersion} · evidence ${id} · advisory`,
        })
        .run()
      if (
        finding.finding === "problem_visible" ||
        finding.sameScene === "different"
      ) {
        tx.update(s.issues)
          .set({ status: "disputed", updatedAt: new Date().toISOString() })
          .where(
            and(
              eq(s.issues.id, issue.id),
              eq(s.issues.status, "awaiting_verification")
            )
          )
          .run()
      }
    },
    { behavior: "immediate" }
  )
}
