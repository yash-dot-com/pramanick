import { NextResponse } from "next/server"
import { errorResponse, jsonBody } from "@/lib/civic/http"
import { respondToSurvey } from "@/lib/civic/repository"
import { CURRENT_USER } from "@/lib/civic/user"
import { queueEvidenceAssessment } from "@/lib/civic/evidence"

export const runtime = "nodejs"
export async function POST(request: Request) {
  try {
    const result = respondToSurvey(await jsonBody(request), CURRENT_USER.id)
    if (result.evidenceId) queueEvidenceAssessment(result.evidenceId)
    return NextResponse.json({ saved: true, ...result })
  } catch (error) {
    return errorResponse(error)
  }
}
