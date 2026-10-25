import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { CURRENT_USER } from "../civic/user"
import { database } from "./index"
import * as s from "./schema"
import { demoSnapshot } from "../civic/demo"
import { LOCALITIES } from "../civic/model"
import {
  areaId,
  directoryExists,
  directoryPath,
  readCsv,
} from "../civic/directory"
import { readFileSync } from "node:fs"
import { seedOfficeDemo } from "./seed-office"
import { seedCityDemo } from "./seed-city"
import { DEMO_MODE } from "../demo-mode"

type MapPoint = {
  geometry: { type: string; coordinates: [number, number] }
  properties: Record<string, string>
}
export function seed() {
  const { db } = database()
  db.transaction((tx) => {
    tx.insert(s.participants)
      .values({ id: CURRENT_USER.id, tokenHash: "hardcoded-demo-user-no-auth" })
      .onConflictDoNothing()
      .run()
    const anchors = directoryExists("area_anchors.csv")
      ? readCsv(directoryPath("area_anchors.csv"))
      : []
    for (const locality of LOCALITIES) {
      const anchor = anchors.find(
        (row) =>
          row.area_id === locality.id || areaId(row.area_name) === locality.id
      )
      tx.insert(s.localities)
        .values({
          id: locality.id,
          name: locality.name,
          lat: anchor ? Number(anchor.latitude) : locality.lat,
          lng: anchor ? Number(anchor.longitude) : locality.lng,
          source:
            anchor?.source_url ?? "Master specification geographic anchor",
        })
        .onConflictDoNothing()
        .run()
    }
    const points: MapPoint[] = directoryExists("map_points.geojson")
      ? JSON.parse(readFileSync(directoryPath("map_points.geojson"), "utf8"))
          .features
      : []
    if (directoryExists("contacts_master.csv")) {
      for (const row of readCsv(directoryPath("contacts_master.csv"))) {
        const point = points.find(
          (feature) =>
            feature.geometry.type === "Point" &&
            feature.properties.contact_id === row.contact_id
        )
        const areaIds = row.area_tags.split(";").map(areaId).filter(Boolean)
        const values = {
          name: row.office_name,
          governmentBody: row.agency,
          address: row.office_address,
          designation: row.position,
          localityId: areaIds[0] ?? null,
          areaIds,
          lat: point?.geometry.coordinates[1] ?? null,
          lng: point?.geometry.coordinates[0] ?? null,
          jurisdiction: row.jurisdiction_description,
          topics: row.responsibility_topics,
          source: row.source_url,
          sourceAsOf: row.source_as_of,
          verificationStatus: row.verification_status,
          publishedPhone: row.office_phone || row.published_work_mobile || null,
          email: row.office_email || null,
          personName: row.person_name || null,
          notes: row.notes,
        }
        tx.insert(s.offices)
          .values({ id: row.contact_id, ...values })
          .onConflictDoUpdate({ target: s.offices.id, set: values })
          .run()
        tx.insert(s.contacts)
          .values({
            id: `contact-${row.contact_id}`,
            officeId: row.contact_id,
            designation: row.position,
            phone: values.publishedPhone ?? "",
            authorized: false,
            isDemo: false,
          })
          .onConflictDoNothing()
          .run()
      }
    }
    if (directoryExists("issue_routing_rules.csv")) {
      for (const [i, row] of readCsv(
        directoryPath("issue_routing_rules.csv")
      ).entries()) {
        const id = areaId(row.area_name)
        if (!id) continue
        tx.insert(s.responsibilityRules)
          .values({
            id: `rule-${i}`,
            localityId: id,
            issueType: row.issue_type,
            candidateOwner: row.candidate_owner_type,
            confirmationNeeded: row.confirmation_needed,
            confidence: row.routing_confidence,
          })
          .onConflictDoNothing()
          .run()
      }
    }
    if (!DEMO_MODE) return
    // Seed exactly once; deleted/changed cases are never silently recreated.
    const seeded = tx
      .select()
      .from(s.participants)
      .where(eq(s.participants.id, "demo-seed"))
      .get()
    if (!seeded) {
      tx.insert(s.participants)
        .values({ id: "demo-seed", tokenHash: randomUUID() })
        .run()
      for (const issue of demoSnapshot().issues) {
        const { events, complaintCount } = issue
        tx.insert(s.issues)
          .values({
            id: issue.id,
            title: issue.title,
            description: issue.description,
            category: issue.category,
            issueType: issue.issueType,
            localityId: issue.localityId,
            landmark: issue.landmark,
            lat: issue.lat,
            lng: issue.lng,
            status: issue.status,
            officeId: issue.officeId,
            assignmentCertainty: issue.assignmentCertainty,
            isDemo: issue.isDemo,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
          })
          .onConflictDoNothing()
          .run()
        for (let i = 0; i < complaintCount; i++) {
          const participantId = `demo-resident-${issue.id}-${i}`
          tx.insert(s.participants)
            .values({ id: participantId, tokenHash: randomUUID() })
            .run()
          tx.insert(s.complaints)
            .values({
              id: randomUUID(),
              issueId: issue.id,
              participantId,
              description: "Fictional demonstration complaint",
            })
            .run()
        }
        for (const event of events)
          tx.insert(s.issueEvents)
            .values({ ...event, issueId: issue.id })
            .run()
      }
    }
  })
  if (DEMO_MODE) {
    seedOfficeDemo(db)
    seedCityDemo(db)
  }
}
