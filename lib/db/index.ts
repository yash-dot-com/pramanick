import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { dirname, resolve } from "node:path"
import * as schema from "./schema"

function connect() {
  const filename =
    process.env.DATABASE_PATH ??
    (process.env.VERCEL
      ? "/tmp/pramanik/pramanik.sqlite"
      : resolve(process.cwd(), "data/pramanik.sqlite"))
  if (filename !== ":memory:") mkdirSync(dirname(filename), { recursive: true })
  // Vercel functions have a read-only bundle; each instance gets a writable copy.
  const bundled = resolve(process.cwd(), "data/demo.sqlite")
  if (
    process.env.VERCEL &&
    filename !== ":memory:" &&
    !existsSync(filename) &&
    existsSync(bundled)
  ) {
    copyFileSync(bundled, filename)
  }
  const sqlite = new Database(filename)
  sqlite.pragma("journal_mode = WAL")
  sqlite.pragma("foreign_keys = ON")
  sqlite.pragma("busy_timeout = 5000")
  const db = drizzle(sqlite, { schema })
  return { db, sqlite }
}
const globalDb = globalThis as unknown as {
  pramanikDb?: ReturnType<typeof connect>
  pramanikMigrationJournal?: string
}
export function database() {
  const connection = (globalDb.pramanikDb ??= connect())
  // A manual revision can be cached before a newly generated SQL file exists.
  // Follow the actual journal so hot reload also applies newly appended migrations.
  const journal = createHash("sha256")
    .update(readFileSync(resolve(process.cwd(), "drizzle/meta/_journal.json")))
    .digest("hex")
  if (globalDb.pramanikMigrationJournal !== journal) {
    migrate(connection.db, {
      migrationsFolder: resolve(process.cwd(), "drizzle"),
    })
    globalDb.pramanikMigrationJournal = journal
  }
  return connection
}
