import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"

// This builds a clean deployable fixture, never the developer's private database.
process.env.DATABASE_PATH = resolve(process.cwd(), "data/demo.sqlite")
process.env.NEXT_PUBLIC_DEMO_MODE = "true"
mkdirSync(dirname(process.env.DATABASE_PATH), { recursive: true })
const { store } = await import("../lib/civic/repository")
const { sqlite } = store()
sqlite.pragma("wal_checkpoint(TRUNCATE)")
sqlite.pragma("journal_mode = DELETE")
const counts = Object.fromEntries(
  [
    "issues",
    "complaints",
    "offices",
    "calls",
    "commitments",
    "surveys",
    "survey_responses",
    "agent_activities",
  ].map((table) => [
    table,
    (
      sqlite.prepare(`SELECT count(*) AS count FROM ${table}`).get() as {
        count: number
      }
    ).count,
  ])
)
const integrity = sqlite.pragma("integrity_check", { simple: true })
if (
  integrity !== "ok" ||
  (sqlite.pragma("foreign_key_check") as unknown[]).length
)
  throw new Error("Demo database integrity check failed")
console.log(
  JSON.stringify({ database: "data/demo.sqlite", counts, integrity }, null, 2)
)
sqlite.close()
