import type { NextConfig } from "next"
import { DEMO_MODE, SHOWCASE_DATA } from "./lib/demo-mode"

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/*": [
      "./drizzle/**/*",
      "./data/pune/**/*",
      ...(DEMO_MODE || SHOWCASE_DATA ? ["./data/demo.sqlite"] : []),
      "./prompts/**/*.md",
      ...(DEMO_MODE || SHOWCASE_DATA
        ? ["./public/demo-office/audio/**/*"]
        : []),
    ],
  },
  outputFileTracingExcludes: {
    "/*": [
      "./data/private/**/*",
      "./data/pramanik.sqlite*",
      "./data/evidence/**/*",
    ],
  },
}

export default nextConfig
