import { NextResponse } from "next/server"
import { responsibilityProfiles } from "@/lib/civic/profiles"
import { errorResponse } from "@/lib/civic/http"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export function GET() {
  try {
    return NextResponse.json(responsibilityProfiles(), {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
