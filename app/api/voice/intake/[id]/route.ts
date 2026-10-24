import { NextResponse } from "next/server"
import { intakeActivity } from "@/lib/voice/intake"
import { errorResponse } from "@/lib/civic/http"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return NextResponse.json(intakeActivity((await params).id), {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return NextResponse.json(intakeActivity((await params).id, true))
  } catch (error) {
    return errorResponse(error)
  }
}
