import { snapshot, store } from "./repository"
import { publicText } from "./dossier"
import * as s from "@/lib/db/schema"
import { demoContact } from "@/lib/voice/contact"
import { isScriptedDemo } from "./demo-office-data"

const terminal = new Set([
  "completed",
  "no-answer",
  "busy",
  "failed",
  "canceled",
  "stopped",
  "error",
  "balance-low",
])
function median(values: number[]) {
  const sorted = values.filter((value) => value >= 0).sort((a, b) => a - b)
  return sorted.length
    ? (sorted[Math.floor(sorted.length / 2)] +
        sorted[Math.ceil(sorted.length / 2) - 1]) /
        2
    : null
}
function ratio(numerator: number, denominator: number) {
  return denominator ? Math.round((numerator / denominator) * 100) : null
}

export function responsibilityProfiles() {
  demoContact(false)
  const { db } = store()
  const civic = snapshot()
  const contacts = db.select().from(s.contacts).all()
  const offices = db.select().from(s.offices).all()
  const allCalls = db.select().from(s.calls).all()
  const links = db.select().from(s.callIssues).all()
  const assignments = db.select().from(s.issueAssignments).all()
  const contactsForOffice = (id: string) =>
    contacts.filter((contact) => contact.officeId === id)
  const facts = (contactIds: string[], officeId?: string) => {
    const scripted = allCalls.some(
      (call) =>
        contactIds.includes(call.contactId) &&
        isScriptedDemo(call.outcome) &&
        contacts.some(
          (contact) => contact.id === call.contactId && contact.isDemo
        )
    )
    const phoneCalls = allCalls.filter(
      (call) =>
        contactIds.includes(call.contactId) &&
        (scripted
          ? isScriptedDemo(call.outcome)
          : !!call.executionId &&
            !!contacts.find((contact) => contact.id === call.contactId)?.phone)
    )
    const associated = new Set([
      ...phoneCalls.map((call) => call.issueId),
      ...links
        .filter((link) => phoneCalls.some((call) => call.id === link.callId))
        .map((link) => link.issueId),
      ...(officeId
        ? civic.issues
            .filter((issue) => issue.officeId === officeId)
            .map((issue) => issue.id)
        : []),
    ])
    const cases = civic.issues.filter((issue) => associated.has(issue.id))
    const finalized = phoneCalls.filter((call) => terminal.has(call.status))
    const answered = finalized.filter(
      (call) => call.status === "completed" && (call.duration ?? 0) > 0
    )
    const verified = cases.filter((issue) => issue.status === "verified")
    const verifiedDate = (issue: (typeof cases)[number]) =>
      [...issue.events]
        .reverse()
        .find(
          (event) =>
            event.kind === "status" && event.title === "Case moved to verified"
        )?.createdAt ?? null
    const relevantPromises = cases.flatMap((issue) =>
      issue.commitments
        .filter((promise) => {
          const call = allCalls.find((item) => item.id === promise.sourceCallId)
          return !!call && contactIds.includes(call.contactId)
        })
        .map((promise) => ({ issue, promise }))
    )
    const due = relevantPromises.filter(
      ({ promise }) =>
        promise.dueAt && new Date(promise.dueAt).getTime() <= Date.now()
    )
    const kept = due.filter(({ issue, promise }) => {
      const date = verifiedDate(issue)
      return date && promise.dueAt && new Date(date) <= new Date(promise.dueAt)
    })
    const responses = cases.flatMap((issue) => {
      const first = answered
        .filter((call) => {
          if (!(
            call.issueId === issue.id ||
            links.some(
              (link) => link.callId === call.id && link.issueId === issue.id
            )
          ))
            return false
          const outcomes = Array.isArray(call.outcome?.cases)
            ? (call.outcome.cases as {
                issueId: string
                progress?: string
                responseSignals?: {
                  actionPlanGiven?: boolean
                  deadlineGiven?: boolean
                  responsibilityClarified?: boolean
                }
              }[])
            : []
          return outcomes.some(
            (outcome) =>
              outcome.issueId === issue.id &&
              ([
                "not_started",
                "in_progress",
                "completion_claimed",
                "wrong_contact",
              ].includes(outcome.progress ?? "") ||
                outcome.responseSignals?.actionPlanGiven ||
                outcome.responseSignals?.deadlineGiven ||
                outcome.responseSignals?.responsibilityClarified)
          )
        })
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0]
      return first
        ? [
            (new Date(first.createdAt).getTime() -
              new Date(issue.createdAt).getTime()) /
              3_600_000,
          ]
        : []
    })
    const resolution = verified.flatMap((issue) => {
      const date = verifiedDate(issue)
      return date
        ? [
            (new Date(date).getTime() - new Date(issue.createdAt).getTime()) /
              3_600_000,
          ]
        : []
    })
    const callsToFix = verified.map(
      (issue) =>
        phoneCalls.filter(
          (call) =>
            (call.issueId === issue.id ||
              links.some(
                (link) => link.callId === call.id && link.issueId === issue.id
              )) &&
            (!verifiedDate(issue) || call.createdAt <= verifiedDate(issue)!)
        ).length
    )
    const notes = phoneCalls
      .filter((call) => call.outcome)
      .flatMap((call) => {
        const outcomes = Array.isArray(call.outcome?.cases)
          ? (call.outcome.cases as {
              issueId: string
              responseSignals?: {
                actionPlanGiven?: boolean
                deadlineGiven?: boolean
                responsibilityClarified?: boolean
                evidenceQuote?: string
                uncertainty?: string
              }
            }[])
          : []
        return outcomes
          .filter((outcome) => outcome.responseSignals?.evidenceQuote)
          .map((outcome) => ({
            callId: call.id,
            issueId: outcome.issueId,
            createdAt: call.createdAt,
            ...outcome.responseSignals,
            evidenceQuote: publicText(outcome.responseSignals?.evidenceQuote),
            uncertainty: publicText(outcome.responseSignals?.uncertainty),
          }))
      })
    return {
      dataMode: scripted
        ? ("scripted_demo" as const)
        : ("provider_records" as const),
      assignedCases: cases.length,
      verifiedFixes: verified.length,
      unresolvedCases: cases.length - verified.length,
      phoneAttempts: phoneCalls.length,
      finalizedAttempts: finalized.length,
      answeredCalls: answered.length,
      answerRate: ratio(answered.length, finalized.length),
      verifiedFixRate: ratio(verified.length, cases.length),
      promisesDue: due.length,
      promisesVerifiedByDeadline: kept.length,
      promiseKeptRate: ratio(kept.length, due.length),
      overduePromises: due.length - kept.length,
      medianFirstResponseHours: median(responses),
      medianResolutionHours: median(resolution),
      medianCallsToFix: median(callsToFix),
      disputedCases: cases.filter((issue) => issue.status === "disputed")
        .length,
      reopenedCases: cases.filter(
        (issue) =>
          issue.events.some(
            (event) => event.title === "Case moved to verified"
          ) &&
          issue.events.some((event) => event.title === "Case moved to disputed")
      ).length,
      busyCalls: finalized.filter((call) => call.status === "busy").length,
      unansweredCalls: finalized.filter((call) => call.status === "no-answer")
        .length,
      blocking: "Not established by available provider data",
      notes,
      cases: cases.map((issue) => ({
        id: issue.id,
        title: issue.title,
        status: issue.status,
        isDemo: issue.isDemo,
        createdAt: issue.createdAt,
        unresolvedDays:
          issue.status === "verified"
            ? null
            : Math.max(
                0,
                Math.floor(
                  (Date.now() - new Date(issue.createdAt).getTime()) /
                    86_400_000
                )
              ),
      })),
      calls: phoneCalls.map((call) => ({
        id: call.id,
        issueId: call.issueId,
        status: call.status,
        createdAt: call.createdAt,
        summary: publicText(call.summary),
      })),
      dateRange: {
        from:
          [
            ...cases.map((issue) => issue.createdAt),
            ...phoneCalls.map((call) => call.createdAt),
          ].sort()[0] ?? null,
        to: new Date().toISOString(),
      },
      attribution: scripted
        ? "Illustrative measures computed from fictional cases and scripted conversations with synthetic audio. These are not real official performance records."
        : officeId
          ? "Current office assignments plus attributed calls. Team outcomes may involve several people."
          : "Cases discussed on this person's demo phone calls; this does not establish sole responsibility for a repair.",
    }
  }
  const profiles = offices.map((office) => ({
    id: office.id,
    kind: "office" as const,
    name: office.name,
    role: office.designation,
    officeId: office.id,
    officeName: office.name,
    isDemo: office.isDemo,
    source: office.source,
    ...facts(
      contactsForOffice(office.id).map((contact) => contact.id),
      office.id
    ),
  }))
  const people = contacts
    .filter(
      (contact) =>
        !!contact.displayName &&
        (contact.id !== "demo-phone-pending" ||
          !contacts.some(
            (item) => item.isDemo && !!item.phone && !!item.displayName
          ))
    )
    .map((contact) => ({
      id: contact.id,
      kind: "person" as const,
      name: contact.displayName,
      role: contact.designation,
      officeId: contact.officeId,
      officeName:
        offices.find((office) => office.id === contact.officeId)?.name ??
        "Office",
      isDemo: contact.isDemo,
      source: contact.isDemo ? "User-configured demonstration" : "Directory",
      ...facts([contact.id]),
    }))
  const publishedPeople = offices
    .filter((office) => !!office.personName && !office.isDemo)
    .map((office) => ({
      id: `person:${office.id}`,
      kind: "person" as const,
      name: office.personName!,
      role: office.designation,
      officeId: office.id,
      officeName: office.name,
      isDemo: false,
      source: office.source,
      ...facts([]),
      attribution:
        "Published directory role only. No verified individual call attribution is available yet.",
    }))
  return {
    profiles: [...people, ...publishedPeople, ...profiles],
    definitions: {
      answerRate:
        "Answered completed phone calls with positive provider duration / finalized phone attempts. Browser conversations excluded.",
      promiseKeptRate:
        "Promises whose linked case was independently verified by their deadline / promises due. Verification time is the conservative measure used here.",
      verifiedFixRate:
        "Currently verified cases / associated cases. Association is shown; it does not establish individual causation.",
      firstResponse:
        "Issue report to the start of the first answered call yielding a documented update, action plan, deadline, or ownership clarification.",
      rankings:
        "Sort comparable roles by one measure. No synthetic character or voting-worthiness score.",
    },
    assignmentHistoryCount: assignments.length,
  }
}
export type ResponsibilityProfile = ReturnType<
  typeof responsibilityProfiles
>["profiles"][number]
