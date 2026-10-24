"use client"
import { Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { LocalizedText } from "@/components/language-provider"
import type { IntakeDraft } from "@/lib/voice/intake"
import { CitizenVoicePanel } from "./citizen-voice-panel"
export function VoiceIntakeDialog({
  onClose,
  onDraft,
  onTypeInstead,
}: {
  onClose: () => void
  onDraft: (draft: IntakeDraft) => void
  onTypeInstead: () => void
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            <LocalizedText text="Tell us what needs fixing" />
          </DialogTitle>
          <DialogDescription>
            <LocalizedText text="Speak naturally. We’ll ask a few short questions, then you choose the exact map location." />
          </DialogDescription>
        </DialogHeader>
        <CitizenVoicePanel onDraft={onDraft} />
        <Button variant="ghost" size="sm" onClick={onTypeInstead}>
          <Keyboard />
          <LocalizedText text="Type instead" />
        </Button>
      </DialogContent>
    </Dialog>
  )
}
