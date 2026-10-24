import { CivicWorkspace } from "@/components/civic/civic-workspace"
import { PublicNavigation } from "@/components/civic/public-navigation"

export default function Page() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <PublicNavigation current="map" />
      <div className="min-h-0 flex-1">
        <CivicWorkspace />
      </div>
    </div>
  )
}
