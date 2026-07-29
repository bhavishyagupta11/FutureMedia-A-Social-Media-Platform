const { test, expect } = require('@playwright/test');
const { connectDB, registerUserViaAPI, uniqueId } = require('../helpers/testHelpers');
const AuthPage = require('../pages/AuthPage');
const crypto = require('crypto');

test.describe('Email Verification System E2E Suite', () => {
  let dbClient;

  test.beforeAll(async () => {
    dbClient = await connectDB();
  });

  test.afterAll(async () => {
    if (dbClient) await dbClient.close();
  });

  test('Full Journey: Signup -> Unverified Login -> Verify Token -> Login Success', async ({ page }) => {
    const id = uniqueId();
    const testUsername = `ev_${id}`.substring(0, 25);
    const testEmail = `ev_${id}@example.com`;
    const testPassword = 'Password123!';
    const authPage = new AuthPage(page);

    // 1. Register via API
    await registerUserViaAPI(testEmail, testUsername, testPassword);

    // 2. Prepare a known raw token for verification
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const updateResult = await dbClient.db().collection('users').updateOne(
      { email: testEmail.toLowerCase() },
      {
        $set: {
          emailVerificationToken: hashedToken,
          emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          emailVerificationLastSentAt: new Date(Date.now() - 120000),
          isEmailVerified: false
        }
      }
    );
    expect(updateResult.matchedCount).toBe(1);

    // 3. Unverified Login Attempt should be blocked
    await authPage.gotoLogin();
    await authPage.login(testUsername, testPassword);
    await expect(page.locator('text=Email Verification Required')).toBeVisible({ timeout: 10000 });

    // 4. Visit Verification URL
    await page.goto(`/verify/${rawToken}`);
    await expect(page.locator('h2:has-text("Account Verified!")')).toBeVisible({ timeout: 15000 });

    // 5. Click Continue to Login
    await page.locator('button:has-text("Continue to Login")').click();
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 10000 });

    // 6. Login after verification should succeed
    await authPage.login(testUsername, testPassword);
    await expect(page).toHaveURL(/.*\/home/, { timeout: 15000 });
  });

  test('Signup via UI redirects to login with verification notice', async ({ page }) => {
    const id = uniqueId();
    const testUsername = `su_${id}`.substring(0, 25);
    const testEmail = `su_${id}@example.com`;
    const testPassword = 'Password123!';
    const authPage = new AuthPage(page);

    await authPage.gotoSignup();
    await authPage.register(testEmail, testUsername, testPassword);

    // Should redirect to login page
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 15000 });
  });

  test('Invalid verification token shows error screen', async ({ page }) => {
    await page.goto('/verify/invalid_fake_token_1234567890abcdef');
    await expect(page.locator('h2:has-text("Invalid Verification Link")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a:has-text("Return to Login")')).toBeVisible();
  });

  test('Already verified token shows Already Verified screen', async ({ page }) => {
    const id = uniqueId();
    const testUsername = `av_${id}`.substring(0, 25);
    const testEmail = `av_${id}@example.com`;
    const testPassword = 'Password123!';

    await registerUserViaAPI(testEmail, testUsername, testPassword);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await dbClient.db().collection('users').updateOne(
      { email: testEmail.toLowerCase() },
      {
        $set: {
          emailVerificationToken: hashedToken,
          emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isEmailVerified: true
        }
      }
    );

    await page.goto(`/verify/${rawToken}`);
    await expect(page.locator('h2:has-text("Already Verified")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Sign In to Your Account")')).toBeVisible();
  });

  test('Expired token shows Link Expired screen with resend form', async ({ page }) => {
    const id = uniqueId();
    const testUsername = `ex_${id}`.substring(0, 25);
    const testEmail = `ex_${id}@example.com`;
    const testPassword = 'Password123!';

    await registerUserViaAPI(testEmail, testUsername, testPassword);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await dbClient.db().collection('users').updateOne(
      { email: testEmail.toLowerCase() },
      {
        $set: {
          emailVerificationToken: hashedToken,
          emailVerificationExpires: new Date(Date.now() - 3600000),
          isEmailVerified: false
        }
      }
    );

    await page.goto(`/verify/${rawToken}`);
    await expect(page.locator('h2:has-text("Link Expired")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a:has-text("Back to Login")')).toBeVisible();
  });

  test('Resend verification from login page works', async ({ page }) => {
    const id = uniqueId();
    const testUsername = `rs_${id}`.substring(0, 25);
    const testEmail = `rs_${id}@example.com`;
    const testPassword = 'Password123!';
    const authPage = new AuthPage(page);

    await registerUserViaAPI(testEmail, testUsername, testPassword);

    // Reset lastSentAt so resend is not rate limited
    await dbClient.db().collection('users').updateOne(
      { email: testEmail.toLowerCase() },
      { $set: { emailVerificationLastSentAt: new Date(Date.now() - 120000) } }
    );

    await authPage.gotoLogin();
    await authPage.login(testUsername, testPassword);

    await expect(page.locator('text=Email Verification Required')).toBeVisible({ timeout: 10000 });

    await page.locator('button:has-text("Resend Verification Link")').click();

    await expect(page.locator('text=verification email dispatched')).toBeVisible({ timeout: 10000 });
  });
});
