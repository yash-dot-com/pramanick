import { z } from "zod"
import { CATEGORIES, LOCALITIES } from "./model"
export const complaintSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(4, "Give the issue a short title")
      .max(160)
      .optional(),
    intakeSessionId: z.string().uuid().optional(),
    localityId: z
      .string()
      .refine(
        (id) => LOCALITIES.some((place) => place.id === id),
        "Choose a supported locality"
      ),
    category: z.enum(["roads", "water", "drainage", "lighting"]),
    issueType: z.string().min(1).max(80),
    landmark: z.string().trim().min(3).max(200),
    description: z.string().trim().max(2000).default(""),
    lat: z.number().min(18.3).max(18.85),
    lng: z.number().min(73.6).max(74.1),
    joinIssueId: z.string().max(100).optional(),
    forceNew: z.boolean().default(false),
    isDemo: z.boolean().default(false),
    photo: z.string().max(2800000).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      !(CATEGORIES[value.category].types as readonly string[]).includes(
        value.issueType
      )
    )
      ctx.addIssue({
        code: "custom",
        path: ["issueType"],
        message: "Choose an issue type for this category",
      })
    if (
      value.photo &&
      !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value.photo)
    )
      ctx.addIssue({
        code: "custom",
        path: ["photo"],
        message: "Use a PNG, JPEG, or WebP photograph under 2 MB",
      })
  })
export const outcomeSchema = z.object({
  summary: z.string(),
  progress: z.enum([
    "not_started",
    "in_progress",
    "completion_claimed",
    "unknown",
    "wrong_contact",
  ]),
  commitment: z
    .object({
      action: z.string(),
      dueAt: z.string().datetime({ offset: true }).nullable(),
      quote: z.string(),
    })
    .nullable(),
  nextAction: z.string(),
  responseSignals: z.object({
    actionPlanGiven: z.boolean(),
    deadlineGiven: z.boolean(),
    responsibilityClarified: z.boolean(),
    evidenceQuote: z.string(),
    uncertainty: z.string(),
  }),
})
export const responseSchema = z.object({
  surveyId: z.string(),
  answer: z.enum(["fixed", "partially_fixed", "not_fixed", "cannot_verify"]),
  note: z.string().trim().max(2000).default(""),
  photo: z.string().max(2800000).optional(),
  observation: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      accuracy: z.number().min(0).max(100000),
      observedAt: z.string().datetime({ offset: true }),
      source: z.enum(["device", "demo"]),
    })
    .optional(),
})
