const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const auth = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

router.post("/", auth, upload.single("image"), postController.createPost);
router.get("/feed", auth, postController.getFeed);
router.get("/user/:id", auth, postController.getUserPosts);
router.post("/like/:id", auth, postController.likePost);
router.post("/comment/:id", auth, postController.commentPost);
router.delete("/comment/:postId/:commentId", auth, postController.deleteComment);

module.exports = router;
