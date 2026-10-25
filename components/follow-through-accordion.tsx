"use client"

import { useId, useState } from "react"
import { ChevronDown } from "lucide-react"
import { LocalizedText } from "@/components/language-provider"

export function FollowThroughAccordion({
  steps,
}: {
  steps: { title: string; description: string }[]
}) {
  const [openStep, setOpenStep] = useState<number | null>(null)
  const id = useId()

  return (
    <ol className="min-w-0 space-y-2.5 self-start">
      {steps.map((step, index) => {
        const open = openStep === index
        const triggerId = `${id}-trigger-${index}`
        const panelId = `${id}-panel-${index}`

        return (
          <li
            key={step.title}
            onPointerEnter={(event) => {
              if (
                event.pointerType === "mouse" &&
                window.matchMedia("(hover: hover) and (pointer: fine)").matches
              ) {
                setOpenStep(index)
              }
            }}
            className={`overflow-hidden rounded-2xl border bg-card shadow-[var(--surface-shadow)] ${open ? "border-primary/30" : "border-border"}`}
          >
            <h3>
              <button
                type="button"
                id={triggerId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenStep(open ? null : index)}
                className="flex w-full items-center gap-3 rounded-2xl p-4 text-left outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:p-5"
              >
                <span
                  aria-hidden="true"
                  className={`w-5 shrink-0 text-xs tabular-nums ${open ? "text-primary" : "text-muted-foreground"}`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium sm:text-base">
                  <LocalizedText text={step.title} />
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={`size-4 shrink-0 text-muted-foreground ${open ? "rotate-180" : ""}`}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              hidden={!open}
              className="pr-4 pb-4 pl-12 sm:pr-5 sm:pb-5 sm:pl-13"
            >
              <p className="text-sm leading-7 text-muted-foreground">
                <LocalizedText text={step.description} />
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
