const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../models/userModel");
const Post = require("../models/postModels");
const Story = require("../models/storyModel");
const Hashtag = require("../models/hashtagModel");
const seedDatabase = require("../database/seedDatabase");
const userService = require("../services/user.service");

let mongoServer;

describe("FutureMedia Seeder & Feature Verification Tests", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  }, 30000);

  test("1. seedDatabase runs idempotently and populates official users", async () => {
    await seedDatabase();

    const userCount = await User.countDocuments();
    expect(userCount).toBeGreaterThanOrEqual(6);

    const snehil = await User.findOne({ username: "snehilkhokhar" });
    expect(snehil).toBeDefined();
    expect(snehil.displayName).toBe("Snehil Khokhar");
    expect(snehil.email).toBe("snehilkhokhar@gmail.com");

    const postsCount = await Post.countDocuments();
    expect(postsCount).toBeGreaterThanOrEqual(6);

    const storiesCount = await Story.countDocuments();
    expect(storiesCount).toBeGreaterThanOrEqual(5);

    const hashtagCount = await Hashtag.countDocuments();
    expect(hashtagCount).toBeGreaterThanOrEqual(4);

    // Re-run seeder to verify idempotence
    await seedDatabase();
    const userCountAfter = await User.countDocuments();
    expect(userCountAfter).toBe(userCount);
  }, 30000);

  test("2. Username update enforces uniqueness and formatting", async () => {
    const snehil = await User.findOne({ username: "snehilkhokhar" });
    const sahil = await User.findOne({ username: "sahilsingh" });

    // Attempting to change snehil's username to sahil's username should reject
    await expect(
      userService.updateProfile(snehil._id, { username: "sahilsingh" })
    ).rejects.toThrow("Username is already taken");

    // Attempting to use invalid characters
    await expect(
      userService.updateProfile(snehil._id, { username: "invalid name with spaces!" })
    ).rejects.toThrow();

    // Valid update
    const updated = await userService.updateProfile(snehil._id, {
      username: "snehil_updated",
      bio: "Updated street photography bio."
    });
    expect(updated.username).toBe("snehil_updated");
    expect(updated.bio).toBe("Updated street photography bio.");

    // Restore original username
    await userService.updateProfile(snehil._id, { username: "snehilkhokhar" });
  }, 30000);

  test("3. Hashtags are extracted, normalized and case-insensitive", async () => {
    const postService = require("../services/post.service");
    const snehil = await User.findOne({ username: "snehilkhokhar" });

    const newPost = await postService.createPost(snehil._id, {
      caption: "Testing #Photography and #FUTUREMEDIA and #photography duplicate tag.",
      visibility: "public"
    });

    expect(newPost.hashtags).toContain("photography");
    expect(newPost.hashtags).toContain("futuremedia");
    expect(newPost.hashtags.filter(h => h === "photography").length).toBe(1);

    const hashtagDoc = await Hashtag.findOne({ tag: "photography" });
    expect(hashtagDoc).toBeDefined();
    expect(hashtagDoc.postCount).toBeGreaterThanOrEqual(1);
  }, 30000);
});
