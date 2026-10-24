import { NextResponse } from "next/server"
import { manageRoutine } from "@/lib/voice/routine"
import { errorResponse, jsonBody } from "@/lib/civic/http"
export const runtime = "nodejs"
export async function POST(request: Request) {
  try {
    return NextResponse.json(manageRoutine(await jsonBody(request)))
  } catch (error) {
    return errorResponse(error)
  }
}
