const express = require("express");
const { protect } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");
const storyController = require("../controllers/storyController");

const router = express.Router();

router.post("/", protect, upload.single("media"), storyController.createStory);
router.get("/", protect, storyController.getFeedStories);
router.get("/user/:userId", protect, storyController.getUserStories);
router.put("/:id/view", protect, storyController.markStoryAsViewed);
router.get("/:id/viewers", protect, storyController.getStoryViewers);
router.delete("/:id", protect, storyController.deleteStory);

module.exports = router;
