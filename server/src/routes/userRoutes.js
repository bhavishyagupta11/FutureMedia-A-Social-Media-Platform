const express = require("express");
const { protect, optionalAuth } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");
const { roleMiddleware } = require("../middleware/role");
const {
  getProfile,
  updateProfile,
  searchUsers,
  getSuggestedUsers,
  followUser,
  unfollowUser,
  acceptFollowRequest,
  rejectFollowRequest,
  getAllUsers,
} = require("../controllers/userController");

const router = express.Router();

router.get("/search", optionalAuth, searchUsers);
router.get("/suggested", protect, getSuggestedUsers);
router.get("/suggestions", protect, getSuggestedUsers);

router.post("/follow-requests/:requesterId/accept", protect, acceptFollowRequest);
router.post("/follow-requests/:requesterId/reject", protect, rejectFollowRequest);

// Ensure /me hits getProfile but is protected
router.get("/me", protect, getProfile);

router.route("/:id")
  .get(getProfile);
  
router.put("/:id/profile", protect, upload.single("profilePicture"), updateProfile);
router.put("/:id", protect, upload.single("profilePicture"), updateProfile);
  
router.post("/:id/follow", protect, followUser);
router.post("/:id/unfollow", protect, unfollowUser);
router.get("/", protect, roleMiddleware("admin", "superadmin"), getAllUsers);

router.put("/:id/settings", protect, require("../controllers/userController").updateSettings);
router.put("/:id/password", protect, require("../controllers/userController").changePassword);
router.delete("/:id", protect, require("../controllers/userController").deleteAccount);

module.exports = router;
