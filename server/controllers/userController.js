const User = require("../models/userModel");

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -__v");
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

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error updating user" });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.q || "";
    const users = await User.find({ username: { $regex: query, $options: "i" } }).select("-password");
    res.status(200).json({ users, posts: [] });
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
