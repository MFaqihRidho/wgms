alter table public.rooms
add column if not exists host_pin_hash text,
add column if not exists host_claim_token text,
add column if not exists archived_at timestamptz,
add column if not exists public_state jsonb;

drop policy if exists "anon can delete room players" on public.room_players;
create policy "anon can delete room players" on public.room_players for delete to anon using (true);
