"use client"
import { Badge } from "@/components/ui/badge"
import { LocalizedText } from "@/components/language-provider"
import type { IssueStatus } from "@/lib/civic/model"
const labels: Record<IssueStatus, string> = {
  reported: "Reported",
  assigned: "Office identified",
  following_up: "Following up",
  awaiting_verification: "Ready for a resident check",
  verified: "Repair verified",
  disputed: "Still needs fixing",
}
export function StatusBadge({ status }: { status: IssueStatus }) {
  const tone =
    status === "verified"
      ? "bg-emerald-500"
      : status === "awaiting_verification"
        ? "bg-amber-500"
        : status === "disputed"
          ? "bg-red-500"
          : "bg-blue-500"
  return (
    <Badge variant="secondary" className="gap-1.5">
      <span className={`size-1.5 shrink-0 rounded-full ${tone}`} />
      <LocalizedText text={labels[status]} />
    </Badge>
  )
}
