const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");

router.get("/", auth, userController.getAllUsers);
router.get("/search", auth, userController.searchUsers);
router.get("/:id", auth, userController.getUser);
router.put("/:id/profile", auth, userController.updateProfile);
router.post("/follow/:id", auth, userController.followUser);
router.post("/unfollow/:id", auth, userController.unfollowUser);

module.exports = router;
