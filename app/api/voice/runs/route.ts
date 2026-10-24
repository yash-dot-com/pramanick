import { NextResponse } from "next/server"
import { errorResponse, jsonBody } from "@/lib/civic/http"
import { manageFollowUpRun, startFollowUpRun } from "@/lib/voice/runs"

export const runtime = "nodejs"
export async function POST(request: Request) {
  try {
    const input = await jsonBody(request)
    return NextResponse.json(
      input.action ? manageFollowUpRun(input) : startFollowUpRun(input),
      { status: input.action ? 200 : 202 }
    )
  } catch (error) {
    return errorResponse(error)
  }
}
