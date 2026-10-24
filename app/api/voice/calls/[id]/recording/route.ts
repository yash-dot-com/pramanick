import { eq } from "drizzle-orm"
import { store, CivicError } from "@/lib/civic/repository"
import { errorResponse } from "@/lib/civic/http"
import * as s from "@/lib/db/schema"
import { bolnaRequest } from "@/lib/voice/bolna"
import { allowedRecordingUrl } from "@/lib/voice/recording"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { isScriptedDemo } from "@/lib/civic/demo-office-data"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { db } = store()
    const call = db.select().from(s.calls).where(eq(s.calls.id, id)).get()
    if (!call) throw new CivicError("Conversation not found", 404)
    const contact = db
      .select()
      .from(s.contacts)
      .where(eq(s.contacts.id, call.contactId))
      .get()
    if (!contact?.publicationConsent || !contact.recordingConsent)
      throw new CivicError("This recording is not published", 403)
    let url = call.recordingUrl
    if (
      contact.isDemo &&
      isScriptedDemo(call.outcome) &&
      url &&
      /^\/demo-office\/audio\/[a-z-]+\.mp3$/.test(url)
    ) {
      const body = await readFile(
        resolve(process.cwd(), "public", url.slice(1))
      )
      const headers = new Headers({
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
        "Accept-Ranges": "bytes",
        "X-Content-Type-Options": "nosniff",
      })
      if (new URL(request.url).searchParams.get("download") === "1")
        headers.set(
          "Content-Disposition",
          `attachment; filename="${url.split("/").at(-1)}"`
        )
      const range = request.headers.get("range")
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range)
        if (!match || (!match[1] && !match[2]))
          return new Response(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${body.length}` },
          })
        const start = match[1]
          ? Number(match[1])
          : Math.max(0, body.length - Number(match[2]))
        const end =
          match[1] && match[2]
            ? Math.min(Number(match[2]), body.length - 1)
            : body.length - 1
        if (start >= body.length || start > end)
          return new Response(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${body.length}` },
          })
        headers.set("Content-Range", `bytes ${start}-${end}/${body.length}`)
        headers.set("Content-Length", String(end - start + 1))
        return new Response(body.subarray(start, end + 1), {
          status: 206,
          headers,
        })
      }
      headers.set("Content-Length", String(body.length))
      return new Response(body, { headers })
    }
    if (call.executionId) {
      const execution = await bolnaRequest(
        `/executions/${encodeURIComponent(call.executionId)}`
      )
      if (
        execution.id !== call.executionId ||
        execution.agent_id !== process.env.BOLNA_AGENT_ID
      )
        throw new CivicError(
          "Recording source does not match this conversation",
          409
        )
      if (allowedRecordingUrl(execution.telephony_data?.recording_url))
        url = execution.telephony_data.recording_url
    }
    if (!allowedRecordingUrl(url))
      throw new CivicError("The provider recording is not available yet", 404)
    let response: Response | undefined
    for (let redirects = 0; redirects < 4; redirects++) {
      if (!allowedRecordingUrl(url))
        throw new CivicError("Recording host is not configured", 502)
      const headers = new Headers()
      if (new URL(url).hostname === "api.bolna.ai")
        headers.set("Authorization", `Bearer ${process.env.BOLNA_API_KEY}`)
      const range = request.headers.get("range")
      if (range && /^bytes=\d*-\d*$/.test(range)) headers.set("Range", range)
      response = await fetch(url, {
        headers,
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(25_000),
      })
      if (![301, 302, 303, 307, 308].includes(response.status)) break
      const location = response.headers.get("location")
      if (!location)
        throw new CivicError("Recording redirect was incomplete", 502)
      url = new URL(location, url).toString()
    }
    if (!response?.ok)
      throw new CivicError("The recording could not be loaded", 502)
    const contentType = response.headers.get("content-type") || "audio/mpeg"
    if (!/^(audio\/|video\/|application\/octet-stream)/i.test(contentType))
      throw new CivicError(
        "The provider did not return an audio recording",
        502
      )
    const headers = new Headers({
      "Cache-Control": "no-store",
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
    })
    if (new URL(request.url).searchParams.get("download") === "1")
      headers.set(
        "Content-Disposition",
        `attachment; filename="pramanik-conversation-${id}.${/mpeg/.test(contentType) ? "mp3" : /wav/.test(contentType) ? "wav" : "audio"}"`
      )
    for (const name of ["content-length", "content-range", "accept-ranges"]) {
      const value = response.headers.get(name)
      if (value) headers.set(name, value)
    }
    return new Response(response.body, { status: response.status, headers })
  } catch (error) {
    return errorResponse(error)
  }
}
