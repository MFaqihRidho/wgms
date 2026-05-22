import { expect, test } from "@playwright/test";

test("main routes load", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Werewolf Game Management System")).toBeVisible(
        { timeout: 15_000 },
    );

    await page.goto("/host");
    await expect(page.getByText("The Grimoire")).toBeVisible({
        timeout: 15_000,
    });

    await page.goto("/play");
    await expect(
        page.getByRole("heading", { name: "Enter the Village" }),
    ).toBeVisible({ timeout: 15_000 });

    await page.goto("/tv");
    await page.getByRole("button", { name: "Admin" }).click();
    await expect(page.getByTestId("tv-load-room")).toBeVisible({
        timeout: 15_000,
    });
});
