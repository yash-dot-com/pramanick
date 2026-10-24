import { OperationsDashboard } from "@/components/civic/operations-dashboard"
import { PublicNavigation } from "@/components/civic/public-navigation"

export default function OperationsPage() {
  return (
    <>
      <PublicNavigation current="operations" />
      <OperationsDashboard />
    </>
  )
}
