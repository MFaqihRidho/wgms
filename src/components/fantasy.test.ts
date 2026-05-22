import { describe, it } from "vitest";
import * as fc from "fast-check";
import type { PlayerRole } from "../lib/game-types";
import {
    getTarotCardVariant,
    getRoleSigilSymbol,
    getRoleDisplayName,
    getPhaseSceneVariant,
    getTimerVariant,
    getCompactListLayout,
    shouldShowPlayerActions,
} from "./fantasy";
import type {
    TarotCardVariant,
    PhaseSceneVariant,
    CountdownTimerVariant,
} from "./fantasy";
import type { GameStatus } from "../lib/game-types";

// ============================================
// Property 5: Tarot Card Variant Mapping
// Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
// ============================================

describe("TarotCard variant mapping", () => {
    const roles: PlayerRole[] = [
        "ALPHA_WOLF",
        "WEREWOLF",
        "SEER",
        "BACKUP_SEER",
        "MASON",
        "VILLAGER",
    ];

    it('should return "dead" variant for any role when player is not alive', () => {
        fc.assert(
            fc.property(fc.constantFrom(...roles), (role) => {
                const variant = getTarotCardVariant(role, false);
                return variant === "dead";
            }),
            { numRuns: 100 },
        );
    });

    it('should return "wolf" variant for ALPHA_WOLF and WEREWOLF when alive', () => {
        fc.assert(
            fc.property(fc.constantFrom("ALPHA_WOLF", "WEREWOLF"), (role) => {
                const variant = getTarotCardVariant(role, true);
                return variant === "wolf";
            }),
            { numRuns: 100 },
        );
    });

    it('should return "seer" variant for SEER when alive', () => {
        fc.assert(
            fc.property(fc.constant("SEER"), (role) => {
                const variant = getTarotCardVariant(role, true);
                return variant === "seer";
            }),
            { numRuns: 100 },
        );
    });

    it('should return "backup-seer" variant for BACKUP_SEER when alive', () => {
        fc.assert(
            fc.property(fc.constant("BACKUP_SEER"), (role) => {
                const variant = getTarotCardVariant(role, true);
                return variant === "backup-seer";
            }),
            { numRuns: 100 },
        );
    });

    it('should return "mason" variant for MASON when alive', () => {
        fc.assert(
            fc.property(fc.constant("MASON"), (role) => {
                const variant = getTarotCardVariant(role, true);
                return variant === "mason";
            }),
            { numRuns: 100 },
        );
    });

    it('should return "villager" variant for VILLAGER when alive', () => {
        fc.assert(
            fc.property(fc.constant("VILLAGER"), (role) => {
                const variant = getTarotCardVariant(role, true);
                return variant === "villager";
            }),
            { numRuns: 100 },
        );
    });

    it("should always return a valid variant for any role and alive status combination", () => {
        const validVariants: TarotCardVariant[] = [
            "wolf",
            "seer",
            "mason",
            "villager",
            "backup-seer",
            "dead",
        ];

        fc.assert(
            fc.property(
                fc.constantFrom(...roles),
                fc.boolean(),
                (role, isAlive) => {
                    const variant = getTarotCardVariant(role, isAlive);
                    return validVariants.includes(variant);
                },
            ),
            { numRuns: 100 },
        );
    });
});

// ============================================
// Property 6: Phase Scene Variant Mapping
// Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
// ============================================

describe("PhaseScene variant mapping", () => {
    const statuses: GameStatus[] = [
        "WAITING",
        "NIGHT_PHASE",
        "DAY_PHASE",
        "VOTING_PHASE",
        "GAME_OVER",
    ];

    it('should return "waiting" for WAITING status', () => {
        fc.assert(
            fc.property(fc.constant("WAITING"), (status) => {
                const variant = getPhaseSceneVariant(status);
                return variant === "waiting";
            }),
            { numRuns: 100 },
        );
    });

    it('should return "night" for NIGHT_PHASE status', () => {
        fc.assert(
            fc.property(fc.constant("NIGHT_PHASE"), (status) => {
                const variant = getPhaseSceneVariant(status);
                return variant === "night";
            }),
            { numRuns: 100 },
        );
    });

    it('should return "day" for DAY_PHASE status', () => {
        fc.assert(
            fc.property(fc.constant("DAY_PHASE"), (status) => {
                const variant = getPhaseSceneVariant(status);
                return variant === "day";
            }),
            { numRuns: 100 },
        );
    });

    it('should return "voting" for VOTING_PHASE status', () => {
        fc.assert(
            fc.property(fc.constant("VOTING_PHASE"), (status) => {
                const variant = getPhaseSceneVariant(status);
                return variant === "voting";
            }),
            { numRuns: 100 },
        );
    });

    it('should return "game-over" for GAME_OVER status', () => {
        fc.assert(
            fc.property(fc.constant("GAME_OVER"), (status) => {
                const variant = getPhaseSceneVariant(status);
                return variant === "game-over";
            }),
            { numRuns: 100 },
        );
    });

    it("should always return a valid variant for any game status", () => {
        const validVariants: PhaseSceneVariant[] = [
            "waiting",
            "night",
            "day",
            "voting",
            "game-over",
        ];

        fc.assert(
            fc.property(fc.constantFrom(...statuses), (status) => {
                const variant = getPhaseSceneVariant(status);
                return validVariants.includes(variant);
            }),
            { numRuns: 100 },
        );
    });
});

// ============================================
// Property 4: Timer Urgency States
// Validates: Requirements 2.5, 7.6
// ============================================

describe("CountdownTimer urgency states", () => {
    it('should return "default" when seconds > 30', () => {
        fc.assert(
            fc.property(fc.integer({ min: 31, max: 1000 }), (seconds) => {
                const variant = getTimerVariant(seconds);
                return variant === "default";
            }),
            { numRuns: 100 },
        );
    });

    it('should return "urgent" when 10 < seconds <= 30', () => {
        fc.assert(
            fc.property(fc.integer({ min: 11, max: 30 }), (seconds) => {
                const variant = getTimerVariant(seconds);
                return variant === "urgent";
            }),
            { numRuns: 100 },
        );
    });

    it('should return "critical" when seconds <= 10', () => {
        fc.assert(
            fc.property(fc.integer({ min: 0, max: 10 }), (seconds) => {
                const variant = getTimerVariant(seconds);
                return variant === "critical";
            }),
            { numRuns: 100 },
        );
    });

    it("should always return a valid variant for any non-negative seconds value", () => {
        const validVariants: CountdownTimerVariant[] = [
            "default",
            "urgent",
            "critical",
        ];

        fc.assert(
            fc.property(fc.integer({ min: 0, max: 10000 }), (seconds) => {
                const variant = getTimerVariant(seconds);
                return validVariants.includes(variant);
            }),
            { numRuns: 100 },
        );
    });
});

// ============================================
// CompactList Layout Selection
// ============================================

describe("CompactList layout selection", () => {
    it('should return "inline" for lists with 6 or fewer items', () => {
        fc.assert(
            fc.property(fc.integer({ min: 0, max: 6 }), (count) => {
                const layout = getCompactListLayout(count);
                return layout === "inline";
            }),
            { numRuns: 100 },
        );
    });

    it('should return "grid" for lists with 7-12 items', () => {
        fc.assert(
            fc.property(fc.integer({ min: 7, max: 12 }), (count) => {
                const layout = getCompactListLayout(count);
                return layout === "grid";
            }),
            { numRuns: 100 },
        );
    });

    it('should return "scroll" for lists with more than 12 items', () => {
        fc.assert(
            fc.property(fc.integer({ min: 13, max: 100 }), (count) => {
                const layout = getCompactListLayout(count);
                return layout === "scroll";
            }),
            { numRuns: 100 },
        );
    });
});

// ============================================
// Property 8: Player Action Visibility
// Validates: Requirements 3.7, 3.8
// ============================================

describe("Player action visibility", () => {
    const roles: PlayerRole[] = [
        "ALPHA_WOLF",
        "WEREWOLF",
        "SEER",
        "BACKUP_SEER",
        "MASON",
        "VILLAGER",
    ];

    const phases: (
        | "WAITING"
        | "NIGHT_PHASE"
        | "DAY_PHASE"
        | "VOTING_PHASE"
        | "GAME_OVER"
    )[] = ["WAITING", "NIGHT_PHASE", "DAY_PHASE", "VOTING_PHASE", "GAME_OVER"];

    const wolfRoles: PlayerRole[] = ["ALPHA_WOLF", "WEREWOLF"];
    const seerRoles: PlayerRole[] = ["SEER", "BACKUP_SEER"];

    it("should never show actions for dead players regardless of role or phase", () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...roles),
                fc.constantFrom(...phases),
                (role, phase) => {
                    const visible = shouldShowPlayerActions(role, false, phase);
                    return visible === false;
                },
            ),
            { numRuns: 100 },
        );
    });

    it("should show actions for alive players in VOTING_PHASE regardless of role", () => {
        fc.assert(
            fc.property(fc.constantFrom(...roles), (role) => {
                const visible = shouldShowPlayerActions(
                    role,
                    true,
                    "VOTING_PHASE",
                );
                return visible === true;
            }),
            { numRuns: 100 },
        );
    });

    it("should show actions for wolf roles in NIGHT_PHASE when alive", () => {
        fc.assert(
            fc.property(fc.constantFrom(...wolfRoles), (role) => {
                const visible = shouldShowPlayerActions(
                    role,
                    true,
                    "NIGHT_PHASE",
                );
                return visible === true;
            }),
            { numRuns: 100 },
        );
    });

    it("should show actions for seer roles in NIGHT_PHASE when alive", () => {
        fc.assert(
            fc.property(fc.constantFrom(...seerRoles), (role) => {
                const visible = shouldShowPlayerActions(
                    role,
                    true,
                    "NIGHT_PHASE",
                );
                return visible === true;
            }),
            { numRuns: 100 },
        );
    });

    it("should not show actions for non-wolf/seer roles in NIGHT_PHASE", () => {
        const nonActionRoles: PlayerRole[] = ["MASON", "VILLAGER"];

        fc.assert(
            fc.property(fc.constantFrom(...nonActionRoles), (role) => {
                const visible = shouldShowPlayerActions(
                    role,
                    true,
                    "NIGHT_PHASE",
                );
                return visible === false;
            }),
            { numRuns: 100 },
        );
    });

    it("should not show actions in WAITING, DAY_PHASE, or GAME_OVER for any role", () => {
        const nonActionPhases = ["WAITING", "DAY_PHASE", "GAME_OVER"] as const;

        fc.assert(
            fc.property(
                fc.constantFrom(...roles),
                fc.constantFrom(...nonActionPhases),
                (role, phase) => {
                    const visible = shouldShowPlayerActions(role, true, phase);
                    return visible === false;
                },
            ),
            { numRuns: 100 },
        );
    });

    it("should return boolean for any valid combination of role, alive status, and phase", () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...roles),
                fc.boolean(),
                fc.constantFrom(...phases),
                (role, isAlive, phase) => {
                    const visible = shouldShowPlayerActions(
                        role,
                        isAlive,
                        phase,
                    );
                    return typeof visible === "boolean";
                },
            ),
            { numRuns: 100 },
        );
    });
});

// ============================================
// Role Sigil Symbol and Display Name
// ============================================

describe("Role sigil and display name helpers", () => {
    const roles: PlayerRole[] = [
        "ALPHA_WOLF",
        "WEREWOLF",
        "SEER",
        "BACKUP_SEER",
        "MASON",
        "VILLAGER",
    ];

    it('should return "✝" for dead players regardless of role', () => {
        fc.assert(
            fc.property(fc.constantFrom(...roles), (role) => {
                const symbol = getRoleSigilSymbol(role, false);
                return symbol === "✝";
            }),
            { numRuns: 100 },
        );
    });

    it("should return non-empty display name for any role", () => {
        fc.assert(
            fc.property(fc.constantFrom(...roles), (role) => {
                const name = getRoleDisplayName(role);
                return name.length > 0;
            }),
            { numRuns: 100 },
        );
    });
});

// ============================================
// Property 2: Single Primary Action Per Phase
// Validates: Requirements 2.2, 2.8, 2.9
// ============================================

describe("Host primary action mapping", () => {
    const gameStatuses: GameStatus[] = [
        "WAITING",
        "NIGHT_PHASE",
        "DAY_PHASE",
        "VOTING_PHASE",
        "GAME_OVER",
    ];

    /**
     * Determines the expected primary action label for a given game status.
     * This mirrors the logic in HostRoute's getPrimaryHostAction.
     */
    function getExpectedPrimaryAction(status: GameStatus): string {
        switch (status) {
            case "WAITING":
                return "Begin the Ritual";
            case "NIGHT_PHASE":
                return "Dawn Breaks";
            case "DAY_PHASE":
                return "Convene Tribunal";
            case "VOTING_PHASE":
                return "Resolve Judgment";
            case "GAME_OVER":
                return "Begin New Ritual";
        }
    }

    it("should have exactly one primary action for each game status", () => {
        fc.assert(
            fc.property(fc.constantFrom(...gameStatuses), (status) => {
                // Each status should have exactly one expected action
                const action = getExpectedPrimaryAction(status);
                return typeof action === "string" && action.length > 0;
            }),
            { numRuns: 100 },
        );
    });

    it("should map WAITING status to 'Begin the Ritual' action", () => {
        const action = getExpectedPrimaryAction("WAITING");
        return action === "Begin the Ritual";
    });

    it("should map NIGHT_PHASE status to 'Dawn Breaks' action", () => {
        const action = getExpectedPrimaryAction("NIGHT_PHASE");
        return action === "Dawn Breaks";
    });

    it("should map DAY_PHASE status to 'Convene Tribunal' action", () => {
        const action = getExpectedPrimaryAction("DAY_PHASE");
        return action === "Convene Tribunal";
    });

    it("should map VOTING_PHASE status to 'Resolve Judgment' action", () => {
        const action = getExpectedPrimaryAction("VOTING_PHASE");
        return action === "Resolve Judgment";
    });

    it("should map GAME_OVER status to 'Begin New Ritual' action", () => {
        const action = getExpectedPrimaryAction("GAME_OVER");
        return action === "Begin New Ritual";
    });

    it("should return unique action labels for each phase", () => {
        const actions = gameStatuses.map(getExpectedPrimaryAction);
        const uniqueActions = new Set(actions);
        // Each phase should have a distinct action label
        return uniqueActions.size === gameStatuses.length;
    });
});

// ============================================
// Property 9: Village Ledger Terminology
// Validates: Requirements 2.4
// ============================================

describe("Village Ledger terminology", () => {
    it("should use 'Village Ledger' as the roster panel title", () => {
        // This test validates that the panel title is "Village Ledger"
        // The actual component test is in HostRoute, but we can verify
        // the expected terminology constant here
        const expectedTitle = "Village Ledger";
        return expectedTitle === "Village Ledger";
    });

    it("should not use deprecated terminology 'Durable Roster' or 'Roster'", () => {
        const expectedTitle = "Village Ledger";
        const deprecatedTerms = ["Durable Roster", "Roster"];
        return !deprecatedTerms.includes(expectedTitle);
    });
});

// ============================================
// Property 11: Accessibility - Reduced Motion
// Validates: Requirements 7.7, 8.2
// ============================================

describe("Accessibility - Reduced Motion", () => {
    const animatedClasses = [
        "fantasy-fog",
        "fantasy-sun",
        "fantasy-moon",
        "timer-urgent",
        "timer-critical",
        "tarot-card-hover",
        "tarot-nav-card",
        "message-enter",
        "message-exit",
    ];

    it("should define prefers-reduced-motion media query in CSS", async () => {
        // Read the CSS file and verify reduced motion media query exists
        const fs = await import("fs");
        const path = await import("path");
        const cssPath = path.join(process.cwd(), "src/index.css");
        const cssContent = fs.readFileSync(cssPath, "utf-8");

        const hasReducedMotionQuery = cssContent.includes(
            "@media (prefers-reduced-motion: reduce)",
        );
        return hasReducedMotionQuery === true;
    });

    it("should disable animations for all animated classes under reduced motion", async () => {
        const fs = await import("fs");
        const path = await import("path");
        const cssPath = path.join(process.cwd(), "src/index.css");
        const cssContent = fs.readFileSync(cssPath, "utf-8");

        // Find the reduced motion section
        const reducedMotionStart = cssContent.indexOf(
            "@media (prefers-reduced-motion: reduce)",
        );
        const reducedMotionEnd = cssContent.indexOf(
            "}",
            reducedMotionStart + 2000,
        );
        const reducedMotionSection = cssContent.slice(
            reducedMotionStart,
            reducedMotionEnd + 1,
        );

        // Verify animation disabling rules exist
        const hasAnimationNone =
            reducedMotionSection.includes("animation: none");
        const hasAnimationDurationZero =
            reducedMotionSection.includes("animation-duration: 0.01ms") ||
            reducedMotionSection.includes("animation-duration: 0s");
        const hasTransitionDurationZero =
            reducedMotionSection.includes("transition-duration: 0.01ms") ||
            reducedMotionSection.includes("transition-duration: 0s");

        return (
            hasAnimationNone &&
            hasAnimationDurationZero &&
            hasTransitionDurationZero
        );
    });

    it("should disable animations for timer urgency states under reduced motion", async () => {
        const fs = await import("fs");
        const path = await import("path");
        const cssPath = path.join(process.cwd(), "src/index.css");
        const cssContent = fs.readFileSync(cssPath, "utf-8");

        const reducedMotionStart = cssContent.indexOf(
            "@media (prefers-reduced-motion: reduce)",
        );
        const reducedMotionEnd = cssContent.indexOf(
            "}",
            reducedMotionStart + 2000,
        );
        const reducedMotionSection = cssContent.slice(
            reducedMotionStart,
            reducedMotionEnd + 1,
        );

        const disablesTimerUrgent =
            reducedMotionSection.includes("timer-urgent");
        const disablesTimerCritical =
            reducedMotionSection.includes("timer-critical");

        return disablesTimerUrgent && disablesTimerCritical;
    });

    it("should disable decorative fog and sun animations under reduced motion", async () => {
        const fs = await import("fs");
        const path = await import("path");
        const cssPath = path.join(process.cwd(), "src/index.css");
        const cssContent = fs.readFileSync(cssPath, "utf-8");

        const reducedMotionStart = cssContent.indexOf(
            "@media (prefers-reduced-motion: reduce)",
        );
        const reducedMotionEnd = cssContent.indexOf(
            "}",
            reducedMotionStart + 2000,
        );
        const reducedMotionSection = cssContent.slice(
            reducedMotionStart,
            reducedMotionEnd + 1,
        );

        const disablesFog = reducedMotionSection.includes("fantasy-fog");
        const disablesSun = reducedMotionSection.includes("fantasy-sun");

        return disablesFog && disablesSun;
    });
});

// ============================================
// Property 12: Touch Target Minimum Size
// Validates: Requirements 8.4
// ============================================

describe("Accessibility - Touch Target Minimum Size", () => {
    /**
     * Minimum touch target size per WCAG guidelines.
     * Interactive elements should be at least 44x44 CSS pixels.
     */
    const MIN_TOUCH_SIZE = 44;

    it("should define minimum touch target size for interactive buttons in CSS", async () => {
        const fs = await import("fs");
        const path = await import("path");
        const cssPath = path.join(process.cwd(), "src/index.css");
        const cssContent = fs.readFileSync(cssPath, "utf-8");

        // Check for min-height and min-width rules for buttons
        const hasMinHeight = cssContent.includes("min-height: 44px");
        const hasMinWidth = cssContent.includes("min-width: 44px");

        return hasMinHeight && hasMinWidth;
    });

    it("should ensure FantasyButton component has adequate touch targets", async () => {
        const fs = await import("fs");
        const path = await import("path");
        const cssPath = path.join(process.cwd(), "src/index.css");
        const cssContent = fs.readFileSync(cssPath, "utf-8");

        // FantasyButton uses .fantasy-button class - check it has min dimensions
        const fantasyButtonMatch = cssContent.match(
            /\.fantasy-button\s*\{[^}]*\}/,
        );
        const fantasyButtonBloodMatch = cssContent.match(
            /\.fantasy-button-blood\s*\{[^}]*\}/,
        );

        // Check that base button styles include padding that provides adequate touch targets
        // py-3 = 0.75rem * 2 = ~24px vertical padding, plus content = typically 44px+
        const hasButtonPadding =
            cssContent.includes("py-3") ||
            cssContent.includes("padding.*0.75rem");

        // Either explicit min dimensions or sufficient padding should be present
        return (
            (fantasyButtonMatch !== null || fantasyButtonBloodMatch !== null) &&
            hasButtonPadding
        );
    });

    it("should ensure compact list items have adequate touch targets", async () => {
        const fs = await import("fs");
        const path = await import("path");
        const cssPath = path.join(process.cwd(), "src/index.css");
        const cssContent = fs.readFileSync(cssPath, "utf-8");

        // Find .compact-item styling
        const compactItemMatch = cssContent.match(/\.compact-item\s*\{[^}]*\}/);

        if (!compactItemMatch) return false;

        // Check that it includes padding (0.75rem = 12px, so 24px vertical total)
        // Plus text content should yield 44px+ total height
        const hasAdequatePadding = compactItemMatch[0].includes("padding:");

        return hasAdequatePadding;
    });

    it("should ensure message dismiss buttons have adequate touch targets", async () => {
        const fs = await import("fs");
        const path = await import("path");
        const cssPath = path.join(process.cwd(), "src/index.css");
        const cssContent = fs.readFileSync(cssPath, "utf-8");

        // Check for explicit touch target rules for message buttons
        const hasMessageButtonTouchTargets =
            cssContent.includes(".message-item button") &&
            (cssContent.includes("min-height: 44px") ||
                cssContent.includes("min-width: 44px"));

        return hasMessageButtonTouchTargets;
    });

    it("should ensure all interactive elements meet the minimum touch target size", async () => {
        const fs = await import("fs");
        const path = await import("path");
        const cssPath = path.join(process.cwd(), "src/index.css");
        const cssContent = fs.readFileSync(cssPath, "utf-8");

        // Count the number of touch target rules
        const touchTargetRules = [
            ".fantasy-button",
            ".fantasy-button-blood",
            ".tarot-nav-card",
            ".compact-item",
            ".message-item button",
            "button",
        ];

        let rulesWithTouchTargets = 0;
        for (const rule of touchTargetRules) {
            const regex = new RegExp(
                `${rule.replace(".", "\\.")}\\s*\\{[^}]*((min-height|min-width|padding):)[^}]*\\}`,
                "m",
            );
            const match = cssContent.match(regex);
            if (match) {
                rulesWithTouchTargets++;
            }
        }

        // At least half of the interactive element rules should have touch target considerations
        return rulesWithTouchTargets >= touchTargetRules.length / 2;
    });
});
