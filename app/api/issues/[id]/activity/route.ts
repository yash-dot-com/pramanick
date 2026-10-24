import { NextResponse } from "next/server"
import { activityFeed } from "@/lib/voice/activity"
import { errorResponse } from "@/lib/civic/http"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return NextResponse.json(activityFeed({ issueId: (await params).id }), {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
