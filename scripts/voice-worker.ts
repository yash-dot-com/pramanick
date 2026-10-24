import { mkdirSync, renameSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { reconcilePendingCalls, workOneJob } from "../lib/voice/worker"
import { reconcileIntakeSessions } from "../lib/voice/intake"

let stopping = false
process.on("SIGINT", () => {
  stopping = true
})
process.on("SIGTERM", () => {
  stopping = true
})
const directory = resolve(process.cwd(), "data/private")
mkdirSync(directory, { recursive: true, mode: 0o700 })
function heartbeat(state: string) {
  const filename = resolve(directory, `voice-worker-${process.pid}.tmp`)
  writeFileSync(
    filename,
    JSON.stringify({
      pid: process.pid,
      state,
      updatedAt: new Date().toISOString(),
    }),
    { mode: 0o600 }
  )
  renameSync(filename, resolve(directory, "voice-worker.json"))
}
console.log(
  "Pramanik voice worker started. Processing durable call, outcome, and deadline jobs."
)
let lastReconciliation = 0
while (!stopping) {
  try {
    heartbeat("running")
    if (Date.now() - lastReconciliation > 30_000) {
      reconcilePendingCalls()
      await reconcileIntakeSessions()
      lastReconciliation = Date.now()
    }
    const worked = await workOneJob()
    if (!worked) await new Promise((resolve) => setTimeout(resolve, 1000))
  } catch {
    heartbeat("recovering")
    console.error(
      "Worker cycle failed; queued work is preserved. Retrying in five seconds."
    )
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
}
heartbeat("stopped")
console.log("Pramanik voice worker stopped.")
