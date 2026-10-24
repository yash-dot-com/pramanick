# Vercel demo deployment

Push `main` to the existing GitHub-connected Vercel project. `vercel.json` runs `npm run vercel-build`, which runs `npm run db:demo` before Next.js compilation. No external database, new package, or API key is required to browse the populated demonstration.

`scripts/populate-demo.ts` builds `data/demo.sqlite` from the directory, the existing office/audio scenarios, and `lib/db/seed-city.ts`. It checks SQLite integrity and foreign keys, checkpoints the WAL and produces a self-contained database file. Repeated runs are idempotent. The generated file is ignored by Git and created during each deployment; private local databases are excluded from function bundles.

Next.js bundles the generated fixture, migrations, directory and prompts. On Vercel, `lib/db/index.ts` copies the fixture to `/tmp/pramanik/pramanik.sqlite` on first use, then opens it for writes. `DATABASE_PATH` can override the default. Local development keeps `data/pramanik.sqlite`.

**Storage scope:** each Vercel instance has its own temporary database. New reports/edits are not durable across replacement or shared across instances. The fixture always returns on a fresh instance. Continuous phone workers and durable multi-instance workflows require separately hosted persistence and a worker; this deployment provides the populated browsing demonstration. AI speech/calls still require their existing environment configuration.

Generated cases are marked `isDemo`, have synthetic provenance and use separate fictional desks with blank, unauthorized phone numbers. The interface uses a single unobtrusive “Demo workspace” indicator. Scripted history never establishes that an actual government employee was contacted.

Checks: `npm run db:demo`, `npm run typecheck`, `node --import tsx --test scripts/demo-seed.test.ts`, `npm run vercel-build`. Inspect `/api/civic`, `/api/dashboard`, `/api/profiles` and a case dossier on the deployed URL.
