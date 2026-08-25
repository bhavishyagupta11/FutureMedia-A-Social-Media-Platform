const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const authService = require("../services/auth.service");
const User = require("../models/userModel");

let mongoServer;

describe("Email Verification Subsystem Integration Tests", () => {
  beforeAll(async () => {
    process.env.EMAIL_MODE = "mock";
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  }, 30000);

  const testEmail = `verify_test_${Date.now()}@test.com`;
  const testUser = `integration_test_user_${Date.now()}`;
  const testPassword = "Password123!";

  test("1. Registration creates user with SHA-256 hashed token and isEmailVerified=false", async () => {
    const result = await authService.registerUser({
      username: testUser,
      email: testEmail,
      password: testPassword,
      deviceInfo: "Jest Test Runner",
      ipAddress: "127.0.0.1"
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(testEmail.toLowerCase());
    expect(result.user.isEmailVerified).toBe(false);

    const userInDb = await User.findOne({ email: testEmail.toLowerCase() });
    expect(userInDb).toBeDefined();
    expect(userInDb.isEmailVerified).toBe(false);
    expect(userInDb.emailVerificationToken).toBeDefined();
    expect(userInDb.emailVerificationToken.length).toBe(64); // SHA-256 hex string length
    expect(userInDb.emailVerificationExpires).toBeDefined();
    expect(userInDb.emailVerificationExpires.getTime()).toBeGreaterThan(Date.now());
  }, 30000);

  test("2. Unverified user login is blocked with HTTP 403 Forbidden and EMAIL_NOT_VERIFIED code", async () => {
    await expect(authService.loginUser({
      username: testEmail,
      password: testPassword,
      deviceInfo: "Jest Test Runner",
      ipAddress: "127.0.0.1"
    })).rejects.toMatchObject({
      status: 403,
      code: "EMAIL_NOT_VERIFIED",
      canResend: true
    });
  }, 30000);

  test("3. Rapid resend triggers rate limit (429), then succeeds after time window", async () => {
    // Immediate resend should be blocked
    await expect(authService.resendVerification(testEmail))
      .rejects.toMatchObject({ status: 429, code: "RESEND_TOO_SOON" });

    // Mock last sent time to 2 minutes ago
    await User.updateOne(
      { email: testEmail.toLowerCase() },
      { emailVerificationLastSentAt: new Date(Date.now() - 120000) }
    );

    const resendResult = await authService.resendVerification(testEmail);
    expect(resendResult.code).toBe("RESEND_SUCCESS");

    const userInDb = await User.findOne({ email: testEmail.toLowerCase() });
    expect(userInDb.emailVerificationLastSentAt).toBeDefined();
  }, 30000);

  test("4. Invalid or tampered token verification fails with TOKEN_INVALID", async () => {
    await expect(authService.verifyEmail("invalid_fake_token_1234567890"))
      .rejects.toMatchObject({
        status: 400,
        code: "TOKEN_INVALID"
      });
  }, 30000);
});
