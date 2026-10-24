import { desc, isNull, sql } from "drizzle-orm"
import { store, snapshot } from "@/lib/civic/repository"
import { publicText } from "@/lib/civic/dossier"
import * as s from "@/lib/db/schema"
import { voiceOperations } from "./operations"
import { publicActionPlan } from "./action-plan"
import { publicRecordingPath } from "./recording"

export function publicAgentDashboard() {
  const { db } = store()
  const civic = snapshot()
  const operations = voiceOperations()
  const contacts = db.select().from(s.contacts).all()
  const calls = db.select().from(s.calls).orderBy(desc(s.calls.createdAt)).all()
  const links = db.select().from(s.callIssues).all()
  const publicCalls = calls.slice(0, 100).map((call) => {
    const person = contacts.find((item) => item.id === call.contactId)
    return {
      id: call.id,
      issueId: call.issueId,
      issueTitle:
        civic.issues.find((item) => item.id === call.issueId)?.title ??
        call.issueId,
      relatedIssueIds: links
        .filter((item) => item.callId === call.id)
        .map((item) => item.issueId),
      followUpRunId: call.followUpRunId,
      status: call.status,
      createdAt: call.createdAt,
      duration: call.duration,
      kind: person?.phone ? "phone" : "browser",
      providerConfirmed: !!call.executionId,
      person: person
        ? {
            name: person.displayName || person.designation,
            role: person.designation,
            isDemo: person.isDemo,
          }
        : null,
      summary: publicText(call.summary),
      transcript: person?.publicationConsent
        ? publicText(call.transcript)
        : null,
      recordingUrl:
        person?.publicationConsent && person.recordingConsent
          ? call.recordingUrl
            ? publicRecordingPath(call.id)
            : null
          : null,
      nextAction: publicText(
        typeof call.outcome?.nextAction === "string"
          ? call.outcome.nextAction
          : ""
      ),
    }
  })
  const phone = calls.filter(
    (call) =>
      call.executionId &&
      contacts.find((person) => person.id === call.contactId)?.phone
  )
  return {
    capturedAt: new Date().toISOString(),
    worker: operations.worker,
    demoPhoneConfigured: operations.phoneDemoConfigured,
    publication: {
      transcript: operations.contact.publicationConsent,
      recording: operations.contact.recordingConsent,
    },
    actions: publicActionPlan(),
    recipient: {
      name: operations.contact.displayName,
      language: operations.contact.language,
      isDemo: true,
    },
    metrics: {
      phoneAttempts: phone.length,
      completedCalls: phone.filter((call) => call.status === "completed")
        .length,
      answeredCalls: phone.filter(
        (call) => call.status === "completed" && (call.duration ?? 0) > 0
      ).length,
      unansweredCalls: phone.filter((call) =>
        ["no-answer", "busy"].includes(call.status)
      ).length,
      browserConversations:
        db
          .select({
            id: s.intakeSessions.id,
            provider: s.intakeSessions.provider,
          })
          .from(s.intakeSessions)
          .all()
          .filter((session) => session.provider === "sarvam").length +
        calls.filter(
          (call) =>
            !contacts.find((person) => person.id === call.contactId)?.phone
        ).length,
      activeRuns: operations.followUpRuns.filter((run) =>
        ["active", "preparing"].includes(run.state)
      ).length,
      queuedJobs: operations.jobs.filter((job) =>
        ["queued", "retry_pending"].includes(job.state)
      ).length,
      awaitingVerification: civic.issues.filter(
        (issue) => issue.status === "awaiting_verification"
      ).length,
      verifiedIssues: civic.issues.filter(
        (issue) => issue.status === "verified"
      ).length,
      overduePromises: civic.issues
        .flatMap((issue) => issue.commitments)
        .filter((promise) => promise.status === "overdue").length,
    },
    routines: db.select().from(s.agentRoutines).all(),
    plans: db
      .select()
      .from(s.caseworkPlans)
      .orderBy(desc(s.caseworkPlans.updatedAt))
      .all(),
    activities: db
      .select()
      .from(s.agentActivities)
      .where(isNull(s.agentActivities.intakeSessionId))
      .orderBy(desc(sql`rowid`))
      .limit(120)
      .all(),
    runs: operations.followUpRuns.map((run) => ({
      id: run.id,
      state: run.state,
      localityId: run.localityId,
      issueIds: run.issueIds,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    })),
    jobs: operations.jobs.map((job) => ({
      ...job,
      error: publicText(job.error),
    })),
    calls: publicCalls,
    issues: civic.issues.map((issue) => ({
      id: issue.id,
      title: publicText(issue.title),
      localityId: issue.localityId,
      status: issue.status,
      isDemo: issue.isDemo,
      complaintCount: issue.complaintCount,
      nextFollowUp: issue.nextFollowUp,
      latestUpdate: publicText(issue.events[0]?.title),
    })),
    limits:
      "Calls target the configured consenting demo recipient. Directory matches are candidates. Browser calls and unconfirmed dispatches are excluded from phone-attempt counts. Conversation publication requires consent.",
  }
}
export type PublicAgentDashboard = ReturnType<typeof publicAgentDashboard>
