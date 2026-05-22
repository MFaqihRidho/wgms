# Playwright E2E Tests

WGMS includes Playwright tests for browser-level automation across host, player, and TV screens.

## Installed Tools

- `@playwright/test`
- Chromium browser through `npx playwright install chromium`

## Commands

Run all E2E tests:

```bash
npm run test:e2e
```

Run with Playwright UI:

```bash
npm run test:e2e:ui
```

Run headed:

```bash
npm run test:e2e:headed
```

Debug:

```bash
npm run test:e2e:debug
```

Run one file:

```bash
npx playwright test tests/e2e/smoke.spec.ts
```

## Environment

The tests run against the real configured Supabase project.

Required env:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Run `supabase/schema.sql` in the Supabase SQL editor before running realtime E2E tests.

If you see `PGRST205`, the tables are missing in that Supabase project.

## Test Files

- `tests/e2e/smoke.spec.ts`: verifies main routes load.
- `tests/e2e/host-ui.spec.ts`: verifies the simplified host page shows only phase-relevant primary actions.
- `tests/e2e/realtime-8-player.spec.ts`: opens host, TV, and 8 player contexts to verify realtime sync and night/day transitions.
- `tests/e2e/realtime-10-player-voting.spec.ts`: opens host, TV, and 10 player contexts to verify voting progress and resolution.
- `tests/e2e/recovery.spec.ts`: verifies host, TV, and player refresh/recovery behavior.

## Notes

- Tests run sequentially with one worker because they use shared Supabase realtime channels.
- Each player uses a separate browser context so `localStorage` sessions do not collide.
- Room codes are generated per test to avoid conflicts.
- Failed tests may leave test rooms in Supabase. This is expected when testing against the real project.
- Realtime tests can take several minutes because they launch 8-10 player contexts plus host and TV.

## Recommended Local Flow

```bash
npm test
npm run build
npx playwright test tests/e2e/smoke.spec.ts
npm run test:e2e
```
