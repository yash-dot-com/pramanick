import { NextResponse } from "next/server";
import { z } from "zod";
import { assignOffice, changeStatus, snapshot, reviewSurvey } from "@/lib/civic/repository";
import { errorResponse, jsonBody } from "@/lib/civic/http";
import { voiceOperations } from "@/lib/voice/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("assign"), issueId: z.string().min(1), officeId: z.string().min(1), note: z.string().trim().min(3).max(2000) }),
  z.object({ action: z.literal("status"), issueId: z.string().min(1), status: z.enum(["reported", "assigned", "following_up", "awaiting_verification", "disputed"]), note: z.string().trim().min(3).max(2000) }),
  z.object({ action: z.literal("review"), issueId: z.string().min(1), decision: z.enum(["verified", "disputed"]), note: z.string().trim().min(3).max(2000) }),
]);
export function GET() {
  try { return NextResponse.json({ ...voiceOperations(), civic: snapshot() }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try {
    const input = actionSchema.parse(await jsonBody(request));
    if (input.action === "assign") assignOffice(input.issueId, input.officeId, input.note);
    else if (input.action === "status") changeStatus(input.issueId, input.status, input.note);
    else reviewSurvey(input.issueId, input.decision, input.note);
    return NextResponse.json({ saved: true });
  } catch (error) { return errorResponse(error); }
}
