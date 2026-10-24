"use client"

import Link from "next/link"
import { AudioLines } from "lucide-react"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { LanguageSwitcher } from "@/components/language-provider"
import { SlidingNavigation } from "@/components/ui/sliding-navigation"

const pages = [
  { href: "/", label: "Home", id: "home" },
  { href: "/app", label: "Issue map", id: "map" },
  { href: "/dashboard", label: "Dashboard", id: "dashboard" },
  { href: "/leaderboard", label: "Officer records", id: "leaderboard" },
  { href: "/operations", label: "Agent workspace", id: "operations" },
]

export function PublicNavigation({
  current,
}: {
  current: "home" | "map" | "dashboard" | "leaderboard" | "operations"
}) {
  return (
    <header className="sticky top-0 z-40 shrink-0 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex w-full flex-wrap items-center justify-between gap-3 lg:w-auto lg:flex-1">
          <Link
            href="/"
            aria-label="Pramanik home"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <AudioLines className="size-4" />
            </span>
            Pramanik
          </Link>
          <SlidingNavigation
            items={pages}
            current={current}
            className="order-last w-full lg:order-none lg:w-auto"
          />
          <div className="flex items-center gap-2 lg:ml-5">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}
