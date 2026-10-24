import { NextResponse } from "next/server";
import { candidates, surveyFor } from "@/lib/civic/repository";
import { errorResponse } from "@/lib/civic/http";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; return NextResponse.json({ routing: candidates(id), survey: surveyFor(id) }); } catch (error) { return errorResponse(error); }
}
