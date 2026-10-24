"use client"

import Link from "next/link"
import { AudioLines } from "lucide-react"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { LanguageSwitcher, LocalizedText } from "@/components/language-provider"
import { cn } from "@/lib/utils"

export function PublicNavigation({
  current,
}: {
  current: "dashboard" | "leaderboard"
}) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <AudioLines className="size-4" />
            </span>
            Pramanik
          </Link>
          <nav
            aria-label="Public navigation"
            className="flex items-center gap-1"
          >
            {[
              { href: "/app", label: "Issue map", id: "map" },
              { href: "/dashboard", label: "Follow-ups", id: "dashboard" },
              {
                href: "/leaderboard",
                label: "Service record",
                id: "leaderboard",
              },
            ].map((item) => (
              <Link
                key={item.id}
                href={item.href}
                aria-current={current === item.id ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs transition-colors hover:bg-muted",
                  current === item.id
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <LocalizedText text={item.label} />
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
