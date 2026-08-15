const Post = require("../models/postModels");
const User = require("../models/userModel");
const Hashtag = require("../models/hashtagModel");

class FeedService {
  /**
   * Generates a weighted chronological feed for the home page.
   * Shows posts from followed users + own posts.
   * Scoring: Likes ×2, Comments ×3, Shares ×5, Views ×0.1
   */
  async getFeed(userId, limit = 10, cursor = null) {
    const currentUser = await User.findById(userId).select("following");
    const ids = [...currentUser.following, userId];

    const query = {
      userId: { $in: ids },
      visibility: { $in: ["public", "followers"] },
      status: "published",
    };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "username displayName profilePicture isVerified");

    // Lightweight weighting (reordering the chronological slice slightly)
    const weightedPosts = posts.map((post) => {
      const score =
        (post.likeCount || 0) * 2 +
        (post.commentCount || 0) * 3 +
        (post.shareCount || 0) * 5 +
        (post.viewCount || 0) * 0.1;
      return { ...post.toObject(), feedScore: score };
    });

    // Re-sort the current batch by weight
    weightedPosts.sort((a, b) => b.feedScore - a.feedScore);

    const nextCursor =
      posts.length > 0 ? posts[posts.length - 1].createdAt : null;

    return { posts: weightedPosts, nextCursor };
  }

  /**
   * Explore feed with weighted ranking and creator diversity.
   *
   * Scoring formula:
   *   exploreScore = likes × 2 + comments × 3 + views × 0.1 + shares × 4 + recencyBoost
   *   recencyBoost = 100 / sqrt(ageInHours)  — recent content gets significant boost
   *
   * Diversity: max 2 posts per creator in final results.
   * Excludes current user's own posts and private-account posts from non-followed users.
   */
  async getExploreFeed(userId, limit = 20, skip = 0) {
    const currentUser = await User.findById(userId).select("following");

    const privateUsers = await User.find({
      isPrivate: true,
      _id: { $nin: [...currentUser.following, currentUser._id] },
    }).select("_id");

    const privateUserIds = privateUsers.map((u) => u._id);

    // Fetch more than needed to allow for diversity filtering
    const fetchLimit = Math.max(limit * 3, 60);

    const posts = await Post.find({
      visibility: "public",
      status: "published",
      userId: { $nin: [...privateUserIds, userId] },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(fetchLimit)
      .populate("userId", "username displayName profilePicture isVerified");

    // Score and rank
    const now = Date.now();
    const scored = posts.map((post) => {
      const p = post.toObject();
      const ageHours = Math.max(
        1,
        (now - new Date(p.createdAt).getTime()) / (1000 * 60 * 60)
      );
      const recencyBoost = Math.max(0, 100 / Math.sqrt(ageHours));

      p.exploreScore =
        (p.likeCount || 0) * 2 +
        (p.commentCount || 0) * 3 +
        (p.viewCount || 0) * 0.1 +
        (p.shareCount || 0) * 4 +
        recencyBoost;

      return p;
    });

    // Sort by explore score
    scored.sort((a, b) => b.exploreScore - a.exploreScore);

    // Apply creator diversity: max 2 posts per creator
    const creatorCounts = {};
    const diverse = [];
    for (const post of scored) {
      const creatorId =
        post.userId?._id?.toString() || post.userId?.toString();
      if (!creatorId) continue;
      creatorCounts[creatorId] = (creatorCounts[creatorId] || 0) + 1;
      if (creatorCounts[creatorId] <= 2) {
        diverse.push(post);
      }
      if (diverse.length >= limit) break;
    }

    return diverse;
  }

  /**
   * Dynamic trending hashtags based on real post data.
   *
   * Scoring formula:
   *   trendScore = recentPosts(24h) × 5
   *              + totalPosts(window) × 1
   *              + totalLikes × 0.5
   *              + totalComments × 1
   *              + uniqueUsers × 2
   *
   * Time window: configurable (default 7 days).
   * Falls back to Hashtag model if insufficient aggregation data.
   */
  async getTrendingHashtags(limit = 15, timeWindowDays = 7) {
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - timeWindowDays * 24 * 60 * 60 * 1000
    );
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Aggregate from actual posts within time window
    const trendingAgg = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: windowStart },
          visibility: "public",
          status: "published",
          hashtags: { $exists: true, $ne: [] },
        },
      },
      { $unwind: "$hashtags" },
      {
        $group: {
          _id: "$hashtags",
          totalPosts: { $sum: 1 },
          recentPosts: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", oneDayAgo] }, 1, 0],
            },
          },
          totalLikes: { $sum: "$likeCount" },
          totalComments: { $sum: "$commentCount" },
          uniqueUsers: { $addToSet: "$userId" },
          latestPost: { $max: "$createdAt" },
        },
      },
      {
        $addFields: {
          uniqueUserCount: { $size: "$uniqueUsers" },
          trendScore: {
            $add: [
              { $multiply: ["$recentPosts", 5] },
              { $multiply: ["$totalPosts", 1] },
              { $multiply: ["$totalLikes", 0.5] },
              { $multiply: ["$totalComments", 1] },
              { $multiply: [{ $size: "$uniqueUsers" }, 2] },
            ],
          },
        },
      },
      { $sort: { trendScore: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          tag: "$_id",
          postCount: "$totalPosts",
          recentPosts: 1,
          trendScore: 1,
          uniqueUsers: "$uniqueUserCount",
          latestPost: 1,
        },
      },
    ]);

    // If not enough data from aggregation, supplement from Hashtag model
    if (trendingAgg.length < limit) {
      const existingTags = trendingAgg.map((t) => t.tag);
      const supplement = await Hashtag.find({
        tag: { $nin: existingTags },
        postCount: { $gt: 0 },
      })
        .sort({ postCount: -1, lastUsed: -1 })
        .limit(limit - trendingAgg.length)
        .lean();

      supplement.forEach((h) => {
        trendingAgg.push({
          tag: h.tag,
          postCount: h.postCount,
          recentPosts: 0,
          trendScore: h.postCount,
          uniqueUsers: 0,
          latestPost: h.lastUsed,
        });
      });
    }

    return trendingAgg;
  }
}

module.exports = new FeedService();
