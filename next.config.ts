import type { NextConfig } from "next"
import { DEMO_MODE } from "./lib/demo-mode"

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/*": [
      "./drizzle/**/*",
      "./data/pune/**/*",
      ...(DEMO_MODE ? ["./data/demo.sqlite"] : []),
      "./prompts/**/*.md",
      ...(DEMO_MODE ? ["./public/demo-office/audio/**/*"] : []),
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
