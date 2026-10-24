"use client"
import { Badge } from "@/components/ui/badge"
import { LocalizedText } from "@/components/language-provider"
import type { IssueStatus } from "@/lib/civic/model"
import { caseStatus } from "@/lib/civic/status-presentation"
export function StatusBadge({ status }: { status: IssueStatus }) {
  const presentation = caseStatus[status]
  return (
    <Badge variant="secondary" className="gap-1.5">
      <span className={`size-1.5 shrink-0 rounded-full ${presentation.dot}`} />
      <LocalizedText text={presentation.label} />
    </Badge>
  )
}
