import { describe, expect, it } from "vitest";
import {
    advanceToNight,
    applyBodyguardProtect,
    applyDayVote,
    applyNightTarget,
    applySeerInspect,
    applyWerewolfTarget,
    checkWinner,
    getMasonPartners,
    getSeerResult,
    killPlayer,
    resolveDayVote,
    resolveNightKill,
    startGame,
} from "./game-engine";
import type { GameState } from "./game-types";

const names = ["Budi", "Alex", "Sari", "Dika", "Maya", "Reno", "Lina", "Tono"];

describe("game engine", () => {
    it("rejects games with fewer than four players", () => {
        expect(() => startGame("TEST", names.slice(0, 3))).toThrow(/Minimum 4/);
    });

    it("assigns one role for every player and exactly one alpha wolf", () => {
        const state = startGame("TEST", names.slice(0, 8), () => 0);

        expect(state.players).toHaveLength(8);
        expect(
            state.players.filter((player) => player.role === "ALPHA_WOLF"),
        ).toHaveLength(1);
    });

    it("makes alpha wolf appear as WARGA to seer", () => {
        const state = withPlayers([
            ["Budi", "SEER"],
            ["Alex", "ALPHA_WOLF"],
            ["Sari", "WEREWOLF"],
            ["Dika", "VILLAGER"],
        ]);

        expect(getSeerResult(state, "Alex")).toBe("WARGA");
        expect(getSeerResult(state, "Sari")).toBe("WEREWOLF");
    });

    it("prevents dead players from voting", () => {
        const state = {
            ...withPlayers([
                ["Budi", "VILLAGER"],
                ["Alex", "ALPHA_WOLF"],
                ["Sari", "SEER"],
                ["Dika", "VILLAGER"],
            ]),
            status: "VOTING_PHASE" as const,
        };
        const killed = killPlayer(state, "Budi");
        const voted = applyDayVote(killed, "Budi", "Alex");

        expect(
            voted.players.find((player) => player.name === "Budi")
                ?.day_vote_target,
        ).toBeNull();
    });

    it("prevents wolves from targeting wolves", () => {
        const state = withPlayers([
            ["Budi", "ALPHA_WOLF"],
            ["Alex", "WEREWOLF"],
            ["Sari", "SEER"],
            ["Dika", "VILLAGER"],
        ]);
        const acted = applyNightTarget(state, "Budi", "Alex");

        expect(
            acted.players.find((player) => player.name === "Budi")
                ?.night_action_target,
        ).toBeNull();
    });

    it("prevents villagers from submitting werewolf targets", () => {
        const state = withPlayers([
            ["Budi", "ALPHA_WOLF"],
            ["Alex", "VILLAGER"],
            ["Sari", "SEER"],
            ["Dika", "VILLAGER"],
        ]);
        const acted = applyWerewolfTarget(state, "Alex", "Budi");

        expect(
            acted.players.find((player) => player.name === "Alex")
                ?.night_action_target,
        ).toBeNull();
    });

    it("allows only seer-like roles to inspect", () => {
        const state = withPlayers([
            ["Budi", "ALPHA_WOLF"],
            ["Alex", "VILLAGER"],
            ["Sari", "SEER"],
            ["Dika", "VILLAGER"],
        ]);
        const blocked = applySeerInspect(state, "Alex", "Budi");
        const inspected = applySeerInspect(state, "Sari", "Budi");

        expect(
            blocked.players.find((player) => player.name === "Alex")
                ?.inspected_target,
        ).toBeNull();
        expect(
            inspected.players.find((player) => player.name === "Sari")
                ?.inspected_target,
        ).toBe("Budi");
    });

    it("unlocks backup seer after seer death and next night", () => {
        const state = withPlayers([
            ["Budi", "ALPHA_WOLF"],
            ["Alex", "SEER"],
            ["Sari", "BACKUP_SEER"],
            ["Dika", "VILLAGER"],
        ]);
        const killed = killPlayer(state, "Alex");
        const nextNight = advanceToNight(killed);

        expect(nextNight.meta.backup_seer_unlocked).toBe(true);
    });

    it("shows mason partners", () => {
        const state = withPlayers([
            ["Budi", "ALPHA_WOLF"],
            ["Alex", "MASON"],
            ["Sari", "MASON"],
            ["Dika", "MASON"],
        ]);

        expect(getMasonPartners(state, "Alex")).toEqual(["Sari", "Dika"]);
    });

    it("mason partners excludes dead masons", () => {
        const state = withPlayers([
            ["Budi", "ALPHA_WOLF"],
            ["Alex", "MASON"],
            ["Sari", "MASON"],
            ["Dika", "MASON"],
        ]);
        const afterKill = killPlayer(state, "Sari");
        expect(getMasonPartners(afterKill, "Alex")).toEqual(["Dika"]);
    });

    it("resolves day vote by killing top target", () => {
        const state = {
            ...withPlayers([
                ["Budi", "ALPHA_WOLF"],
                ["Alex", "SEER"],
                ["Sari", "VILLAGER"],
                ["Dika", "VILLAGER"],
            ]),
            status: "VOTING_PHASE" as const,
        };
        const voted = applyDayVote(
            applyDayVote(applyDayVote(state, "Alex", "Budi"), "Sari", "Budi"),
            "Dika",
            "Budi",
        );
        const resolved = resolveDayVote(voted);

        expect(
            resolved.players.find((player) => player.name === "Budi")?.is_alive,
        ).toBe(false);
    });

    it("does not execute on tied or sub-majority vote", () => {
        const state = {
            ...withPlayers([
                ["Budi", "ALPHA_WOLF"],
                ["Alex", "SEER"],
                ["Sari", "VILLAGER"],
                ["Dika", "VILLAGER"],
            ]),
            status: "VOTING_PHASE" as const,
        };
        // 2 out of 4 = 50%, not a majority
        const voted = applyDayVote(
            applyDayVote(state, "Alex", "Budi"),
            "Sari",
            "Budi",
        );
        const resolved = resolveDayVote(voted);

        expect(
            resolved.players.find((player) => player.name === "Budi")?.is_alive,
        ).toBe(true);
        expect(resolved.status).toBe("NIGHT_PHASE");
    });

    it("resolves night kill from wolf target", () => {
        const state = withPlayers([
            ["Budi", "ALPHA_WOLF"],
            ["Alex", "SEER"],
            ["Sari", "VILLAGER"],
            ["Dika", "VILLAGER"],
        ]);
        const acted = applyNightTarget(state, "Budi", "Alex");
        const resolved = resolveNightKill(acted);

        expect(
            resolved.players.find((player) => player.name === "Alex")?.is_alive,
        ).toBe(false);
    });

    it("detects villager and werewolf winners", () => {
        expect(
            checkWinner(
                withPlayers([
                    ["Budi", "VILLAGER"],
                    ["Alex", "SEER"],
                    ["Sari", "VILLAGER"],
                    ["Dika", "VILLAGER"],
                ]).players,
            ),
        ).toBe("VILLAGERS");
        expect(
            checkWinner(
                withPlayers([
                    ["Budi", "ALPHA_WOLF"],
                    ["Alex", "VILLAGER"],
                ]).players,
            ),
        ).toBe("WEREWOLVES");
    });

    it("bodyguard blocks wolf kill when protecting the target", () => {
        const state = withPlayers([
            ["Budi", "ALPHA_WOLF"],
            ["Alex", "SEER"],
            ["Sari", "BODYGUARD"],
            ["Dika", "VILLAGER"],
        ]);
        // Wolf targets Alex, Bodyguard protects Alex
        const wolfActed = applyWerewolfTarget(state, "Budi", "Alex");
        const guardActed = applyBodyguardProtect(wolfActed, "Sari", "Alex");
        const resolved = resolveNightKill(guardActed);

        // Alex should survive because Bodyguard protected them
        expect(resolved.players.find((p) => p.name === "Alex")?.is_alive).toBe(
            true,
        );
        expect(resolved.last_killed).toBeNull();
    });

    it("bodyguard does not block kill when protecting a different player", () => {
        const state = withPlayers([
            ["Budi", "ALPHA_WOLF"],
            ["Alex", "SEER"],
            ["Sari", "BODYGUARD"],
            ["Dika", "VILLAGER"],
        ]);
        // Wolf targets Alex, Bodyguard protects Dika
        const wolfActed = applyWerewolfTarget(state, "Budi", "Alex");
        const guardActed = applyBodyguardProtect(wolfActed, "Sari", "Dika");
        const resolved = resolveNightKill(guardActed);

        // Alex should die — Bodyguard was protecting Dika, not Alex
        expect(resolved.players.find((p) => p.name === "Alex")?.is_alive).toBe(
            false,
        );
    });

    it("bodyguard can protect any player including wolves (they don't know roles)", () => {
        const state = withPlayers([
            ["Budi", "ALPHA_WOLF"],
            ["Alex", "WEREWOLF"],
            ["Sari", "BODYGUARD"],
            ["Dika", "VILLAGER"],
        ]);
        // Bodyguard can target a wolf — they don't know who's a wolf
        const acted = applyBodyguardProtect(state, "Sari", "Budi");
        expect(
            acted.players.find((p) => p.name === "Sari")?.bodyguard_target,
        ).toBe("Budi");
        // Protecting a wolf is a wasted action — wolves can't be night-killed anyway
    });

    it("bodyguard can protect themselves", () => {
        const state = withPlayers([
            ["Budi", "ALPHA_WOLF"],
            ["Alex", "SEER"],
            ["Sari", "BODYGUARD"],
            ["Dika", "VILLAGER"],
        ]);
        // Wolf targets Sari, Bodyguard protects themselves
        const wolfActed = applyWerewolfTarget(state, "Budi", "Sari");
        const guardActed = applyBodyguardProtect(wolfActed, "Sari", "Sari");
        const resolved = resolveNightKill(guardActed);

        expect(resolved.players.find((p) => p.name === "Sari")?.is_alive).toBe(
            true,
        );
        expect(resolved.last_killed).toBeNull();
    });

    it("bodyguard protection resets each night", () => {
        const state = withPlayers([
            ["Budi", "ALPHA_WOLF"],
            ["Alex", "SEER"],
            ["Sari", "BODYGUARD"],
            ["Dika", "VILLAGER"],
        ]);
        const withProtection = applyBodyguardProtect(state, "Sari", "Alex");
        expect(
            withProtection.players.find((p) => p.name === "Sari")
                ?.bodyguard_target,
        ).toBe("Alex");

        const nextNight = advanceToNight(withProtection);
        expect(
            nextNight.players.find((p) => p.name === "Sari")?.bodyguard_target,
        ).toBeNull();
    });
});

function withPlayers(
    entries: [string, GameState["players"][number]["role"]][],
): GameState {
    return {
        room_code: "TEST",
        status: "NIGHT_PHASE",
        day_count: 1,
        timer_left: 180,
        timer_duration: 180,
        phase_started_at: new Date().toISOString(),
        last_killed: null,
        winner: null,
        players: entries.map(([name, role]) => ({
            name,
            role,
            is_alive: true,
            night_action_target: null,
            day_vote_target: null,
            inspected_target: null,
            bodyguard_target: null,
        })),
        meta: { backup_seer_unlocked: false, seer_dead_on_day: null },
    };
}
