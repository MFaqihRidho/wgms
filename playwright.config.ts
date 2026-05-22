import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./tests/e2e",
    timeout: 180_000,
    expect: { timeout: 20_000 },
    fullyParallel: false,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: [["html"], ["list"]],
    use: {
        baseURL: "http://127.0.0.1:5173",
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
    webServer: {
        command: "npm run dev -- --host 127.0.0.1",
        url: "http://127.0.0.1:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
