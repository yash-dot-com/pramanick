import { createHash } from "node:crypto"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { CivicError, store } from "@/lib/civic/repository"
import * as s from "@/lib/db/schema"
import { DEMO_MODE } from "@/lib/demo-mode"

const defaults = {
  displayName: "Aarav Patil (demo)",
  designation: "Demo civic works coordinator",
  language: "hi",
}
function configuredPhone() {
  return process.env.BOLNA_DEMO_PHONE?.trim() ?? ""
}
export function phoneConfigured() {
  return (
    DEMO_MODE &&
    process.env.BOLNA_DEMO_CALL_AUTHORIZED === "true" &&
    /^\+[1-9]\d{7,14}$/.test(configuredPhone())
  )
}
function contactId() {
  return phoneConfigured()
    ? `demo-phone-${createHash("sha256").update(configuredPhone()).digest("hex").slice(0, 16)}`
    : "demo-phone-pending"
}

export function demoContact(requirePhone = true) {
  if (!DEMO_MODE)
    throw new CivicError(
      "Phone outreach is not configured for this workspace",
      409
    )
  if (requirePhone && !phoneConfigured())
    throw new CivicError(
      "Add your consenting demo phone as BOLNA_DEMO_PHONE and set BOLNA_DEMO_CALL_AUTHORIZED=true locally",
      409
    )
  const { db } = store()
  const id = contactId()
  const previous = db
    .select()
    .from(s.contacts)
    .where(eq(s.contacts.id, id))
    .get()
  const pending = db
    .select()
    .from(s.contacts)
    .where(eq(s.contacts.id, "demo-phone-pending"))
    .get()
  if (previous?.revokedAt && requirePhone)
    throw new CivicError("This demo contact has revoked calling consent", 409)
  db.transaction((tx) => {
    tx.insert(s.offices)
      .values({
        id: "PRAMANIK-DEMO",
        name: "Pramanik demo civic office",
        governmentBody: "Fictional demonstration",
        address: "Pune demo",
        designation: defaults.designation,
        areaIds: [],
        jurisdiction: "Demo cases only; no government authority",
        topics: "demo",
        source: "User-configured demonstration",
        sourceAsOf: new Date().toISOString(),
        verificationStatus: "DEMO",
        isDemo: true,
      })
      .onConflictDoNothing()
      .run()
    tx.insert(s.contacts)
      .values({
        id,
        officeId: "PRAMANIK-DEMO",
        phone: phoneConfigured() ? configuredPhone() : "",
        authorized: phoneConfigured(),
        isDemo: true,
        displayName:
          process.env.BOLNA_DEMO_NAME ||
          pending?.displayName ||
          defaults.displayName,
        designation: pending?.designation || defaults.designation,
        language: pending?.language || defaults.language,
        publicationConsent: pending?.publicationConsent ?? false,
        recordingConsent: pending?.recordingConsent ?? false,
      })
      .onConflictDoNothing()
      .run()
    if (previous && !previous.displayName)
      tx.update(s.contacts)
        .set({ displayName: pending?.displayName || defaults.displayName })
        .where(eq(s.contacts.id, id))
        .run()
  })
  return db.select().from(s.contacts).where(eq(s.contacts.id, id)).get()!
}

export function canCallDemoContact(contact: typeof s.contacts.$inferSelect) {
  return (
    phoneConfigured() &&
    contact.isDemo &&
    contact.authorized &&
    !contact.revokedAt &&
    contact.phone === configuredPhone()
  )
}

export function contactProfile() {
  if (!DEMO_MODE)
    return {
      id: "",
      displayName: "No outreach contact configured",
      designation: "Phone outreach unavailable",
      language: "en",
      publicationConsent: false,
      recordingConsent: false,
      revoked: false,
      phoneConfigured: false,
      recipient: null,
      isDemo: false,
    }
  const contact = demoContact(false)
  return {
    id: contact.id,
    displayName: contact.displayName,
    designation: contact.designation,
    language: contact.language,
    publicationConsent: contact.publicationConsent,
    recordingConsent: contact.recordingConsent,
    revoked: !!contact.revokedAt,
    phoneConfigured: phoneConfigured(),
    recipient: contact.phone ? `••••${contact.phone.slice(-4)}` : null,
    isDemo: true,
  }
}

export function saveContactProfile(raw: unknown) {
  const input = z
    .object({
      displayName: z.string().trim().min(2).max(100),
      designation: z.string().trim().min(2).max(150),
      language: z.enum(["hi", "mr", "en"]),
      publicationConsent: z.boolean(),
      recordingConsent: z.boolean(),
    })
    .parse(raw)
  const { db } = store()
  const contact = demoContact(false)
  db.update(s.contacts).set(input).where(eq(s.contacts.id, contact.id)).run()
  return contactProfile()
}
