# Production data defaults

Production always disables fictional fixtures, even if `NEXT_PUBLIC_DEMO_MODE=true` is accidentally configured. Outside production, that flag explicitly opts into demonstration data. Startup imports the published office directory and geographic anchors, but does not create fictional issues, officers, conversations, promises, surveys, or activity. Deployment no longer builds or copies the demo fixture database. Demo-only controls and the workspace badge are hidden.

To remove existing fixture records, run `node --import tsx scripts/remove-demo-data.ts`. It backs up the database under ignored `data/private/backups/`, deletes marked demo records and their dependent history, preserves real cases, clears their fictional office assignments, and checks referential integrity before committing. An optional database path may be passed as the first argument.

Phone outreach is shown as unavailable unless an explicitly opted-in demonstration is configured. This change does not enable unrestricted calling of published directory numbers. The existing single-user identity and SQLite/Vercel storage architecture are unchanged; production authentication and durable hosted storage still require separate work.

Fixture regression tests can opt in with `NEXT_PUBLIC_DEMO_MODE=true`. The video retains labels on its illustrative cases and scripted officer conversations.
