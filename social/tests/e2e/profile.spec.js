const { test, expect } = require('@playwright/test');
const { connectDB, createTestUser, loginViaLocalStorage, uniqueId, API_BASE } = require('../helpers/testHelpers');

test.describe('Profile', () => {
  let dbClient;
  let userA;

  test.beforeAll(async () => {
    dbClient = await connectDB();
    userA = await createTestUser(dbClient, uniqueId());
  });

  test.afterAll(async () => {
    if (dbClient) await dbClient.close();
  });

  test('User can view own profile', async ({ page }) => {
    await loginViaLocalStorage(page, userA);
    await page.goto('/profile');

    // Verify profile elements are visible
    await expect(page.locator('.profileUsername')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.profileDisplayName')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.profileAvatar')).toBeVisible({ timeout: 5000 });

    // Verify stats section
    await expect(page.locator('.statItem').first()).toBeVisible({ timeout: 5000 });
  });

  test('User can navigate to edit profile', async ({ page }) => {
    await loginViaLocalStorage(page, userA);
    await page.goto(`/profile/${userA.userId}`);

    const editBtn = page.locator('button:has-text("Edit profile")');
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.scrollIntoViewIfNeeded();
    await editBtn.click({ force: true });

    await expect(page).toHaveURL(/.*\/profile\/edit/);
  });

  test('User can update display name and bio', async ({ page }) => {
    await loginViaLocalStorage(page, userA);
    await page.goto('/profile/edit');
    await page.waitForTimeout(1000);

    const newDisplayName = `TestUser ${Date.now()}`;
    const newBio = `E2E bio ${Date.now()}`;

    await page.getByPlaceholder('Your full name').fill(newDisplayName);
    await page.getByPlaceholder('Tell people about yourself...').fill(newBio);
    await page.locator('button.saveBtn').click();

    // Wait for save and redirect
    await page.waitForURL(/\/profile\//, { timeout: 10000 });
    await expect(page.locator('.profileDisplayName')).toContainText(newDisplayName, { timeout: 10000 });
    await expect(page.locator('.profileBio')).toContainText(newBio, { timeout: 5000 });
  });

  test('Profile persists after page reload', async ({ page }) => {
    await loginViaLocalStorage(page, userA);
    await page.goto(`/profile/${userA.userId}`);
    await page.waitForTimeout(600);

    await expect(page.locator('.profileHeader, .profileCard')).toBeVisible({ timeout: 10000 });

    await page.reload();
    await expect(page.locator('.profileHeader, .profileCard')).toBeVisible({ timeout: 10000 });
  });

  test('User can view another user profile', async ({ page }) => {
    const userB = await createTestUser(dbClient, uniqueId());
    await loginViaLocalStorage(page, userA);

    await page.goto(`/profile/${userB.userId}`);
    await page.waitForTimeout(600);

    // Should see the other user's profile with Follow button (not Edit)
    await expect(page.locator('.profileUsername, .profileDisplayName').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button.profileBtn.followBtn, button:has-text("Follow")').first()).toBeVisible({ timeout: 5000 });
    // Edit button should NOT be visible
    await expect(page.locator('button:has-text("Edit profile")')).not.toBeVisible();
  });
});
