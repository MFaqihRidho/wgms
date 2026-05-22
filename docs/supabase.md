# Supabase Setup

1. Create a Supabase project.
2. Copy the project URL and publishable key into `.env.local`.
3. Run `supabase/schema.sql` in the Supabase SQL editor.
4. Ensure Realtime is available for Broadcast and Presence.

If you see `PGRST205` or `Could not find the table 'public.rooms' in the schema cache`, the app is connected to Supabase but this schema has not been run in that project yet.

If you already ran the Phase 1-4 schema before Host PIN existed, run `supabase/phase-5-8-migration.sql` once.

Environment file:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Do not use a service role key in the frontend.

## Tables

- `rooms`: durable room snapshot and host PIN metadata
- `room_players`: durable player session rows
- `game_events`: lightweight event log for host ticker recovery

## Write Strategy

Write meaningful recovery state only: room creation, player joins, game start, phase changes, kill/revive, vote/action events, and game end.

Do not write every timer second.
