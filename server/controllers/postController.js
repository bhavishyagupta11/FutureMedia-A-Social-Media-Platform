const Post = require("../models/postModels");
const User = require("../models/userModel");

exports.createPost = async (req, res) => {
  try {
    const { caption } = req.body;
    let imageUrl = "";

    if (req.file && req.file.path) {
      imageUrl = req.file.path;
    } else {
      return res.status(400).json({ error: "Image is required" });
    }

    const newPost = await Post.create({
      userId: req.user.id,
      imageUrl,
      caption: caption || "",
    });

    res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error creating post" });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const followingIds = currentUser.following;

    // Get posts from followed users, sort by newest
    const posts = await Post.find({ userId: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .populate("userId", "username profilePicture")
      .populate("comments.userId", "username profilePicture");

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching feed" });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.id })
      .sort({ createdAt: -1 })
      .populate("userId", "username profilePicture")
      .populate("comments.userId", "username profilePicture");

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching user posts" });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (!post.likes.includes(req.user.id)) {
      await post.updateOne({ $push: { likes: req.user.id } });
      res.status(200).json({ message: "Post liked" });
    } else {
      await post.updateOne({ $pull: { likes: req.user.id } });
      res.status(200).json({ message: "Post unliked" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error liking post" });
  }
};

exports.commentPost = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comment = {
      userId: req.user.id,
      text,
    };

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: comment } },
      { new: true }
    ).populate("comments.userId", "username profilePicture");

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error commenting on post" });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    post.comments = post.comments.filter(
      (c) => c._id.toString() !== req.params.commentId
    );
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error deleting comment" });
  }
};
