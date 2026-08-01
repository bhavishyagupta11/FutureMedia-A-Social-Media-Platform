const express = require("express");
const { protect } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");
const postController = require("../controllers/postController");

const router = express.Router();

router.route("/")
  .post(protect, upload.any(), postController.createPost)
  .get(protect, postController.getAllPosts);

router.get("/search", protect, postController.searchPosts);
router.get("/feed", protect, postController.getAllPosts);
router.get("/timeline", protect, postController.getAllPosts);

router.get("/user/:userId", protect, postController.getUserPosts);

router.route("/:id")
  .get(protect, postController.getPostById)
  .put(protect, postController.updatePost)
  .delete(protect, postController.deletePost);

router.put("/:id/like", protect, postController.likePost);
router.put("/:id/save", protect, postController.savePost);

router.post("/:id/comment", protect, postController.addComment);
router.put("/:id/comment/:commentId", protect, postController.editComment);
router.delete("/comment/:id/:commentId", protect, postController.deleteComment);

module.exports = router;
