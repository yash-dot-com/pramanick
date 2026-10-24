import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/*": [
      "./drizzle/**/*",
      "./data/pune/**/*",
      "./data/demo.sqlite",
      "./prompts/**/*.md",
      "./public/demo-office/audio/**/*",
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
