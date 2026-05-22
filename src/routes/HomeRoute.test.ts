import { describe, it } from "vitest";
import * as fc from "fast-check";
import {
    LANDING_NAV_CARDS,
    validateLandingPageStructure,
    getNavCardCount,
} from "./HomeRoute";

// ============================================
// Property 7: Landing Page Structure
// Validates: Requirements 1.1, 1.2, 1.5
// ============================================

describe("Landing Page Structure", () => {
    const requiredLabels = ["Host", "Player", "TV"];

    it("should always have exactly 3 navigation cards", () => {
        const count = getNavCardCount();
        if (count !== 3) throw new Error(`Expected 3 cards, got ${count}`);
    });

    it("should contain all required labels (Host, Player, TV)", () => {
        fc.assert(
            fc.property(fc.constant(LANDING_NAV_CARDS), (cards) => {
                const isValid = validateLandingPageStructure(cards);
                return isValid === true;
            }),
            { numRuns: 100 },
        );
    });

    it("should have each required label present exactly once", () => {
        const labels = LANDING_NAV_CARDS.map((card) => card.subtitle);
        const labelCounts = new Map<string, number>();
        for (const label of labels) {
            labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
        }

        for (const requiredLabel of requiredLabels) {
            const count = labelCounts.get(requiredLabel) ?? 0;
            if (count !== 1) {
                throw new Error(
                    `Expected exactly 1 "${requiredLabel}" card, found ${count}`,
                );
            }
        }
    });

    it("should have valid routes for all navigation cards", () => {
        const validRoutes = ["/host", "/play", "/tv"];
        const routes = LANDING_NAV_CARDS.map((card) => card.href);

        fc.assert(
            fc.property(fc.constantFrom(...routes), (route) => {
                return validRoutes.includes(route);
            }),
            { numRuns: 100 },
        );
    });

    it("should have non-empty titles and descriptions for all cards", () => {
        fc.assert(
            fc.property(fc.constantFrom(...LANDING_NAV_CARDS), (card) => {
                return card.title.length > 0 && card.description.length > 0;
            }),
            { numRuns: 100 },
        );
    });

    it("should reject invalid card structures", () => {
        const invalidCards = [
            { subtitle: "Host" },
            { subtitle: "Player" },
            { subtitle: "Invalid" },
        ] as const;

        const isValid = validateLandingPageStructure(invalidCards);
        if (isValid) {
            throw new Error("Should reject cards missing 'TV' label");
        }
    });
});
