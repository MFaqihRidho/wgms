import { expect, test } from "@playwright/test";
import {
    advanceToNightDirect,
    closePlayers,
    createPlayerNames,
    createRoomCode,
    expectTvPhase,
    joinPlayers,
    openHost,
    openTv,
    startGame,
} from "./helpers/wgms";

test("host tv and player recover after refresh", async ({ browser, page }) => {
    const roomCode = createRoomCode("R");
    await openHost(page, roomCode);
    const players = await joinPlayers(browser, roomCode, createPlayerNames(8));
    const tv = await browser.newPage();
    await openTv(tv, roomCode);

    await startGame(page);
    await advanceToNightDirect(page);
    await expectTvPhase(tv, "Hunt");
    await expect(players[0].page.getByTestId("player-phase")).toContainText(
        "Hunt",
        { timeout: 10_000 },
    );

    // Host refresh
    await page.reload();
    await expect(page.getByTestId("host-current-phase")).toContainText(
        "Night",
        { timeout: 15_000 },
    );

    // TV refresh
    await tv.reload();
    await expectTvPhase(tv, "Hunt");

    // Player refresh
    await players[0].page.reload();
    await expect(players[0].page.getByTestId("player-phase")).toContainText(
        "Hunt",
        { timeout: 15_000 },
    );

    await tv.close();
    await closePlayers(players);
});
