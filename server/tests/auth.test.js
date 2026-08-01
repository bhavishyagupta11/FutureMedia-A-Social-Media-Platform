const request = require("supertest");
const app = require("../src/app");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../src/models/userModel");

let mongoServer;

describe("Auth API Endpoints", () => {
  beforeAll(async () => {
    process.env.EMAIL_MODE = "mock";
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  }, 30000);

  afterEach(async () => {
    await User.deleteMany({});
  });

  it("should register a new user successfully with isEmailVerified=false and no session token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        username: "testuser",
        email: "testuser@example.com",
        password: "Password123!"
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBeTruthy();
    expect(res.body.message).toBe("User registered successfully");
    expect(res.body.data.email).toBe("testuser@example.com");
    expect(res.body.data.isEmailVerified).toBe(false);
    expect(res.body.data.token).toBeUndefined();
  }, 30000);

  it("should enforce validation on register", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        username: "tu", // too short
        email: "notanemail",
        password: "123" // too short
      });

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBeFalsy();
    expect(res.body.errors).not.toBeNull();
  }, 30000);

  it("should fail on duplicate email with 409 Conflict", async () => {
    // First user
    await request(app).post("/api/v1/auth/register").send({
      username: "user1", email: "dup@example.com", password: "Password123!"
    });
    
    // Duplicate email
    const res = await request(app).post("/api/v1/auth/register").send({
      username: "user2", email: "dup@example.com", password: "Password123!"
    });

    expect(res.statusCode).toEqual(409);
    expect(res.body.success).toBeFalsy();
    expect(res.body.message).toContain("User already exists");
  }, 30000);

  it("should handle SMTP email dispatch on registration", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        username: "smtp_test",
        email: "smtp@example.com",
        password: "Password123!"
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBeTruthy();
    if (res.body.meta && res.body.meta.warning) {
      expect(res.body.meta.warning).toContain("SMTP");
    }
  }, 30000);
});
