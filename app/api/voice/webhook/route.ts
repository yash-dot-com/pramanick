import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { enqueueCallSync } from "@/lib/voice/queue";
import { store } from "@/lib/civic/repository";
import { calls } from "@/lib/db/schema";
import { errorResponse, jsonBody } from "@/lib/civic/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const input = z.object({ id: z.string().uuid().optional(), execution_id: z.string().uuid().optional() }).parse(await jsonBody(request));
    const executionId = input.id ?? input.execution_id;
    if (!executionId) return NextResponse.json({ ignored: true });
    const { db } = store(); const call = db.select().from(calls).where(eq(calls.executionId, executionId)).get();
    if (!call) return NextResponse.json({ ignored: true });
    // Only enqueue a known execution. The worker fetches its authoritative record from Bolna.
    // Do not trust callback transcripts or wait for provider/OpenAI requests before acknowledging.
    enqueueCallSync(call.id);
    return NextResponse.json({ received: true });
  } catch (error) { return errorResponse(error); }
}
