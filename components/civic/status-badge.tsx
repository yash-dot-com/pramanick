import { Badge } from "@/components/ui/badge"
import { STATUSES, type IssueStatus } from "@/lib/civic/model"

export function StatusBadge({ status }: { status: IssueStatus }) {
  return <Badge variant="secondary">{STATUSES[status]}</Badge>
}
