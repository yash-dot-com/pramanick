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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
        <Select
          value={issueId}
          disabled={!issues.length}
          onValueChange={(value) => {
            if (value) setIssueId(value)
          }}
        >
          <SelectTrigger aria-label="Case context" className="w-full">
            <SelectValue>
              <LocalizedText
                text={
                  issues.find((issue) => issue.id === issueId)?.title ||
                  "No cases available"
                }
              />
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false}>
            {issues.map((issue) => (
              <SelectItem key={issue.id} value={issue.id}>
                <LocalizedText text={issue.title} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {issueId && <CitizenVoicePanel key={issueId} issueId={issueId} />}
      </DialogContent>
    </Dialog>
  )
}
