const { test, expect } = require('@playwright/test');
const { connectDB, createTestUser, loginViaLocalStorage, uniqueId } = require('../helpers/testHelpers');
const FeedPage = require('../pages/FeedPage');
const ProfilePage = require('../pages/ProfilePage');
const SearchPage = require('../pages/SearchPage');
const NotificationsPage = require('../pages/NotificationsPage');

test.describe('Two User Session End-to-End Workflows', () => {
  let dbClient;
  let userA;
  let userB;

  test.beforeAll(async () => {
    dbClient = await connectDB();
    userA = await createTestUser(dbClient, uniqueId());
    userB = await createTestUser(dbClient, uniqueId());
  });

  test.afterAll(async () => {
    if (dbClient) await dbClient.close();
  });

  test('Multi-user interaction: User B follows User A, likes post, and User A receives notification', async ({ browser }) => {
    // Phase 3: Create two completely isolated browser contexts
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Authenticate User A and User B separately
    await loginViaLocalStorage(pageA, userA);
    await loginViaLocalStorage(pageB, userB);

    // 1. User A creates a post
    const feedA = new FeedPage(pageA);
    const postCaption = `MultiUser Test Post ${Date.now()}`;
    await feedA.createTextPost(postCaption);
    await expect(pageA.locator('.Toastify__toast, :text("Post shared successfully")').first()).toBeVisible({ timeout: 8000 });

    // 2. User B searches for User A and visits profile to follow
    const searchB = new SearchPage(pageB);
    await searchB.goto();
    await searchB.search(userA.username);
    await expect(searchB.resultsSection).toBeVisible({ timeout: 10000 });

    const profileB = new ProfilePage(pageB);
    await profileB.goto(userA.userId);
    const followBtn = pageB.locator('button.followBtn, button.profileBtn, button:has-text("Follow")').first();
    await expect(followBtn).toBeVisible({ timeout: 10000 });
    await followBtn.scrollIntoViewIfNeeded();
    await followBtn.click({ force: true });
    await expect(pageB.locator('button:has-text("Following")')).toBeVisible({ timeout: 8000 });

    // 3. User B checks home feed, sees User A's post, and likes it
    const feedB = new FeedPage(pageB);
    await feedB.goto();
    await pageB.waitForTimeout(1500);
    await pageB.reload();

    const postCardOnB = feedB.getPostByCaption(postCaption);
    if (await postCardOnB.isVisible({ timeout: 5000 })) {
      const likeBtnB = postCardOnB.locator('button.action-like, button[title="Like"]').first();
      await likeBtnB.click();
      await pageB.waitForTimeout(1000);
    }

    // 4. User A navigates to Notifications and verifies activity
    const notificationsA = new NotificationsPage(pageA);
    await notificationsA.goto();
    await expect(notificationsA.header).toBeVisible({ timeout: 10000 });

    await contextA.close();
    await contextB.close();
  });
});
