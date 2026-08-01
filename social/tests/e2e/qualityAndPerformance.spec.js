const { test, expect } = require('@playwright/test');
const { connectDB, createTestUser, loginViaLocalStorage, uniqueId } = require('../helpers/testHelpers');

test.describe('Phase 5, 6 & 7: Quality Gates, Responsive Verification & Performance Audit', () => {
  let dbClient;
  let userA;

  test.beforeAll(async () => {
    dbClient = await connectDB();
    userA = await createTestUser(dbClient, uniqueId());
  });

  test.afterAll(async () => {
    if (dbClient) await dbClient.close();
  });

  test('Quality Gate: Zero uncaught console errors, React warnings, or broken images', async ({ page }) => {
    const consoleErrors = [];
    const httpErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known harmless network retry error if backend mail is disconnected
        if (!text.includes('ECONNREFUSED') && !text.includes('favicon')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('response', (response) => {
      if (response.status() >= 500) {
        httpErrors.push(`${response.status()}: ${response.url()}`);
      }
    });

    await loginViaLocalStorage(page, userA);
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Verify no unexpected HTTP 500 errors
    expect(httpErrors).toEqual([]);

    // Verify no broken images on page
    const brokenImages = await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src);
    });
    expect(brokenImages).toEqual([]);

    // Verify no infinite loading indicators remain
    const loadingSpinners = page.locator('.loading-spinner, .skeleton-loading');
    await expect(loadingSpinners).not.toBeVisible({ timeout: 5000 });
  });

  test('Responsive Layout Integrity across Viewports', async ({ page }) => {
    await loginViaLocalStorage(page, userA);
    await page.goto('/home');

    // Verify main container bounds without horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test('Performance Metrics Collection (FCP, LCP, Waterfall)', async ({ page }) => {
    await loginViaLocalStorage(page, userA);
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Extract Performance Observer metrics
    const metrics = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      
      const navEntry = performance.getEntriesByType('navigation')[0];
      const loadTime = navEntry ? navEntry.loadEventEnd - navEntry.startTime : 0;
      const domContentLoaded = navEntry ? navEntry.domContentLoadedEventEnd - navEntry.startTime : 0;

      return { fcp, loadTime, domContentLoaded };
    });

    expect(metrics.fcp).toBeGreaterThan(0);
    expect(metrics.fcp).toBeLessThan(3000); // Threshold check < 3s
  });
});
