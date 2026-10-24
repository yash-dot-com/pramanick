import { NextResponse } from "next/server";
import { executeVoiceTool } from "@/lib/voice/tools";
import { requireToolSecret } from "@/lib/voice/bolna";
import { errorResponse, jsonBody } from "@/lib/civic/http";
export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try { requireToolSecret(request); const { name } = await params; return NextResponse.json({ result: executeVoiceTool(name, await jsonBody(request)) }); }
  catch (error) { return errorResponse(error); }
}
