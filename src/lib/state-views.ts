import { getMasonPartners, getSeerResult } from "./game-engine";
import type {
    GamePlayer,
    GameState,
    PlayerPrivateState,
    PublicGameState,
    PublicPlayer,
} from "./game-types";
import { isWolf } from "./role-assignment";

export function toPublicGameState(state: GameState): PublicGameState {
    const alivePlayers = state.players.filter((player) => player.is_alive);

    return {
        room_code: state.room_code,
        status: state.status,
        day_count: state.day_count,
        timer_left: state.timer_left,
        timer_duration: state.timer_duration,
        phase_started_at: state.phase_started_at,
        last_killed: state.last_killed,
        winner: state.winner,
        players: state.players.map(toPublicPlayer),
        vote_progress: {
            submitted: alivePlayers.filter((player) => player.day_vote_target)
                .length,
            total_alive: alivePlayers.length,
        },
    };
}

export function toPlayerPrivateState(
    state: GameState,
    playerName: string,
): PlayerPrivateState | null {
    const self = state.players.find((player) => player.name === playerName);
    if (!self) return null;

    return {
        room_code: state.room_code,
        status: state.status,
        day_count: state.day_count,
        timer_left: state.timer_left,
        timer_duration: state.timer_duration,
        phase_started_at: state.phase_started_at,
        last_killed: state.last_killed,
        winner: state.winner,
        self: { ...self },
        public_players: state.players.map(toPublicPlayer),
        valid_targets: getValidTargets(state, self).map(toPublicPlayer),
        mason_partners:
            self.role === "MASON" ? getMasonPartners(state, self.name) : [],
        seer_result: self.inspected_target
            ? getSeerResult(state, self.inspected_target)
            : null,
        werewolf_poll: isWolf(self.role) ? getWerewolfPoll(state) : undefined,
    };
}

function toPublicPlayer(player: GamePlayer): PublicPlayer {
    return { name: player.name, is_alive: player.is_alive };
}

function getValidTargets(state: GameState, self: GamePlayer) {
    if (!self.is_alive) return [];
    const livingTargets = state.players.filter(
        (player) => player.is_alive && player.name !== self.name,
    );

    if (state.status === "VOTING_PHASE") return livingTargets;
    if (state.status !== "NIGHT_PHASE") return [];
    if (isWolf(self.role))
        return livingTargets.filter((player) => !isWolf(player.role));
    if (
        self.role === "SEER" ||
        (self.role === "BACKUP_SEER" && state.meta.backup_seer_unlocked)
    ) {
        return self.inspected_target ? [] : livingTargets;
    }
    // Bodyguard can protect any living player (including themselves)
    // They don't know who the wolves are, so all living players are valid targets
    if (self.role === "BODYGUARD") {
        return state.players.filter((player) => player.is_alive);
    }

    return [];
}

function getWerewolfPoll(state: GameState) {
    const counts = new Map<string, number>();
    for (const player of state.players) {
        if (
            player.is_alive &&
            isWolf(player.role) &&
            player.night_action_target
        ) {
            counts.set(
                player.night_action_target,
                (counts.get(player.night_action_target) ?? 0) + 1,
            );
        }
    }

    return [...counts.entries()]
        .map(([target, votes]) => ({ target, votes }))
        .sort((a, b) => b.votes - a.votes || a.target.localeCompare(b.target));
}
