import { NextResponse } from "next/server"
import { z } from "zod"
import { dossierMarkdown, readDossier } from "@/lib/civic/dossier"
import { errorResponse } from "@/lib/civic/http"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const version = url.searchParams.has("version")
      ? z.coerce
          .number()
          .int()
          .positive()
          .parse(url.searchParams.get("version"))
      : undefined
    const dossier = readDossier(id, version)
    const format = url.searchParams.get("format")
    if (format === "md" || format === "json") {
      const filename = `pramanik-${id.replace(/[^a-zA-Z0-9_-]/g, "")}-v${dossier.version}.${format}`
      return new Response(
        format === "md"
          ? dossierMarkdown(dossier)
          : JSON.stringify(dossier, null, 2),
        {
          headers: {
            "Content-Type":
              format === "md"
                ? "text/markdown; charset=utf-8"
                : "application/json",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-store",
          },
        }
      )
    }
    return NextResponse.json(dossier, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
