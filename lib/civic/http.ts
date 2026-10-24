import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { CivicError } from "./repository";
export function errorResponse(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  if (error instanceof CivicError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("Pramanik request failed", error instanceof Error ? error.message : "Unknown error");
  return NextResponse.json({ error: "This action could not be saved. Please try again." }, { status: 500 });
}
export async function jsonBody(request: Request) {
  const text = await request.text();
  if (text.length > 3000000) throw new CivicError("Keep photographs under 2 MB", 413);
  try { return JSON.parse(text); } catch { throw new CivicError("Invalid JSON request"); }
}
