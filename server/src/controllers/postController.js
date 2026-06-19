const postService = require("../services/post.service");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/responseHandler");

exports.createPost = asyncHandler(async (req, res) => {
  const result = await postService.createPost(req.user.id, req.body);
  return successResponse(res, 201, "Post created", result);
});

exports.getAllPosts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = parseInt(req.query.skip, 10) || 0;
  const result = await postService.getAllPosts(limit, skip);
  return successResponse(res, 200, "Posts fetched", result);
});

exports.getPostById = asyncHandler(async (req, res) => {
  const result = await postService.getPostById(req.params.id);
  return successResponse(res, 200, "Post fetched", result);
});

exports.deletePost = asyncHandler(async (req, res) => {
  const result = await postService.deletePost(req.params.id, req.user.id);
  return successResponse(res, 200, "Post deleted", result);
});

exports.likePost = asyncHandler(async (req, res) => {
  const result = await postService.likePost(req.params.id, req.user.id);
  return successResponse(res, 200, "Post liked/unliked", result);
});

exports.addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const result = await postService.addComment(req.params.id, req.user.id, text);
  return successResponse(res, 201, "Comment added", result);
});

exports.getUserPosts = asyncHandler(async (req, res) => {
  const result = await postService.getPostsByUser(req.params.userId);
  return successResponse(res, 200, "User posts fetched", result);
});

exports.searchPosts = asyncHandler(async (req, res) => {
  const { query } = req.query;
  const result = await postService.searchPosts(query);
  return successResponse(res, 200, "Posts search results", result);
});
