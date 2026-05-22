export type GameStatus =
    | "WAITING"
    | "NIGHT_PHASE"
    | "DAY_PHASE"
    | "VOTING_PHASE"
    | "GAME_OVER";

export type PlayerRole =
    | "ALPHA_WOLF"
    | "WEREWOLF"
    | "SEER"
    | "BACKUP_SEER"
    | "MASON"
    | "BODYGUARD"
    | "VILLAGER";

export type Winner = "WEREWOLVES" | "VILLAGERS" | null;

export type GamePlayer = {
    name: string;
    role: PlayerRole;
    is_alive: boolean;
    night_action_target: string | null;
    day_vote_target: string | null;
    inspected_target: string | null;
    bodyguard_target: string | null;
};

export type PublicPlayer = {
    name: string;
    is_alive: boolean;
};

export type VoteProgress = {
    submitted: number;
    total_alive: number;
};

export type PublicGameState = {
    room_code: string;
    status: GameStatus;
    day_count: number;
    timer_left: number;
    timer_duration: number;
    phase_started_at: string | null;
    last_killed: string | null;
    winner: Winner;
    players: PublicPlayer[];
    vote_progress: VoteProgress;
};

export type PlayerPrivateState = {
    room_code: string;
    status: GameStatus;
    day_count: number;
    timer_left: number;
    timer_duration: number;
    phase_started_at: string | null;
    last_killed: string | null;
    winner: Winner;
    self: GamePlayer;
    public_players: PublicPlayer[];
    valid_targets: PublicPlayer[];
    mason_partners: string[];
    seer_result: "WARGA" | "WEREWOLF" | null;
    werewolf_poll?: Array<{ target: string; votes: number }>;
};

export type GameState = {
    room_code: string;
    status: GameStatus;
    day_count: number;
    timer_left: number;
    timer_duration: number;
    phase_started_at: string | null;
    last_killed: string | null;
    winner: Winner;
    players: GamePlayer[];
    meta: {
        backup_seer_unlocked: boolean;
        seer_dead_on_day: number | null;
    };
};

export type PlayerSession = {
    room_code: string;
    name: string;
    session_token: string;
};

export type HostSession = {
    room_code: string;
    host_pin_hash?: string;
    host_claim_token?: string;
};

export type TvSession = {
    room_code: string;
    audio_enabled: boolean;
};

export type PresenceIdentity =
    | { screen: "host"; room_code: string }
    | { screen: "tv"; room_code: string }
    | {
          screen: "player";
          room_code: string;
          name: string;
          session_token: string;
      };

export type PlayerActionBroadcast = {
    type: "player_action";
    room_code: string;
    actor: string;
    action: "NIGHT_TARGET" | "SEER_INSPECT" | "DAY_VOTE";
    target: string;
    sent_at: string;
};

export type GameStateBroadcast = {
    type: "game_state";
    state: GameState;
    sent_at: string;
};

export type PublicStateBroadcast = {
    type: "public_state";
    state: PublicGameState;
    sent_at: string;
};

export type PlayerStateBroadcast = {
    type: "player_state";
    room_code: string;
    player_name: string;
    state: PlayerPrivateState;
    sent_at: string;
};

export type StateRequestBroadcast = {
    type: "state_request";
    room_code: string;
    requester: "player" | "tv";
    player_name?: string;
    sent_at: string;
};

export type TickerEventBroadcast = {
    type: "ticker_event";
    room_code: string;
    message: string;
    severity: "info" | "warning" | "danger";
    sent_at: string;
};

export type AudioCueBroadcast = {
    type: "audio_cue";
    room_code: string;
    cue:
        | "NIGHT_AMBIENT_START"
        | "NIGHT_AMBIENT_STOP"
        | "WOLF_HOWL"
        | "HEARTBEAT_START"
        | "HEARTBEAT_STOP";
    sent_at: string;
};

export type RoomRow = {
    id: string;
    room_code: string;
    status: GameStatus;
    day_count: number;
    timer_duration: number;
    phase_started_at: string | null;
    last_killed: string | null;
    winner: Winner;
    host_pin_hash: string | null;
    host_claim_token: string | null;
    archived_at: string | null;
    public_state: PublicGameState | null;
    game_state: GameState;
    created_at: string;
    updated_at: string;
};

export type RoomPlayerRow = {
    id: string;
    room_code: string;
    name: string;
    role: PlayerRole | null;
    is_alive: boolean;
    session_token: string;
    joined_at: string;
    updated_at: string;
};
