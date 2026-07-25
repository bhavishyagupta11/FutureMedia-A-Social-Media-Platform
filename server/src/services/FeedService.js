const Post = require("../models/postModels");
const User = require("../models/userModel");

class FeedService {
  /**
   * Generates a weighted chronological feed.
   * AI/ML is explicitly omitted in Phase 2.
   */
  async getFeed(userId, limit = 10, cursor = null) {
    const currentUser = await User.findById(userId).select("following");
    const ids = [...currentUser.following, userId];

    const query = { 
      userId: { $in: ids },
      visibility: { $in: ["public", "followers"] },
      status: "published"
    };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 }) // Base chronological
      .limit(limit)
      .populate("userId", "username displayName profilePicture isVerified");

    // Lightweight weighting (reordering the chronological slice slightly)
    // Weights: Likes +2, Comments +3, Shares +5, Views +0.1
    const weightedPosts = posts.map(post => {
      const score = (post.likeCount * 2) + (post.commentCount * 3) + (post.shareCount * 5) + (post.viewCount * 0.1);
      return { ...post.toObject(), feedScore: score };
    });

    // Re-sort the current batch by weight
    weightedPosts.sort((a, b) => b.feedScore - a.feedScore);

    const nextCursor = posts.length > 0 ? posts[posts.length - 1].createdAt : null;

    return { posts: weightedPosts, nextCursor };
  }

  async getExploreFeed(userId, limit = 20) {
    const currentUser = await User.findById(userId).select("following");
    
    // Find users who are private and NOT followed by currentUser
    const privateUsers = await User.find({
      isPrivate: true,
      _id: { $nin: [...currentUser.following, currentUser._id] }
    }).select("_id");
    
    const privateUserIds = privateUsers.map(u => u._id);

    const posts = await Post.find({ 
      visibility: "public", 
      status: "published",
      userId: { $nin: privateUserIds }
    })
      .sort({ createdAt: -1, likeCount: -1 })
      .limit(limit)
      .populate("userId", "username displayName profilePicture isVerified");
    return posts;
  }
}

module.exports = new FeedService();
