export function allowedRecordingUrl(value: unknown): value is string {
  if (typeof value !== "string") return false
  try {
    const url = new URL(value)
    const roots = [
      "bolna.ai",
      "amazonaws.com",
      "cloudfront.net",
      "plivo.com",
      "plivocloud.com",
      "vobiz.ai",
      "twilio.com",
      "r2.cloudflarestorage.com",
      ...(process.env.BOLNA_RECORDING_HOSTS || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ]
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (!url.port || url.port === "443") &&
      roots.some(
        (root) => url.hostname === root || url.hostname.endsWith(`.${root}`)
      )
    )
  } catch {
    return false
  }
}
export function publicRecordingPath(callId: string) {
  return `/api/voice/calls/${encodeURIComponent(callId)}/recording`
}
