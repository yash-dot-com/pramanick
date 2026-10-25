import assert from "node:assert/strict"
import Database from "better-sqlite3"
import { removeDemoData } from "../lib/db/remove-demo-data"

const sqlite = new Database(":memory:")
sqlite.pragma("foreign_keys = ON")
sqlite.exec(`
  CREATE TABLE offices (id TEXT PRIMARY KEY, is_demo INTEGER NOT NULL);
  CREATE TABLE issues (id TEXT PRIMARY KEY, is_demo INTEGER NOT NULL, office_id TEXT REFERENCES offices(id), assignment_certainty TEXT);
  CREATE TABLE complaints (id TEXT PRIMARY KEY, issue_id TEXT REFERENCES issues(id), participant_id TEXT REFERENCES participants(id));
  CREATE TABLE participants (id TEXT PRIMARY KEY);
  INSERT INTO offices VALUES ('fictional-office', 1), ('real-office', 0);
  INSERT INTO participants VALUES ('fixture-resident'), ('real-resident');
  INSERT INTO issues VALUES ('fixture', 1, 'fictional-office', 'demo_confirmed'), ('real-case', 0, 'fictional-office', 'candidate');
  INSERT INTO complaints VALUES ('fixture-report', 'fixture', 'fixture-resident'), ('real-report', 'real-case', 'real-resident');
`)
const removed = removeDemoData(sqlite)
assert.equal(removed.issues, 1)
assert.equal(
  (sqlite.prepare("SELECT count(*) AS n FROM issues").get() as { n: number }).n,
  1
)
assert.deepEqual(
  sqlite
    .prepare(
      "SELECT office_id, assignment_certainty FROM issues WHERE id='real-case'"
    )
    .get(),
  { office_id: null, assignment_certainty: "unassigned" }
)
assert.equal(
  (
    sqlite
      .prepare("SELECT count(*) AS n FROM complaints WHERE id='real-report'")
      .get() as { n: number }
  ).n,
  1
)
assert.equal(
  (
    sqlite
      .prepare(
        "SELECT count(*) AS n FROM participants WHERE id='real-resident'"
      )
      .get() as { n: number }
  ).n,
  1
)
assert.deepEqual(sqlite.pragma("foreign_key_check"), [])
assert.deepEqual(removeDemoData(sqlite), {})
sqlite.close()
console.log("Fixture cleanup preserves real records and remains idempotent")
