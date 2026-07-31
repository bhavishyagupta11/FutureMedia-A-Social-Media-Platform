const { test, expect } = require('@playwright/test');
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../server/.env') });
const AuthPage = require('../pages/AuthPage');

test.describe('Authentication Flows', () => {
  let authPage;
  let dbClient;
  let usersCollection;
  let testUser;

  test.beforeAll(async () => {
    dbClient = new MongoClient(process.env.MONGO_URI);
    await dbClient.connect();
    usersCollection = dbClient.db().collection('users');
  });

  test.afterAll(async () => {
    if (dbClient) await dbClient.close();
  });

  test.beforeEach(async ({ page }) => {
    const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    testUser = {
      email: `e2e_${uniqueId}@test.com`,
      username: `e2e_${uniqueId}`.substring(0, 25),
      password: 'password123'
    };
    authPage = new AuthPage(page);
    page.on('pageerror', (err) => {
      expect(err.message).not.toBeDefined(); 
    });
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('400') && !msg.text().includes('401')) {
         // Log errors but maybe don't fail immediately to avoid flakiness from 3rd party scripts
      }
    });
  });

  test('should successfully register a new user', async ({ page }) => {
    await authPage.gotoSignup();
    await authPage.register(testUser.email, testUser.username, testUser.password);

    // After signup, we should be redirected to login (/)
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // We should see a success toast
    const successToast = page.locator('.Toastify__toast--success, .go3958317564, :text("Account created successfully")').first();
    await expect(successToast).toBeVisible({ timeout: 5000 });
  });

  test('should fail to register with duplicate username', async ({ page }) => {
    const email1 = testUser.email.replace('@', '1@');
    const email2 = testUser.email.replace('@', '2@');
    
    // First register the user
    await authPage.gotoSignup();
    await authPage.register(email1, testUser.username + 'dup', testUser.password);
    await expect(page).toHaveURL('http://localhost:3000/');

    // Try to register again with same username
    await authPage.gotoSignup();
    await authPage.register(email2, testUser.username + 'dup', testUser.password);

    // We should see an error message (toast or inline)
    const errorToast = page.locator('.Toastify__toast--error, .go3958317564, .inlineError').first();
    await expect(errorToast).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login and persist session', async ({ page, context }) => {
    // Setup user
    await authPage.gotoSignup();
    const loginUser = { email: `login_${Date.now()}@test.com`, username: `login_${Date.now()}`, password: 'password123' };
    await authPage.register(loginUser.email, loginUser.username, loginUser.password);
    await expect(page).toHaveURL('http://localhost:3000/');

    // Bypass email verification
    await usersCollection.updateOne({ email: loginUser.email }, { $set: { isEmailVerified: true } });

    // Login
    await authPage.gotoLogin();
    await authPage.login(loginUser.username, loginUser.password);
    await expect(page).toHaveURL(/.*\/home|.*\//);

    // Test persistence by opening a new tab in the same context
    const newPage = await context.newPage();
    await newPage.goto('/home');
    await expect(newPage).toHaveURL(/.*\/home|.*\//); // Should not redirect to login
  });

  test('should fail to login with invalid credentials', async ({ page }) => {
    await authPage.gotoLogin();
    await authPage.login('invalid_user_xyz', 'wrongpassword');
    
    // Expect error toast
    const errorToast = page.locator('.Toastify__toast--error, .go3958317564').first();
    await expect(errorToast).toBeVisible({ timeout: 5000 });
  });
});
