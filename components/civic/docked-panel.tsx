"use client"

import { LocalizedText } from "@/components/language-provider"

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react"
import { ArrowLeft, GripVertical, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DockedPanel({
  title,
  width,
  onWidthChange,
  onClose,
  onBack,
  children,
}: {
  title: string
  width: number
  onWidthChange: (width: number) => void
  onClose: () => void
  onBack?: () => void
  children: ReactNode
}) {
  const gesture = useRef<{ x: number; width: number } | null>(null)
  function finish() {
    gesture.current = null
    document.documentElement.removeAttribute("data-sidebar-resizing")
  }
  useEffect(() => () => finish(), [])
  const clamp = (next: number) =>
    Math.max(
      260,
      Math.min(
        next,
        Math.min(680, window.innerWidth - (window.innerWidth >= 768 ? 280 : 24))
      )
    )
  function start(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    gesture.current = { x: event.clientX, width }
    document.documentElement.setAttribute("data-sidebar-resizing", "")
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }
  return (
    <aside
      className="absolute inset-y-2 left-2 z-20 flex shrink-0 flex-col rounded-xl border bg-background shadow-sm md:relative md:inset-auto"
      style={{ width: `min(${width}px, calc(100vw - 24px))` }}
      aria-label={title}
    >
      {onBack && (
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-muted/20 px-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            aria-label="Back to issue list"
          >
            <ArrowLeft />
          </Button>
          <h2 className="flex-1 text-sm font-medium">
            <LocalizedText text={title} />
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X />
          </Button>
        </header>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      <div
        role="separator"
        aria-label="Resize sidebar width"
        aria-orientation="vertical"
        aria-valuemin={260}
        aria-valuemax={680}
        aria-valuenow={width}
        tabIndex={0}
        className="absolute inset-y-0 -right-1.5 z-30 flex w-3 cursor-col-resize touch-none items-center justify-center outline-none focus-visible:bg-ring/20"
        onPointerDown={start}
        onPointerMove={(event) => {
          if (gesture.current)
            onWidthChange(
              clamp(gesture.current.width + event.clientX - gesture.current.x)
            )
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
        onLostPointerCapture={finish}
        onKeyDown={(event) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
            event.preventDefault()
            onWidthChange(
              clamp(
                event.key === "Home"
                  ? 260
                  : event.key === "End"
                    ? 680
                    : width + (event.key === "ArrowLeft" ? -20 : 20)
              )
            )
          }
        }}
      >
        <span className="pointer-events-none rounded-full border bg-background py-2">
          <GripVertical className="size-3 text-muted-foreground" />
        </span>
      </div>
    </aside>
  )
}
