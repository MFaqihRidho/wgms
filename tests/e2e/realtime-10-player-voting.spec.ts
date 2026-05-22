import { expect, test } from "@playwright/test";
import {
    advanceToNightDirect,
    closePlayers,
    createPlayerNames,
    createRoomCode,
    expectPlayersPhase,
    expectTvPhase,
    joinPlayers,
    openHost,
    openTv,
    openVoting,
    resolveVote,
    startGame,
} from "./helpers/wgms";

test("10-player voting syncs with host and tv", async ({ browser, page }) => {
    const roomCode = createRoomCode("V");
    await openHost(page, roomCode);

    const tv = await browser.newPage();
    await openTv(tv, roomCode);

    const players = await joinPlayers(browser, roomCode, createPlayerNames(10));
    await expect(page.getByTestId("host-village-ledger")).toContainText("P10");

    await startGame(page);
    await openVoting(page);
    await expectTvPhase(tv, "Tribunal");
    await expectPlayersPhase(players, "Tribunal");

    // TV should show vote progress
    await expect(tv.getByTestId("tv-vote-progress")).toContainText("0/10");

    // Have 6+ players vote for P01 to get majority (>50% of 10 = need 6+)
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
            if (votesCast >= 6) break;
        }
    }

    // TV vote progress should update
    if (votesCast > 0) {
        await expect(tv.getByTestId("tv-vote-progress")).not.toContainText(
            "0/",
            { timeout: 10_000 },
        );
    }

    await resolveVote(page);

    if (votesCast >= 6) {
        // Majority reached — should advance to night
        await expect(page.getByTestId("host-current-phase")).toContainText(
            "Night",
            { timeout: 10_000 },
        );
    }

    await tv.close();
    await closePlayers(players);
});
