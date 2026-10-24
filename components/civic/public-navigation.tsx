"use client"

import Link from "next/link"
import { AudioLines } from "lucide-react"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { LanguageSwitcher, LocalizedText } from "@/components/language-provider"
import { cn } from "@/lib/utils"

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
          <nav
            aria-label="Main navigation"
            className="order-last flex w-full flex-wrap items-center gap-1 lg:order-none lg:w-auto"
          >
            {[
              { href: "/", label: "Home", id: "home" },
              { href: "/app", label: "Issue map", id: "map" },
              { href: "/dashboard", label: "Dashboard", id: "dashboard" },
              {
                href: "/leaderboard",
                label: "Officer records",
                id: "leaderboard",
              },
              {
                href: "/operations",
                label: "Agent workspace",
                id: "operations",
              },
            ].map((item) => (
              <Link
                key={item.id}
                href={item.href}
                aria-current={current === item.id ? "page" : undefined}
                className={cn(
                  "rounded-lg border border-transparent px-3 py-2 text-xs transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none",
                  current === item.id
                    ? "border-primary/20 bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground"
                )}
              >
                <LocalizedText text={item.label} />
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 lg:ml-5">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}
