# WGMS

Werewolf Game Management System for local villa/party play.

## Stack

- React Router 7
- Vite
- TailwindCSS
- Supabase Realtime Broadcast and Presence
- Supabase Postgres recovery snapshots
- Vitest

## Routes

- `/host`: moderator console
- `/play`: player phone UI
- `/tv`: fullscreen public TV display

## Setup

Create `.env.local`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Run the database schema in Supabase SQL editor:

`supabase/schema.sql`

Install and run:

```bash
npm install
npm run dev
```

## Verification

```bash
npm test
npm run build
```

E2E tests:

```bash
npm run test:e2e
```

## Documentation

- `context.md`: agent handoff context
- `docs/supabase.md`: Supabase setup
- `docs/security.md`: current security limitations and production direction
- `docs/manual-qa.md`: manual QA checklist
- `docs/deployment.md`: static hosting deployment
- `docs/edge-functions.md`: future production-security architecture
- `docs/playwright-e2e.md`: host/player/TV browser automation tests
