import { createHash, randomUUID } from "node:crypto"
import { and, desc, eq } from "drizzle-orm"
import { z } from "zod"
import * as s from "@/lib/db/schema"
import { persistDossier, publicText } from "./dossier"
import { CivicError, store } from "./repository"

export function escalationHistory(issueId: string) {
  return store()
    .db.select({
      id: s.escalations.id,
      createdAt: s.escalations.createdAt,
      dossierVersion: s.escalations.dossierVersion,
      state: s.escalations.state,
      submissionReference: s.escalations.submissionReference,
      submissionChannel: s.escalations.submissionChannel,
      submittedAt: s.escalations.submittedAt,
    })
    .from(s.escalations)
    .where(eq(s.escalations.issueId, issueId))
    .orderBy(desc(s.escalations.createdAt))
    .all()
}

export function prepareEscalation(issueId: string, automatic = false) {
  const { db } = store()
  const existing = db
    .select()
    .from(s.escalations)
    .where(eq(s.escalations.issueId, issueId))
    .orderBy(desc(s.escalations.createdAt))
    .get()
  if (automatic && existing) return existing
  const dossier = persistDossier(issueId)
  if (dossier.issue.status === "verified")
    throw new CivicError("This repair is already verified", 409)
  const missed = dossier.commitments.filter((item) => item.status === "overdue")
  const unanswered = dossier.calls.filter(
    (call) => call.phoneAttempt && ["no-answer", "busy"].includes(call.status)
  )
  if (automatic && !missed.length && unanswered.length < 2) return null
  // Only facts and source IDs are composed here. No model invents allegations or a filing receipt.
  const fingerprint = createHash("sha256")
    .update(`${issueId}:${dossier.version}`)
    .digest("hex")
  const duplicate = db
    .select()
    .from(s.escalations)
    .where(eq(s.escalations.fingerprint, fingerprint))
    .get()
  if (duplicate) return duplicate
  const demonstration =
    dossier.issue.isDemo ||
    dossier.calls.some((call) => call.person?.isDemo) ||
    dossier.responsibility?.isDemo
  const draft = [
    `# Complaint draft — ${dossier.issue.title}`,
    demonstration
      ? "DEMONSTRATION MATERIAL — includes fictional casework or a demo participant. Do not file as an allegation against a real official."
      : "DRAFT — review responsibility and factual accuracy before filing through an official channel.",
    "Not submitted. No government acknowledgment or case number has been obtained by Pramanik.",
    "",
    `To: ${dossier.responsibility?.name ?? "Responsible office — assignment requires review"}`,
    `Assignment basis: ${dossier.responsibility?.certainty ?? "unassigned"}. Confirm jurisdiction and escalation recipient before filing.`,
    `Subject: Request for action and a written progress update — ${dossier.issue.title}`,
    "",
    `Residents reported ${dossier.issue.issueType.toLowerCase()} at ${dossier.issue.landmark}, ${dossier.issue.locality}.`,
    `Issue location: ${dossier.issue.lat}, ${dossier.issue.lng}. First report: ${dossier.issue.createdAt}.`,
    `Community complaints: ${dossier.issue.complaintCount}. Current status: ${dossier.issue.status}.`,
    dossier.issue.description,
    "",
    "## Documented follow-through",
    ...dossier.calls.map(
      (call) =>
        `- ${call.createdAt}: ${call.person?.name ?? "Participant"}${call.person?.isDemo ? " (demo participant)" : ""}; ${call.status}; source call ${call.id}. ${call.summary || "No substantive response documented."}`
    ),
    ...(!dossier.calls.length
      ? [
          "- No conversations have been recorded. This draft does not establish prior contact or non-response.",
        ]
      : []),
    ...dossier.commitments.map(
      (item) =>
        `- Promise: ${item.action}; due ${item.dueAt ?? "unspecified"}; ${item.status}; source call ${item.sourceCallId}.`
    ),
    "",
    "## Supporting evidence",
    ...dossier.evidence.map(
      (item) => `- ${item.createdAt}: ${item.caption}; evidence ${item.id}.`
    ),
    `- Source dossier: version ${dossier.version}, captured ${dossier.capturedAt}. Download the matching dossier for original images, timeline and available conversation material.`,
    ...dossier.gaps.map((gap) => `- Limit: ${gap}`),
    "",
    "## Requested action",
    "Please confirm the responsible department, provide an action plan and target date, and supply a written progress update. If this office is not responsible, please identify the correct channel. Any completion claim will be checked against resident observations before the community case is closed.",
    "",
    "Pramanik tracks follow-through. Provider busy/no-answer statuses do not establish blocking, refusal, negligence, or personal intent. Statements and AI summaries require source review.",
  ].join("\n")
  const row = {
    id: randomUUID(),
    issueId,
    dossierVersion: dossier.version,
    fingerprint,
    draft,
  }
  db.transaction(
    (tx) => {
      const inserted = tx
        .insert(s.escalations)
        .values(row)
        .onConflictDoNothing()
        .run()
      if (!inserted.changes) return
      tx.insert(s.issueEvents)
        .values({
          id: randomUUID(),
          issueId,
          kind: "escalation",
          title: "Complaint draft prepared",
          description: `An evidence-linked complaint draft was prepared from dossier v${dossier.version}. It has not been submitted.${automatic ? " Trigger: overdue promise or repeated unanswered contact attempts." : " Requested by the operator."}`,
          source: `Pramanik casework · draft ${row.id}`,
        })
        .run()
    },
    { behavior: "immediate" }
  )
  return db
    .select()
    .from(s.escalations)
    .where(eq(s.escalations.fingerprint, fingerprint))
    .get()!
}

export function escalationDraft(issueId: string, id: string) {
  const row = store()
    .db.select()
    .from(s.escalations)
    .where(and(eq(s.escalations.id, id), eq(s.escalations.issueId, issueId)))
    .get()
  if (!row) throw new CivicError("Complaint draft not found", 404)
  return row
}

export function recordSubmission(issueId: string, raw: unknown) {
  const input = z
    .object({
      id: z.string().uuid(),
      reference: z.string().trim().min(3).max(200),
      channel: z.string().trim().min(3).max(200),
    })
    .parse(raw)
  const { db } = store()
  return db.transaction(
    (tx) => {
      const row = escalationDraft(issueId, input.id)
      if (row.state === "submission_recorded") {
        if (
          row.submissionReference === publicText(input.reference) &&
          row.submissionChannel === publicText(input.channel)
        )
          return
        throw new CivicError(
          "A reference is already recorded for this draft",
          409
        )
      }
      tx.update(s.escalations)
        .set({
          state: "submission_recorded",
          submissionReference: publicText(input.reference),
          submissionChannel: publicText(input.channel),
          submittedAt: new Date().toISOString(),
        })
        .where(eq(s.escalations.id, row.id))
        .run()
      tx.insert(s.issueEvents)
        .values({
          id: randomUUID(),
          issueId,
          kind: "escalation_submission",
          title: "Filing reference recorded by operator",
          description: `${publicText(input.channel)} · ${publicText(input.reference)}. This reference has not been independently confirmed with the receiving authority.`,
          source: `Operator record · draft ${row.id}`,
        })
        .run()
    },
    { behavior: "immediate" }
  )
}
