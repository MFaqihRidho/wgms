# WGMS Project Context

## Project

WGMS means Werewolf Game Management System.

It is a villa/local-party Werewolf game controller with three screens:

- `/host`: moderator console
- `/play`: individual player phone UI
- `/tv`: fullscreen public villa TV display

The app uses Supabase Realtime for low-latency room sync and Supabase Postgres for recovery snapshots.

## Current Status

Phases 1-12 are implemented in this working tree.

Project path:

`/home/faqih/Desktop/main/wgms`

Always verify before handoff:

```bash
npm test
npm run build
npm run test:e2e
```

## Tech Stack

- React 19
- React Router 7
- Vite 8
- TailwindCSS 4 through `@tailwindcss/vite`
- Supabase JS 2
- Supabase Realtime Broadcast
- Supabase Realtime Presence
- Supabase Postgres
- Vitest

## Environment

Required local environment file:

`.env.local`

Values:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Never add Supabase service role keys to this Vite app.

## Commands

```bash
npm install
npm run dev
npm test
npm run build
```

## Routes

- `/`: landing page
- `/host`: moderator console
- `/play`: player phone UI
- `/tv`: public TV screen, supports `/tv?room=VILLA`

## Architecture

Do not introduce Next.js or a custom WebSocket server.

Realtime sync uses:

- Supabase Broadcast for game state and actions
- Supabase Presence for connected sockets
- Supabase Postgres for recovery snapshots

Database is used for room creation, durable player joins, game snapshots, and important event logging.

Database is not used for per-second timer ticks, animation state, presence state, or audio state.

The host is the authoritative reducer. Players send action broadcasts. The host validates/applies actions, persists snapshots, and broadcasts canonical game state.

## Core Files

- `src/lib/game-types.ts`: core types and broadcast payloads
- `src/lib/game-engine.ts`: pure game rules
- `src/lib/role-assignment.ts`: automatic roles for 4-12 players
- `src/lib/database.ts`: Supabase Postgres helpers
- `src/lib/realtime.ts`: Supabase Broadcast/Presence helpers
- `src/lib/storage.ts`: localStorage sessions
- `src/lib/room-code.ts`: room code/session helpers
- `src/lib/player-view.ts`: filtered player-facing view helper
- `src/lib/host-pin.ts`: client-side host PIN helpers
- `src/lib/audio.ts`: TV audio controller
- `src/lib/state-views.ts`: public/private filtered state builders
- `src/lib/host-guard.ts`: host claim guard helper
- `src/hooks/useLiveTimer.ts`: local countdown timer hook
- `src/routes/HostRoute.tsx`: host console
- `src/routes/PlayRoute.tsx`: player phone UI
- `src/routes/TvRoute.tsx`: TV display
- `supabase/schema.sql`: database schema and dev RLS policies
- `playwright.config.ts`: Playwright E2E configuration
- `tests/e2e/`: host/player/TV browser automation tests

## Game Rules

- Alpha Wolf appears as `WARGA` to Seer.
- Backup Seer unlocks after Seer death and the next night.
- Werewolves cannot target wolves.
- Dead players cannot act.
- Villagers win when no wolves remain.
- Werewolves win when alive wolves are greater than or equal to alive non-wolves.
- Supported player count is 4-12.

## Known Limitations

- Host PIN is client-side protection. It is practical for casual play but not production-grade security.
- Full `GameState` is currently broadcast to all clients. Technical players can inspect hidden roles in devtools.
- Production-grade hidden-role secrecy requires player-specific filtered state and trusted host mutations through Supabase Edge Functions or another backend.
- The final MVP uses filtered public/private broadcasts for UI. This reduces accidental role exposure, but Supabase Broadcast is still a shared channel.

## Phase 5-8 Additions

- Explicit wolf target and Seer inspect engine functions.
- Shared live timer hook.
- Player view helper for role-specific UI.
- Host ticker recovery from `game_events`.
- Client-side Host PIN setup/unlock.
- Room archive/reset controls.
- TV audio controller with placeholder-safe `.mp3` references.
- README and docs for Supabase, security, and manual QA.

## Phase 9-12 Additions

- Public and private state view contracts.
- TV consumes `PublicGameState` instead of full `GameState`.
- Player consumes `PlayerPrivateState` instead of full `GameState`.
- Host broadcasts full, public, and per-player private state.
- State request broadcast lets TV/players ask host for refreshed filtered state.
- Host room links include QR code and copy buttons.
- `/play?room=VILLA` prefills room code.
- TV shows voting progress count only.
- TV has fullscreen and best-effort wake lock control.
- New Game Same Players restarts with same names and reassigned roles.
- Deployment and future Edge Function docs added.

## Dark Fantasy UI Direction

- WGMS uses a moonlit dark fantasy werewolf theme.
- Visual language: haunted forest, gothic parchment, tarot role cards, blood seals, silver moonlight, and amber torchlight.
- Main design document: `docs/dark-fantasy-ui.md`.
- Shared fantasy components live in `src/components/fantasy.tsx`.
- Theme utilities and CSS illustrations live in `src/index.css`.

## Future-Agent Guidelines

- Keep the app Vite-powered.
- Do not add Next.js.
- Do not create a custom WebSocket server.
- Do not write timer ticks to Postgres.
- Prefer pure game-engine functions for rule changes.
- Add/update tests when changing rules.
- Update this file when changing architecture, schema, commands, or route contracts.

## Playwright E2E

- Documentation: `docs/playwright-e2e.md`.
- Tests run against the configured Supabase project.
- Run smoke only with `npx playwright test tests/e2e/smoke.spec.ts`.
- Full suite opens host, TV, and 8-10 player contexts, so it can take several minutes.
