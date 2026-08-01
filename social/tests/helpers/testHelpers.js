const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../server/.env') });

/**
 * Shared test helpers for E2E tests.
 * Provides user creation via API, DB access, and login helpers.
 */

const API_BASE = 'http://localhost:8080';

/**
 * Register a user via the backend API (bypasses UI).
 */
async function registerUserViaAPI(email, username, password) {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Registration failed: ${data.message || res.statusText}`);
  return data;
}

/**
 * Login a user via the backend API and return the token + user data.
 */
async function loginUserViaAPI(username, password) {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed: ${data.message || res.statusText}`);
  return data;
}

/**
 * Connect to MongoDB using the configured MONGO_URI.
 */
async function connectDB() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  return client;
}

/**
 * Verify a user's email in the DB (bypass email verification).
 */
async function verifyUserEmail(dbClient, email) {
  const db = dbClient.db();
  await db.collection('users').updateOne(
    { email },
    { $set: { isEmailVerified: true } }
  );
}

/**
 * Create a test user: register, verify email, login. Returns { token, userId, username }.
 */
async function createTestUser(dbClient, uniqueId) {
  const email = `e2e_${uniqueId}@test.com`;
  const username = `e2e_${uniqueId}`.substring(0, 25);
  const password = 'password123';

  await registerUserViaAPI(email, username, password);
  await verifyUserEmail(dbClient, email);
  const loginData = await loginUserViaAPI(username, password);

  const user = loginData.data || loginData;
  return {
    token: user.token,
    userId: user._id || user.userId,
    username,
    email,
    password,
  };
}

/**
 * Set up a Playwright page with an authenticated session.
 * Injects token and user data into localStorage so the page loads as authenticated.
 */
async function loginViaUI(page, authPage, username, password) {
  await authPage.gotoLogin();
  await authPage.login(username, password);
  // Wait for navigation to /home
  await page.waitForURL(/.*\/home|.*\//, { timeout: 10000 });
}

/**
 * Set up a page with an API-based login (faster, no UI interaction).
 * Navigates to the app, injects localStorage, then reloads.
 */
async function loginViaLocalStorage(page, user) {
  await page.goto('/');
  await page.evaluate((userData) => {
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('username', userData.username);
  }, user);
  await page.goto('/home');
  await page.waitForURL(/.*\/home/, { timeout: 10000 });
}

/**
 * Generate a unique ID for test isolation.
 */
function uniqueId() {
  return `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

module.exports = {
  API_BASE,
  registerUserViaAPI,
  loginUserViaAPI,
  connectDB,
  verifyUserEmail,
  createTestUser,
  loginViaUI,
  loginViaLocalStorage,
  uniqueId,
};
