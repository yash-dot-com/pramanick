import { createHash, randomUUID } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { and, asc, desc, eq, inArray, or } from "drizzle-orm"
import { CivicError, snapshot, store, surveyFor } from "./repository"
import { localityName } from "./model"
import * as s from "@/lib/db/schema"
import { publicRecordingPath } from "@/lib/voice/recording"
import { isScriptedDemo } from "./demo-office-data"

export function publicText(value: string | null | undefined) {
  return (value ?? "")
    .replace(/\+\d{9,15}\b/g, "[private contact]")
    .replace(/\b[6-9]\d{9}\b/g, "[private contact]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[private email]")
}

export function dossierContent(issueId: string) {
  const { db } = store()
  const issue = snapshot().issues.find((item) => item.id === issueId)
  if (!issue) throw new CivicError("Issue not found", 404)
  const office = issue.officeId
    ? db.select().from(s.offices).where(eq(s.offices.id, issue.officeId)).get()
    : null
  const linked = db
    .select({ id: s.callIssues.callId })
    .from(s.callIssues)
    .where(eq(s.callIssues.issueId, issueId))
    .all()
    .map((item) => item.id)
  const calls = db
    .select()
    .from(s.calls)
    .where(or(eq(s.calls.issueId, issueId), inArray(s.calls.id, linked)))
    .orderBy(asc(s.calls.createdAt))
    .all()
    .map((call) => {
      const contact = db
        .select()
        .from(s.contacts)
        .where(eq(s.contacts.id, call.contactId))
        .get()
      const cases = Array.isArray(call.outcome?.cases)
        ? (call.outcome.cases as {
            issueId: string
            summary?: string
            progress?: string
            nextAction?: string
            responseSignals?: Record<string, unknown>
          }[])
        : []
      const attributed = cases.find((item) => item.issueId === issueId)
      return {
        id: call.id,
        status: call.status,
        createdAt: call.createdAt,
        duration: call.duration,
        phoneAttempt: !!call.executionId && !!contact?.phone,
        scriptedDemo: !!contact?.isDemo && isScriptedDemo(call.outcome),
        summary: publicText(
          attributed?.summary ??
            (call.issueId === issueId ? call.summary : null)
        ),
        progress: attributed?.progress ?? null,
        nextAction: publicText(attributed?.nextAction),
        responseSignals: attributed?.responseSignals
          ? {
              ...attributed.responseSignals,
              evidenceQuote: publicText(
                String(attributed.responseSignals.evidenceQuote ?? "")
              ),
              uncertainty: publicText(
                String(attributed.responseSignals.uncertainty ?? "")
              ),
            }
          : null,
        person: contact
          ? {
              id: contact.id,
              name: contact.displayName || contact.designation,
              role: contact.designation,
              isDemo: contact.isDemo,
            }
          : null,
        transcript: contact?.publicationConsent
          ? publicText(call.transcript)
          : null,
        recordingUrl:
          contact?.publicationConsent && contact.recordingConsent
            ? call.recordingUrl
              ? publicRecordingPath(call.id)
              : null
            : null,
      }
    })
  const runs = db
    .select({
      id: s.followUpRuns.id,
      state: s.followUpRuns.state,
      createdAt: s.followUpRuns.createdAt,
      updatedAt: s.followUpRuns.updatedAt,
    })
    .from(s.followUpRunIssues)
    .innerJoin(
      s.followUpRuns,
      eq(s.followUpRunIssues.followUpRunId, s.followUpRuns.id)
    )
    .where(eq(s.followUpRunIssues.issueId, issueId))
    .orderBy(asc(s.followUpRuns.createdAt))
    .all()
  const survey = surveyFor(issueId)
  return {
    issue: {
      id: issue.id,
      title: publicText(issue.title),
      description: publicText(issue.description),
      category: issue.category,
      issueType: issue.issueType,
      locality: localityName(issue.localityId),
      landmark: publicText(issue.landmark),
      lat: issue.lat,
      lng: issue.lng,
      status: issue.status,
      isDemo: issue.isDemo,
      complaintCount: issue.complaintCount,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    },
    responsibility: office
      ? {
          id: office.id,
          name: office.name,
          role: office.designation,
          certainty: issue.assignmentCertainty,
          isDemo: office.isDemo,
        }
      : null,
    complaints: db
      .select({
        id: s.complaints.id,
        description: s.complaints.description,
        createdAt: s.complaints.createdAt,
      })
      .from(s.complaints)
      .where(eq(s.complaints.issueId, issueId))
      .orderBy(asc(s.complaints.createdAt))
      .all()
      .map((item) => ({ ...item, description: publicText(item.description) })),
    evidence: db
      .select({
        id: s.evidence.id,
        caption: s.evidence.caption,
        url: s.evidence.url,
        createdAt: s.evidence.createdAt,
        phase: s.evidence.phase,
        location: s.evidence.location,
        assessment: s.evidence.assessment,
      })
      .from(s.evidence)
      .where(eq(s.evidence.issueId, issueId))
      .orderBy(asc(s.evidence.createdAt))
      .all()
      .map((item) => ({ ...item, caption: publicText(item.caption) })),
    escalations: db
      .select({
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
      .all(),
    timeline: [...issue.events].reverse().map((item) => ({
      ...item,
      title: publicText(item.title),
      description: publicText(item.description),
      source: publicText(item.source),
    })),
    commitments: issue.commitments.map((item) => ({
      ...item,
      action: publicText(item.action),
    })),
    calls,
    runs,
    nextFollowUp: issue.nextFollowUp,
    verification: survey
      ? {
          id: survey.id,
          state: survey.state,
          conflicting: survey.conflicting,
          responses: survey.responses.map((item) => ({
            ...item,
            note: publicText(item.note),
          })),
          reviewNote: publicText(survey.reviewNote),
          reviewedAt: survey.reviewedAt,
        }
      : null,
    gaps: [
      ...(!issue.evidence.length
        ? ["No resident photograph has been submitted."]
        : []),
      ...(!issue.officeId
        ? ["Responsible office assignment has not been reviewed."]
        : []),
      ...(issue.status !== "verified"
        ? ["An independently reviewed repair is not established."]
        : []),
    ],
  }
}

export type IssueDossier = ReturnType<typeof dossierContent>
export function persistDossier(issueId: string) {
  const { db } = store()
  const version = db.transaction(
    (tx) => {
      const content = dossierContent(issueId)
      const fingerprint = createHash("sha256")
        .update(JSON.stringify(content))
        .digest("hex")
      const previous = tx
        .select()
        .from(s.dossierVersions)
        .where(eq(s.dossierVersions.issueId, issueId))
        .orderBy(desc(s.dossierVersions.version))
        .get()
      if (previous?.fingerprint === fingerprint) return previous
      const entry = {
        id: randomUUID(),
        issueId,
        version: (previous?.version ?? 0) + 1,
        fingerprint,
        content,
        createdAt: new Date().toISOString(),
      }
      tx.insert(s.dossierVersions).values(entry).run()
      return entry
    },
    { behavior: "immediate" }
  )
  // Files are derived artifacts. SQLite remains the canonical, transactional record.
  try {
    const directory = resolve(
      process.cwd(),
      "data/evidence",
      createHash("sha256").update(issueId).digest("hex").slice(0, 24)
    )
    mkdirSync(directory, { recursive: true })
    writeFileSync(
      resolve(directory, `v${version.version}.json`),
      JSON.stringify(
        {
          version: version.version,
          createdAt: version.createdAt,
          ...version.content,
        },
        null,
        2
      )
    )
  } catch {
    /* Downloads remain available from the saved SQLite version if disk export is unavailable. */
  }
  return {
    version: version.version,
    capturedAt: version.createdAt,
    ...(version.content as IssueDossier),
  }
}

export function readDossier(issueId: string, version?: number) {
  const history = () =>
    store()
      .db.select({
        version: s.dossierVersions.version,
        createdAt: s.dossierVersions.createdAt,
      })
      .from(s.dossierVersions)
      .where(eq(s.dossierVersions.issueId, issueId))
      .orderBy(desc(s.dossierVersions.version))
      .limit(100)
      .all()
  if (version === undefined)
    return { ...persistDossier(issueId), versions: history() }
  const row = store()
    .db.select()
    .from(s.dossierVersions)
    .where(
      and(
        eq(s.dossierVersions.issueId, issueId),
        eq(s.dossierVersions.version, version)
      )
    )
    .get()
  if (!row) throw new CivicError("Dossier version not found", 404)
  const content = row.content as IssueDossier
  return {
    version: row.version,
    capturedAt: row.createdAt,
    ...content,
    versions: history(),
    calls: content.calls.map((call) => {
      const contact = call.person
        ? store()
            .db.select()
            .from(s.contacts)
            .where(eq(s.contacts.id, call.person.id))
            .get()
        : null
      return {
        ...call,
        transcript: contact?.publicationConsent ? call.transcript : null,
        recordingUrl:
          contact?.publicationConsent && contact.recordingConsent
            ? call.recordingUrl
            : null,
      }
    }),
  }
}

export function dossierMarkdown(dossier: ReturnType<typeof readDossier>) {
  const { issue } = dossier
  return [
    `# ${issue.title}`,
    `Version ${dossier.version} · ${dossier.capturedAt}`,
    `${issue.isDemo ? "FICTIONAL DEMO · " : ""}${issue.locality} · ${issue.status} · ${issue.complaintCount} complaints`,
    "",
    issue.description,
    "",
    "## Responsibility",
    dossier.responsibility
      ? `${dossier.responsibility.name} · ${dossier.responsibility.certainty}`
      : "Assignment requires review.",
    "",
    "## Evidence",
    ...dossier.evidence.map(
      (item) =>
        `- ${item.createdAt}: ${item.caption} (evidence ${item.id}; original image is included in the JSON dossier)${item.location ? `\n  Device observation: ${item.location.proximity}; ${item.location.distanceMeters}m from pin; ±${item.location.accuracy}m; ${item.location.observedAt}. Location is client-reported and does not prove where the photo was taken.` : ""}${item.assessment ? `\n  Visual assessment: ${item.assessment.finding}. ${item.assessment.explanation} Limits: ${item.assessment.limitations}` : ""}`
    ),
    "",
    "## Timeline",
    ...dossier.timeline.map(
      (item) =>
        `- ${item.createdAt} — ${item.title}\n  ${item.description}\n  Source: ${item.source}`
    ),
    "",
    "## Promises",
    ...dossier.commitments.map(
      (item) =>
        `- ${item.action} · deadline ${item.dueAt ?? "not specified"} · ${item.status} · call ${item.sourceCallId}`
    ),
    "",
    "## Conversations",
    ...dossier.calls.map(
      (call) =>
        `### ${call.createdAt} · ${call.person?.name ?? "Participant"}\n${call.person?.role ?? ""} · ${call.status}${call.scriptedDemo ? " · FICTIONAL SCRIPTED SAMPLE; audio uses synthetic voices" : ""}\n\n${call.summary || "No published summary."}${call.recordingUrl ? `\n\nAudio: ${call.recordingUrl}` : ""}${call.nextAction ? `\n\nNext follow-up: ${call.nextAction}` : ""}${call.transcript ? `\n\nOriginal transcript:\n\n${call.transcript}` : ""}\n`
    ),
    "",
    "## Evidence gaps",
    ...dossier.gaps.map((gap) => `- ${gap}`),
    "",
    "## Escalation history",
    ...(dossier.escalations ?? []).map(
      (item) =>
        `- ${item.createdAt}: ${item.state}; draft ${item.id}; source dossier v${item.dossierVersion}${item.submissionReference ? `; operator-recorded reference ${item.submissionReference} (${item.submissionChannel}); not independently confirmed` : "; not filed"}.`
    ),
    "",
    `Next scheduled review/follow-up: ${dossier.nextFollowUp ?? "none"}`,
    "Claims and AI summaries are attributed statements; only resident review establishes a verified repair.",
  ].join("\n")
}
