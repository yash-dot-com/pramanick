"use client"

import { Popover } from "@base-ui/react/popover"
import { Settings } from "lucide-react"
import {
  LanguageSwitcher,
  LocalizedText,
  useTranslatedText,
} from "@/components/language-provider"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Button } from "@/components/ui/button"

export function SettingsDropdown() {
  const settings = useTranslatedText("Settings")

  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button variant="outline" size="icon" className="rounded-full" />
        }
        aria-label={settings}
        title={settings}
      >
        <Settings className="size-4" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={8}
          className="z-50"
        >
          <Popover.Popup className="w-64 max-w-[calc(100vw-2rem)] rounded-2xl border bg-popover p-4 text-popover-foreground shadow-[var(--surface-shadow)] outline-none">
            <Popover.Title className="mb-4 text-sm font-semibold">
              <LocalizedText text="Settings" />
            </Popover.Title>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  <LocalizedText text="Theme" />
                </span>
                <ThemeSwitcher />
              </div>
              <div className="space-y-2 border-t pt-4">
                <span className="text-sm text-muted-foreground">
                  <LocalizedText text="Language" />
                </span>
                <div className="[&_select]:w-full [&>div]:flex-wrap">
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
