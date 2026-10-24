import { createCitizenSession } from "@/lib/voice/citizen"
import { errorResponse, jsonBody } from "@/lib/civic/http"
export const runtime = "nodejs"
export async function POST(request: Request) {
  try {
    return Response.json(createCitizenSession(await jsonBody(request)))
  } catch (error) {
    return errorResponse(error)
  }
}
