import { defineConfig, devices } from '@playwright/test';

// PORT lets the suite run on the built site while a dev server uses 4321.
const port = Number(process.env.PORT ?? 4321);

// CI machines have no GPU, and recent headless Chromium no longer falls back to software WebGL
// on its own: without these flags the 3D scene shows its "no WebGL" fallback in every test.
const chromium = {
  ...devices['Desktop Chrome'],
  launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] },
};

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  // Without a GPU, a frame of the scene can block the page for over a second: the default 5 s is
  // too short there for checks that are otherwise fine (the figure's wave draws many frames).
  expect: { timeout: process.env.CI ? 15_000 : 5_000 },
  use: {
    baseURL: `http://localhost:${port}`,
  },
  webServer: {
    // On CI the workflow has already built the site: only start it.
    command: `${process.env.CI ? '' : 'npm run build && '}npm run preview -- --port ${port}`,
    url: `http://localhost:${port}/en/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: 'desktop-chromium', use: chromium },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 15'] },
      // Starts its own browser with Chromium-only flags, which WebKit refuses to launch with.
      testIgnore: /scene-nowebgl\.spec\.ts/,
    },
    {
      name: 'chromium-320',
      use: { ...chromium, viewport: { width: 320, height: 640 } },
      // Only what depends on the width: no style changes between 320 px and the phone of
      // mobile-webkit, so what can break here is overflow and what no longer fits or can be reached.
      grep: /@narrow/,
    },
    { name: 'chromium-nojs', use: { ...chromium, javaScriptEnabled: false } },
  ],
});
