const User = require("../models/userModel");

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -__v")
      .populate("followers", "username displayName profilePicture")
      .populate("following", "username displayName profilePicture");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching user" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -__v");
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching users" });
  }
};

exports.getSuggestedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select("following");
    const excludeIds = [...currentUser.following, req.user.id];

    const suggested = await User.find({ _id: { $nin: excludeIds } })
      .select("username displayName profilePicture bio")
      .limit(6);

    res.status(200).json(suggested);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching suggested users" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { displayName, bio, website } = req.body;
    const updateData = {};

    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;

    // Handle profile picture upload via Cloudinary (from multer middleware)
    if (req.file && req.file.path) {
      updateData.profilePicture = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select("-password -__v");

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error updating profile" });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.q || "";
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { displayName: { $regex: query, $options: "i" } },
      ],
      _id: { $ne: req.user.id },
    }).select("-password -__v").limit(10);
    res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error searching users" });
  }
};

exports.followUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!currentUser.following.includes(req.params.id)) {
      await currentUser.updateOne({ $push: { following: req.params.id } });
      await targetUser.updateOne({ $push: { followers: req.user.id } });
      res.status(200).json({ message: "User followed successfully" });
    } else {
      res.status(400).json({ error: "You are already following this user" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error following user" });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: "You cannot unfollow yourself" });
    }

    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (currentUser.following.includes(req.params.id)) {
      await currentUser.updateOne({ $pull: { following: req.params.id } });
      await targetUser.updateOne({ $pull: { followers: req.user.id } });
      res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      res.status(400).json({ error: "You are not following this user" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error unfollowing user" });
  }
};
