const postService = require("../services/post.service");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/responseHandler");

exports.createPost = asyncHandler(async (req, res) => {
  let media = [];
  if (req.files && req.files.length > 0) {
    media = req.files.map(file => ({
      url: file.path && file.path.startsWith("http") ? file.path : `/uploads/${file.filename}`,
      type: file.mimetype.startsWith('video') ? 'video' : 'image',
      provider: file.path && file.path.startsWith("http") ? "cloudinary" : "local"
    }));
  }
  
  const postData = { ...req.body, media };
  const result = await postService.createPost(req.user.id, postData);
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

exports.updatePost = asyncHandler(async (req, res) => {
  const result = await postService.updatePost(req.params.id, req.user.id, req.body);
  return successResponse(res, 200, "Post updated", result);
});

exports.savePost = asyncHandler(async (req, res) => {
  const result = await postService.savePost(req.params.id, req.user.id);
  return successResponse(res, 200, "Post saved/unsaved", result);
});

exports.editComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const result = await postService.editComment(req.params.id, req.params.commentId, req.user.id, text);
  return successResponse(res, 200, "Comment updated", result);
});

exports.deleteComment = asyncHandler(async (req, res) => {
  const result = await postService.deleteComment(req.params.id, req.params.commentId, req.user.id);
  return successResponse(res, 200, "Comment deleted", result);
});
