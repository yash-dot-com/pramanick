import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { eq } from "drizzle-orm"
import type { database } from "./index"
import * as s from "./schema"
import { demoOfficeCases, demoOfficers } from "../civic/demo-office-data"

export const demoId = (key: string) => {
  const h = createHash("sha256")
    .update(`pramanik-office-v1:${key}`)
    .digest("hex")
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`
}

export function seedOfficeDemo(db: ReturnType<typeof database>["db"]) {
  if (process.env.PRAMANIK_DEMO_OFFICE === "false") return
  db.transaction((tx) => {
    if (
      tx
        .select()
        .from(s.participants)
        .where(eq(s.participants.id, "office-demo-v1"))
        .get()
    )
      return
    const now = Date.now()
    const at = (hoursAgo: number) =>
      new Date(now - hoursAgo * 3_600_000).toISOString()
    tx.insert(s.participants)
      .values({ id: "office-demo-v1", tokenHash: demoId("marker") })
      .run()
    for (const person of demoOfficers) {
      tx.insert(s.offices)
        .values({
          id: person.id,
          name: person.office,
          personName: person.name,
          designation: person.role,
          governmentBody: "Fictional demonstration office",
          address: "Demonstration location, Pune",
          localityId: person.localityId,
          areaIds: ["kothrud", "vanaz", "pcmc", "ramwadi"],
          jurisdiction: "Scripted demonstration cases only",
          topics: person.responsibilities,
          source: "Scripted demonstration, not an official directory entry",
          sourceAsOf: at(0).slice(0, 10),
          verificationStatus: "fictional_demo",
          isDemo: true,
        })
        .run()
      tx.insert(s.contacts)
        .values({
          id: `${person.id}-contact`,
          officeId: person.id,
          displayName: person.name,
          designation: person.role,
          phone: "",
          authorized: false,
          isDemo: true,
          language: "en",
          publicationConsent: true,
          recordingConsent: true,
        })
        .run()
    }
    for (const issue of demoOfficeCases) {
      const person = demoOfficers[issue.officer]
      const contactId = `${person.id}-contact`
      const runId = demoId(`${issue.id}:followup`)
      const agentRunId = demoId(`${issue.id}:agent`)
      const createdAt = at(issue.reportedHoursAgo)
      const updatedAt = at(
        issue.status === "verified"
          ? 20
          : issue.status === "disputed"
            ? 6
            : issue.calls.at(-1)!.hoursAgo
      )
      tx.insert(s.issues)
        .values({
          id: issue.id,
          title: issue.title,
          description: issue.reports[0],
          category: issue.category,
          issueType: issue.issueType,
          localityId: issue.localityId,
          landmark: issue.landmark,
          lat: issue.lat,
          lng: issue.lng,
          status: issue.status,
          officeId: person.id,
          assignmentCertainty: "demo_confirmed",
          isDemo: true,
          createdAt,
          updatedAt,
        })
        .run()
      tx.insert(s.issueAssignments)
        .values({
          id: demoId(`${issue.id}:assignment`),
          issueId: issue.id,
          officeId: person.id,
          certainty: "demo_confirmed",
          reason: `Scripted responsibility: ${person.responsibilities}`,
          createdAt,
        })
        .run()
      const complaintIds = issue.reports.map((description, i) => {
        const participantId = demoId(`${issue.id}:resident:${i}`)
        const id = demoId(`${issue.id}:complaint:${i}`)
        tx.insert(s.participants)
          .values({ id: participantId, tokenHash: participantId })
          .run()
        tx.insert(s.complaints)
          .values({
            id,
            issueId: issue.id,
            participantId,
            description,
            createdAt: at(issue.reportedHoursAgo - i * 0.25),
          })
          .run()
        return id
      })
      const event = (
        key: string,
        hours: number,
        title: string,
        description: string,
        kind = "agent"
      ) =>
        tx
          .insert(s.issueEvents)
          .values({
            id: demoId(`${issue.id}:event:${key}`),
            issueId: issue.id,
            kind,
            title,
            description,
            source: "Scripted demonstration",
            createdAt: at(hours),
          })
          .run()
      event(
        "reported",
        issue.reportedHoursAgo,
        "Community reports received",
        `${issue.reports.length} fictional residents describe the same location.`,
        "complaint"
      )
      event(
        "parallel",
        issue.calls[0].hoursAgo + 1,
        "Coordinator assigned three specialists",
        "Reports, conversation memory and responsibility research were reviewed in parallel in this scripted example."
      )
      tx.insert(s.agentRuns)
        .values({
          id: agentRunId,
          issueId: issue.id,
          state: "completed",
          promptVersion: "scripted-office-v1",
          context: {
            provenance: "scripted_demo",
            complaintIds,
            location: issue.landmark,
          },
          createdAt,
        })
        .run()
      const actionPlan = [
        {
          issueId: issue.id,
          kind: "call_contact",
          title: `Ask ${person.name} for a specific action and date`,
          reason: "Use the location, community reports and earlier promises.",
          question: issue.calls[0].turns[0][1],
        },
        {
          issueId: issue.id,
          kind: "follow_up",
          title: "Return to the promised deadline",
          reason: "Keep the original commitment visible; record delays.",
          question: issue.calls[1].turns[0][1],
        },
        {
          issueId: issue.id,
          kind: "resident_review",
          title: "Ask residents whether the problem is actually fixed",
          reason: issue.nextAction,
          question: "Does the problem remain at the reported location?",
        },
      ]
      tx.insert(s.followUpRuns)
        .values({
          id: runId,
          requestId: runId,
          contactId,
          scope: "issue",
          localityId: issue.localityId,
          state: "paused",
          language: "en",
          brief: {
            provenance: "scripted_demo",
            issueIds: [issue.id],
            preparedAt: at(issue.calls[0].hoursAgo + 1),
            caseSummaries: [
              {
                issueId: issue.id,
                sourceComplaintIds: complaintIds,
                summary: issue.reports[0],
              },
            ],
            actionPlan,
            nextAction: issue.nextAction,
          },
          createdAt,
          updatedAt,
        })
        .run()
      tx.insert(s.followUpRunIssues)
        .values({
          id: demoId(`${issue.id}:run-link`),
          followUpRunId: runId,
          issueId: issue.id,
        })
        .run()
      for (const call of issue.calls) {
        const callId = demoId(call.key)
        const quote = call.turns.find(([speaker]) => speaker === "officer")![1]
        const responseSignals = {
          responsibilityClarified: call === issue.calls[0],
          actionPlanGiven: true,
          deadlineGiven:
            call === issue.calls[0] || call.key === "water-followup",
          evidenceQuote: quote,
          uncertainty:
            "Illustrative assessment of a fictional scripted conversation.",
        }
        tx.insert(s.calls)
          .values({
            id: callId,
            issueId: issue.id,
            runId: agentRunId,
            contactId,
            followUpRunId: runId,
            idempotencyKey: `scripted:${call.key}`,
            status: "completed",
            transcript: call.turns
              .map(([speaker, text]) => `${speaker}: ${text}`)
              .join("\n"),
            summary: call.summary,
            recordingUrl: `/demo-office/audio/${call.key}.mp3`,
            outcome: {
              provenance: {
                kind: "scripted_demo",
                audio: "synthetic",
                version: 1,
              },
              nextAction: call.nextAction,
              cases: [
                {
                  issueId: issue.id,
                  summary: call.summary,
                  progress: call.progress,
                  nextAction: call.nextAction,
                  responseSignals,
                },
              ],
            },
            createdAt: at(call.hoursAgo),
            updatedAt: at(call.hoursAgo),
          })
          .run()
        tx.insert(s.callIssues)
          .values({ id: demoId(`${call.key}:link`), callId, issueId: issue.id })
          .run()
        for (const [i, [role, content]] of call.turns.entries())
          tx.insert(s.callMessages)
            .values({
              id: demoId(`${call.key}:message:${i}`),
              callId,
              role,
              content,
              createdAt: at(call.hoursAgo),
            })
            .run()
      }
      const firstCall = demoId(issue.calls[0].key)
      const lastCall = demoId(issue.calls[1].key)
      tx.insert(s.commitments)
        .values({
          id: demoId(`${issue.id}:promise`),
          issueId: issue.id,
          sourceCallId: firstCall,
          action: issue.calls[0].summary,
          dueAt: at(issue.dueHoursAgo),
          status:
            issue.status === "verified"
              ? "fulfilled"
              : issue.dueHoursAgo > 0
                ? "overdue"
                : "upcoming",
          createdAt: at(issue.calls[0].hoursAgo),
        })
        .run()
      tx.insert(s.caseworkPlans)
        .values({
          id: demoId(`${issue.id}:plan`),
          issueId: issue.id,
          inputFingerprint: "scripted-office-v1",
          state: "completed",
          relatedIssueIds: [],
          contactCandidates: [
            {
              id: person.id,
              name: person.name,
              reason: person.responsibilities,
            },
          ],
          nextAction: issue.nextAction,
          followUpRunId: runId,
          createdAt,
          updatedAt,
        })
        .run()
      if (
        ["verified", "awaiting_verification", "disputed"].includes(issue.status)
      ) {
        const surveyId = demoId(`${issue.id}:survey`)
        tx.insert(s.surveys)
          .values({
            id: surveyId,
            issueId: issue.id,
            sourceCallId: lastCall,
            state: issue.status === "awaiting_verification" ? "open" : "closed",
            reviewNote: issue.nextAction,
            createdAt: at(issue.calls[1].hoursAgo),
          })
          .run()
        if (issue.status !== "awaiting_verification")
          for (let i = 0; i < 2; i++)
            tx.insert(s.surveyResponses)
              .values({
                id: demoId(`${issue.id}:response:${i}`),
                surveyId,
                participantId: demoId(`${issue.id}:resident:${i}`),
                answer: issue.status === "verified" ? "fixed" : "not_fixed",
                note:
                  issue.status === "verified"
                    ? "Scripted resident check: the entrance is usable and both patches are holding."
                    : "Scripted resident check: water still overflows at the outlet after rain.",
                createdAt: updatedAt,
              })
              .run()
      }
      if (issue.status === "verified")
        event(
          "verified",
          20,
          "Case moved to verified",
          "Two fictional residents independently confirmed the repaired entrance.",
          "status"
        )
      if (issue.status === "disputed")
        event(
          "disputed",
          6,
          "Case moved to disputed",
          "Resident checks conflict with the clearance claim. The outlet still needs inspection.",
          "status"
        )
      if (issue.status === "awaiting_verification")
        event(
          "check",
          3,
          "Resident verification requested",
          "Check all three lamps after sunset. Completion has not been independently confirmed."
        )
      const rootId = demoId(`${issue.id}:coordinator`)
      const deskOutputs = [
        [
          "reports",
          `Combined ${issue.reports.length} reports at ${issue.landmark}`,
        ],
        [
          "history",
          `Recalled ${issue.calls.length} conversations and the original repair promise`,
        ],
        ["responsibility", `${person.name}: ${person.responsibilities}`],
        ["coordinator", issue.nextAction],
        ["outreach", issue.calls[1].summary],
        [
          "evaluation",
          issue.dueHoursAgo > 0 && issue.status !== "verified"
            ? "Deadline passed; keep the delay and supporting conversation visible"
            : "Commitment and next check recorded against the conversation",
        ],
        ["verification", issue.nextAction],
      ]
      for (const [role, summary] of deskOutputs)
        tx.insert(s.agentActivities)
          .values({
            id:
              role === "coordinator"
                ? rootId
                : demoId(`${issue.id}:desk:${role}`),
            issueId: issue.id,
            followUpRunId: runId,
            action: `office_${role}`,
            state: "completed",
            summary,
            detail: {
              provenance: "scripted_demo",
              officeRole: role,
              parentActivityId: role === "coordinator" ? null : rootId,
              issueIds: [issue.id],
              sourceIds: complaintIds,
              startedAt: at(issue.calls[0].hoursAgo + 1),
              finishedAt: updatedAt,
              handoffTo: ["reports", "history", "responsibility"].includes(role)
                ? "coordinator"
                : role === "coordinator"
                  ? "outreach"
                  : "verification",
            },
            createdAt: at(issue.calls[0].hoursAgo + 1),
            updatedAt,
            dedupeKey: `scripted:${issue.id}:${role}`,
          })
          .run()
    }
  })
  const manifestPath = resolve("public/demo-office/audio/manifest.json")
  const manifest: Record<string, { duration: number }> = existsSync(
    manifestPath
  )
    ? JSON.parse(readFileSync(manifestPath, "utf8"))
    : {}
  db.transaction((tx) => {
    for (const issue of demoOfficeCases) {
      const row = tx
        .select()
        .from(s.issues)
        .where(eq(s.issues.id, issue.id))
        .get()
      if (!row) continue
      for (const call of issue.calls)
        if (manifest[call.key]?.duration)
          tx.update(s.calls)
            .set({ duration: manifest[call.key].duration })
            .where(eq(s.calls.id, demoId(call.key)))
            .run()
      for (const phase of [
        "report",
        ...(issue.status === "verified" || issue.status === "disputed"
          ? ["verification"]
          : []),
      ]) {
        const id = demoId(`${issue.id}:evidence:${phase}`)
        const observedAt = phase === "report" ? row.createdAt : row.updatedAt
        tx.insert(s.evidence)
          .values({
            id,
            issueId: issue.id,
            participantId: demoId(`${issue.id}:resident:0`),
            caption: `Demo illustration: ${phase === "report" ? issue.reports[0] : issue.status === "verified" ? "Repaired surface confirmed by fictional residents." : "Water still overflows; resident check contradicts the clearance claim."} This is an illustration, not a site photograph.`,
            url: `/demo-office/evidence/${issue.category}-${phase}.png`,
            phase,
            location: {
              source: "demo",
              observedAt,
              accuracy: 0,
              distanceMeters: 0,
              proximity: "simulated",
            },
            createdAt: observedAt,
          })
          .onConflictDoNothing()
          .run()
      }
      // Migrate the original fixture's answer labels to the existing survey vocabulary.
      for (let i = 0; i < 2; i++)
        tx.update(s.surveyResponses)
          .set({ answer: issue.status === "verified" ? "fixed" : "not_fixed" })
          .where(eq(s.surveyResponses.id, demoId(`${issue.id}:response:${i}`)))
          .run()
    }
  })
}
