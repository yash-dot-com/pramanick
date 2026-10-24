"use client"
import { Check, CircleCheck, MessageCircle, Phone, Users } from "lucide-react"
import { LocalizedText } from "@/components/language-provider"
import type { IssueStatus } from "@/lib/civic/model"
export function IssueJourney({
  status,
  hasRun,
}: {
  status: IssueStatus
  hasRun: boolean
}) {
  const current =
    status === "verified"
      ? 3
      : status === "awaiting_verification"
        ? 2
        : status === "following_up" || status === "disputed" || hasRun
          ? 1
          : 0
  const steps = [
    { label: "Reported", Icon: MessageCircle },
    { label: "Follow-up", Icon: Phone },
    { label: "Resident check", Icon: Users },
    { label: "Fixed", Icon: CircleCheck },
  ]
  return (
    <ol aria-label="Issue progress" className="grid grid-cols-4 py-1">
      {steps.map(({ label, Icon }, index) => (
        <li
          key={label}
          className="relative flex min-w-0 flex-col items-center gap-2 text-center"
        >
          {index < 3 && (
            <span
              aria-hidden
              className={`absolute top-4 left-1/2 h-px w-full ${index < current ? "bg-primary/40" : "bg-border"}`}
            />
          )}
          <span
            aria-current={index === current ? "step" : undefined}
            className={`relative z-10 flex size-8 items-center justify-center rounded-full border ${index === current ? "border-primary bg-primary text-primary-foreground" : index < current ? "border-primary/20 bg-secondary text-foreground" : "bg-background text-muted-foreground"}`}
          >
            {index < current ? (
              <Check className="size-3.5" />
            ) : (
              <Icon className="size-3.5" />
            )}
          </span>
          <span
            className={`px-0.5 text-[10px] leading-tight ${index === current ? "font-medium text-foreground" : "text-muted-foreground"}`}
          >
            <LocalizedText text={label} />
          </span>
        </li>
      ))}
    </ol>
  )
}
