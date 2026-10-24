// Fictional fixtures and demonstration controls require an explicit opt-in.
export const DEMO_MODE =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DEMO_MODE === "true"
