import { citizenActivity } from "@/lib/voice/citizen"
import { errorResponse } from "@/lib/civic/http"
export const runtime = "nodejs"
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return Response.json(citizenActivity((await context.params).id))
  } catch (error) {
    return errorResponse(error)
  }
}
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return Response.json(citizenActivity((await context.params).id, true))
  } catch (error) {
    return errorResponse(error)
  }
}
