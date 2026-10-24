"use client"

import { LocalizedText } from "@/components/language-provider"

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react"
import { ArrowLeft, GripHorizontal, MoveDiagonal2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type Frame = { x: number; y: number; width: number; height: number }
function fit(frame: Frame): Frame {
  const width = Math.min(Math.max(280, frame.width), window.innerWidth - 24)
  const height = Math.min(Math.max(240, frame.height), window.innerHeight - 24)
  return {
    width,
    height,
    x: Math.max(12, Math.min(frame.x, window.innerWidth - width - 12)),
    y: Math.max(12, Math.min(frame.y, window.innerHeight - height - 12)),
  }
}

export function FloatingPanel({
  title,
  children,
  onClose,
  onBack,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  onBack?: () => void
}) {
  const [frame, setFrame] = useState<Frame>({
    x: 12,
    y: 72,
    width: 360,
    height: 640,
  })
  const gesture = useRef<{
    mode: "move" | "resize" | "width"
    x: number
    y: number
    frame: Frame
  } | null>(null)
  useEffect(() => {
    setFrame((current) =>
      fit({ ...current, height: Math.min(720, window.innerHeight - 88) })
    )
    const resize = () => setFrame((current) => fit(current))
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])
  function start(
    event: PointerEvent<HTMLElement>,
    mode: "move" | "resize" | "width"
  ) {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    gesture.current = { mode, x: event.clientX, y: event.clientY, frame }
  }
  function move(event: PointerEvent<HTMLElement>) {
    const active = gesture.current
    if (!active) return
    const dx = event.clientX - active.x
    const dy = event.clientY - active.y
    setFrame(
      fit(
        active.mode === "move"
          ? { ...active.frame, x: active.frame.x + dx, y: active.frame.y + dy }
          : {
              ...active.frame,
              width: Math.min(
                active.frame.width + dx,
                window.innerWidth - active.frame.x - 12
              ),
              height:
                active.mode === "width"
                  ? active.frame.height
                  : Math.min(
                      active.frame.height + dy,
                      window.innerHeight - active.frame.y - 12
                    ),
            }
      )
    )
  }
  const end = () => {
    gesture.current = null
  }
  return (
    <section
      className="absolute z-20 flex flex-col overflow-hidden rounded-xl border bg-background text-foreground shadow-lg"
      aria-label={title}
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: frame.height,
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation()
          onClose()
        }
      }}
    >
      <div className="flex h-12 shrink-0 items-center gap-1 border-b px-2">
        {onBack && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            aria-label="Back to list"
          >
            <ArrowLeft />
          </Button>
        )}
        <button
          className="flex min-w-0 flex-1 cursor-grab touch-none items-center gap-2 self-stretch px-2 text-left text-sm font-medium active:cursor-grabbing"
          aria-label={`Move ${title} panel`}
          onPointerDown={(event) => start(event, "move")}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onLostPointerCapture={end}
          onKeyDown={(event) => {
            const delta: Record<string, [number, number]> = {
              ArrowLeft: [-20, 0],
              ArrowRight: [20, 0],
              ArrowUp: [0, -20],
              ArrowDown: [0, 20],
            }
            if (delta[event.key]) {
              event.preventDefault()
              const [x, y] = delta[event.key]
              setFrame((current) =>
                fit({ ...current, x: current.x + x, y: current.y + y })
              )
            }
          }}
        >
          <GripHorizontal className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">
            <LocalizedText text={title} />
          </span>
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close panel"
        >
          <X />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
      <div
        role="separator"
        aria-label="Resize panel width"
        aria-orientation="vertical"
        aria-valuemin={280}
        aria-valuemax={
          typeof window !== "undefined" ? window.innerWidth - 24 : 1200
        }
        aria-valuenow={Math.round(frame.width)}
        tabIndex={0}
        className="absolute inset-y-12 right-0 w-1.5 cursor-col-resize touch-none hover:bg-border focus-visible:bg-ring focus-visible:outline-none"
        onPointerDown={(event) => start(event, "width")}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault()
            setFrame((current) =>
              fit({
                ...current,
                width: current.width + (event.key === "ArrowRight" ? 20 : -20),
              })
            )
          }
        }}
      />
      <button
        className="absolute right-0 bottom-0 flex size-7 cursor-nwse-resize touch-none items-center justify-center rounded-tl-md bg-background text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label="Resize panel"
        title="Drag to resize"
        onPointerDown={(event) => start(event, "resize")}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
        onKeyDown={(event) => {
          const changes: Record<string, [number, number]> = {
            ArrowLeft: [-20, 0],
            ArrowRight: [20, 0],
            ArrowUp: [0, -20],
            ArrowDown: [0, 20],
          }
          if (changes[event.key]) {
            event.preventDefault()
            const [width, height] = changes[event.key]
            setFrame((current) =>
              fit({
                ...current,
                width: current.width + width,
                height: current.height + height,
              })
            )
          }
        }}
      >
        <MoveDiagonal2 className="size-3.5" />
      </button>
    </section>
  )
}
