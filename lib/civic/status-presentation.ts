import type { IssueStatus } from "./model"

export const caseStatus: Record<
  IssueStatus,
  { label: string; from: string; to: string; dot: string; ink?: string }
> = {
  reported: {
    label: "New report",
    from: "#f4aa42",
    to: "#d68018",
    dot: "bg-orange-500",
    ink: "#623208",
  },
  assigned: {
    label: "Office identified",
    from: "#64a1f5",
    to: "#397bdc",
    dot: "bg-sky-500",
  },
  following_up: {
    label: "Following up",
    from: "#3987f5",
    to: "#135fdb",
    dot: "bg-blue-600",
  },
  awaiting_verification: {
    label: "Needs a resident check",
    from: "#f4c749",
    to: "#dca01a",
    dot: "bg-amber-500",
    ink: "#623f08",
  },
  verified: {
    label: "Repair verified",
    from: "#30b992",
    to: "#098363",
    dot: "bg-emerald-600",
  },
  disputed: {
    label: "Still needs fixing",
    from: "#f17991",
    to: "#d64b68",
    dot: "bg-rose-500",
  },
}
