import { citizenTurn } from "@/lib/voice/citizen"
import { errorResponse } from "@/lib/civic/http"
import { CivicError } from "@/lib/civic/repository"
export const runtime = "nodejs"
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (Number(request.headers.get("content-length")) > 4_100_000)
      throw new CivicError("Audio clip too large", 413)
    return Response.json(
      await citizenTurn((await context.params).id, await request.formData())
    )
  } catch (error) {
    return errorResponse(error)
  }
}
