"use client"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { LocalizedText } from "@/components/language-provider"
import type { CivicIssue } from "@/lib/civic/model"
import { CitizenVoicePanel } from "./citizen-voice-panel"
export function VoiceAgentDialog({
  issues,
  selectedIssueId,
  onClose,
  onUpdated,
}: {
  issues: CivicIssue[]
  selectedIssueId: string | null
  onClose: () => void
  onUpdated: () => void
}) {
  const [issueId, setIssueId] = useState(selectedIssueId ?? issues[0]?.id ?? "")
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onUpdated()
          onClose()
        }
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            <LocalizedText text="Talk about this issue" />
          </DialogTitle>
          <DialogDescription>
            <LocalizedText text="Ask about resident reports, earlier calls, promises and next steps." />
          </DialogDescription>
        </DialogHeader>
        <select
          aria-label="Case context"
          className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
          value={issueId}
          onChange={(event) => setIssueId(event.target.value)}
        >
          {issues.map((issue) => (
            <option key={issue.id} value={issue.id}>
              {issue.title}
            </option>
          ))}
        </select>
        {issueId && <CitizenVoicePanel key={issueId} issueId={issueId} />}
      </DialogContent>
    </Dialog>
  )
}
