import { expect, test } from "@playwright/test";
import {
    advanceToDay,
    advanceToNightDirect,
    clickFirstTarget,
    closePlayers,
    createPlayerNames,
    createRoomCode,
    expectPlayersPhase,
    expectTvPhase,
    joinPlayers,
    openHost,
    openTv,
    startGame,
} from "./helpers/wgms";

test("8-player host tv player realtime sync", async ({ browser, page }) => {
    const roomCode = createRoomCode("E");
    await openHost(page, roomCode);

    const tv = await browser.newPage();
    await openTv(tv, roomCode);

    const players = await joinPlayers(browser, roomCode, createPlayerNames(8));
    await expect(page.getByTestId("host-village-ledger")).toContainText("P08");
    // During WAITING, TV shows player count in the waiting section (not tv-players)
    await expect(tv.getByTestId("tv-waiting")).toContainText("8", {
        timeout: 10_000,
    });

    await startGame(page);

    // After game starts, player list is in the active game section
    await expect(tv.getByTestId("tv-players")).toContainText("P08", {
        timeout: 10_000,
    });

    // Game starts on DAY_PHASE
    await expectTvPhase(tv, "Village Awakens");
    await expectPlayersPhase(players, "Village Awakens");

    // Advance to night via advanced tools
    await advanceToNightDirect(page);
    await expectTvPhase(tv, "Hunt");
    await expectPlayersPhase(players, "Hunt");

    // Wait for role cards to load
    for (const player of players) {
        await player.page
            .getByTestId("player-role")
            .waitFor({ state: "visible", timeout: 10_000 })
            .catch(() => null);
    }

    const wolf = players.find(async (p) => {
        const text = await p.page
            .getByTestId("player-role")
            .innerText()
            .catch(() => "");
        return text.toLowerCase().includes("wolf");
    });

    // Find wolf by checking role text
    let wolfPlayer = null;
    let seerPlayer = null;
    for (const player of players) {
        const roleText = await player.page
            .getByTestId("player-role")
            .innerText()
            .catch(() => "");
        if (roleText.toLowerCase().includes("wolf") && !wolfPlayer)
            wolfPlayer = player;
        if (roleText.toLowerCase().includes("seer") && !seerPlayer)
            seerPlayer = player;
    }

    if (wolfPlayer) {
        const target = await clickFirstTarget(wolfPlayer);
        await expect(page.getByTestId("host-ticker")).toContainText(target, {
            timeout: 8_000,
        });
    }

    if (seerPlayer) {
        const targetList = seerPlayer.page.getByTestId("player-target-list");
        if (await targetList.isVisible({ timeout: 3000 }).catch(() => false)) {
            await clickFirstTarget(seerPlayer);
            await expect(
                seerPlayer.page.getByTestId("seer-vision-modal"),
            ).toBeVisible({ timeout: 8_000 });
            await seerPlayer.page
                .getByTestId("seer-vision-modal")
                .locator("button")
                .click();
        }
    }

    await advanceToDay(page);
    await expectTvPhase(tv, "Village Awakens");
    await expectPlayersPhase(players, "Village Awakens");

    await tv.close();
    await closePlayers(players);
});
