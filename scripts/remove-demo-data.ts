import Database from "better-sqlite3"
import { mkdirSync } from "node:fs"
import { resolve } from "node:path"
import { removeDemoData } from "../lib/db/remove-demo-data"

const path = resolve(
  process.argv[2] ?? process.env.DATABASE_PATH ?? "data/pramanik.sqlite"
)
const sqlite = new Database(path, { fileMustExist: true })
mkdirSync("data/private/backups", { recursive: true })
const backup = resolve(
  `data/private/backups/pre-production-cleanup-${Date.now()}.sqlite`
)
await sqlite.backup(backup)
const removed = removeDemoData(sqlite)
console.log(
  JSON.stringify(
    {
      backup,
      removed,
      integrity: sqlite.pragma("integrity_check", { simple: true }),
    },
    null,
    2
  )
)
sqlite.close()
