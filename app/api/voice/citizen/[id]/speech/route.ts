import { citizenSpeech } from "@/lib/voice/citizen"
import { errorResponse } from "@/lib/civic/http"
export const runtime = "nodejs"
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await citizenSpeech(
      (await context.params).id,
      new URL(request.url).searchParams.get("turn") ?? "",
      request.signal
    )
  } catch (error) {
    return errorResponse(error)
  }
}
