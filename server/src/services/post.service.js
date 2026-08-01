const mongoose = require("mongoose");
const Post = require("../models/postModels");
const User = require("../models/userModel");
const NotificationService = require("./NotificationService");

const createPost = async (userId, data) => {
  const post = await Post.create({
    userId,
    media: data.media || [],
    caption: data.caption,
    location: data.location,
    hashtags: data.hashtags || [],
    visibility: data.visibility || "public",
    status: data.status || "published"
  });
  
  // Reward engagement score for posting
  await User.findByIdAndUpdate(userId, { $inc: { engagementScore: 1 } });
  
  return await Post.findById(post._id).populate("userId", "username displayName profilePicture isVerified");
};

const getAllPosts = async (currentUserId, limit = 20, skip = 0) => {
  const currentUser = await User.findById(currentUserId).select("following");
  const privateUsers = await User.find({
    isPrivate: true,
    _id: { $nin: [...currentUser.following, currentUser._id] }
  }).select("_id");
  const privateUserIds = privateUsers.map(u => u._id);

  return await Post.find({ 
    visibility: "public", 
    status: "published",
    userId: { $nin: privateUserIds }
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "username displayName profilePicture isVerified")
    .populate("comments.userId", "username displayName profilePicture isVerified");
};

const getPostById = async (id, currentUserId) => {
  const post = await Post.findById(id)
    .populate("userId", "username displayName profilePicture isVerified isPrivate")
    .populate("comments.userId", "username displayName profilePicture isVerified");
  if (!post) throw new Error("Post not found");

  if (post.userId.isPrivate && post.userId._id.toString() !== currentUserId) {
    const currentUser = await User.findById(currentUserId).select("following");
    if (!currentUser.following.includes(post.userId._id)) {
      const err = new Error("Post is from a private account you do not follow");
      err.status = 403;
      throw err;
    }
  }
  
  // Increment view count atomically
  post.viewCount += 1;
  await post.save({ validateBeforeSave: false }); // skip validation to just update count
  
  return post;
};

const deletePost = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  if (post.userId.toString() !== userId) {
    const err = new Error("Unauthorized");
    err.status = 403;
    throw err;
  }

  await post.deleteOne();
  return { message: "Post deleted successfully" };
};

const likePost = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  const isAlreadyLiked = post.likes.some(id => id.toString() === userId.toString());
  if (!isAlreadyLiked) {
    post.likes.push(userId);
    post.likeCount += 1;
    await post.save();
    
    // Reward original poster
    await User.findByIdAndUpdate(post.userId, { $inc: { engagementScore: 2 } });
    
    // Send Notification
    await NotificationService.createNotification({
      recipientId: post.userId,
      senderId: userId,
      type: "like",
      entityId: post._id,
      entityModel: "Post",
      body: "liked your post",
      deepLink: `/post/${post._id}`
    });

    return { message: "Post liked", likeCount: post.likeCount };
  } else {
    post.likes = post.likes.filter(id => id.toString() !== userId);
    post.likeCount -= 1;
    await post.save();
    
    await User.findByIdAndUpdate(post.userId, { $inc: { engagementScore: -2 } });
    return { message: "Post unliked", likeCount: post.likeCount };
  }
};

const addComment = async (postId, userId, text) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");

  const newComment = { userId, text };
  post.comments.push(newComment);
  post.commentCount += 1;
  await post.save();

  await User.findByIdAndUpdate(post.userId, { $inc: { engagementScore: 3 } });

  // Send Notification
  await NotificationService.createNotification({
    recipientId: post.userId,
    senderId: userId,
    type: "comment",
    entityId: post._id,
    entityModel: "Post",
    body: "commented on your post",
    deepLink: `/post/${post._id}`
  });

  // Return the newly added comment populated
  const savedPost = await Post.findById(postId).populate("comments.userId", "username displayName profilePicture isVerified");
  return savedPost.comments[savedPost.comments.length - 1];
};

const getPostsByUser = async (targetIdentifier, requestingUserId) => {
  let targetUser;
  if (mongoose.Types.ObjectId.isValid(targetIdentifier)) {
    targetUser = await User.findOne({ $or: [{ _id: targetIdentifier }, { usernameLower: String(targetIdentifier).toLowerCase() }] });
  } else {
    targetUser = await User.findOne({ usernameLower: String(targetIdentifier).toLowerCase() });
  }

  if (!targetUser) return [];

  const isSelf = requestingUserId && String(targetUser._id) === String(requestingUserId);
  const isFollower = requestingUserId && targetUser.followers && targetUser.followers.some(f => String(f._id || f) === String(requestingUserId));

  if (targetUser.isPrivate && !isSelf && !isFollower) {
    return [];
  }

  return await Post.find({ userId: targetUser._id, status: "published" })
    .sort({ createdAt: -1 })
    .populate("userId", "username displayName profilePicture isVerified");
};

const searchPosts = async (query, currentUserId) => {
  const currentUser = await User.findById(currentUserId).select("following");
  const privateUsers = await User.find({
    isPrivate: true,
    _id: { $nin: [...currentUser.following, currentUser._id] }
  }).select("_id");
  const privateUserIds = privateUsers.map(u => u._id);

  const q = query.toLowerCase();
  return await Post.find({
    $or: [
      { caption: { $regex: q, $options: "i" } },
      { hashtags: { $in: [q, `#${q}`] } }
    ],
    visibility: "public",
    status: "published",
    userId: { $nin: privateUserIds }
  })
    .sort({ createdAt: -1 })
    .populate("userId", "username displayName profilePicture isVerified");
};

const updatePost = async (postId, userId, data) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");
  if (post.userId.toString() !== userId) {
    const err = new Error("Unauthorized");
    err.status = 403;
    throw err;
  }
  
  if (data.caption !== undefined) post.caption = data.caption;
  if (data.location !== undefined) post.location = data.location;
  if (data.hashtags !== undefined) post.hashtags = data.hashtags;
  if (data.visibility !== undefined) post.visibility = data.visibility;
  if (data.media) post.media = data.media; // Or we can prevent editing media
  
  await post.save();
  return await Post.findById(postId).populate("userId", "username displayName profilePicture isVerified");
};

const savePost = async (postId, userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  
  const isSaved = user.savedPosts.includes(postId);
  if (isSaved) {
    user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
  } else {
    user.savedPosts.push(postId);
  }
  await user.save();
  return { message: isSaved ? "Post unsaved" : "Post saved", saved: !isSaved };
};

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
  return await Post.findById(postId).populate("comments.userId", "username displayName profilePicture isVerified");
};

const deleteComment = async (postId, commentId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");
  
  const comment = post.comments.id(commentId);
  if (!comment) throw new Error("Comment not found");
  if (comment.userId.toString() !== userId && post.userId.toString() !== userId) {
    const err = new Error("Unauthorized");
    err.status = 403;
    throw err;
  }
  
  post.comments.pull(commentId);
  post.commentCount -= 1;
  await post.save();
  return await Post.findById(postId).populate("comments.userId", "username displayName profilePicture isVerified");
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
  deleteComment
};
