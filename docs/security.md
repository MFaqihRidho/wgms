# Security Notes

WGMS is currently designed for local-party use and fast iteration.

## Current Protection

- Room codes provide casual room separation.
- Host PIN is client-side protection once enabled.
- Player sessions use local `session_token` values stored in `localStorage`.

## Important Limitations

- Client-side PIN checks are not strong security because the frontend is not trusted.
- Current dev RLS policies in `supabase/schema.sql` are permissive for anon use.
- The app broadcasts full `GameState`, including hidden roles, to all clients.
- Final MVP broadcasts filtered public and private state for app UI, but Supabase Broadcast is still a shared channel and not a cryptographic secrecy boundary.

## Production Direction

- Use Supabase Edge Functions or another trusted backend for host mutations.
- Broadcast filtered public state to TV.
- Broadcast player-specific private state to each player.
- Keep full hidden state only on host/trusted backend.
- Tighten RLS policies around room ownership and player sessions.
- Move private player state generation to an Edge Function for real secrecy.
