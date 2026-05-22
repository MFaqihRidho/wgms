import type { GamePlayer, GameState, Winner } from "./game-types";
import { assignRoles, isWolf } from "./role-assignment";

const defaultTimer = 180;

export function createInitialGame(roomCode: string): GameState {
    return {
        room_code: roomCode,
        status: "WAITING",
        day_count: 0,
        timer_left: defaultTimer,
        timer_duration: defaultTimer,
        phase_started_at: null,
        last_killed: null,
        winner: null,
        players: [],
        meta: {
            backup_seer_unlocked: false,
            seer_dead_on_day: null,
        },
    };
}

export function createWaitingGame(
    roomCode: string,
    playerNames: string[],
): GameState {
    return {
        ...createInitialGame(roomCode),
        players: playerNames.map((name) => createLobbyPlayer(name)),
    };
}

export function startGame(
    roomCode: string,
    playerNames: string[],
    random = Math.random,
): GameState {
    if (playerNames.length < 4) {
        throw new Error("Cannot start game. Minimum 4 players required.");
    }

    const players = assignRoles(playerNames, random);

    return {
        ...createInitialGame(roomCode),
        status: "DAY_PHASE",
        day_count: 1,
        phase_started_at: new Date().toISOString(),
        players,
    };
}

export function restartGameSamePlayers(
    state: GameState,
    random = Math.random,
): GameState {
    return startGame(
        state.room_code,
        state.players.map((player) => player.name),
        random,
    );
}

export function advanceToNight(state: GameState): GameState {
    const seer = state.players.find((player) => player.role === "SEER");
    const backupUnlocks =
        state.meta.backup_seer_unlocked || Boolean(seer && !seer.is_alive);

    return withWinner({
        ...state,
        status: "NIGHT_PHASE",
        timer_left: state.timer_duration,
        phase_started_at: new Date().toISOString(),
        players: state.players.map((player) => ({
            ...player,
            night_action_target: null,
            day_vote_target: null,
            inspected_target: null,
            bodyguard_target: null,
        })),
        meta: {
            backup_seer_unlocked: backupUnlocks,
            seer_dead_on_day: backupUnlocks
                ? (state.meta.seer_dead_on_day ?? state.day_count)
                : null,
        },
    });
}

export function advanceToDay(state: GameState): GameState {
    return withWinner({
        ...resolveNightKill(state),
        status: "DAY_PHASE",
        timer_left: state.timer_duration,
        phase_started_at: new Date().toISOString(),
    });
}

export function openVoting(state: GameState): GameState {
    return {
        ...state,
        status: "VOTING_PHASE",
        timer_left: state.timer_duration,
        phase_started_at: new Date().toISOString(),
        players: state.players.map((player) => ({
            ...player,
            day_vote_target: null,
        })),
    };
}

export function resolveNightKill(state: GameState): GameState {
    const wolfVotes = state.players.filter(
        (player) =>
            isWolf(player.role) &&
            player.is_alive &&
            player.night_action_target,
    );
    const target = pickTopTarget(
        wolfVotes.map((player) => player.night_action_target!),
    );

    if (!target) {
        return { ...state, last_killed: null };
    }

    // Check if the Bodyguard is protecting the wolf's target
    const isProtected = state.players.some(
        (player) =>
            player.role === "BODYGUARD" &&
            player.is_alive &&
            player.bodyguard_target === target,
    );

    if (isProtected) {
        // Kill blocked — no one dies this night
        return { ...state, last_killed: null };
    }

    return killPlayer({ ...state, last_killed: target }, target);
}

export function resolveDayVote(state: GameState): GameState {
    const aliveCount = state.players.filter((p) => p.is_alive).length;
    const votes = state.players.filter(
        (player) => player.is_alive && player.day_vote_target,
    );

    // Require strictly more than 50% of alive players to execute
    const target = pickTopTarget(
        votes.map((player) => player.day_vote_target!),
        aliveCount,
    );

    const nextDayCount = state.day_count + 1;

    if (!target) {
        // No majority — advance to night, check if seer died (unlock backup seer)
        return advanceToNightFromVote({
            ...state,
            day_count: nextDayCount,
        });
    }

    const afterKill = killPlayer({ ...state, last_killed: target }, target);

    // Check for winner before advancing to night
    const withWin = withWinner(afterKill);
    if (withWin.status === "GAME_OVER") return withWin;

    // Advance to night — this also handles backup seer unlock
    return advanceToNightFromVote({
        ...afterKill,
        day_count: nextDayCount,
    });
}

// Internal helper: transition to NIGHT_PHASE and handle backup seer unlock.
// Used by resolveDayVote so the unlock logic isn't duplicated.
function advanceToNightFromVote(state: GameState): GameState {
    const seer = state.players.find((player) => player.role === "SEER");
    const backupUnlocks =
        state.meta.backup_seer_unlocked || Boolean(seer && !seer.is_alive);

    return withWinner({
        ...state,
        status: "NIGHT_PHASE",
        timer_left: state.timer_duration,
        phase_started_at: new Date().toISOString(),
        players: state.players.map((player) => ({
            ...player,
            night_action_target: null,
            day_vote_target: null,
            inspected_target: null,
            bodyguard_target: null,
        })),
        meta: {
            backup_seer_unlocked: backupUnlocks,
            seer_dead_on_day: backupUnlocks
                ? (state.meta.seer_dead_on_day ?? state.day_count)
                : null,
        },
    });
}

export function killPlayer(state: GameState, name: string): GameState {
    const players = state.players.map((player) =>
        player.name === name ? { ...player, is_alive: false } : player,
    );
    const killed = players.find((player) => player.name === name);
    const seerDeadOnDay =
        killed?.role === "SEER" ? state.day_count : state.meta.seer_dead_on_day;

    return withWinner({
        ...state,
        players,
        meta: { ...state.meta, seer_dead_on_day: seerDeadOnDay },
    });
}

export function revivePlayer(state: GameState, name: string): GameState {
    const players = state.players.map((player) =>
        player.name === name ? { ...player, is_alive: true } : player,
    );

    return withWinner({ ...state, players });
}

export function setTimer(state: GameState, seconds: number): GameState {
    const safeSeconds = Math.max(10, Math.floor(seconds));
    return {
        ...state,
        timer_duration: safeSeconds,
        timer_left: safeSeconds,
        phase_started_at: new Date().toISOString(),
    };
}

export function endGame(
    state: GameState,
    winner: NonNullable<Winner>,
): GameState {
    return { ...state, status: "GAME_OVER", winner };
}

export function applyNightTarget(
    state: GameState,
    actor: string,
    target: string,
): GameState {
    const actingPlayer = state.players.find((player) => player.name === actor);
    if (
        actingPlayer?.role === "SEER" ||
        (actingPlayer && isUnlockedBackupSeer(state, actingPlayer))
    ) {
        return applySeerInspect(state, actor, target);
    }

    if (actingPlayer?.role === "BODYGUARD") {
        return applyBodyguardProtect(state, actor, target);
    }

    return applyWerewolfTarget(state, actor, target);
}

export function applyBodyguardProtect(
    state: GameState,
    actor: string,
    target: string,
): GameState {
    if (state.status !== "NIGHT_PHASE") return state;

    const actingPlayer = state.players.find((player) => player.name === actor);
    const targetPlayer = state.players.find((player) => player.name === target);

    if (!actingPlayer?.is_alive || !targetPlayer?.is_alive) return state;
    if (actingPlayer.role !== "BODYGUARD") return state;
    if (!canPerformNightAction(state, actingPlayer)) return state;

    return {
        ...state,
        players: state.players.map((player) =>
            player.name === actor
                ? {
                      ...player,
                      bodyguard_target: target,
                      night_action_target: target,
                  }
                : player,
        ),
    };
}

export function applyWerewolfTarget(
    state: GameState,
    actor: string,
    target: string,
): GameState {
    if (state.status !== "NIGHT_PHASE") return state;

    const actingPlayer = state.players.find((player) => player.name === actor);
    const targetPlayer = state.players.find((player) => player.name === target);

    if (!actingPlayer?.is_alive || !targetPlayer?.is_alive) return state;
    if (!isWolf(actingPlayer.role)) return state;
    if (isWolf(actingPlayer.role) && isWolf(targetPlayer.role)) return state;
    if (!canPerformNightAction(state, actingPlayer)) return state;

    return {
        ...state,
        players: state.players.map((player) => {
            if (player.name !== actor) return player;
            return {
                ...player,
                night_action_target: target,
            };
        }),
    };
}

export function applySeerInspect(
    state: GameState,
    actor: string,
    target: string,
): GameState {
    if (state.status !== "NIGHT_PHASE") return state;

    const actingPlayer = state.players.find((player) => player.name === actor);
    const targetPlayer = state.players.find((player) => player.name === target);

    if (!actingPlayer?.is_alive || !targetPlayer?.is_alive) return state;
    if (
        actingPlayer.role !== "SEER" &&
        !isUnlockedBackupSeer(state, actingPlayer)
    )
        return state;
    if (!canPerformNightAction(state, actingPlayer)) return state;

    return {
        ...state,
        players: state.players.map((player) =>
            player.name === actor
                ? {
                      ...player,
                      night_action_target: target,
                      inspected_target: target,
                  }
                : player,
        ),
    };
}

export function applyDayVote(
    state: GameState,
    actor: string,
    target: string,
): GameState {
    if (state.status !== "VOTING_PHASE") return state;

    const actingPlayer = state.players.find((player) => player.name === actor);
    const targetPlayer = state.players.find((player) => player.name === target);

    if (!actingPlayer?.is_alive || !targetPlayer?.is_alive) return state;

    return {
        ...state,
        players: state.players.map((player) =>
            player.name === actor
                ? { ...player, day_vote_target: target }
                : player,
        ),
    };
}

export function getSeerResult(
    state: GameState,
    target: string,
): "WARGA" | "WEREWOLF" {
    const targetPlayer = state.players.find((player) => player.name === target);
    if (!targetPlayer) return "WARGA";
    if (targetPlayer.role === "ALPHA_WOLF") return "WARGA";
    return targetPlayer.role === "WEREWOLF" ? "WEREWOLF" : "WARGA";
}

export function getMasonPartners(state: GameState, playerName: string) {
    return state.players
        .filter(
            (player) => player.role === "MASON" && player.name !== playerName,
        )
        .map((player) => player.name);
}

export function getTimerLeft(state: GameState, now = Date.now()) {
    if (!state.phase_started_at) return state.timer_left;
    const started = new Date(state.phase_started_at).getTime();
    const elapsed = Math.floor((now - started) / 1000);
    return Math.max(0, state.timer_duration - elapsed);
}

export function checkWinner(players: GamePlayer[]): Winner {
    const alive = players.filter((player) => player.is_alive);
    const wolves = alive.filter((player) => isWolf(player.role)).length;
    const village = alive.length - wolves;

    if (wolves === 0) return "VILLAGERS";
    if (wolves >= village) return "WEREWOLVES";
    return null;
}

export function canPerformNightAction(state: GameState, player: GamePlayer) {
    if (!player.is_alive) return false;
    if (isWolf(player.role)) return true;
    if (player.role === "SEER") return !player.inspected_target;
    if (isUnlockedBackupSeer(state, player)) return !player.inspected_target;
    if (player.role === "BODYGUARD") return true; // can protect a different player each night
    return false;
}

export function isUnlockedBackupSeer(state: GameState, player: GamePlayer) {
    return player.role === "BACKUP_SEER" && state.meta.backup_seer_unlocked;
}

function createLobbyPlayer(name: string): GamePlayer {
    return {
        name,
        role: "VILLAGER",
        is_alive: true,
        night_action_target: null,
        day_vote_target: null,
        inspected_target: null,
        bodyguard_target: null,
    };
}

function pickTopTarget(targets: string[], aliveCount?: number) {
    if (targets.length === 0) return null;

    const counts = new Map<string, number>();
    for (const target of targets) {
        counts.set(target, (counts.get(target) ?? 0) + 1);
    }

    const sorted = [...counts.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );

    const topVotes = sorted[0][1];
    const topCandidates = sorted.filter(([, votes]) => votes === topVotes);

    // Tie — no execution
    if (topCandidates.length > 1) return null;

    // If aliveCount provided, require strictly more than 50% of alive players
    if (aliveCount !== undefined && topVotes <= aliveCount / 2) return null;

    return sorted[0][0];
}

function withWinner(state: GameState): GameState {
    const winner = checkWinner(state.players);
    return winner ? { ...state, winner, status: "GAME_OVER" } : state;
}
