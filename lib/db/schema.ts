import { sql } from "drizzle-orm"
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"
import type { Category, IssueStatus } from "../civic/model"
const identity = () => ({
  id: text("id").primaryKey(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
})
export const localities = sqliteTable("localities", {
  ...identity(),
  name: text("name").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  source: text("source").notNull().default(""),
})
export const wards = sqliteTable("wards", {
  ...identity(),
  name: text("name").notNull(),
  source: text("source").notNull(),
  geometry: text("geometry", { mode: "json" }),
})
export const offices = sqliteTable("offices", {
  ...identity(),
  name: text("name").notNull(),
  governmentBody: text("government_body").notNull(),
  address: text("address").notNull(),
  designation: text("designation").notNull(),
  localityId: text("locality_id").references(() => localities.id),
  areaIds: text("area_ids", { mode: "json" }).$type<string[]>().notNull(),
  lat: real("lat"),
  lng: real("lng"),
  jurisdiction: text("jurisdiction").notNull(),
  topics: text("topics").notNull(),
  source: text("source").notNull(),
  sourceAsOf: text("source_as_of").notNull(),
  verificationStatus: text("verification_status").notNull(),
  publishedPhone: text("published_phone"),
  email: text("email"),
  personName: text("person_name"),
  notes: text("notes").notNull().default(""),
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
})
export const contacts = sqliteTable("contacts", {
  ...identity(),
  officeId: text("office_id")
    .notNull()
    .references(() => offices.id),
  designation: text("designation").notNull(),
  phone: text("phone").notNull(),
  authorized: integer("authorized", { mode: "boolean" })
    .notNull()
    .default(false),
  recordingConsent: integer("recording_consent", { mode: "boolean" })
    .notNull()
    .default(false),
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
  revokedAt: text("revoked_at"),
  displayName: text("display_name").notNull().default(""),
  language: text("language").notNull().default("hi"),
  publicationConsent: integer("publication_consent", { mode: "boolean" })
    .notNull()
    .default(false),
})
export const responsibilityRules = sqliteTable("responsibility_rules", {
  ...identity(),
  localityId: text("locality_id")
    .notNull()
    .references(() => localities.id),
  issueType: text("issue_type").notNull(),
  candidateOwner: text("candidate_owner").notNull(),
  confirmationNeeded: text("confirmation_needed").notNull(),
  confidence: text("confidence").notNull(),
})
export const participants = sqliteTable("participants", {
  ...identity(),
  tokenHash: text("token_hash").notNull().unique(),
})
export const issues = sqliteTable(
  "issues",
  {
    ...identity(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").$type<Category>().notNull(),
    issueType: text("issue_type").notNull(),
    localityId: text("locality_id")
      .notNull()
      .references(() => localities.id),
    landmark: text("landmark").notNull(),
    lat: real("lat").notNull(),
    lng: real("lng").notNull(),
    status: text("status").$type<IssueStatus>().notNull().default("reported"),
    officeId: text("office_id").references(() => offices.id),
    assignmentCertainty: text("assignment_certainty")
      .notNull()
      .default("unassigned"),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    index("issues_match_idx").on(
      t.localityId,
      t.category,
      t.issueType,
      t.status
    ),
  ]
)
export const complaints = sqliteTable(
  "complaints",
  {
    ...identity(),
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id),
    participantId: text("participant_id")
      .notNull()
      .references(() => participants.id),
    description: text("description").notNull().default(""),
  },
  (t) => [
    uniqueIndex("complaints_participant_issue_idx").on(
      t.participantId,
      t.issueId
    ),
  ]
)
export const issueAssignments = sqliteTable("issue_assignments", {
  ...identity(),
  issueId: text("issue_id")
    .notNull()
    .references(() => issues.id),
  officeId: text("office_id").references(() => offices.id),
  certainty: text("certainty").notNull(),
  reason: text("reason").notNull(),
})
export const evidence = sqliteTable("evidence", {
  ...identity(),
  issueId: text("issue_id")
    .notNull()
    .references(() => issues.id),
  participantId: text("participant_id").references(() => participants.id),
  caption: text("caption").notNull(),
  url: text("url").notNull(),
  phase: text("phase").notNull().default("report"),
  location: text("location", { mode: "json" }).$type<{
    source: "device" | "demo"
    observedAt: string
    accuracy: number
    distanceMeters: number
    proximity: "near" | "away" | "poor_accuracy" | "simulated"
  }>(),
  assessment: text("assessment", { mode: "json" }).$type<{
    finding: "appears_fixed" | "problem_visible" | "inconclusive"
    sameScene: "consistent" | "different" | "unclear" | "no_baseline"
    explanation: string
    limitations: string
    baselineIds: string[]
    assessedAt: string
    model: string
    promptVersion: string
  }>(),
})
export const issueEvents = sqliteTable(
  "issue_events",
  {
    ...identity(),
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    source: text("source").notNull(),
  },
  (t) => [index("events_issue_idx").on(t.issueId, t.createdAt)]
)
export const agentRuns = sqliteTable("agent_runs", {
  ...identity(),
  issueId: text("issue_id")
    .notNull()
    .references(() => issues.id),
  state: text("state").notNull(),
  promptVersion: text("prompt_version").notNull(),
  context: text("context", { mode: "json" })
    .$type<Record<string, unknown>>()
    .notNull(),
  error: text("error"),
})
export const followUpRuns = sqliteTable("follow_up_runs", {
  ...identity(),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  scope: text("scope").notNull(),
  localityId: text("locality_id").references(() => localities.id),
  state: text("state").notNull(),
  brief: text("brief", { mode: "json" }).$type<Record<string, unknown>>(),
  requestId: text("request_id").notNull().unique(),
  updatedAt: text("updated_at").notNull(),
  language: text("language").notNull().default("mr"),
})
export const followUpRunIssues = sqliteTable(
  "follow_up_run_issues",
  {
    ...identity(),
    followUpRunId: text("follow_up_run_id")
      .notNull()
      .references(() => followUpRuns.id),
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id),
  },
  (t) => [uniqueIndex("run_issue_idx").on(t.followUpRunId, t.issueId)]
)
export const calls = sqliteTable(
  "calls",
  {
    ...identity(),
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id),
    runId: text("run_id")
      .notNull()
      .references(() => agentRuns.id),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id),
    executionId: text("execution_id").unique(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    status: text("status").notNull(),
    duration: real("duration"),
    transcript: text("transcript"),
    summary: text("summary"),
    outcome: text("outcome", { mode: "json" }).$type<Record<string, unknown>>(),
    recordingUrl: text("recording_url"),
    error: text("error"),
    updatedAt: text("updated_at").notNull(),
    followUpRunId: text("follow_up_run_id").references(() => followUpRuns.id),
  },
  (t) => [index("calls_issue_idx").on(t.issueId, t.createdAt)]
)
export const callIssues = sqliteTable(
  "call_issues",
  {
    ...identity(),
    callId: text("call_id")
      .notNull()
      .references(() => calls.id),
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id),
  },
  (t) => [uniqueIndex("call_issue_idx").on(t.callId, t.issueId)]
)
export const callMessages = sqliteTable("call_messages", {
  ...identity(),
  callId: text("call_id")
    .notNull()
    .references(() => calls.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
})
export const commitments = sqliteTable("commitments", {
  ...identity(),
  issueId: text("issue_id")
    .notNull()
    .references(() => issues.id),
  sourceCallId: text("source_call_id")
    .notNull()
    .references(() => calls.id),
  action: text("action").notNull(),
  dueAt: text("due_at"),
  status: text("status").notNull().default("upcoming"),
})
export const followUpJobs = sqliteTable(
  "follow_up_jobs",
  {
    ...identity(),
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id),
    contactId: text("contact_id")
      .notNull()
      .references(() => contacts.id),
    kind: text("kind").notNull(),
    dueAt: text("due_at").notNull(),
    state: text("state").notNull(),
    attempts: integer("attempts").notNull().default(0),
    callId: text("call_id").references(() => calls.id),
    followUpRunId: text("follow_up_run_id").references(() => followUpRuns.id),
    error: text("error"),
    leaseUntil: text("lease_until"),
    dedupeKey: text("dedupe_key").notNull().unique(),
  },
  (t) => [index("jobs_due_idx").on(t.state, t.dueAt)]
)
export const toolExecutions = sqliteTable("tool_executions", {
  ...identity(),
  runId: text("run_id").references(() => agentRuns.id),
  tool: text("tool").notNull(),
  state: text("state").notNull(),
  detail: text("detail").notNull(),
})
export const surveys = sqliteTable("surveys", {
  ...identity(),
  issueId: text("issue_id")
    .notNull()
    .references(() => issues.id),
  sourceCallId: text("source_call_id").references(() => calls.id),
  state: text("state").notNull().default("open"),
  reviewNote: text("review_note"),
  reviewedAt: text("reviewed_at"),
})
export const surveyResponses = sqliteTable(
  "survey_responses",
  {
    ...identity(),
    surveyId: text("survey_id")
      .notNull()
      .references(() => surveys.id),
    participantId: text("participant_id")
      .notNull()
      .references(() => participants.id),
    answer: text("answer").notNull(),
    note: text("note").notNull(),
    evidenceId: text("evidence_id").references(() => evidence.id),
  },
  (t) => [uniqueIndex("survey_participant_idx").on(t.surveyId, t.participantId)]
)
export const webhookEvents = sqliteTable("webhook_events", {
  ...identity(),
  fingerprint: text("fingerprint").notNull().unique(),
  executionId: text("execution_id").notNull(),
  status: text("status").notNull(),
  repeats: integer("repeats").notNull().default(0),
})
export const dossierVersions = sqliteTable(
  "dossier_versions",
  {
    ...identity(),
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id),
    version: integer("version").notNull(),
    fingerprint: text("fingerprint").notNull(),
    content: text("content", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull(),
  },
  (t) => [uniqueIndex("dossier_version_idx").on(t.issueId, t.version)]
)
export const intakeSessions = sqliteTable("intake_sessions", {
  ...identity(),
  executionId: text("execution_id").unique(),
  state: text("state").notNull(),
  draft: text("draft", { mode: "json" }).$type<Record<string, string>>(),
  submittedIssueId: text("submitted_issue_id").references(() => issues.id),
  updatedAt: text("updated_at").notNull(),
  language: text("language").notNull().default("hi"),
  inference: text("inference", { mode: "json" }).$type<
    Record<string, string>
  >(),
  transcript: text("transcript"),
  providerStatus: text("provider_status"),
  provider: text("provider").notNull().default("bolna"),
  mode: text("mode").notNull().default("intake"),
  issueId: text("issue_id").references(() => issues.id),
})
export const agentActivities = sqliteTable("agent_activities", {
  ...identity(),
  issueId: text("issue_id").references(() => issues.id),
  intakeSessionId: text("intake_session_id").references(
    () => intakeSessions.id
  ),
  followUpRunId: text("follow_up_run_id").references(() => followUpRuns.id),
  callId: text("call_id").references(() => calls.id),
  action: text("action").notNull(),
  state: text("state").notNull(),
  summary: text("summary").notNull(),
  detail: text("detail", { mode: "json" }).$type<Record<string, unknown>>(),
  updatedAt: text("updated_at").notNull(),
  dedupeKey: text("dedupe_key").unique(),
})
export const agentRoutines = sqliteTable(
  "agent_routines",
  {
    ...identity(),
    localityId: text("locality_id")
      .notNull()
      .references(() => localities.id),
    state: text("state").notNull().default("paused"),
    intervalMinutes: integer("interval_minutes").notNull().default(2),
    nextScanAt: text("next_scan_at").notNull(),
    lastScanAt: text("last_scan_at"),
    updatedAt: text("updated_at").notNull(),
    language: text("language").notNull().default("mr"),
  },
  (t) => [uniqueIndex("routine_locality_idx").on(t.localityId)]
)
export const caseworkPlans = sqliteTable(
  "casework_plans",
  {
    ...identity(),
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id),
    inputFingerprint: text("input_fingerprint").notNull(),
    state: text("state").notNull(),
    relatedIssueIds: text("related_issue_ids", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    contactCandidates: text("contact_candidates", { mode: "json" })
      .$type<Record<string, unknown>[]>()
      .notNull(),
    nextAction: text("next_action").notNull(),
    followUpRunId: text("follow_up_run_id").references(() => followUpRuns.id),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [uniqueIndex("casework_plan_issue_idx").on(t.issueId)]
)
export const escalations = sqliteTable("escalations", {
  ...identity(),
  issueId: text("issue_id")
    .notNull()
    .references(() => issues.id),
  dossierVersion: integer("dossier_version").notNull(),
  fingerprint: text("fingerprint").notNull().unique(),
  draft: text("draft").notNull(),
  state: text("state").notNull().default("draft"),
  submissionReference: text("submission_reference"),
  submissionChannel: text("submission_channel"),
  submittedAt: text("submitted_at"),
})
export const translations = sqliteTable("translations", {
  ...identity(),
  language: text("language").notNull(),
  source: text("source").notNull(),
  translated: text("translated").notNull(),
})
