"use client"

import { useState } from "react"
import { Building2, MapPin } from "lucide-react"
import { CivicWorkspace } from "@/components/civic/civic-workspace"
import { PublicNavigation } from "@/components/civic/public-navigation"
import { LocalizedText } from "@/components/language-provider"
import { Button } from "@/components/ui/button"

export default function Page() {
  const [layers, setLayers] = useState({ issues: true, offices: true })
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <PublicNavigation
        current="map"
        mapControls={
          <div
            role="group"
            aria-label="Map layers"
            className="flex items-center gap-1.5"
          >
            {(
              [
                { id: "issues", label: "Issues", Icon: MapPin },
                { id: "offices", label: "Offices", Icon: Building2 },
              ] as const
            ).map(({ id, label, Icon }) => (
              <Button
                key={id}
                size="sm"
                variant={layers[id] ? "default" : "outline"}
                aria-pressed={layers[id]}
                onClick={() =>
                  setLayers((current) => ({ ...current, [id]: !current[id] }))
                }
              >
                <Icon />
                <LocalizedText text={label} />
                <span className="ml-1 text-[10px] font-normal opacity-80">
                  <LocalizedText text={layers[id] ? "On" : "Off"} />
                </span>
              </Button>
            ))}
          </div>
        }
      />
      <div className="min-h-0 flex-1">
        <CivicWorkspace
          showIssues={layers.issues}
          showOffices={layers.offices}
        />
      </div>
    </div>
  )
}
