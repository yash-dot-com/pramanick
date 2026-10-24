import { NextResponse } from "next/server"
import { publicAgentDashboard } from "@/lib/voice/dashboard"
import { errorResponse } from "@/lib/civic/http"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export function GET() {
  try {
    return NextResponse.json(publicAgentDashboard(), {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
