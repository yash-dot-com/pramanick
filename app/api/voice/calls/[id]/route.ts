import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"
import {
  callActivity,
  confirmCallNotPlaced,
  reconcileCall,
  syncCall,
} from "@/lib/voice/bolna"
import {
  enqueueCallSync,
  enqueueJob,
  TERMINAL_CALL_STATES,
} from "@/lib/voice/queue"
import { errorResponse, jsonBody } from "@/lib/civic/http"
import { store } from "@/lib/civic/repository"
import * as s from "@/lib/db/schema"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    return NextResponse.json(callActivity(id), {
      headers: { "Cache-Control": "no-store" },
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
    const input = z
      .discriminatedUnion("action", [
        z.object({ action: z.literal("sync") }),
        z.object({ action: z.literal("end") }),
        z.object({ action: z.literal("failed") }),
        z.object({
          action: z.literal("reconcile"),
          executionId: z.string().uuid(),
        }),
        z.object({
          action: z.literal("not_placed"),
          confirmed: z.literal(true),
          note: z.string().trim().min(3).max(1000),
        }),
      ])
      .parse(await jsonBody(request))
    if (input.action === "sync" || input.action === "reconcile") {
      const call =
        input.action === "sync"
          ? await syncCall(id)
          : await reconcileCall(id, input.executionId)
      if (call.status === "completed")
        enqueueJob({
          issueId: call.issueId,
          contactId: call.contactId,
          callId: id,
          kind: "extract_outcome",
          dedupeKey: `extract:${id}`,
        })
    } else if (input.action === "not_placed")
      confirmCallNotPlaced(id, input.note)
    else {
      const activity = callActivity(id)
      const { db } = store()
      if (!TERMINAL_CALL_STATES.has(activity.call.status))
        db.transaction((tx) => {
          tx.update(s.calls)
            .set({
              status:
                input.action === "failed" ? "failed" : "call-disconnected",
              updatedAt: new Date().toISOString(),
            })
            .where(eq(s.calls.id, id))
            .run()
        })
      enqueueCallSync(id)
    }
    return NextResponse.json(callActivity(id))
  } catch (error) {
    return errorResponse(error)
  }
}
