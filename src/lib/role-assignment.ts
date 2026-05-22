import type { GamePlayer, PlayerRole } from "./game-types";

const rolePlans: Record<number, PlayerRole[]> = {
    // 4: 1 wolf — seer alone is strong enough, no backup needed
    4: ["ALPHA_WOLF", "SEER", "VILLAGER", "VILLAGER"],
    // 5: 1 wolf — drop backup seer, seer + 3 villagers is already village-favoured
    5: ["ALPHA_WOLF", "SEER", "VILLAGER", "VILLAGER", "VILLAGER"],
    // 6: 2 wolves — seer now has real work to do
    6: ["ALPHA_WOLF", "WEREWOLF", "SEER", "VILLAGER", "VILLAGER", "VILLAGER"],
    // 7: 2 wolves — backup seer justified with 2 wolves
    7: [
        "ALPHA_WOLF",
        "WEREWOLF",
        "SEER",
        "BACKUP_SEER",
        "VILLAGER",
        "VILLAGER",
        "VILLAGER",
    ],
    // 8: 2 wolves — add masons for village coordination
    8: [
        "ALPHA_WOLF",
        "WEREWOLF",
        "SEER",
        "BACKUP_SEER",
        "MASON",
        "MASON",
        "VILLAGER",
        "VILLAGER",
    ],
    9: [
        "ALPHA_WOLF",
        "WEREWOLF",
        "WEREWOLF",
        "SEER",
        "BACKUP_SEER",
        "MASON",
        "MASON",
        "BODYGUARD",
        "VILLAGER",
    ],
    10: [
        "ALPHA_WOLF",
        "WEREWOLF",
        "WEREWOLF",
        "SEER",
        "BACKUP_SEER",
        "MASON",
        "MASON",
        "MASON",
        "BODYGUARD",
        "VILLAGER",
    ],
    11: [
        "ALPHA_WOLF",
        "WEREWOLF",
        "WEREWOLF",
        "SEER",
        "BACKUP_SEER",
        "MASON",
        "MASON",
        "MASON",
        "BODYGUARD",
        "VILLAGER",
        "VILLAGER",
    ],
    12: [
        "ALPHA_WOLF",
        "WEREWOLF",
        "WEREWOLF",
        "WEREWOLF",
        "SEER",
        "BACKUP_SEER",
        "MASON",
        "MASON",
        "MASON",
        "BODYGUARD",
        "VILLAGER",
        "VILLAGER",
    ],
    13: [
        "ALPHA_WOLF",
        "WEREWOLF",
        "WEREWOLF",
        "WEREWOLF",
        "SEER",
        "BACKUP_SEER",
        "MASON",
        "MASON",
        "MASON",
        "BODYGUARD",
        "VILLAGER",
        "VILLAGER",
        "VILLAGER",
    ],
    14: [
        "ALPHA_WOLF",
        "WEREWOLF",
        "WEREWOLF",
        "WEREWOLF",
        "SEER",
        "BACKUP_SEER",
        "MASON",
        "MASON",
        "MASON",
        "BODYGUARD",
        "VILLAGER",
        "VILLAGER",
        "VILLAGER",
        "VILLAGER",
    ],
    15: [
        "ALPHA_WOLF",
        "WEREWOLF",
        "WEREWOLF",
        "WEREWOLF",
        "WEREWOLF",
        "SEER",
        "BACKUP_SEER",
        "MASON",
        "MASON",
        "MASON",
        "BODYGUARD",
        "VILLAGER",
        "VILLAGER",
        "VILLAGER",
        "VILLAGER",
    ],
};

export function getSupportedPlayerCounts() {
    return Object.keys(rolePlans).map(Number);
}

export function getRolePlan(playerCount: number) {
    return rolePlans[playerCount] ?? null;
}

export function assignRoles(
    playerNames: string[],
    random = Math.random,
): GamePlayer[] {
    const roles = getRolePlan(playerNames.length);

    if (!roles) {
        throw new Error(
            "Game supports 4 to 15 players for automatic role assignment.",
        );
    }

    const shuffledNames = shuffle(playerNames, random);
    const shuffledRoles = shuffle(roles, random);

    return shuffledNames.map((name, index) => ({
        name,
        role: shuffledRoles[index],
        is_alive: true,
        night_action_target: null,
        day_vote_target: null,
        inspected_target: null,
        bodyguard_target: null,
    }));
}

function shuffle<T>(items: T[], random: () => number) {
    const copy = [...items];

    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        const current = copy[index];
        copy[index] = copy[swapIndex];
        copy[swapIndex] = current;
    }

    return copy;
}

export function isWolf(role: PlayerRole) {
    return role === "ALPHA_WOLF" || role === "WEREWOLF";
}
