# Future Edge Function Architecture

The current app remains a static Vite app with Supabase Realtime and Postgres.

For stronger production security, host-only mutations should move into Supabase Edge Functions.

## Suggested Functions

```text
supabase/functions/verify-host-pin/index.ts
supabase/functions/host-action/index.ts
supabase/functions/player-private-state/index.ts
```

## verify-host-pin

Input:

```json
{ "room_code": "VILLA", "pin": "123456" }
```

Output:

```json
{ "ok": true, "host_claim_token": "..." }
```

## host-action

Input:

```json
{
  "room_code": "VILLA",
  "host_claim_token": "...",
  "action": "ADVANCE_TO_DAY",
  "payload": {}
}
```

Responsibilities:

- Verify host claim token.
- Load canonical `rooms.game_state`.
- Apply pure game-engine action.
- Save `rooms.game_state` and `rooms.public_state`.
- Log `game_events`.
- Return updated public/full state as appropriate.

## player-private-state

Input:

```json
{ "room_code": "VILLA", "name": "Budi", "session_token": "..." }
```

Responsibilities:

- Verify the player session token against `room_players`.
- Build `PlayerPrivateState` server-side.
- Return only that player's private state.

## Why Not Implemented Yet

The current final MVP keeps deployment simple as a static Vite app. Filtered broadcasts reduce accidental hidden-role exposure, but true secrecy still requires a trusted server path like these Edge Functions.
