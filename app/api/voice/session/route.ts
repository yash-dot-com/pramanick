import { NextResponse } from "next/server"
import { z } from "zod"
import { createWebCall } from "@/lib/voice/bolna"
import { errorResponse, jsonBody } from "@/lib/civic/http"
export const runtime = "nodejs"
export async function POST(request: Request) {
  try {
    const input = z
      .object({
        issueId: z.string().min(1),
        language: z.enum(["hi", "mr", "en"]).default("mr"),
      })
      .parse(await jsonBody(request))
    return NextResponse.json(
      await createWebCall(input.issueId, input.language),
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    return errorResponse(error)
  }
}
