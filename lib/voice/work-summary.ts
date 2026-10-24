import type { TraceData, TraceStep } from "./activity-trace"
import type { PublicAgentDashboard } from "./dashboard"
import { activityStatus, traceRecord } from "./trace-presentation"

export type WorkRecords = Pick<
  PublicAgentDashboard,
  "activities" | "plans" | "capturedAt"
>
export type WorkState = "working" | "done" | "planned" | "waiting" | "attention"
export type WorkItem = {
  id: string
  title: string
  note: string
  state: WorkState
  at?: string
  dueAt?: string | null
  questions?: string[]
}

const actionNames: Record<string, [string, string]> = {
  aggregate_complaints: [
    "Gathering the community’s reports",
    "Gathered the community’s reports",
  ],
  deduplicate_complaints: [
    "Checking for nearby reports of the same problem",
    "Checked for nearby reports of the same problem",
  ],
  search_contacts: [
    "Looking for an office that may be responsible",
    "Looked up possible responsible offices",
  ],
  plan_next_action: [
    "Deciding what to do next",
    "Saved the next step for this complaint",
  ],
  prepare_run: [
    "Reading the reports and deciding what to ask",
    "Prepared the questions and next steps",
  ],
  outbound_call: [
    "Arranging a call with the contact",
    "Processed a call request",
  ],
  provider_sync: [
    "Checking whether the conversation has finished",
    "Checked the conversation record",
  ],
  extract_outcome: [
    "Writing down the response and any promises",
    "Saved the conversation notes",
  ],
  extract_call_outcome: [
    "Writing down the response and any promises",
    "Saved the conversation notes",
  ],
  deadline_review: [
    "Checking whether a promised deadline was met",
    "Checked a promised deadline",
  ],
  assess_evidence: [
    "Reviewing a resident’s repair photograph",
    "Reviewed a resident’s repair photograph",
  ],
  search_complaints: [
    "Looking for related complaints",
    "Looked for related complaints",
  ],
  get_complaint_details: [
    "Reading the complaint and its evidence",
    "Read the complaint and its evidence",
  ],
  get_issue_timeline: [
    "Checking earlier updates and promises",
    "Read earlier updates and promises",
  ],
  find_responsible_offices: [
    "Looking for the office that may be responsible",
    "Looked up possible responsible offices",
  ],
  search_office_directory: [
    "Looking through the office directory",
    "Searched the office directory",
  ],
  record_progress_update: [
    "Saving an update about the work",
    "Saved a progress update",
  ],
  record_commitment: [
    "Writing down what the contact promised",
    "Saved a promise from the contact",
  ],
  select_issue_context: [
    "Opening this complaint for the conversation",
    "Opened this complaint for the conversation",
  ],
  get_follow_up_schedule: [
    "Checking when to follow up again",
    "Checked the next follow-up",
  ],
  stop_follow_ups: [
    "Stopping further calls as requested",
    "Stopped further calls as requested",
  ],
  scan_complaints: [
    "Reading new community reports",
    "Checked the community reports",
  ],
  queue_follow_up: [
    "Arranging the next follow-up",
    "Added a follow-up to the saved plan",
  ],
}
export function describeAgentAction(action: string, state: string) {
  const names = actionNames[action]
  const status = activityStatus(state)
  if (names && status === "attention")
    return `Needs checking: ${names[0].toLowerCase()}`
  if (names && ["waiting", "paused", "cancelled"].includes(status))
    return `Waiting: ${names[0].toLowerCase()}`
  return (
    names?.[status === "completed" ? 1 : 0] ??
    (activityStatus(state) === "completed"
      ? "Saved an update to this case"
      : "Working on this case")
  )
}
function stateFor(state: string): WorkState {
  const status = activityStatus(state)
  return status === "running"
    ? "working"
    : status === "completed"
      ? "done"
      : status === "attention"
        ? "attention"
        : "waiting"
}
function text(value: unknown) {
  return typeof value === "string" ? value : ""
}

// Explain saved instructions without exposing internal casework terminology.
// Keep every condition in the plan; the original record remains in the inspector.
export function plainAgentText(value: string) {
  return value
    .replace(/responsibility holder/gi, "contact")
    .replace(/prior commitment/gi, "earlier promise")
    .replace(/clarifying question/gi, "clear question")
    .replace(/case ID\/history/gi, "case record and its history")
    .replace(
      /substantive resident description/gi,
      "clear description from a resident"
    )
    .replace(/placeholder complaint text/gi, "example complaint text")
    .replace(/\bdossiers?\b/gi, "case history")
    .replace(
      /do not infer repairs or deadlines/gi,
      "do not assume that repairs are finished or that a date has been promised"
    )
}

export function buildWorkSummary(
  data: TraceData,
  selection: string,
  steps: TraceStep[],
  records: WorkRecords | null,
  observedAt = Date.now()
) {
  const run = selection.startsWith("run:")
    ? data.followUpRuns.find((item) => item.id === selection.slice(4))
    : undefined
  const calls = steps.filter((step) => step.kind === "call")
  const callIds = new Set(calls.map((step) => step.callId))
  const issueIds =
    run?.issueIds ??
    calls.flatMap((step) => text(traceRecord(step.detail).issueId) || [])
  const issues = data.civic.issues.filter((issue) =>
    issueIds.includes(issue.id)
  )
  const jobs = steps.filter((step) => step.kind === "job")
  const linkedActivities =
    records?.activities.filter(
      (item) =>
        (run && item.followUpRunId === run.id) ||
        (!!item.callId && callIds.has(item.callId))
    ) ?? []
  const caseActivities =
    records?.activities.filter(
      (item) =>
        !item.followUpRunId &&
        !item.callId &&
        !!item.issueId &&
        issueIds.includes(item.issueId)
    ) ?? []
  const activities = [...linkedActivities, ...caseActivities]
  const caseActivityIds = new Set(caseActivities.map((item) => item.id))
  const activeCall = calls.find((step) =>
    [
      "initiating",
      "queued",
      "ringing",
      "in-progress",
      "call-disconnected",
    ].includes(step.state)
  )
  const running = jobs.find((step) => step.state === "running")
  const activeRecord = linkedActivities.find(
    (item) =>
      item.state === "running" &&
      (!run || ["active", "preparing"].includes(run.state)) &&
      observedAt - Date.parse(item.updatedAt || item.createdAt) < 180_000
  )
  const failedJob = jobs.find(
    (step) => activityStatus(step.state) === "attention"
  )
  const uncertainCall = calls.find((step) => step.state === "dispatch_unknown")
  const verified =
    issues.length > 0 && issues.every((issue) => issue.status === "verified")
  const awaitingReview = issues.some(
    (issue) => issue.status === "awaiting_verification"
  )
  const finishedCall = [...calls]
    .reverse()
    .find((step) => step.state === "completed")
  const plannedJob = [...jobs]
    .filter((step) => ["queued", "retry_pending"].includes(step.state))
    .sort((a, b) =>
      text(traceRecord(a.detail).dueAt).localeCompare(
        text(traceRecord(b.detail).dueAt)
      )
    )[0]
  const brief = run?.brief ?? {}
  const questions = (Array.isArray(brief.questions) ? brief.questions : [])
    .map(traceRecord)
    .filter(
      (item) => issueIds.includes(text(item.issueId)) && text(item.question)
    )
    .map((item) => text(item.question))
  const proposed = (Array.isArray(brief.actionPlan) ? brief.actionPlan : [])
    .map(traceRecord)
    .filter((item) => issueIds.includes(text(item.issueId)))
  const savedCasePlans =
    records?.plans.filter(
      (plan) =>
        run && plan.followUpRunId === run.id && issueIds.includes(plan.issueId)
    ) ?? []

  let now: WorkItem = {
    id: "now",
    state: "waiting",
    title: "Waiting for the next step",
    note: "No action is running for this follow-up right now.",
  }
  if (activeCall)
    now = {
      id: "now",
      state: "working",
      title:
        activeCall.state === "in-progress"
          ? "Talking with the contact now"
          : activeCall.state === "ringing"
            ? "The contact’s phone is ringing"
            : activeCall.state === "call-disconnected"
              ? "The conversation ended. Checking the result"
              : "Getting the conversation connected",
      note: "The response will be saved with this case when it is available.",
    }
  else if (run?.state === "awaiting_configuration")
    now = {
      id: "now",
      state: "attention",
      title: "The call is waiting for a contact to be set up",
      note: "Pramanik can prepare the questions, but a demo phone number and permission to call it are still needed.",
    }
  else if (run?.state === "paused")
    now = {
      id: "now",
      state: "waiting",
      title: "This follow-up is paused",
      note: "The plan and previous updates are saved. Resume the follow-up to continue pending work.",
    }
  else if (uncertainCall)
    now = {
      id: "now",
      state: "attention",
      title: "The last call needs to be checked",
      note: "The agent cannot confirm whether the call was accepted. Someone needs to check the call record before another attempt.",
    }
  else if ((running || activeRecord) && (!run || data.worker?.online)) {
    const action =
      activeRecord?.action ?? text(traceRecord(running?.detail).kind)
    now = {
      id: "now",
      state: "working",
      title: describeAgentAction(action, "running"),
      note: activeRecord
        ? "This action is running and has not finished yet."
        : "The agent is carrying out this saved step.",
    }
  } else if (failedJob || run?.state === "needs_review")
    now = {
      id: "now",
      state: "attention",
      title: "A step could not finish and needs checking",
      note: finishedCall
        ? "The conversation is saved, but some follow-up work needs attention before it can continue."
        : "The saved plan is available. This step needs to be reviewed before the agent continues.",
    }
  else if (verified)
    now = {
      id: "now",
      state: "done",
      title: "Residents have verified the repair",
      note: "The cases in this follow-up are marked as verified.",
    }
  else if (awaitingReview)
    now = {
      id: "now",
      state: "waiting",
      title: "Waiting for residents to check the repair",
      note: "A completion claim has been recorded. Residents still need to confirm whether the problem is fixed.",
    }
  else if (!data.worker?.online && run)
    now = {
      id: "now",
      state: "waiting",
      title: "The agent is offline for now",
      note: "The plan is saved. Pending work will wait until the agent is back online.",
    }
  else if (plannedJob)
    now = {
      id: "now",
      state: "waiting",
      title: "The next step is lined up",
      note: "No action is running right now. The agent will pick up the saved work when it is due.",
    }
  else if (finishedCall)
    now = {
      id: "now",
      state: "done",
      title: "The conversation has finished",
      note:
        text(traceRecord(finishedCall.detail).summary) ||
        "The conversation record is saved. Its notes may still be awaiting review.",
    }
  else if (run?.state === "preparing")
    now = {
      id: "now",
      state: "waiting",
      title: "Waiting to read the reports and prepare a plan",
      note: "The follow-up has been saved. The agent has not finished preparing the questions yet.",
    }

  const callPlanState: WorkState = activeCall
    ? "working"
    : uncertainCall
      ? "attention"
      : finishedCall
        ? "done"
        : run?.state === "awaiting_configuration"
          ? "attention"
          : run?.state === "paused"
            ? "waiting"
            : "planned"
  const next: WorkItem[] = proposed.map((item, index) => ({
    id: `plan:${index}`,
    title: text(item.title) || "Follow the saved plan",
    note: plainAgentText(text(item.reason)),
    state:
      item.kind === "call_contact"
        ? callPlanState
        : item.kind === "resident_review"
          ? verified
            ? "done"
            : awaitingReview
              ? "waiting"
              : "planned"
          : "planned",
    questions: text(item.question) ? [text(item.question)] : [],
  }))
  if (!next.length && questions.length)
    next.push({
      id: "questions",
      title: "Ask the contact for a clear update",
      note: "These questions were prepared from the saved case reports.",
      state: callPlanState,
      questions,
    })
  if (!next.length && savedCasePlans.length)
    next.push(
      ...savedCasePlans.map((plan) => ({
        id: plan.id,
        title: "The saved next step",
        note: plainAgentText(plan.nextAction),
        state: "planned" as const,
      }))
    )
  if (text(brief.nextAction))
    next.push({
      id: "next",
      title: "The next step in the saved plan",
      note: plainAgentText(text(brief.nextAction)),
      state: "planned",
    })
  const missing = (
    Array.isArray(brief.missingEvidence) ? brief.missingEvidence : []
  )
    .map(traceRecord)
    .filter(
      (item) => issueIds.includes(text(item.issueId)) && text(item.detail)
    )
    .map((item) => text(item.detail))
  if (missing.length)
    next.push({
      id: "missing",
      title: "Information the agent still needs",
      note: plainAgentText(missing.join("\n")),
      state: "planned",
    })
  if (plannedJob) {
    const kind = text(traceRecord(plannedJob.detail).kind)
    next.unshift({
      id: plannedJob.id,
      title: describeAgentAction(kind, "running"),
      note: "This step has been added to the agent’s work list.",
      state: "waiting",
      dueAt: text(traceRecord(plannedJob.detail).dueAt) || null,
    })
  }

  const history: WorkItem[] = activities.length
    ? activities.map((item) => ({
        id: item.id,
        title: describeAgentAction(item.action, item.state),
        note: caseActivityIds.has(item.id)
          ? "Recorded for this complaint."
          : "",
        state: stateFor(item.state),
        at: item.updatedAt || item.createdAt,
      }))
    : steps
        .filter((step) => ["brief", "call", "tool"].includes(step.kind))
        .map((step) => {
          const detail = traceRecord(step.detail)
          return {
            id: step.id,
            title:
              step.kind === "brief"
                ? "Prepared the questions and next steps"
                : step.kind === "call"
                  ? step.state === "completed"
                    ? "Conversation saved"
                    : activeCall?.id === step.id
                      ? now.title
                      : "Call attempt recorded"
                  : describeAgentAction(
                      step.label.replaceAll(" ", "_"),
                      step.state
                    ),
            note: step.kind === "call" ? text(detail.summary) : "",
            state: stateFor(step.state),
            at:
              step.end !== undefined
                ? new Date(step.end).toISOString()
                : step.start !== null
                  ? new Date(step.start).toISOString()
                  : undefined,
          }
        })
  history.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""))
  const stages: WorkItem[] = [
    {
      id: "read",
      title: "Read the reports",
      note: "Understand the complaint and its history",
      state: run?.brief
        ? "done"
        : run?.state === "preparing" && running
          ? "working"
          : "planned",
    },
    {
      id: "plan",
      title: "Prepare the plan",
      note: "Decide what to ask and what to do next",
      state: run?.brief ? "done" : "planned",
    },
    {
      id: "speak",
      title: "Speak to the contact",
      note: "Ask for an update and record the response",
      state: finishedCall
        ? "done"
        : activeCall
          ? "working"
          : run?.state === "awaiting_configuration" || uncertainCall
            ? "attention"
            : "planned",
    },
    {
      id: "verify",
      title: "Check the repair",
      note: "Residents confirm whether the problem is fixed",
      state: verified ? "done" : awaitingReview ? "waiting" : "planned",
    },
  ]
  return {
    now,
    next,
    history: history.slice(0, 8),
    stages: run ? stages : [],
    issues,
    questions,
    finishedConversation: !!finishedCall,
    hasBrief: !!run?.brief,
  }
}
