import type Database from "better-sqlite3"

type Row = { id: string; [key: string]: unknown }
type ForeignKey = { table: string; from: string; to: string }
const quote = (name: string) => `"${name.replaceAll('"', '""')}"`

// Remove fixture records and their dependent history, never relabel them as real.
// The caller makes a backup first. Integrity is checked before committing.
export function removeDemoData(sqlite: Database.Database) {
  const tables = (
    sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%'"
      )
      .all() as { name: string }[]
  ).map(({ name }) => name)
  const rows = new Map(
    tables.map((table) => [
      table,
      sqlite.prepare(`SELECT * FROM ${quote(table)}`).all() as Row[],
    ])
  )
  const foreignKeys = new Map(
    tables.map((table) => [
      table,
      sqlite.pragma(`foreign_key_list(${quote(table)})`) as ForeignKey[],
    ])
  )
  const removed = new Map(tables.map((table) => [table, new Set<string>()]))
  for (const table of ["issues", "offices", "contacts"]) {
    for (const row of rows.get(table) ?? [])
      if (row.is_demo === 1) removed.get(table)!.add(row.id)
  }
  const detach: { table: string; id: string; column: string }[] = []
  let changed = true
  while (changed) {
    changed = false
    for (const table of tables)
      for (const row of rows.get(table)!) {
        if (removed.get(table)!.has(row.id)) continue
        for (const fk of foreignKeys.get(table)!) {
          if (!removed.get(fk.table)?.has(String(row[fk.from]))) continue
          const realIssue = table === "issues" && row.is_demo !== 1
          const realAssignment =
            table === "issue_assignments" &&
            !removed.get("issues")?.has(String(row.issue_id))
          if (fk.from === "office_id" && (realIssue || realAssignment)) {
            detach.push({ table, id: row.id, column: fk.from })
            row[fk.from] = null
          } else {
            removed.get(table)!.add(row.id)
            changed = true
            break
          }
        }
      }
  }
  // Drop orphaned fixture participants, but retain any participant still cited.
  const candidates = new Set<string>()
  for (const table of ["complaints", "survey_responses"])
    for (const row of rows.get(table) ?? []) {
      if (removed.get(table)!.has(row.id))
        candidates.add(String(row.participant_id))
    }
  for (const row of rows.get("participants") ?? []) {
    if (row.id === "demo-user-yash") continue
    if (
      !candidates.has(row.id) &&
      !["demo-seed", "office-demo-v1", "city-demo-v1"].includes(row.id)
    )
      continue
    const referenced = tables.some((table) =>
      (foreignKeys.get(table) ?? []).some(
        (fk) =>
          fk.table === "participants" &&
          rows
            .get(table)!
            .some(
              (child) =>
                !removed.get(table)!.has(child.id) && child[fk.from] === row.id
            )
      )
    )
    if (!referenced) removed.get("participants")!.add(row.id)
  }
  const enabled = sqlite.pragma("foreign_keys", { simple: true })
  sqlite.pragma("foreign_keys = OFF")
  try {
    sqlite.transaction(() => {
      for (const item of detach) {
        sqlite
          .prepare(
            `UPDATE ${quote(item.table)} SET ${quote(item.column)} = NULL${item.table === "issues" ? ", assignment_certainty = 'unassigned'" : ""} WHERE id = ?`
          )
          .run(item.id)
      }
      for (const table of tables)
        for (const id of removed.get(table)!)
          sqlite.prepare(`DELETE FROM ${quote(table)} WHERE id = ?`).run(id)
      if ((sqlite.pragma("foreign_key_check") as unknown[]).length)
        throw new Error("Fixture cleanup would leave broken references")
    })()
  } finally {
    if (enabled) sqlite.pragma("foreign_keys = ON")
  }
  return Object.fromEntries(
    [...removed]
      .filter(([, ids]) => ids.size)
      .map(([table, ids]) => [table, ids.size])
  )
}
