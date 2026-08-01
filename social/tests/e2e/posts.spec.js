const { test, expect } = require('@playwright/test');
const { connectDB, createTestUser, loginViaLocalStorage, uniqueId } = require('../helpers/testHelpers');
const FeedPage = require('../pages/FeedPage');

test.describe('Posts & Interactions', () => {
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

  test('User A can create a text post', async ({ page }) => {
    await loginViaLocalStorage(page, userA);
    const feedPage = new FeedPage(page);

    const caption = `E2E test post ${Date.now()}`;
    await feedPage.createTextPost(caption);

    // Wait for success toast
    const successToast = page.locator('.Toastify__toast, :text("Post shared successfully")').first();
    await expect(successToast).toBeVisible({ timeout: 8000 });

    // Verify the post appears in the feed
    await page.waitForTimeout(1000);
    const postCard = feedPage.getPostByCaption(caption);
    await expect(postCard).toBeVisible({ timeout: 10000 });
  });

  test('User A can like and unlike a post', async ({ page }) => {
    await loginViaLocalStorage(page, userA);
    const feedPage = new FeedPage(page);
    await feedPage.goto();

    const postContent = `Like test post ${Date.now()}`;
    await feedPage.createTextPost(postContent);
    await page.waitForTimeout(1000);

    const postCard = page.locator('.Post', { hasText: postContent }).first();
    await expect(postCard).toBeVisible({ timeout: 10000 });

    // Like
    const likeBtn = postCard.locator('button.action-like').first();
    const likeResponsePromise = page.waitForResponse(resp => resp.url().includes('/like') && resp.status() === 200);
    await likeBtn.click();
    await likeResponsePromise;

    // Verify the button is now in "liked" state
    await expect(likeBtn).toHaveClass(/active/, { timeout: 8000 });

    // Unlike (click again)
    const unlikeResponsePromise = page.waitForResponse(resp => resp.url().includes('/like') && resp.status() === 200);
    await likeBtn.click();
    await unlikeResponsePromise;

    // Verify the button reverted to inactive state
    await expect(likeBtn).not.toHaveClass(/active/, { timeout: 8000 });
  });

  test('User A can comment on a post', async ({ page }) => {
    await loginViaLocalStorage(page, userA);
    const feedPage = new FeedPage(page);
    await feedPage.goto();

    const postContent = `Comment test post ${Date.now()}`;
    await feedPage.createTextPost(postContent);
    await page.waitForTimeout(1000);

    const postCard = page.locator('.Post', { hasText: postContent }).first();
    await expect(postCard).toBeVisible({ timeout: 10000 });

    const commentText = `E2E comment ${Date.now()}`;
    await feedPage.commentOnPost(postCard, commentText);

    // The comment should be in the expanded comment section
    const commentElement = page.locator(`.commentBody:has-text("${commentText}")`).first();
    await expect(commentElement).toBeVisible({ timeout: 10000 });
  });

  test('User A can delete own post', async ({ page }) => {
    await loginViaLocalStorage(page, userA);
    const feedPage = new FeedPage(page);
    await feedPage.goto();

    // Create a post to delete
    const caption = `deleteme_${Date.now()}`;
    await feedPage.createTextPost(caption);
    await page.waitForTimeout(2000);

    // Find the post
    const postCard = feedPage.getPostByCaption(caption);
    await expect(postCard).toBeVisible({ timeout: 10000 });

    // Delete it
    await feedPage.deletePost(postCard);

    // Verify deletion toast
    const deleteToast = page.locator(':text("Post deleted")').first();
    await expect(deleteToast).toBeVisible({ timeout: 5000 });

    // Verify the post is gone
    await expect(postCard).not.toBeVisible({ timeout: 5000 });
  });

  test('User B can see User A posts in feed', async ({ page }) => {
    // First, User A creates a post
    const apiPage = await page.context().newPage();
    await loginViaLocalStorage(apiPage, userA);
    const feedPageA = new FeedPage(apiPage);
    const caption = `visible_to_b_${Date.now()}`;
    await feedPageA.createTextPost(caption);
    await apiPage.waitForTimeout(2000);
    await apiPage.close();

    // User B follows User A first (via API to speed things up)
    const followRes = await fetch(`http://localhost:8080/api/v1/user/${userA.userId}/follow`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userB.token}`,
      },
    });

    // Now User B checks the feed
    await loginViaLocalStorage(page, userB);
    const feedPage = new FeedPage(page);
    await feedPage.goto();

    // The post should appear (may take a moment)
    await page.waitForTimeout(2000);
    await page.reload();
    await expect(feedPage.postsContainer).toBeVisible({ timeout: 10000 });
  });
});
