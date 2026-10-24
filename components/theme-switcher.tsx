"use client"

import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useTranslatedText } from "@/components/language-provider"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const light = useTranslatedText("Light mode"),
    dark = useTranslatedText("Dark mode"),
    system = useTranslatedText("Use device theme")
  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex shrink-0 items-center rounded-full border bg-muted/60 p-0.5"
    >
      {[
        { value: "light", label: light, Icon: Sun },
        { value: "dark", label: dark, Icon: Moon },
        { value: "system", label: system, Icon: Monitor },
      ].map(({ value, label, Icon }) => (
        <Button
          key={value}
          size="icon-xs"
          variant={mounted && theme === value ? "outline" : "ghost"}
          className="size-7"
          aria-label={label}
          title={label}
          aria-pressed={mounted && theme === value}
          onClick={() => setTheme(value)}
        >
          <Icon className="size-3.5" />
        </Button>
      ))}
    </div>
  )
}
