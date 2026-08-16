const mongoose = require("mongoose");
const Post = require("../models/postModels");
const User = require("../models/userModel");
const Hashtag = require("../models/hashtagModel");
const NotificationService = require("./NotificationService");

// ─── Hashtag Extraction ─────────────────────────────────────────────────────
// - Case normalized to lowercase
// - Deduped
// - Max 30 hashtags, max 50 chars each
// - Supports basic Unicode letters
const extractHashtags = (caption) => {
  if (!caption || typeof caption !== "string") return [];
  const regex = /#([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)/g;
  const tags = new Set();
  let match;
  while ((match = regex.exec(caption)) !== null) {
    const tag = match[1].toLowerCase();
    if (tag.length >= 2 && tag.length <= 50) {
      tags.add(tag);
    }
    if (tags.size >= 30) break;
  }
  return Array.from(tags);
};

const VALID_VISIBILITY = ["public", "private", "followers", "unlisted"];

// ─── Create Post ────────────────────────────────────────────────────────────
const createPost = async (userId, data) => {
  // Extract hashtags from caption
  const captionHashtags = extractHashtags(data.caption);
  // Merge with explicitly provided hashtags (also normalize)
  const explicitTags = (data.hashtags || [])
    .map((t) => t.toLowerCase().replace(/^#/, ""))
    .filter((t) => t.length >= 2 && t.length <= 50);
  const allTags = [...new Set([...captionHashtags, ...explicitTags])].slice(0, 30);

  // Validate visibility
  const visibility = VALID_VISIBILITY.includes(data.visibility)
    ? data.visibility
    : "public";

  const post = await Post.create({
    userId,
    media: data.media || [],
    caption: data.caption,
    location: data.location,
    hashtags: allTags,
    visibility,
    status: data.status || "published",
  });

  // Update Hashtag collection
  if (allTags.length > 0) {
    const bulkOps = allTags.map((tag) => ({
      updateOne: {
        filter: { tag },
        update: { $inc: { postCount: 1 }, $set: { lastUsed: new Date() } },
        upsert: true,
      },
    }));
    try {
      await Hashtag.bulkWrite(bulkOps);
    } catch (err) {
      console.error("Hashtag upsert error:", err.message);
    }
  }

  // Reward engagement score for posting
  await User.findByIdAndUpdate(userId, { $inc: { engagementScore: 1 } });

  return await Post.findById(post._id).populate(
    "userId",
    "username displayName profilePicture isVerified"
  );
};

// ─── Get All Posts (public feed) ────────────────────────────────────────────
const getAllPosts = async (currentUserId, limit = 20, skip = 0) => {
  const currentUser = await User.findById(currentUserId).select("following");
  const privateUsers = await User.find({
    isPrivate: true,
    _id: { $nin: [...currentUser.following, currentUser._id] },
  }).select("_id");
  const privateUserIds = privateUsers.map((u) => u._id);

  return await Post.find({
    visibility: "public",
    status: "published",
    userId: { $nin: privateUserIds },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "username displayName profilePicture isVerified")
    .populate(
      "comments.userId",
      "username displayName profilePicture isVerified"
    );
};

// ─── Get Post By ID (with privacy enforcement) ─────────────────────────────
const getPostById = async (id, currentUserId) => {
  const post = await Post.findById(id)
    .populate(
      "userId",
      "username displayName profilePicture isVerified isPrivate followers"
    )
    .populate(
      "comments.userId",
      "username displayName profilePicture isVerified"
    );
  if (!post) throw new Error("Post not found");

  const isOwner =
    post.userId._id.toString() === currentUserId.toString();

  if (!isOwner) {
    const isFollower =
      post.userId.followers &&
      post.userId.followers.some(
        (f) => f.toString() === currentUserId.toString()
      );

    // Account-level privacy check
    if (post.userId.isPrivate && !isFollower) {
      const err = new Error(
        "Post is from a private account you do not follow"
      );
      err.status = 403;
      throw err;
    }

    // Post-level visibility check
    if (post.visibility === "private" && !isFollower) {
      const err = new Error("This post is private");
      err.status = 403;
      throw err;
    }
  }

  // Increment view count atomically
  post.viewCount += 1;
  await post.save({ validateBeforeSave: false });

  return post;
};

// ─── Delete Post ────────────────────────────────────────────────────────────
const deletePost = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  if (post.userId.toString() !== userId) {
    const err = new Error("Unauthorized");
    err.status = 403;
    throw err;
  }

  // Decrement hashtag counts
  if (post.hashtags && post.hashtags.length > 0) {
    const bulkOps = post.hashtags.map((tag) => ({
      updateOne: {
        filter: { tag },
        update: { $inc: { postCount: -1 } },
      },
    }));
    try {
      await Hashtag.bulkWrite(bulkOps);
    } catch (err) {
      console.error("Hashtag decrement error:", err.message);
    }
  }

  await post.deleteOne();
  return { message: "Post deleted successfully" };
};

// ─── Like Post ──────────────────────────────────────────────────────────────
const likePost = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  const isAlreadyLiked = post.likes.some(
    (id) => id.toString() === userId.toString()
  );
  if (!isAlreadyLiked) {
    post.likes.push(userId);
    post.likeCount += 1;
    await post.save();

    // Reward original poster
    await User.findByIdAndUpdate(post.userId, {
      $inc: { engagementScore: 2 },
    });

    // Send Notification
    await NotificationService.createNotification({
      recipientId: post.userId,
      senderId: userId,
      type: "like",
      entityId: post._id,
      entityModel: "Post",
      body: "liked your post",
      deepLink: `/post/${post._id}`,
    });

    return { message: "Post liked", likeCount: post.likeCount };
  } else {
    post.likes = post.likes.filter((id) => id.toString() !== userId);
    post.likeCount -= 1;
    await post.save();

    await User.findByIdAndUpdate(post.userId, {
      $inc: { engagementScore: -2 },
    });
    return { message: "Post unliked", likeCount: post.likeCount };
  }
};

// ─── Add Comment ────────────────────────────────────────────────────────────
const addComment = async (postId, userId, text) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  const newComment = { userId, text };
  post.comments.push(newComment);
  post.commentCount += 1;
  await post.save();

  await User.findByIdAndUpdate(post.userId, {
    $inc: { engagementScore: 3 },
  });

  // Send Notification
  await NotificationService.createNotification({
    recipientId: post.userId,
    senderId: userId,
    type: "comment",
    entityId: post._id,
    entityModel: "Post",
    body: "commented on your post",
    deepLink: `/post/${post._id}`,
  });

  // Return the newly added comment populated
  const savedPost = await Post.findById(postId).populate(
    "comments.userId",
    "username displayName profilePicture isVerified"
  );
  return savedPost.comments[savedPost.comments.length - 1];
};

// ─── Get Posts By User (with visibility filtering) ──────────────────────────
const getPostsByUser = async (targetIdentifier, requestingUserId) => {
  let targetUser;
  if (mongoose.Types.ObjectId.isValid(targetIdentifier)) {
    targetUser = await User.findOne({
      $or: [
        { _id: targetIdentifier },
        { usernameLower: String(targetIdentifier).toLowerCase() },
      ],
    });
  } else {
    targetUser = await User.findOne({
      usernameLower: String(targetIdentifier).toLowerCase(),
    });
  }

  if (!targetUser) return [];

  const isSelf =
    requestingUserId &&
    String(targetUser._id) === String(requestingUserId);
  const isFollower =
    requestingUserId &&
    targetUser.followers &&
    targetUser.followers.some(
      (f) => String(f._id || f) === String(requestingUserId)
    );

  // Private account: non-followers see nothing
  if (targetUser.isPrivate && !isSelf && !isFollower) {
    return [];
  }

  // Visibility filter: owner sees all, follower sees public+followers, others see public only
  const visibilityFilter = isSelf
    ? {}
    : isFollower
      ? { visibility: { $in: ["public", "followers"] } }
      : { visibility: "public" };

  return await Post.find({
    userId: targetUser._id,
    status: "published",
    ...visibilityFilter,
  })
    .sort({ createdAt: -1 })
    .populate("userId", "username displayName profilePicture isVerified");
};

// ─── Search Posts ───────────────────────────────────────────────────────────
const searchPosts = async (query, currentUserId) => {
  const currentUser = await User.findById(currentUserId).select("following");
  const privateUsers = await User.find({
    isPrivate: true,
    _id: { $nin: [...currentUser.following, currentUser._id] },
  }).select("_id");
  const privateUserIds = privateUsers.map((u) => u._id);

  const q = query.toLowerCase();
  return await Post.find({
    $or: [
      { caption: { $regex: q, $options: "i" } },
      { hashtags: { $in: [q, `#${q}`] } },
    ],
    visibility: "public",
    status: "published",
    userId: { $nin: privateUserIds },
  })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate("userId", "username displayName profilePicture isVerified");
};

// ─── Update Post ────────────────────────────────────────────────────────────
const updatePost = async (postId, userId, data) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");
  if (post.userId.toString() !== userId) {
    const err = new Error("Unauthorized");
    err.status = 403;
    throw err;
  }

  // Handle caption + hashtag re-extraction
  if (data.caption !== undefined) {
    post.caption = data.caption;
    // Re-extract hashtags from updated caption
    const newTags = extractHashtags(data.caption);
    if (data.hashtags) {
      const explicit = data.hashtags
        .map((t) => t.toLowerCase().replace(/^#/, ""))
        .filter((t) => t.length >= 2 && t.length <= 50);
      post.hashtags = [...new Set([...newTags, ...explicit])].slice(0, 30);
    } else {
      post.hashtags = newTags;
    }
  } else if (data.hashtags !== undefined) {
    post.hashtags = data.hashtags;
  }

  if (data.location !== undefined) post.location = data.location;
  if (data.visibility !== undefined) {
    post.visibility = VALID_VISIBILITY.includes(data.visibility)
      ? data.visibility
      : post.visibility;
  }
  if (data.media) post.media = data.media;

  await post.save();
  return await Post.findById(postId).populate(
    "userId",
    "username displayName profilePicture isVerified"
  );
};

// ─── Save Post ──────────────────────────────────────────────────────────────
const savePost = async (postId, userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const isSaved = user.savedPosts.includes(postId);
  if (isSaved) {
    user.savedPosts = user.savedPosts.filter(
      (id) => id.toString() !== postId
    );
  } else {
    user.savedPosts.push(postId);
  }
  await user.save();
  return {
    message: isSaved ? "Post unsaved" : "Post saved",
    saved: !isSaved,
  };
};

// ─── Edit Comment ───────────────────────────────────────────────────────────
const editComment = async (postId, commentId, userId, text) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  const comment = post.comments.id(commentId);
  if (!comment) throw new Error("Comment not found");
  if (comment.userId.toString() !== userId) {
    const err = new Error("Unauthorized");
    err.status = 403;
    throw err;
  }

  comment.text = text;
  await post.save();
  return await Post.findById(postId).populate(
    "comments.userId",
    "username displayName profilePicture isVerified"
  );
};

// ─── Delete Comment ─────────────────────────────────────────────────────────
const deleteComment = async (postId, commentId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  const comment = post.comments.id(commentId);
  if (!comment) throw new Error("Comment not found");
  if (
    comment.userId.toString() !== userId &&
    post.userId.toString() !== userId
  ) {
    const err = new Error("Unauthorized");
    err.status = 403;
    throw err;
  }

  post.comments.pull(commentId);
  post.commentCount -= 1;
  await post.save();
  return await Post.findById(postId).populate(
    "comments.userId",
    "username displayName profilePicture isVerified"
  );
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
  likePost,
  addComment,
  getPostsByUser,
  searchPosts,
  updatePost,
  savePost,
  editComment,
  deleteComment,
};
