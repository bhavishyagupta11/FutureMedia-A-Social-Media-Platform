const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const auth = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

router.post("/", auth, (req, res, next) => {
  upload.single("image")(req, res, function (err) {
    if (err) {
      console.error("Cloudinary upload error:", err.message);
      return res.status(500).json({ error: "Cloudinary upload error: " + err.message + ". Please verify your Cloudinary keys!" });
    }
    next();
  });
}, postController.createPost);
router.get("/feed", auth, postController.getFeed);
router.get("/user/:id", auth, postController.getUserPosts);
router.post("/like/:id", auth, postController.likePost);
router.post("/comment/:id", auth, postController.commentPost);
router.delete("/comment/:postId/:commentId", auth, postController.deleteComment);

module.exports = router;
