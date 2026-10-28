// Fictional fixtures and demonstration controls require an explicit opt-in.
export const DEMO_MODE =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DEMO_MODE === "true"

// Public showcase records are independent of interactive calling permissions.
export const SHOWCASE_DATA = process.env.PRAMANIK_SHOWCASE_DATA === "true"
