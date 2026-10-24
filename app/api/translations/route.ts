import { NextResponse } from "next/server"
import { translateContent } from "@/lib/i18n/translate"
import { errorResponse, jsonBody } from "@/lib/civic/http"
export const runtime = "nodejs"
export async function POST(request: Request) {
  try {
    return NextResponse.json(await translateContent(await jsonBody(request)))
  } catch (error) {
    return errorResponse(error)
  }
}
