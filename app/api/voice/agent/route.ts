import { NextResponse } from "next/server";
import { configureAgent, voiceSettings } from "@/lib/voice/bolna";
import { errorResponse } from "@/lib/civic/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET() { return NextResponse.json(voiceSettings(), { headers: { "Cache-Control": "no-store" } }); }
export async function POST() { try { return NextResponse.json(await configureAgent()); } catch (error) { return errorResponse(error); } }
