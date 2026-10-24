import { NextResponse } from "next/server"
import { z } from "zod"
import {
  escalationDraft,
  escalationHistory,
  prepareEscalation,
  recordSubmission,
} from "@/lib/civic/escalation"
import { errorResponse, jsonBody } from "@/lib/civic/http"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const draftId = new URL(request.url).searchParams.get("draft")
    if (!draftId)
      return NextResponse.json(escalationHistory(id), {
        headers: { "Cache-Control": "no-store" },
      })
    const draft = escalationDraft(id, z.string().uuid().parse(draftId))
    return new Response(draft.draft, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="pramanik-complaint-${draft.id}.md"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const raw = await jsonBody(request)
    const { action } = z
      .object({ action: z.enum(["prepare", "record_submission"]) })
      .parse(raw)
    if (action === "prepare") {
      const draft = prepareEscalation(id)
      return NextResponse.json({ id: draft!.id, state: draft!.state })
    }
    recordSubmission(id, raw)
    return NextResponse.json({ saved: true })
  } catch (error) {
    return errorResponse(error)
  }
}
