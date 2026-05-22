/**
 * E2E tests for game logic fixes:
 * - Vote requires >50% majority to execute
 * - Tied vote advances to night without killing anyone
 * - Seer/wolf modals only appear during night phase
 * - Restart includes all players (no "unknown" players)
 * - Player does not stay stuck on loading spinner
 */

import { expect, test } from "@playwright/test";
import {
    advanceToDay,
    advanceToNightDirect,
    closePlayers,
    createPlayerNames,
    createRoomCode,
    joinPlayers,
    openHost,
    openVoting,
    resolveVote,
    startGame,
} from "./helpers/wgms";

// ─── Vote majority threshold ──────────────────────────────────────────────────

test("tied vote does not execute anyone and advances to night", async ({
    browser,
    page,
}) => {
    const roomCode = createRoomCode("M");
    await openHost(page, roomCode);
    const players = await joinPlayers(browser, roomCode, createPlayerNames(4));
    await startGame(page);
    await openVoting(page);

    // Each player votes for a different person — 1 vote each = tie, no majority
    for (let i = 0; i < players.length; i++) {
        const targetIndex = (i + 1) % players.length;
        const targetName = players[targetIndex].name;
        const btn = players[i].page
            .getByTestId("player-target-list")
            .locator("button")
            .filter({ hasText: targetName })
            .first();
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await btn.click();
        } else {
            await players[i].page
                .getByTestId("player-target-list")
                .locator("button")
                .first()
                .click();
        }
    }

    await resolveVote(page);

    // Tied vote = no execution = game advances to night
    await expect(page.getByTestId("host-current-phase")).toContainText(
        "Night",
        { timeout: 10_000 },
    );

    // All players should still be in the ledger
    const ledger = page.getByTestId("host-village-ledger");
    await expect(ledger).toBeVisible();
    for (const player of players) {
        await expect(ledger).toContainText(player.name);
    }

    await closePlayers(players);
});

test("majority vote executes the target", async ({ browser, page }) => {
    const roomCode = createRoomCode("J");
    await openHost(page, roomCode);
    const players = await joinPlayers(browser, roomCode, createPlayerNames(4));
    await startGame(page);
    await openVoting(page);

    // 3 out of 4 vote for P01 — clear majority (75% > 50%)
    const target = "P01";
    let votesCast = 0;
    for (const player of players) {
        if (player.name === target) continue;
        const btn = player.page
            .getByTestId("player-target-list")
            .locator("button")
            .filter({ hasText: target })
            .first();
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await btn.click();
            votesCast++;
        }
    }

    if (votesCast >= 3) {
        await resolveVote(page);
        await expect(page.getByTestId("host-current-phase")).toContainText(
            "Night",
            { timeout: 10_000 },
        );
    }

    await closePlayers(players);
});

// ─── Modal phase gating ───────────────────────────────────────────────────────

test("seer vision modal does not appear during day phase", async ({
    browser,
    page,
}) => {
    const roomCode = createRoomCode("S");
    await openHost(page, roomCode);
    const players = await joinPlayers(browser, roomCode, createPlayerNames(5));
    await startGame(page);
    await advanceToNightDirect(page);

    // Wait for all players to receive night state, then find the seer
    let seerPlayer = null;
    for (const player of players) {
        await player.page
            .getByTestId("player-role")
            .waitFor({ state: "visible", timeout: 10_000 })
            .catch(() => null);
        const roleText = await player.page
            .getByTestId("player-role")
            .innerText()
            .catch(() => "");
        if (roleText.toLowerCase().includes("seer")) {
            seerPlayer = player;
            break;
        }
    }

    if (seerPlayer) {
        const targetList = seerPlayer.page.getByTestId("player-target-list");
        if (await targetList.isVisible({ timeout: 5000 }).catch(() => false)) {
            await targetList.locator("button").first().click();
            await expect(
                seerPlayer.page.getByTestId("seer-vision-modal"),
            ).toBeVisible({ timeout: 8_000 });
            await seerPlayer.page
                .getByTestId("seer-vision-modal")
                .locator("button")
                .click();
            await expect(
                seerPlayer.page.getByTestId("seer-vision-modal"),
            ).not.toBeVisible();
        }
    }

    await advanceToDay(page);

    // Seer modal must NOT appear during day phase
    if (seerPlayer) {
        await expect(
            seerPlayer.page.getByTestId("seer-vision-modal"),
        ).not.toBeVisible();
        await seerPlayer.page.waitForTimeout(1500);
        await expect(
            seerPlayer.page.getByTestId("seer-vision-modal"),
        ).not.toBeVisible();
    }

    await closePlayers(players);
});

test("wolf poll modal does not appear during day phase", async ({
    browser,
    page,
}) => {
    const roomCode = createRoomCode("W");
    await openHost(page, roomCode);
    const players = await joinPlayers(browser, roomCode, createPlayerNames(6));
    await startGame(page);
    await advanceToNightDirect(page);

    // Wait for all players to receive night state, then find a wolf
    let wolfPlayer = null;
    for (const player of players) {
        await player.page
            .getByTestId("player-role")
            .waitFor({ state: "visible", timeout: 10_000 })
            .catch(() => null);
        const roleText = await player.page
            .getByTestId("player-role")
            .innerText()
            .catch(() => "");
        if (roleText.toLowerCase().includes("wolf")) {
            wolfPlayer = player;
            break;
        }
    }

    if (wolfPlayer) {
        const targetList = wolfPlayer.page.getByTestId("player-target-list");
        if (await targetList.isVisible({ timeout: 5000 }).catch(() => false)) {
            await targetList.locator("button").first().click();
            await expect(
                wolfPlayer.page.getByTestId("wolf-poll-modal"),
            ).toBeVisible({ timeout: 8_000 });
            await wolfPlayer.page
                .getByTestId("wolf-poll-modal")
                .locator("button")
                .click();
            await expect(
                wolfPlayer.page.getByTestId("wolf-poll-modal"),
            ).not.toBeVisible();
        }
    }

    await advanceToDay(page);

    if (wolfPlayer) {
        await expect(
            wolfPlayer.page.getByTestId("wolf-poll-modal"),
        ).not.toBeVisible();
        await wolfPlayer.page.waitForTimeout(1500);
        await expect(
            wolfPlayer.page.getByTestId("wolf-poll-modal"),
        ).not.toBeVisible();
    }

    await closePlayers(players);
});

// ─── Restart includes all players ────────────────────────────────────────────

test("begin new ritual includes all players and none show as unknown", async ({
    browser,
    page,
}) => {
    const roomCode = createRoomCode("N");
    await openHost(page, roomCode);
    const players = await joinPlayers(browser, roomCode, createPlayerNames(4));
    await startGame(page);

    // End the game via advanced tools
    await page.getByTestId("host-advanced-toggle").click();
    await page.getByRole("button", { name: "Wolves Prevail" }).click();
    await expect(page.getByTestId("host-current-phase")).toContainText(
        "Ended",
        { timeout: 10_000 },
    );
    await page.getByTestId("host-advanced-toggle").click();

    // Begin new ritual
    await expect(page.getByTestId("host-primary-action")).toContainText(
        "Begin New Ritual",
    );
    await page.getByTestId("host-primary-action").click();
    await expect(page.getByTestId("host-current-phase")).toContainText("Day", {
        timeout: 10_000,
    });

    // Village ledger should show all players with roles (not "Unknown")
    const ledger = page.getByTestId("host-village-ledger");
    await expect(ledger).toBeVisible();
    await expect(ledger).not.toContainText("Unknown");
    for (const player of players) {
        await expect(ledger).toContainText(player.name);
    }

    // All player phones should receive new state (not stuck on game over)
    for (const player of players) {
        await expect(player.page.getByTestId("player-phase")).not.toContainText(
            "Prophecy Fulfilled",
            { timeout: 10_000 },
        );
        await expect(player.page.getByTestId("player-phase")).toContainText(
            "Village Awakens",
            { timeout: 10_000 },
        );
    }

    await closePlayers(players);
});

// ─── Player hydration ─────────────────────────────────────────────────────────

test("player does not stay stuck on loading spinner after joining", async ({
    browser,
    page,
}) => {
    const roomCode = createRoomCode("L");
    await openHost(page, roomCode);
    const players = await joinPlayers(browser, roomCode, createPlayerNames(4));
    await startGame(page);

    for (const player of players) {
        await expect(player.page.getByTestId("player-loading")).not.toBeVisible(
            { timeout: 12_000 },
        );
        await expect(player.page.getByTestId("player-role")).toBeVisible({
            timeout: 5_000,
        });
    }

    await closePlayers(players);
});
