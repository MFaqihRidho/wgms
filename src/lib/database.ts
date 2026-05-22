import type {
    GameState,
    PlayerRole,
    RoomPlayerRow,
    RoomRow,
} from "./game-types";
import { createInitialGame } from "./game-engine";
import { normalizeDatabaseError } from "./database-error";
import { toPublicGameState } from "./state-views";
import { requireSupabase } from "./supabase";

export async function createOrLoadRoom(roomCode: string) {
    const existing = await getRoom(roomCode);
    if (existing) return existing;

    const state = createInitialGame(roomCode);
    const client = requireSupabase();
    const { data, error } = await client
        .from("rooms")
        .insert({
            room_code: roomCode,
            status: state.status,
            day_count: state.day_count,
            timer_duration: state.timer_duration,
            phase_started_at: state.phase_started_at,
            last_killed: state.last_killed,
            winner: state.winner,
            public_state: toPublicGameState(state),
            game_state: state,
        })
        .select()
        .single();

    if (error) throw normalizeDatabaseError(error);
    return data as RoomRow;
}

export async function createOrLoadRoomWithHostPin(
    roomCode: string,
    hostPinHash: string,
) {
    const existing = await getRoom(roomCode);
    if (existing) return existing;

    const state = createInitialGame(roomCode);
    const client = requireSupabase();
    const { data, error } = await client
        .from("rooms")
        .insert({
            room_code: roomCode,
            status: state.status,
            day_count: state.day_count,
            timer_duration: state.timer_duration,
            phase_started_at: state.phase_started_at,
            last_killed: state.last_killed,
            winner: state.winner,
            host_pin_hash: hostPinHash,
            host_claim_token: crypto.randomUUID(),
            public_state: toPublicGameState(state),
            game_state: state,
        })
        .select()
        .single();

    if (error) throw normalizeDatabaseError(error);
    return data as RoomRow;
}

export async function setRoomHostPin(roomCode: string, hostPinHash: string) {
    const hostClaimToken = crypto.randomUUID();
    const client = requireSupabase();
    const { data, error } = await client
        .from("rooms")
        .update({
            host_pin_hash: hostPinHash,
            host_claim_token: hostClaimToken,
        })
        .eq("room_code", roomCode)
        .select()
        .single();

    if (error) throw normalizeDatabaseError(error);
    return data as RoomRow;
}

export async function getRoom(roomCode: string) {
    const client = requireSupabase();
    const { data, error } = await client
        .from("rooms")
        .select("*")
        .eq("room_code", roomCode)
        .maybeSingle();

    if (error) throw normalizeDatabaseError(error);
    return data as RoomRow | null;
}

export async function saveGameSnapshot(state: GameState) {
    const client = requireSupabase();
    const { data, error } = await client
        .from("rooms")
        .update({
            status: state.status,
            day_count: state.day_count,
            timer_duration: state.timer_duration,
            phase_started_at: state.phase_started_at,
            last_killed: state.last_killed,
            winner: state.winner,
            public_state: toPublicGameState(state),
            game_state: state,
        })
        .eq("room_code", state.room_code)
        .select()
        .single();

    if (error) throw normalizeDatabaseError(error);
    return data as RoomRow;
}

export async function getRoomPlayers(roomCode: string) {
    const client = requireSupabase();
    const { data, error } = await client
        .from("room_players")
        .select("*")
        .eq("room_code", roomCode)
        .order("joined_at", { ascending: true });

    if (error) throw normalizeDatabaseError(error);
    return (data ?? []) as RoomPlayerRow[];
}

export async function getRecentGameEvents(roomCode: string, limit = 50) {
    const client = requireSupabase();
    const { data, error } = await client
        .from("game_events")
        .select("*")
        .eq("room_code", roomCode)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) throw normalizeDatabaseError(error);
    return (data ?? []) as Array<{
        id: string;
        room_code: string;
        event_type: string;
        actor: string | null;
        payload: Record<string, unknown>;
        created_at: string;
    }>;
}

export async function joinRoomPlayer(
    roomCode: string,
    name: string,
    sessionToken: string,
) {
    const existing = (await getRoomPlayers(roomCode)).find(
        (player) => player.name === name,
    );

    if (existing && existing.session_token !== sessionToken) {
        throw new Error("Nickname is already taken in this room.");
    }

    const client = requireSupabase();
    const { data, error } = await client
        .from("room_players")
        .upsert(
            {
                room_code: roomCode,
                name,
                session_token: sessionToken,
            },
            { onConflict: "room_code,name" },
        )
        .select()
        .single();

    if (error) throw normalizeDatabaseError(error);
    await logGameEvent(roomCode, "PLAYER_JOINED", name, { name });
    return data as RoomPlayerRow;
}

export async function syncRoomPlayersFromState(state: GameState) {
    const client = requireSupabase();

    // First reset all players in the room to unassigned (handles players not in new game)
    await client
        .from("room_players")
        .update({ role: null, is_alive: true })
        .eq("room_code", state.room_code);

    // Then apply the new game's role assignments
    for (const player of state.players) {
        const { error } = await client
            .from("room_players")
            .update({ role: player.role, is_alive: player.is_alive })
            .eq("room_code", state.room_code)
            .eq("name", player.name);

        if (error) throw normalizeDatabaseError(error);
    }
}

export async function updateRoomPlayerRole(
    roomCode: string,
    name: string,
    role: PlayerRole,
    isAlive: boolean,
) {
    const client = requireSupabase();
    const { error } = await client
        .from("room_players")
        .update({ role, is_alive: isAlive })
        .eq("room_code", roomCode)
        .eq("name", name);

    if (error) throw normalizeDatabaseError(error);
}

export async function logGameEvent(
    roomCode: string,
    eventType: string,
    actor: string | null,
    payload: object,
) {
    const client = requireSupabase();
    const { error } = await client.from("game_events").insert({
        room_code: roomCode,
        event_type: eventType,
        actor,
        payload,
    });

    if (error) throw normalizeDatabaseError(error);
}

export async function archiveRoom(roomCode: string) {
    const client = requireSupabase();
    const { error } = await client
        .from("rooms")
        .update({ archived_at: new Date().toISOString() })
        .eq("room_code", roomCode);
    if (error) throw normalizeDatabaseError(error);
}

export async function resetRoom(roomCode: string) {
    const client = requireSupabase();
    const state = createInitialGame(roomCode);
    const { error: playersError } = await client
        .from("room_players")
        .delete()
        .eq("room_code", roomCode);
    if (playersError) throw normalizeDatabaseError(playersError);
    const { error } = await client
        .from("rooms")
        .update({
            status: state.status,
            day_count: state.day_count,
            timer_duration: state.timer_duration,
            phase_started_at: state.phase_started_at,
            last_killed: state.last_killed,
            winner: state.winner,
            public_state: toPublicGameState(state),
            game_state: state,
        })
        .eq("room_code", roomCode);
    if (error) throw normalizeDatabaseError(error);
    await logGameEvent(roomCode, "ROOM_RESET", "HOST", {});
    return state;
}
