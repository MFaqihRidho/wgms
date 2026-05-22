import { expect, test } from "@playwright/test";
import {
    advanceToNightDirect,
    closePlayers,
    createPlayerNames,
    createRoomCode,
    joinPlayers,
    openHost,
    openVoting,
    startGame,
} from "./helpers/wgms";

test("host shows correct primary action per phase", async ({
    browser,
    page,
}) => {
    const roomCode = createRoomCode("H");
    await openHost(page, roomCode);

    const players = await joinPlayers(browser, roomCode, createPlayerNames(4));
    await expect(page.getByTestId("host-village-ledger")).toContainText("P04");
    await expect(page.getByTestId("host-primary-action")).toContainText(
        "Begin the Ritual",
    );

    // Game starts on day
    await startGame(page);
    await expect(page.getByTestId("host-primary-action")).toContainText(
        "Convene Tribunal",
    );

    // Voting phase
    await openVoting(page);
    await expect(page.getByTestId("host-primary-action")).toContainText(
        "Resolve Judgment",
    );

    // Advanced tools are collapsed by default
    await expect(page.getByTestId("host-advanced-tools")).not.toBeVisible();
    await page.getByTestId("host-advanced-toggle").click();
    await expect(page.getByTestId("host-advanced-tools")).toBeVisible();
    await expect(page.getByTestId("host-advanced-tools")).toContainText(
        "Banish Soul",
    );
    await expect(page.getByTestId("host-advanced-tools")).toContainText(
        "Dissolve Ritual",
    );

    await closePlayers(players);
});

test("host cannot start game with fewer than 4 players", async ({
    browser,
    page,
}) => {
    const roomCode = createRoomCode("F");
    await openHost(page, roomCode);

    const players = await joinPlayers(browser, roomCode, createPlayerNames(3));
    await expect(page.getByTestId("host-village-ledger")).toContainText("P03");

    // Primary action should be disabled
    await expect(page.getByTestId("host-primary-action")).toBeDisabled();
    await expect(page.getByTestId("host-phase-area")).toContainText("4");

    await closePlayers(players);
});

test("host night phase shows wolf and seer action status", async ({
    browser,
    page,
}) => {
    const roomCode = createRoomCode("K");
    await openHost(page, roomCode);

    const players = await joinPlayers(browser, roomCode, createPlayerNames(5));
    await startGame(page);
    await advanceToNightDirect(page);

    // Night phase panel should show action status
    await expect(page.getByTestId("host-phase-area")).toContainText("Wolves");
    await expect(page.getByTestId("host-phase-area")).toContainText("Awaiting");

    await closePlayers(players);
});
