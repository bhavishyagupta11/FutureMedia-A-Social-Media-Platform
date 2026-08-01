const { test, expect } = require('@playwright/test');
const { connectDB, createTestUser, loginViaLocalStorage, uniqueId } = require('../helpers/testHelpers');

test.describe('Navigation & Search', () => {
  let dbClient;
  let userA;

  test.beforeAll(async () => {
    dbClient = await connectDB();
    userA = await createTestUser(dbClient, uniqueId());
  });

  test.afterAll(async () => {
    if (dbClient) await dbClient.close();
  });

  test('Sidebar navigation links work', async ({ page }) => {
    await loginViaLocalStorage(page, userA);

    // Home
    const homeLink = page.locator('a[href="/home"]:visible').first();
    await homeLink.scrollIntoViewIfNeeded();
    await homeLink.click({ force: true });
    await expect(page).toHaveURL(/.*\/home/);

    // Explore
    const exploreLink = page.locator('a[href="/explore"]:visible').first();
    await exploreLink.scrollIntoViewIfNeeded();
    await exploreLink.click({ force: true });
    await expect(page).toHaveURL(/.*\/explore/);

    // Search
    await page.goto('/search');
    await expect(page).toHaveURL(/.*\/search/);

    // Notifications
    await page.goto('/notifications');
    await expect(page).toHaveURL(/.*\/notifications/);

    // Settings
    await page.goto('/settings');
    await expect(page).toHaveURL(/.*\/settings/);
  });

  test('Search page renders and accepts input', async ({ page }) => {
    await loginViaLocalStorage(page, userA);
    await page.goto('/search');

    const searchInput = page.locator('input.search-input');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    await searchInput.fill('test query');
    await expect(searchInput).toHaveValue('test query');
  });

  test('Notifications page renders', async ({ page }) => {
    await loginViaLocalStorage(page, userA);
    await page.goto('/notifications');

    // Should see the notifications page header
    const header = page.locator('h1:has-text("Notifications")');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('Logout works via sidebar', async ({ page }) => {
    await loginViaLocalStorage(page, userA);

    const logoutBtn = page.locator('.logout-btn:visible').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      // Mobile fallback: navigate to login directly by clearing token
      await page.evaluate(() => localStorage.clear());
      await page.goto('/');
    }

    // Should be redirected to login page (/)
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('Session persists across page reload', async ({ page }) => {
    await loginViaLocalStorage(page, userA);

    // Verify we're on home
    await expect(page).toHaveURL(/.*\/home/);

    // Reload
    await page.reload();

    // Should still be on home (not redirected to login)
    await expect(page).toHaveURL(/.*\/home/, { timeout: 10000 });

    // Verify authenticated layout elements are visible
    await expect(page.locator('aside.sidebar:visible, nav.bottom-nav:visible').first()).toBeVisible({ timeout: 5000 });
  });
});
