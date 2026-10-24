import { NextResponse } from "next/server"
import { contactProfile, saveContactProfile } from "@/lib/voice/contact"
import { errorResponse, jsonBody } from "@/lib/civic/http"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export function GET() {
  try {
    return NextResponse.json(contactProfile(), {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
export async function POST(request: Request) {
  try {
    return NextResponse.json(saveContactProfile(await jsonBody(request)))
  } catch (error) {
    return errorResponse(error)
  }
}
