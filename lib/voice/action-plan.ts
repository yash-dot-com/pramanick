import { and, eq, desc } from "drizzle-orm"
import * as s from "@/lib/db/schema"
import { snapshot, store } from "@/lib/civic/repository"
import { publicText } from "@/lib/civic/dossier"
import { isScriptedDemo } from "@/lib/civic/demo-office-data"

export type PublicAction = {
  id: string
  issueId: string
  runId: string | null
  kind: string
  title: string
  reason: string
  question: string
  state: "planned" | "running" | "scheduled" | "completed" | "needs_attention"
  dueAt: string | null
  person: string
  sourceComplaintIds: string[]
}
export function publicActionPlan() {
  const { db } = store()
  const civic = snapshot()
  const plans = db.select().from(s.caseworkPlans).all()
  const runs = db
    .select()
    .from(s.followUpRuns)
    .orderBy(desc(s.followUpRuns.createdAt))
    .all()
  const links = db.select().from(s.followUpRunIssues).all()
  const calls = db.select().from(s.calls).all()
  const callLinks = db.select().from(s.callIssues).all()
  const jobs = db.select().from(s.followUpJobs).all()
  const contacts = db.select().from(s.contacts).all()
  const tasks: PublicAction[] = []
  for (const issue of civic.issues) {
    const plan = plans.find((item) => item.issueId === issue.id)
    const run = runs.find((item) =>
      links.some(
        (link) => link.issueId === issue.id && link.followUpRunId === item.id
      )
    )
    if (!plan && !run) continue
    const person = contacts.find((item) => item.id === run?.contactId)
    const base = {
      issueId: issue.id,
      runId: run?.id ?? null,
      dueAt: null,
      person:
        person?.displayName ||
        person?.designation ||
        "Responsibility needs review",
      question: "",
      sourceComplaintIds: [] as string[],
    }
    tasks.push({
      ...base,
      id: `gather:${issue.id}`,
      kind: "aggregate_complaints",
      title: "Gather the community's reports",
      reason: `${issue.complaintCount} complaints and ${issue.evidence.length} photographs in this case.`,
      state: plan || run?.brief ? "completed" : "planned",
    })
    const preparing = jobs.find(
      (job) => job.followUpRunId === run?.id && job.kind === "prepare_run"
    )
    tasks.push({
      ...base,
      id: `plan:${issue.id}`,
      kind: "prepare_run",
      title: "Prepare the questions and next steps",
      reason:
        "Read the reports, earlier responses and promises before deciding what to ask.",
      state: run?.brief
        ? "completed"
        : preparing?.state === "running"
          ? "running"
          : preparing?.state === "needs_review"
            ? "needs_attention"
            : "planned",
    })
    const proposed = Array.isArray(run?.brief?.actionPlan)
      ? (run.brief.actionPlan as {
          issueId: string
          kind: string
          title: string
          reason: string
          question: string
        }[])
      : Array.isArray(run?.brief?.questions)
        ? (run.brief.questions as { issueId: string; question: string }[]).map(
            (item) => ({
              issueId: item.issueId,
              kind: "call_contact",
              title: "Ask the responsibility holder for an update",
              reason: "Question from the saved agent brief",
              question: item.question,
            })
          )
        : []
    const summaries = Array.isArray(run?.brief?.caseSummaries)
      ? (run.brief.caseSummaries as {
          issueId: string
          sourceComplaintIds: string[]
        }[])
      : []
    const relatedCalls = calls.filter(
      (call) =>
        call.followUpRunId === run?.id &&
        (call.issueId === issue.id ||
          callLinks.some(
            (link) => link.callId === call.id && link.issueId === issue.id
          ))
    )
    const active = relatedCalls.find((call) =>
      ["initiating", "queued", "ringing", "in-progress"].includes(call.status)
    )
    const finished = relatedCalls.filter(
      (call) =>
        call.status === "completed" &&
        (call.executionId || isScriptedDemo(call.outcome))
    )
    const queued = jobs.filter(
      (job) =>
        job.followUpRunId === run?.id &&
        ["queued", "retry_pending", "paused", "running"].includes(job.state)
    )
    for (const [index, step] of proposed
      .filter((step) => step.issueId === issue.id)
      .entries()) {
      let state: PublicAction["state"] = "planned"
      let dueAt: string | null = null
      if (step.kind === "call_contact") {
        state = active
          ? "running"
          : finished.length
            ? "completed"
            : run?.state === "awaiting_configuration" ||
                run?.state === "needs_review" ||
                run?.state === "paused" ||
                relatedCalls.some((call) => call.status === "dispatch_unknown")
              ? "needs_attention"
              : queued.some((job) => job.kind === "outbound_call")
                ? "scheduled"
                : "planned"
        dueAt =
          queued.find((job) => job.kind === "outbound_call")?.dueAt ?? null
      } else if (step.kind === "follow_up") {
        const promise = issue.commitments.find(
          (item) => item.status !== "fulfilled"
        )
        dueAt =
          promise?.dueAt ??
          queued.find((job) => job.kind === "deadline_review")?.dueAt ??
          null
        state =
          issue.status === "verified"
            ? "completed"
            : active && finished.length > 0
              ? "running"
              : dueAt
                ? "scheduled"
                : "planned"
      } else if (step.kind === "resident_review") {
        state =
          issue.status === "verified"
            ? "completed"
            : issue.status === "disputed"
              ? "needs_attention"
              : issue.status === "awaiting_verification"
                ? "scheduled"
                : "planned"
      } else if (step.kind === "request_evidence") {
        const after = db
          .select({ id: s.evidence.id })
          .from(s.evidence)
          .where(
            and(
              eq(s.evidence.issueId, issue.id),
              eq(s.evidence.phase, "verification")
            )
          )
          .all()
        state = after.length
          ? "completed"
          : issue.status === "awaiting_verification"
            ? "scheduled"
            : "planned"
      }
      tasks.push({
        ...base,
        id: `${run!.id}:${issue.id}:${index}`,
        kind: step.kind,
        title: publicText(step.title),
        reason: publicText(step.reason),
        question: publicText(step.question),
        state,
        dueAt,
        sourceComplaintIds:
          summaries.find((item) => item.issueId === issue.id)
            ?.sourceComplaintIds ?? [],
      })
    }
  }
  return tasks
}
