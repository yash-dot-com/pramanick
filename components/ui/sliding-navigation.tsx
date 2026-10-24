"use client"

import Link from "next/link"
import { useLayoutEffect, useRef } from "react"
import { LocalizedText } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type NavigationItem = { id: string; href: string; label: string }
const positionKey = "pramanik-navigation-page"

export function SlidingNavigation({
  items,
  current,
  className,
}: {
  items: NavigationItem[]
  current: string
  className?: string
}) {
  const container = useRef<HTMLElement>(null)
  const indicator = useRef<HTMLSpanElement>(null)
  const move = useRef<(id: string, animate: boolean) => void>(() => {})

  useLayoutEffect(() => {
    const nav = container.current
    const pill = indicator.current
    if (!nav || !pill) return
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    let initialized = false
    let firstFrame = 0
    let secondFrame = 0
    const place = (id: string, animate: boolean) => {
      const item = nav.querySelector<HTMLElement>(`[data-nav-item="${id}"]`)
      if (!item) return
      pill.style.transition =
        animate && !reduced
          ? "transform 220ms cubic-bezier(.2,.8,.2,1), width 220ms cubic-bezier(.2,.8,.2,1), height 220ms cubic-bezier(.2,.8,.2,1)"
          : "none"
      pill.style.transform = `translate(${item.offsetLeft}px, ${item.offsetTop}px)`
      pill.style.width = `${item.offsetWidth}px`
      pill.style.height = `${item.offsetHeight}px`
      pill.style.opacity = "1"
    }
    move.current = place
    let previous = current
    try {
      previous = sessionStorage.getItem(positionKey) || current
      sessionStorage.setItem(positionKey, current)
    } catch {
      /* Navigation works when storage is unavailable. */
    }
    place(reduced ? current : previous, false)
    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        place(current, true)
        initialized = true
      })
    })
    const observer = new ResizeObserver(() => {
      if (initialized) place(current, false)
    })
    observer.observe(nav)
    for (const item of nav.querySelectorAll<HTMLElement>("[data-nav-item]"))
      observer.observe(item)
    return () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
      observer.disconnect()
    }
  }, [current, items])

  return (
    <nav
      ref={container}
      aria-label="Main navigation"
      className={cn(
        "relative isolate flex w-fit flex-wrap items-center gap-1 rounded-2xl border bg-muted/35 p-1 shadow-[var(--field-shadow)]",
        className
      )}
    >
      <span
        ref={indicator}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 -z-10 rounded-xl border border-primary/40 bg-primary bg-linear-to-b from-[var(--button-primary-top)] to-[var(--button-primary-bottom)] opacity-0 shadow-[var(--button-primary-shadow)] motion-reduce:transition-none"
      />
      {items.map((item) => (
        <Button
          key={item.id}
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={item.href} />}
          data-nav-item={item.id}
          aria-current={current === item.id ? "page" : undefined}
          onClick={() => move.current(item.id, true)}
          className={cn(
            "relative rounded-xl px-3 text-xs hover:bg-transparent dark:hover:bg-transparent",
            current === item.id
              ? "text-primary-foreground hover:text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LocalizedText text={item.label} />
        </Button>
      ))}
    </nav>
  )
}
