import { NextResponse } from "next/server";
import { snapshot } from "@/lib/civic/repository";
import { errorResponse } from "@/lib/civic/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET() { try { return NextResponse.json(snapshot(), { headers: { "Cache-Control": "no-store" } }); } catch (error) { return errorResponse(error); } }
