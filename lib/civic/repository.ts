import { randomUUID } from "node:crypto"
import { and, asc, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm"
import distance from "@turf/distance"
import { point } from "@turf/helpers"
import { z } from "zod"
import { database } from "../db"
import * as s from "../db/schema"
import { seed } from "../db/seed"
import { categoriesFor, directoryExists } from "./directory"
import {
  DATASET_FILES,
  type CivicIssue,
  type CivicSnapshot,
  type IssueStatus,
} from "./model"
import { complaintSchema, responseSchema } from "./validation"

export class CivicError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message)
  }
}
let initialized = false
export function store() {
  const result = database()
  if (!initialized) {
    seed()
    initialized = true
  }
  return result
}
export function snapshot(): CivicSnapshot {
  const { db } = store()
  const rows = db
    .select()
    .from(s.issues)
    .orderBy(desc(s.issues.createdAt))
    .all()
  const issues: CivicIssue[] = rows.map((row) => ({
    ...row,
    complaintCount:
      db
        .select({ count: sql<number>`count(*)` })
        .from(s.complaints)
        .where(eq(s.complaints.issueId, row.id))
        .get()?.count ?? 0,
    events: db
      .select()
      .from(s.issueEvents)
      .where(eq(s.issueEvents.issueId, row.id))
      .orderBy(desc(s.issueEvents.createdAt))
      .all(),
    commitments: db
      .select()
      .from(s.commitments)
      .where(eq(s.commitments.issueId, row.id))
      .orderBy(desc(s.commitments.createdAt))
      .all(),
    evidence: db
      .select({
        id: s.evidence.id,
        caption: s.evidence.caption,
        url: s.evidence.url,
        createdAt: s.evidence.createdAt,
      })
      .from(s.evidence)
      .where(eq(s.evidence.issueId, row.id))
      .all(),
    calls: db
      .select({
        id: s.calls.id,
        status: s.calls.status,
        summary: s.calls.summary,
        createdAt: s.calls.createdAt,
      })
      .from(s.calls)
      .where(
        or(
          eq(s.calls.issueId, row.id),
          inArray(
            s.calls.id,
            db
              .select({ id: s.callIssues.callId })
              .from(s.callIssues)
              .where(eq(s.callIssues.issueId, row.id))
          )
        )
      )
      .orderBy(desc(s.calls.createdAt))
      .all(),
    nextFollowUp:
      db
        .select()
        .from(s.followUpJobs)
        .where(
          and(
            eq(s.followUpJobs.issueId, row.id),
            inArray(s.followUpJobs.kind, [
              "outbound_call",
              "deadline_review",
              "manual_review",
            ]),
            inArray(s.followUpJobs.state, ["queued", "retry_pending"])
          )
        )
        .orderBy(asc(s.followUpJobs.dueAt))
        .get()?.dueAt ?? null,
  }))
  return {
    issues,
    offices: db
      .select()
      .from(s.offices)
      .where(eq(s.offices.isDemo, false))
      .all()
      .map((office) => ({
        ...office,
        localityId: office.localityId ?? "",
        categories: categoriesFor(office.topics),
        verified: office.verificationStatus === "OFFICIAL_PUBLISHED",
      })),
    directoryMissing: DATASET_FILES.filter(
      (filename) => !directoryExists(filename)
    ),
  }
}
export function duplicateIssues(input: z.infer<typeof complaintSchema>) {
  const { db } = store()
  return db
    .select()
    .from(s.issues)
    .where(
      and(
        eq(s.issues.localityId, input.localityId),
        eq(s.issues.category, input.category),
        eq(s.issues.issueType, input.issueType),
        eq(s.issues.isDemo, input.isDemo)
      )
    )
    .all()
    .filter(
      (issue) =>
        issue.status !== "verified" &&
        distance(point([issue.lng, issue.lat]), point([input.lng, input.lat]), {
          units: "meters",
        }) <= 100
    )
}
export function candidates(issueId: string) {
  const { db } = store()
  const issue = db.select().from(s.issues).where(eq(s.issues.id, issueId)).get()
  if (!issue) throw new CivicError("Issue not found", 404)
  const ruleType =
    issue.category === "roads"
      ? "pothole"
      : issue.category === "lighting"
        ? "broken_streetlight"
        : issue.issueType === "Uncollected waste"
          ? "garbage"
          : "sewage_overflow"
  const rules =
    issue.category === "water"
      ? []
      : db
          .select()
          .from(s.responsibilityRules)
          .where(
            and(
              eq(s.responsibilityRules.localityId, issue.localityId),
              eq(s.responsibilityRules.issueType, ruleType)
            )
          )
          .all()
  const offices = db
    .select()
    .from(s.offices)
    .all()
    .filter(
      (office) =>
        office.areaIds.includes(issue.localityId) &&
        categoriesFor(office.topics).includes(issue.category) &&
        !/MLA|legislative|representative|traffic|security/i.test(
          office.designation + office.topics
        )
    )
  return {
    offices: offices.map(
      ({ id, name, designation, source, verificationStatus }) => ({
        id,
        name,
        designation,
        source,
        verificationStatus,
      })
    ),
    rules,
    certainty: "candidate",
    note: "Directory relevance only. Confirm asset ownership and jurisdiction before assignment. No automated calling authorized.",
  }
}
export function submitComplaint(raw: unknown, participantId: string) {
  const input = complaintSchema.parse(raw)
  const { db } = store()
  if (input.intakeSessionId) {
    const session = db
      .select()
      .from(s.intakeSessions)
      .where(eq(s.intakeSessions.id, input.intakeSessionId))
      .get()
    if (!session?.draft)
      throw new CivicError(
        "No saved voice draft for this reporting session",
        409
      )
    if (session.submittedIssueId) return { issueId: session.submittedIssueId }
  }
  const nearby = duplicateIssues(input)
  if (!input.joinIssueId && !input.forceNew && nearby.length)
    return {
      duplicates: nearby.map(({ id, title, landmark }) => ({
        id,
        title,
        landmark,
      })),
    }
  return db.transaction((tx) => {
    if (input.intakeSessionId) {
      const consumed = tx
        .select()
        .from(s.intakeSessions)
        .where(eq(s.intakeSessions.id, input.intakeSessionId))
        .get()
      if (consumed?.submittedIssueId)
        return { issueId: consumed.submittedIssueId }
    }
    const now = new Date().toISOString()
    let issueId = input.joinIssueId
    if (issueId) {
      const issue = tx
        .select()
        .from(s.issues)
        .where(eq(s.issues.id, issueId))
        .get()
      if (!issue) throw new CivicError("This issue is no longer available", 404)
      if (
        issue.localityId !== input.localityId ||
        issue.category !== input.category ||
        issue.issueType !== input.issueType
      )
        throw new CivicError(
          "The selected case describes a different type of issue"
        )
      if (issue.isDemo !== input.isDemo)
        throw new CivicError(
          "Keep fictional demonstration reports separate from real cases"
        )
      if (issue.status === "verified")
        throw new CivicError(
          "This case is already verified. Report a new issue or ask for review.",
          409
        )
      const existing = tx
        .select()
        .from(s.complaints)
        .where(
          and(
            eq(s.complaints.issueId, issueId),
            eq(s.complaints.participantId, participantId)
          )
        )
        .get()
      if (existing)
        throw new CivicError(
          "You have already added a complaint to this issue",
          409
        )
    } else {
      issueId = randomUUID()
      tx.insert(s.issues)
        .values({
          id: issueId,
          title: input.title ?? `${input.issueType} · ${input.landmark}`,
          description:
            input.description ||
            `Community report: ${input.issueType.toLowerCase()} near ${input.landmark}.`,
          category: input.category,
          issueType: input.issueType,
          localityId: input.localityId,
          landmark: input.landmark,
          lat: input.lat,
          lng: input.lng,
          isDemo: input.isDemo,
          updatedAt: now,
        })
        .run()
      tx.insert(s.issueEvents)
        .values({
          id: randomUUID(),
          issueId,
          kind: "reported",
          title: "Community case opened",
          description:
            "A resident reported this civic problem. Responsibility is awaiting review.",
          source: "Resident report",
        })
        .run()
    }
    tx.insert(s.complaints)
      .values({
        id: randomUUID(),
        issueId,
        participantId,
        description: input.description,
      })
      .run()
    tx.insert(s.issueEvents)
      .values({
        id: randomUUID(),
        issueId,
        kind: "complaint",
        title: "A resident joined this case",
        description: "Another complaint is now part of this collective issue.",
        source: "Resident report",
      })
      .run()
    if (input.photo)
      tx.insert(s.evidence)
        .values({
          id: randomUUID(),
          issueId,
          participantId,
          caption: "Resident-submitted photograph · not independently verified",
          url: input.photo,
        })
        .run()
    tx.update(s.issues)
      .set({ updatedAt: now })
      .where(eq(s.issues.id, issueId))
      .run()
    if (input.intakeSessionId)
      tx.update(s.intakeSessions)
        .set({ submittedIssueId: issueId, state: "submitted", updatedAt: now })
        .where(eq(s.intakeSessions.id, input.intakeSessionId))
        .run()
    if (input.intakeSessionId)
      tx.insert(s.issueEvents)
        .values({
          id: randomUUID(),
          issueId,
          kind: "voice_intake",
          title: "Voice complaint confirmed",
          description:
            "The resident reviewed the spoken draft and selected its map location before saving.",
          source: "Resident confirmation",
        })
        .run()
    return { issueId }
  })
}
const transitions: Record<IssueStatus, IssueStatus[]> = {
  reported: ["assigned"],
  assigned: ["following_up", "reported"],
  following_up: ["awaiting_verification", "assigned"],
  awaiting_verification: ["verified", "disputed"],
  verified: ["disputed"],
  disputed: ["following_up", "awaiting_verification"],
}
export function changeStatus(
  id: string,
  status: IssueStatus,
  note: string,
  reviewer = false
) {
  const { db } = store()
  return db.transaction((tx) => {
    const issue = tx.select().from(s.issues).where(eq(s.issues.id, id)).get()
    if (!issue) throw new CivicError("Issue not found", 404)
    if (!transitions[issue.status].includes(status))
      throw new CivicError(`Cannot move from ${issue.status} to ${status}`, 409)
    if (status === "assigned" && !issue.officeId)
      throw new CivicError("Assign an office before changing this state")
    if (status === "verified" && !reviewer)
      throw new CivicError("Verification requires an evidence review", 409)
    tx.update(s.issues)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(s.issues.id, id))
      .run()
    tx.insert(s.issueEvents)
      .values({
        id: randomUUID(),
        issueId: id,
        kind: "status",
        title: `Case moved to ${status.replaceAll("_", " ")}`,
        description: note,
        source: reviewer ? "Manual evidence review" : "Operations",
      })
      .run()
    if (status === "awaiting_verification") {
      if (
        !tx
          .select()
          .from(s.surveys)
          .where(and(eq(s.surveys.issueId, id), eq(s.surveys.state, "open")))
          .get()
      )
        tx.insert(s.surveys).values({ id: randomUUID(), issueId: id }).run()
    }
    if (status === "verified") {
      tx.update(s.followUpJobs)
        .set({ state: "cancelled", error: "Case verified by reviewer" })
        .where(
          and(
            eq(s.followUpJobs.issueId, id),
            inArray(s.followUpJobs.kind, [
              "outbound_call",
              "deadline_review",
              "manual_review",
            ]),
            inArray(s.followUpJobs.state, [
              "queued",
              "retry_pending",
              "paused",
            ]),
            or(
              ne(s.followUpJobs.kind, "outbound_call"),
              isNull(s.followUpJobs.followUpRunId)
            )
          )
        )
        .run()
      tx.update(s.commitments)
        .set({ status: "fulfilled" })
        .where(eq(s.commitments.issueId, id))
        .run()
    }
  })
}
export function assignOffice(issueId: string, officeId: string, note: string) {
  const { db } = store()
  return db.transaction((tx) => {
    const issue = tx
      .select()
      .from(s.issues)
      .where(eq(s.issues.id, issueId))
      .get()
    const office = tx
      .select()
      .from(s.offices)
      .where(eq(s.offices.id, officeId))
      .get()
    if (!issue || !office)
      throw new CivicError("Issue or office not found", 404)
    tx.insert(s.issueAssignments)
      .values({
        id: randomUUID(),
        issueId,
        officeId,
        certainty: "reviewed",
        reason: note,
      })
      .run()
    tx.update(s.issues)
      .set({
        officeId,
        assignmentCertainty: "reviewed",
        status: issue.status === "reported" ? "assigned" : issue.status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(s.issues.id, issueId))
      .run()
    tx.insert(s.issueEvents)
      .values({
        id: randomUUID(),
        issueId,
        kind: "assignment",
        title: "Office assignment reviewed",
        description: `${office.name}. ${note}`,
        source: "Operations review",
      })
      .run()
  })
}
export function surveyFor(issueId: string) {
  const { db } = store()
  const survey = db
    .select()
    .from(s.surveys)
    .where(eq(s.surveys.issueId, issueId))
    .orderBy(desc(s.surveys.createdAt))
    .get()
  if (!survey) return null
  const responses = db
    .select({
      answer: s.surveyResponses.answer,
      note: s.surveyResponses.note,
      createdAt: s.surveyResponses.createdAt,
      evidenceId: s.surveyResponses.evidenceId,
    })
    .from(s.surveyResponses)
    .where(eq(s.surveyResponses.surveyId, survey.id))
    .all()
  return {
    ...survey,
    responses,
    conflicting: responses.some((row) =>
      ["partially_fixed", "not_fixed"].includes(row.answer)
    ),
  }
}
export function respondToSurvey(raw: unknown, participantId: string) {
  const input = responseSchema.parse(raw)
  const { db } = store()
  return db.transaction((tx) => {
    const survey = tx
      .select()
      .from(s.surveys)
      .where(eq(s.surveys.id, input.surveyId))
      .get()
    if (!survey || survey.state !== "open")
      throw new CivicError("Survey is not open", 409)
    const issue = tx
      .select()
      .from(s.issues)
      .where(eq(s.issues.id, survey.issueId))
      .get()
    if (!issue) throw new CivicError("Issue not found", 404)
    if (input.observation && !input.photo)
      throw new CivicError("Attach a photograph to the location observation")
    if (input.observation?.source === "demo" && !issue.isDemo)
      throw new CivicError(
        "Simulated locations are restricted to fictional cases"
      )
    if (input.observation) {
      const age = Date.now() - Date.parse(input.observation.observedAt)
      if (age < -60_000 || age > 10 * 60_000)
        throw new CivicError("Capture a fresh device location before saving")
    }
    if (
      tx
        .select()
        .from(s.surveyResponses)
        .where(
          and(
            eq(s.surveyResponses.surveyId, survey.id),
            eq(s.surveyResponses.participantId, participantId)
          )
        )
        .get()
    )
      throw new CivicError("You have already responded to this survey", 409)
    const evidenceId = input.photo ? randomUUID() : null
    if (input.photo) {
      if (
        !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(
          input.photo
        )
      )
        throw new CivicError("Invalid photograph")
      const observation = input.observation
      const meters = observation
        ? Math.round(
            distance(
              point([issue.lng, issue.lat]),
              point([observation.lng, observation.lat]),
              { units: "meters" }
            )
          )
        : 0
      tx.insert(s.evidence)
        .values({
          id: evidenceId!,
          issueId: survey.issueId,
          participantId,
          caption: `Verification photo: ${input.answer} · resident submitted`,
          url: input.photo,
          phase: "verification",
          location: observation
            ? {
                source: observation.source,
                observedAt: observation.observedAt,
                accuracy: Math.round(observation.accuracy),
                distanceMeters: meters,
                proximity:
                  observation.source === "demo"
                    ? "simulated"
                    : observation.accuracy > 50
                      ? "poor_accuracy"
                      : meters <= 100
                        ? "near"
                        : "away",
              }
            : null,
        })
        .run()
    }
    tx.insert(s.surveyResponses)
      .values({
        id: randomUUID(),
        surveyId: survey.id,
        participantId,
        answer: input.answer,
        note: input.note,
        evidenceId,
      })
      .run()
    tx.insert(s.issueEvents)
      .values({
        id: randomUUID(),
        issueId: survey.issueId,
        kind: "verification",
        title: "Resident verification received",
        description: `${input.answer.replaceAll("_", " ")}${input.note ? `: ${input.note}` : ""}`,
        source: "Resident observation",
      })
      .run()
    if (["partially_fixed", "not_fixed"].includes(input.answer)) {
      const issue = tx
        .select()
        .from(s.issues)
        .where(eq(s.issues.id, survey.issueId))
        .get()
      if (issue?.status === "awaiting_verification")
        tx.update(s.issues)
          .set({ status: "disputed", updatedAt: new Date().toISOString() })
          .where(eq(s.issues.id, survey.issueId))
          .run()
    }
    return { issueId: survey.issueId, evidenceId }
  })
}
export function reviewSurvey(
  issueId: string,
  decision: "verified" | "disputed",
  note: string
) {
  const { db } = store()
  return db.transaction((tx) => {
    const survey = surveyFor(issueId)
    if (!survey || survey.state !== "open")
      throw new CivicError("No open survey", 409)
    if (
      decision === "verified" &&
      (survey.conflicting ||
        !survey.responses.some((row) => row.answer === "fixed"))
    )
      throw new CivicError(
        "A fixed response and no conflicting evidence are required. Keep disputed cases open.",
        409
      )
    if (decision === "verified") {
      for (const response of survey.responses) {
        if (!response.evidenceId) continue
        const photo = tx
          .select()
          .from(s.evidence)
          .where(eq(s.evidence.id, response.evidenceId))
          .get()
        if (!photo?.assessment)
          throw new CivicError(
            "Wait for the photograph assessment before reviewing this repair",
            409
          )
        if (photo.location && photo.location.proximity !== "near")
          throw new CivicError(
            "The observation is not a precise nearby device location. Keep this case disputed and capture fresh evidence.",
            409
          )
        if (
          photo.assessment.finding === "problem_visible" ||
          photo.assessment.sameScene === "different"
        )
          throw new CivicError(
            "The photograph conflicts with closure. Keep the case disputed and request another observation.",
            409
          )
      }
    }
    const issue = tx
      .select()
      .from(s.issues)
      .where(eq(s.issues.id, issueId))
      .get()
    if (!issue) throw new CivicError("Issue not found", 404)
    if (issue.status === "disputed" && decision === "disputed") {
      tx.insert(s.issueEvents)
        .values({
          id: randomUUID(),
          issueId,
          kind: "review",
          title: "Repair remains disputed",
          description: note,
          source: "Manual evidence review",
        })
        .run()
    } else changeStatus(issueId, decision, note, true)
    tx.update(s.surveys)
      .set({
        state: "reviewed",
        reviewNote: note,
        reviewedAt: new Date().toISOString(),
      })
      .where(eq(s.surveys.id, survey.id))
      .run()
  })
}
