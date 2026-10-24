import { NextResponse } from "next/server";
import { errorResponse, jsonBody } from "@/lib/civic/http";
import { manageJob, voiceOperations } from "@/lib/voice/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET() {
  try { return NextResponse.json(voiceOperations(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try { return NextResponse.json(manageJob(await jsonBody(request))); }
  catch (error) { return errorResponse(error); }
}
