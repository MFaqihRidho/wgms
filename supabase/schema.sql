create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  status text not null default 'WAITING',
  day_count integer not null default 0,
  timer_duration integer not null default 180,
  phase_started_at timestamptz,
  last_killed text,
  winner text,
  host_pin_hash text,
  host_claim_token text,
  archived_at timestamptz,
  public_state jsonb,
  game_state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references public.rooms(room_code) on delete cascade,
  name text not null,
  role text,
  is_alive boolean not null default true,
  session_token text not null,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(room_code, name)
);

create table if not exists public.game_events (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references public.rooms(room_code) on delete cascade,
  event_type text not null,
  actor text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists rooms_set_updated_at on public.rooms;
create trigger rooms_set_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

drop trigger if exists room_players_set_updated_at on public.room_players;
create trigger room_players_set_updated_at
before update on public.room_players
for each row execute function public.set_updated_at();

alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.game_events enable row level security;

drop policy if exists "anon can read rooms" on public.rooms;
create policy "anon can read rooms" on public.rooms for select to anon using (true);

drop policy if exists "anon can insert rooms" on public.rooms;
create policy "anon can insert rooms" on public.rooms for insert to anon with check (true);

drop policy if exists "anon can update rooms" on public.rooms;
create policy "anon can update rooms" on public.rooms for update to anon using (true) with check (true);

drop policy if exists "anon can read room players" on public.room_players;
create policy "anon can read room players" on public.room_players for select to anon using (true);

drop policy if exists "anon can insert room players" on public.room_players;
create policy "anon can insert room players" on public.room_players for insert to anon with check (true);

drop policy if exists "anon can update room players" on public.room_players;
create policy "anon can update room players" on public.room_players for update to anon using (true) with check (true);

drop policy if exists "anon can delete room players" on public.room_players;
create policy "anon can delete room players" on public.room_players for delete to anon using (true);

drop policy if exists "anon can read game events" on public.game_events;
create policy "anon can read game events" on public.game_events for select to anon using (true);

drop policy if exists "anon can insert game events" on public.game_events;
create policy "anon can insert game events" on public.game_events for insert to anon with check (true);
