const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

router.get("/", auth, userController.getAllUsers);
router.get("/search", auth, userController.searchUsers);
router.get("/suggestions", auth, userController.getSuggestedUsers);
router.get("/:id", auth, userController.getUser);
router.put(
  "/:id/profile",
  auth,
  (req, res, next) => {
    upload.single("profilePicture")(req, res, function (err) {
      if (err) {
        return res.status(500).json({ error: "Image upload error: " + err.message });
      }
      next();
    });
  },
  userController.updateProfile
);
router.post("/follow/:id", auth, userController.followUser);
router.post("/unfollow/:id", auth, userController.unfollowUser);

module.exports = router;
