import { eq } from "drizzle-orm"
import type { database } from "./index"
import * as s from "./schema"
import { demoId } from "./seed-office"
import {
  CATEGORIES,
  LOCALITIES,
  type Category,
  type IssueStatus,
} from "../civic/model"

const scenarios: {
  title: string
  category: Category
  type: string
  report: string
  action: string
}[] = [
  {
    title: "Broken surface beside the bus stop",
    category: "roads",
    type: "Pothole",
    report:
      "Two depressions fill with water after rain. Riders move towards the centre of the road to avoid the damaged edge.",
    action: "Patch both depressions and compact the road edge",
  },
  {
    title: "Footpath tiles lifted at the crossing",
    category: "roads",
    type: "Damaged footpath",
    report:
      "Loose tiles and a raised corner leave very little room for wheelchairs. Pedestrians step onto the road near the crossing.",
    action: "Relay the loose tiles and restore a level walking surface",
  },
  {
    title: "Valve chamber leaking through the morning",
    category: "water",
    type: "Water leakage",
    report:
      "Water emerges from the valve chamber every morning and flows across the footpath. The walking surface remains slippery until afternoon.",
    action: "Replace the valve seal and check for leakage after supply resumes",
  },
  {
    title: "Low pressure on the upper lane",
    category: "water",
    type: "Water shortage",
    report:
      "The supply reaches ground-floor taps but the upper lane gets only a short trickle. Residents have recorded the last three morning supply windows.",
    action:
      "Measure pressure during the supply window and inspect the local valve",
  },
  {
    title: "Drain outlet backing up after rain",
    category: "drainage",
    type: "Blocked drain",
    report:
      "The inlet looks clear but water is not passing through the outlet. Water collects beside the crossing after even a short shower.",
    action: "Clear the outlet and demonstrate a flow test",
  },
  {
    title: "Waste collection missed at the market corner",
    category: "drainage",
    type: "Uncollected waste",
    report:
      "Collection has been missed on two successive mornings. Bags now occupy part of the walking route beside the market entrance.",
    action:
      "Collect the accumulated waste and restore the regular pickup route",
  },
  {
    title: "Three lamps dark on the station approach",
    category: "lighting",
    type: "Broken streetlight",
    report:
      "Three consecutive lamps remain dark after sunset. Commuters use phone torches on the walking route from the station.",
    action: "Inspect the feeder and restore all three lamps",
  },
  {
    title: "Cable cover loose beside the pedestrian lane",
    category: "lighting",
    type: "Exposed wiring",
    report:
      "A lamp-post cable cover is hanging loose next to the footpath. Residents have kept their distance and asked for the area to be made safe.",
    action:
      "Secure the area and have the electrical team refit the cable cover",
  },
  {
    title: "Road edge crumbling beside the service lane",
    category: "roads",
    type: "Broken road surface",
    report:
      "The road edge has broken away along the service lane. Loose aggregate spreads onto the route used by bicycles.",
    action: "Rebuild the damaged edge and remove loose aggregate",
  },
  {
    title: "Drain overflowing at the lane entrance",
    category: "drainage",
    type: "Overflowing drain",
    report:
      "Water overflows near the lane entrance during peak morning use. The problem returns even after the visible debris is removed.",
    action: "Inspect the downstream blockage and restore flow",
  },
  {
    title: "Dim stretch between the crossing and shops",
    category: "lighting",
    type: "Unlit stretch",
    report:
      "The stretch between the crossing and the first row of shops has no working lamps. The crossing itself is difficult to see after sunset.",
    action: "Inspect the lighting circuit and restore the dark stretch",
  },
  {
    title: "Cloudy water reported at the lane taps",
    category: "water",
    type: "Contaminated supply",
    report:
      "Residents report cloudy water during the first few minutes of supply. They have asked for sampling and a clear update on the cause.",
    action: "Collect a water sample and report the test result and next action",
  },
]
const stages: IssueStatus[] = [
  "reported",
  "assigned",
  "following_up",
  "awaiting_verification",
  "verified",
  "disputed",
]
const names = [
  "Anagha Kulkarni",
  "Rohan Pawar",
  "Sayali Joshi",
  "Aditya More",
  "Neha Shinde",
  "Kunal Bhosale",
]

export function seedCityDemo(db: ReturnType<typeof database>["db"]) {
  if (process.env.PRAMANIK_DEMO_CITY === "false") return
  db.transaction((tx) => {
    const marker = "city-demo-v1"
    if (
      tx
        .select()
        .from(s.participants)
        .where(eq(s.participants.id, marker))
        .get()
    )
      return
    const now = Date.now()
    const at = (hours: number) =>
      new Date(now - hours * 3_600_000).toISOString()
    for (const [areaIndex, area] of LOCALITIES.entries()) {
      const officeId = `city-demo-office-${area.id}`
      const contactId = `${officeId}-contact`
      tx.insert(s.offices)
        .values({
          id: officeId,
          name: `${area.name} civic response desk`,
          governmentBody: "Pramanik demo civic services",
          designation: "Area services coordinator",
          personName: names[areaIndex],
          address: `${area.name}, Pune`,
          localityId: area.id,
          areaIds: [area.id],
          jurisdiction: `${area.name} demonstration cases`,
          topics: "roads footpaths water drainage waste lighting",
          source: "Pramanik generated demo dataset",
          sourceAsOf: at(0).slice(0, 10),
          verificationStatus: "DEMO",
          isDemo: true,
        })
        .run()
      tx.insert(s.contacts)
        .values({
          id: contactId,
          officeId,
          displayName: names[areaIndex],
          designation: "Area services coordinator",
          phone: "",
          authorized: false,
          isDemo: true,
          publicationConsent: true,
          recordingConsent: false,
          language: "en",
        })
        .run()
      for (const [index, scenario] of scenarios.entries()) {
        const id = `city-demo-${area.id}-${index + 1}`
        const status = stages[(index + areaIndex) % stages.length]
        const reportedHours = 48 + index * 11 + areaIndex * 7
        const createdAt = at(reportedHours)
        const completed = [
          "verified",
          "awaiting_verification",
          "disputed",
        ].includes(status)
        const hasCall = !["reported", "assigned"].includes(status)
        const dueAt = at(status === "following_up" && index % 2 ? -18 : 24)
        const landmark = `${area.name} ${["bus-stop service lane", "market entrance", "station approach", "residential crossing"][index % 4]}, point ${areaIndex + 1}-${index + 1}`
        const reportCount = 3 + ((index * 3 + areaIndex) % 12)
        const nextAction =
          status === "verified"
            ? "Repair checked by residents; preserve the record for future reference."
            : status === "disputed"
              ? "Request a fresh site inspection using the conflicting resident observation."
              : status === "awaiting_verification"
                ? "Collect resident checks before closing the case."
                : hasCall
                  ? "Follow up on the recorded action and request completion evidence."
                  : status === "assigned"
                    ? "Confirm the inspection date with the assigned response desk."
                    : "Review the resident reports and confirm the responsible desk."
        tx.insert(s.issues)
          .values({
            id,
            title: scenario.title,
            description: scenario.report,
            category: scenario.category,
            issueType: scenario.type,
            localityId: area.id,
            landmark,
            lat:
              area.lat +
              (Math.floor(index / 4) - 1) * 0.0025 +
              areaIndex * 0.00015,
            lng: area.lng + ((index % 4) - 1.5) * 0.0025,
            status,
            officeId: status === "reported" ? null : officeId,
            assignmentCertainty:
              status === "reported" ? "unassigned" : "demo_confirmed",
            isDemo: true,
            createdAt,
            updatedAt: at(completed ? 4 : hasCall ? 12 : reportedHours - 4),
          })
          .run()
        const residentIds: string[] = []
        const complaintIds: string[] = []
        for (let resident = 0; resident < reportCount; resident++) {
          const participantId = demoId(`${id}:resident:${resident}`)
          residentIds.push(participantId)
          const complaintId = demoId(`${id}:complaint:${resident}`)
          complaintIds.push(complaintId)
          tx.insert(s.participants)
            .values({ id: participantId, tokenHash: participantId })
            .run()
          tx.insert(s.complaints)
            .values({
              id: complaintId,
              issueId: id,
              participantId,
              description: [
                scenario.report,
                `I use ${landmark} on my daily commute. ${scenario.report.split(". ")[0]}.`,
                `This is the same location already reported near ${landmark}. Please give us an inspection date.`,
              ][resident % 3],
              createdAt: at(reportedHours - resident * 0.4),
            })
            .run()
        }
        const event = (
          key: string,
          hours: number,
          title: string,
          description: string,
          kind: string
        ) =>
          tx
            .insert(s.issueEvents)
            .values({
              id: demoId(`${id}:event:${key}`),
              issueId: id,
              title,
              description,
              kind,
              source: "Pramanik demo dataset",
              createdAt: at(hours),
            })
            .run()
        event(
          "report",
          reportedHours,
          "Community case opened",
          `${reportCount} residents describe the problem near ${landmark}.`,
          "reported"
        )
        if (status !== "reported") {
          tx.insert(s.issueAssignments)
            .values({
              id: demoId(`${id}:assignment`),
              issueId: id,
              officeId,
              certainty: "demo_confirmed",
              reason:
                "Assigned to the area response desk in the demonstration scenario.",
              createdAt: at(reportedHours - 4),
            })
            .run()
          event(
            "assignment",
            reportedHours - 4,
            "Office assignment reviewed",
            `${names[areaIndex]}, area services coordinator, will handle the next update.`,
            "assignment"
          )
        }
        const runId = demoId(`${id}:run`)
        const agentId = demoId(`${id}:agent`)
        const firstCallId = demoId(`${id}:call:1`)
        const lastCallId = demoId(`${id}:call:2`)
        const evidenceId = demoId(`${id}:evidence`)
        tx.insert(s.evidence)
          .values({
            id: evidenceId,
            issueId: id,
            participantId: residentIds[0],
            caption: `${CATEGORIES[scenario.category].label}: ${scenario.report.split(". ")[0]}.`,
            url: `/demo-city/${scenario.category}.svg`,
            phase: "report",
            createdAt,
            location: {
              source: "demo",
              observedAt: createdAt,
              accuracy: 15,
              distanceMeters: 8,
              proximity: "simulated",
            },
          })
          .run()
        tx.insert(s.followUpRuns)
          .values({
            id: runId,
            requestId: runId,
            contactId,
            scope: "issue",
            localityId: area.id,
            state: status === "verified" ? "completed" : "paused",
            language: "en",
            createdAt,
            updatedAt: at(4),
            brief: {
              provenance: "scripted_demo",
              preparedAt: at(reportedHours - 6),
              summary: scenario.report,
              caseSummaries: [
                {
                  issueId: id,
                  sourceComplaintIds: complaintIds,
                  summary: scenario.report,
                },
              ],
              questions: [
                {
                  issueId: id,
                  question: `What is the next action at ${landmark}, and when will it be completed?`,
                },
              ],
              missingEvidence: [
                {
                  issueId: id,
                  detail:
                    "A dated site photograph and a resident check are needed after completion.",
                },
              ],
              nextAction,
              actionPlan: [
                {
                  issueId: id,
                  kind: completed ? "resident_review" : "call_contact",
                  title: scenario.action,
                  reason: nextAction,
                  question:
                    "Who owns the next step and when will residents receive an update?",
                },
              ],
            },
          })
          .run()
        tx.insert(s.followUpRunIssues)
          .values({
            id: demoId(`${id}:run-link`),
            followUpRunId: runId,
            issueId: id,
          })
          .run()
        tx.insert(s.agentRuns)
          .values({
            id: agentId,
            issueId: id,
            state: "completed",
            promptVersion: "city-demo-v1",
            context: { provenance: "scripted_demo", issueId: id },
            createdAt,
          })
          .run()
        tx.insert(s.caseworkPlans)
          .values({
            id: demoId(`${id}:plan`),
            issueId: id,
            inputFingerprint: "city-demo-v1",
            state: "completed",
            relatedIssueIds: [],
            contactCandidates: [
              {
                id: officeId,
                name: names[areaIndex],
                reason: "Area services coordination",
              },
            ],
            nextAction,
            followUpRunId: runId,
            createdAt,
            updatedAt: at(4),
          })
          .run()
        if (hasCall) {
          for (let callIndex = 0; callIndex < 2; callIndex++) {
            const callId = callIndex ? lastCallId : firstCallId
            const response = callIndex
              ? completed
                ? `The team has completed the work at ${landmark}. Please ask residents to check the result.`
                : `The inspection is complete. ${scenario.action}; the team is awaiting its work slot.`
              : `Our area desk will coordinate this work. We will ${scenario.action.toLowerCase()} by ${new Date(dueAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}.`
            const question = callIndex
              ? `Following up on the previous commitment for ${landmark}. What work has actually been completed?`
              : `${reportCount} residents report this problem at ${landmark}. ${scenario.report} What is your next action?`
            const progress =
              callIndex && completed ? "completion_claimed" : "in_progress"
            tx.insert(s.calls)
              .values({
                id: callId,
                issueId: id,
                runId: agentId,
                contactId,
                followUpRunId: runId,
                idempotencyKey: `scripted:${callId}`,
                status: "completed",
                duration: 54 + index * 5 + callIndex * 12,
                summary: response,
                transcript: `agent: ${question}\nofficer: ${response}\nagent: ${nextAction}`,
                outcome: {
                  provenance: { kind: "scripted_demo", version: 1 },
                  nextAction,
                  cases: [
                    {
                      issueId: id,
                      summary: response,
                      progress,
                      nextAction,
                      responseSignals: {
                        responsibilityClarified: !callIndex,
                        actionPlanGiven: true,
                        deadlineGiven: !callIndex,
                        evidenceQuote: response,
                        uncertainty: "Generated demonstration conversation.",
                      },
                    },
                  ],
                },
                createdAt: at(callIndex ? 12 : reportedHours - 8),
                updatedAt: at(callIndex ? 12 : reportedHours - 8),
              })
              .run()
            tx.insert(s.callIssues)
              .values({ id: demoId(`${callId}:link`), callId, issueId: id })
              .run()
          }
          tx.insert(s.commitments)
            .values({
              id: demoId(`${id}:promise`),
              issueId: id,
              sourceCallId: firstCallId,
              action: scenario.action,
              dueAt,
              status:
                status === "verified"
                  ? "fulfilled"
                  : new Date(dueAt).getTime() < now
                    ? "overdue"
                    : "upcoming",
              createdAt: at(reportedHours - 8),
            })
            .run()
          event(
            "promise",
            reportedHours - 8,
            "Action and deadline recorded",
            scenario.action,
            "commitment"
          )
        }
        if (completed) {
          const surveyId = demoId(`${id}:survey`)
          tx.insert(s.surveys)
            .values({
              id: surveyId,
              issueId: id,
              sourceCallId: lastCallId,
              state: status === "awaiting_verification" ? "open" : "closed",
              reviewNote:
                status === "awaiting_verification" ? null : nextAction,
              reviewedAt: status === "awaiting_verification" ? null : at(4),
              createdAt: at(10),
            })
            .run()
          if (status !== "awaiting_verification")
            for (let response = 0; response < 3; response++)
              tx.insert(s.surveyResponses)
                .values({
                  id: demoId(`${id}:response:${response}`),
                  surveyId,
                  participantId: residentIds[response],
                  answer:
                    status === "verified"
                      ? "fixed"
                      : response === 0
                        ? "partially_fixed"
                        : "not_fixed",
                  note:
                    status === "verified"
                      ? `The work at ${landmark} is complete and the route is usable.`
                      : `Some work was done, but the reported problem at ${landmark} remains.`,
                  evidenceId,
                  createdAt: at(6 - response * 0.5),
                })
                .run()
          event(
            "review",
            4,
            status === "verified"
              ? "Case moved to verified"
              : status === "disputed"
                ? "Case moved to disputed"
                : "Resident verification requested",
            nextAction,
            "status"
          )
        }
        for (const [step, summary] of [
          [
            "reports",
            `Consolidated ${reportCount} observations at ${landmark}`,
          ],
          [
            "history",
            hasCall
              ? "Recalled two conversations and the original action commitment"
              : "Prepared the first conversation brief",
          ],
          ["responsibility", `Checked the area response desk for ${area.name}`],
          ["coordinator", nextAction],
          [
            "verification",
            completed ? nextAction : "Completion evidence remains outstanding",
          ],
        ])
          tx.insert(s.agentActivities)
            .values({
              id: demoId(`${id}:activity:${step}`),
              issueId: id,
              followUpRunId: runId,
              action: `office_${step}`,
              state: "completed",
              summary,
              detail: {
                provenance: "scripted_demo",
                officeRole: step,
                issueIds: [id],
                sourceIds: complaintIds,
                startedAt: at(reportedHours - 6),
                finishedAt: at(4),
              },
              createdAt: at(reportedHours - 6),
              updatedAt: at(4),
              dedupeKey: `city-demo:${id}:${step}`,
            })
            .run()
        if (status === "disputed")
          tx.insert(s.escalations)
            .values({
              id: demoId(`${id}:escalation`),
              issueId: id,
              dossierVersion: 1,
              fingerprint: demoId(`${id}:escalation-fingerprint`),
              draft: `To the area services coordinator, ${area.name}: Residents at ${landmark} report that the problem remains after the recorded completion claim. Please arrange a fresh inspection, confirm the outstanding work and provide a revised action date. Original action: ${scenario.action}.`,
              state: "draft",
              createdAt: at(3),
            })
            .run()
      }
    }
    tx.insert(s.participants)
      .values({ id: marker, tokenHash: demoId(marker) })
      .run()
  })
}
