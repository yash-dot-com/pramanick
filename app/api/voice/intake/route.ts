import { NextResponse } from "next/server"
import { createIntakeSession } from "@/lib/voice/intake"
import { errorResponse, jsonBody } from "@/lib/civic/http"

export const runtime = "nodejs"
export async function POST(request: Request) {
  try {
    return NextResponse.json(
      await createIntakeSession(await jsonBody(request)),
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    return errorResponse(error)
  }
}
