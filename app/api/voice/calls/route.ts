import { NextResponse } from "next/server";
import { errorResponse, jsonBody } from "@/lib/civic/http";
import { schedulePhoneCall } from "@/lib/voice/outbound";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try { return NextResponse.json(schedulePhoneCall(await jsonBody(request)), { status: 202 }); }
  catch (error) { return errorResponse(error); }
}
