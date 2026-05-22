import { expect, type Browser, type Page } from "@playwright/test";

export type PlayerClient = {
    name: string;
    page: Page;
    close: () => Promise<void>;
};

export function createRoomCode(prefix = "T") {
    const chars = Math.random()
        .toString(36)
        .replace(/[^a-z0-9]/gi, "")
        .toUpperCase();
    return `${prefix}${chars}`.slice(0, 4).padEnd(4, "X");
}

export function createPlayerNames(count: number) {
    return Array.from(
        { length: count },
        (_, index) => `P${String(index + 1).padStart(2, "0")}`,
    );
}

export async function openHost(page: Page, roomCode: string) {
    // Go to /host first, clear the saved session, then reload clean
    await page.goto("/host");
    await page.evaluate(() => localStorage.removeItem("wgms.host.session"));
    await page.goto("/host");
    await expect(page.getByTestId("host-room-input")).toBeVisible({
        timeout: 10_000,
    });
    await page.getByTestId("host-room-input").fill(roomCode);
    await page.getByTestId("host-load-room").click();
    await expect(page.getByTestId("host-room-code")).toContainText(roomCode, {
        timeout: 20_000,
    });
}

export async function openTv(page: Page, roomCode: string) {
    await page.goto(`/tv?room=${roomCode}`);
    await page.getByRole("button", { name: "Admin" }).click();
    await expect(page.getByTestId("tv-room-input")).toHaveValue(roomCode);
    await page.getByRole("button", { name: "Admin" }).click();
}

export async function joinPlayer(
    browser: Browser,
    roomCode: string,
    name: string,
): Promise<PlayerClient> {
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    // Navigate first, then clear any stale session before the actual join page loads
    await page.goto(`/play?room=${roomCode}`);
    await page.evaluate(() => localStorage.removeItem("wgms.player.session"));
    await page.goto(`/play?room=${roomCode}`);
    await page.getByTestId("player-name-input").fill(name);
    await page.getByTestId("player-join-room").click();
    await expect(page.getByTestId("player-session-toggle")).toContainText(
        name,
        { timeout: 30_000 },
    );
    return { name, page, close: () => context.close() };
}

export async function joinPlayers(
    browser: Browser,
    roomCode: string,
    names: string[],
) {
    const clients: PlayerClient[] = [];
    for (const name of names) {
        clients.push(await joinPlayer(browser, roomCode, name));
    }
    return clients;
}

/** Wait for the primary action button to be ready (not pending/disabled) */
async function waitForPrimaryAction(host: Page, labelFragment: string) {
    // Wait for the label to appear
    await expect(host.getByTestId("host-primary-action")).toContainText(
        labelFragment,
        { timeout: 20_000 },
    );
    // Wait for it to be enabled (actionPending = false)
    await expect(host.getByTestId("host-primary-action")).toBeEnabled({
        timeout: 15_000,
    });
}

export async function startGame(host: Page) {
    await waitForPrimaryAction(host, "Begin the Ritual");
    await host.getByTestId("host-primary-action").click();
    await expect(host.getByTestId("host-current-phase")).toContainText("Day", {
        timeout: 20_000,
    });
    await expect(host.getByTestId("host-primary-action")).toBeEnabled({
        timeout: 15_000,
    });
}

export async function advanceToNightDirect(host: Page) {
    await host.getByTestId("host-advanced-toggle").click();
    await expect(
        host.getByRole("button", { name: "Return to Night" }),
    ).toBeEnabled({ timeout: 10_000 });
    await host.getByRole("button", { name: "Return to Night" }).click();
    await expect(host.getByTestId("host-current-phase")).toContainText(
        "Night",
        { timeout: 20_000 },
    );
    await expect(host.getByTestId("host-primary-action")).toBeEnabled({
        timeout: 15_000,
    });
    await host.getByTestId("host-advanced-toggle").click();
}

export async function advanceToDay(host: Page) {
    await waitForPrimaryAction(host, "Dawn Breaks");
    await host.getByTestId("host-primary-action").click();
    await expect(host.getByTestId("host-current-phase")).toContainText("Day", {
        timeout: 20_000,
    });
    await expect(host.getByTestId("host-primary-action")).toBeEnabled({
        timeout: 15_000,
    });
}

export async function openVoting(host: Page) {
    await waitForPrimaryAction(host, "Convene Tribunal");
    await host.getByTestId("host-primary-action").click();
    await expect(host.getByTestId("host-current-phase")).toContainText(
        "Tribunal",
        { timeout: 20_000 },
    );
    await expect(host.getByTestId("host-primary-action")).toBeEnabled({
        timeout: 15_000,
    });
}

export async function resolveVote(host: Page) {
    await waitForPrimaryAction(host, "Resolve Judgment");
    await host.getByTestId("host-primary-action").click();
    // Don't assert phase — game may go to GAME_OVER or NIGHT_PHASE
    await host.waitForTimeout(1000);
}

export async function expectPlayersPhase(
    players: PlayerClient[],
    phaseText: string,
) {
    for (const player of players) {
        await expect(player.page.getByTestId("player-phase")).toContainText(
            phaseText,
            { timeout: 15_000 },
        );
    }
}

export async function expectTvPhase(page: Page, phaseText: string) {
    await expect(page.getByTestId("tv-phase")).toContainText(phaseText, {
        timeout: 15_000,
    });
}

export async function getPlayerRoles(players: PlayerClient[]) {
    const roles = new Map<string, string>();
    for (const player of players) {
        await expect(player.page.getByTestId("player-role")).toBeVisible();
        roles.set(
            player.name,
            (await player.page.getByTestId("player-role").innerText()).trim(),
        );
    }
    return roles;
}

export async function clickFirstTarget(player: PlayerClient) {
    const target = player.page
        .getByTestId("player-target-list")
        .locator("button")
        .first();
    await expect(target).toBeVisible();
    const targetName = (await target.innerText()).trim();
    await target.click();
    return targetName;
}

export async function closePlayers(players: PlayerClient[]) {
    for (const player of players) {
        await player.close();
    }
}
