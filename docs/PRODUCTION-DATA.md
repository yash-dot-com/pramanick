# Production data modes

Normal production disables interactive demo mode, even when `NEXT_PUBLIC_DEMO_MODE=true`. Without `PRAMANIK_SHOWCASE_DATA=true`, startup imports only the published office directory and geographic anchors; it does not create sample issues or conversations.

The public hackathon deployment explicitly sets `PRAMANIK_SHOWCASE_DATA=true` in `vercel.json`. The build creates `data/demo.sqlite`, includes it with migrations, directory data and existing audio assets, and restores that clean fixture into each Vercel instance. This populates maps, dashboards, case histories and responsibility profiles. Private local databases are never uploaded.

Showcase data does not enable interactive demo mode, phone authorization, or calls to directory contacts. Sample contacts retain blank, unauthorized phone numbers. Existing fixture provenance and publication markers remain intact.

To remove fixture records, use `node --import tsx scripts/remove-demo-data.ts` on the intended database. It backs up the database under ignored `data/private/backups/`, preserves real cases and checks foreign keys.

Vercel uses temporary per-instance SQLite storage. New reports and edits are not durable or shared between instances. Durable community data and continuous follow-up workers remain separate deployment work; this fix restores the populated browsing showcase.

Checks: `node --import tsx scripts/production-data.test.ts`, `node --import tsx scripts/showcase-production.test.ts`, and `npm run vercel-build`.
