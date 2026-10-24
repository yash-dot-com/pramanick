export const jobLabels: Record<string, string> = {
  prepare_run: "Reading reports and preparing the call plan",
  outbound_call: "Calling the responsibility holder",
  provider_sync: "Checking the call result and recording",
  extract_outcome: "Writing the conversation summary and promises",
  deadline_review: "Checking whether a promised deadline was met",
  manual_review: "Reviewing the next follow-up",
  assess_evidence: "Checking the resident's repair photograph",
}
export const callLabels: Record<string, string> = {
  initiating: "Preparing call",
  queued: "Call accepted",
  ringing: "Ringing",
  "in-progress": "Speaking now",
  completed: "Conversation completed",
  "no-answer": "No answer",
  busy: "Line busy",
  failed: "Call failed",
  dispatch_unknown: "Call acceptance needs checking",
  canceled: "Cancelled",
  stopped: "Stopped",
  error: "Call needs attention",
}
