"use client"

import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"
import { Popover } from "@base-ui/react/popover"
import { Check, Menu } from "lucide-react"
import {
  LocalizedText,
  useTranslatedText,
} from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { SettingsDropdown } from "@/components/settings-dropdown"
import { SlidingNavigation } from "@/components/ui/sliding-navigation"

const pages = [
  { href: "/", label: "Home", id: "home" },
  { href: "/app", label: "Map", id: "map" },
  { href: "/dashboard", label: "Dashboard", id: "dashboard" },
  { href: "/leaderboard", label: "Leaderboard", id: "leaderboard" },
  { href: "/operations", label: "Accountability office", id: "operations" },
]

export function PublicNavigation({
  current,
  mapControls,
}: {
  current: "home" | "map" | "dashboard" | "leaderboard" | "operations"
  mapControls?: ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isMap = current === "map"
  const menuLabel = useTranslatedText("Open navigation")
  const desktopNavigation = isMap
    ? "hidden min-[1100px]:flex"
    : "hidden min-[900px]:flex"
  const mobileNavigation = isMap ? "min-[1100px]:hidden" : "min-[900px]:hidden"

  useEffect(() => {
    const desktop = window.matchMedia(
      isMap ? "(min-width: 1100px)" : "(min-width: 900px)"
    )
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false)
    }
    desktop.addEventListener("change", closeOnDesktop)
    return () => desktop.removeEventListener("change", closeOnDesktop)
  }, [isMap])

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
        <div
          className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 ${isMap ? "min-[1100px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]" : "min-[900px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"}`}
        >
          <div className="min-w-0">
            {isMap ? (
              <span className={`text-sm font-medium ${mobileNavigation}`}>
                <LocalizedText text="Map" />
              </span>
            ) : (
              <Link
                href="/"
                aria-label="Pramanik home"
                className="text-xl font-semibold tracking-tight"
              >
                Pramanik
              </Link>
            )}
          </div>
          <SlidingNavigation
            items={pages}
            current={current}
            className={`col-start-2 row-start-1 flex-nowrap justify-self-center ${desktopNavigation}`}
          />
          <div
            className={`col-start-2 row-start-1 flex items-center justify-end gap-2 justify-self-end ${isMap ? "min-[1100px]:col-start-3" : "min-[900px]:col-start-3"}`}
          >
            {isMap && (
              <div className="hidden min-[1100px]:flex">{mapControls}</div>
            )}
            <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
              <Popover.Trigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className={mobileNavigation}
                  />
                }
                aria-label={menuLabel}
              >
                <Menu className="size-4" />
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner
                  side="bottom"
                  align="end"
                  sideOffset={8}
                  className="z-50"
                >
                  <Popover.Popup
                    aria-label={menuLabel}
                    className="max-h-(--available-height) w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border bg-popover p-2 text-popover-foreground shadow-[var(--surface-shadow)] outline-none"
                  >
                    <nav aria-label="Main navigation" className="space-y-1">
                      {pages.map((page) => (
                        <Link
                          key={page.id}
                          href={page.href}
                          aria-current={
                            current === page.id ? "page" : undefined
                          }
                          onClick={() => setMenuOpen(false)}
                          className={`flex min-h-10 items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${current === page.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                        >
                          <LocalizedText text={page.label} />
                          {current === page.id && (
                            <Check
                              aria-hidden="true"
                              className="size-4 shrink-0"
                            />
                          )}
                        </Link>
                      ))}
                    </nav>
                    {isMap && mapControls && (
                      <div className="mt-2 space-y-2 border-t px-3 pt-3 pb-2">
                        <p className="text-xs text-muted-foreground">
                          <LocalizedText text="Map layers" />
                        </p>
                        {mapControls}
                      </div>
                    )}
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
            <SettingsDropdown />
          </div>
        </div>
      </div>
    </header>
  )
}
