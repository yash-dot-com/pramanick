import { DEMO_MODE } from "../lib/demo-mode"
import { database } from "../lib/db"
import { seedCityDemo } from "../lib/db/seed-city"

if (!DEMO_MODE)
  throw new Error("Run this only in the opted-in local demo workspace.")
const { db, sqlite } = database()
seedCityDemo(db)
sqlite.close()
console.log(
  "Applied stable scattered positions to the city demo fixtures. Real reports and office coordinates are unchanged."
)
