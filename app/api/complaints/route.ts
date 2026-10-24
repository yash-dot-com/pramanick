import { CURRENT_USER } from "@/lib/civic/user";
import { NextRequest, NextResponse } from "next/server";
import { submitComplaint } from "@/lib/civic/repository";
import { errorResponse, jsonBody } from "@/lib/civic/http";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const result = submitComplaint(await jsonBody(request), CURRENT_USER.id);
    return NextResponse.json(result, { status: "duplicates" in result ? 200 : 201 });
  } catch (error) { return errorResponse(error); }
}
