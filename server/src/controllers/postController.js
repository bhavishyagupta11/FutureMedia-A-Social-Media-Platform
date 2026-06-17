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

    const author = await User.findById(req.user.id).select("username displayName profilePicture");

    const newPost = await Post.create({
      userId: req.user.id,
      imageUrl,
      caption: caption || "",
    });

    const populated = await Post.findById(newPost._id)
      .populate("userId", "username displayName profilePicture")
      .populate("comments.userId", "username displayName profilePicture");

    res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error creating post" });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const ids = [...currentUser.following, req.user.id]; // own + followed

    const posts = await Post.find({ userId: { $in: ids } })
      .sort({ createdAt: -1 })
      .populate("userId", "username displayName profilePicture")
      .populate("comments.userId", "username displayName profilePicture");

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
      .populate("userId", "username displayName profilePicture")
      .populate("comments.userId", "username displayName profilePicture");

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching user posts" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this post" });
    }
    await post.deleteOne();
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error deleting post" });
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
      res.status(200).json({ message: "Post liked", liked: true });
    } else {
      await post.updateOne({ $pull: { likes: req.user.id } });
      res.status(200).json({ message: "Post unliked", liked: false });
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

    const comment = { userId: req.user.id, text };

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: comment } },
      { new: true }
    )
      .populate("userId", "username displayName profilePicture")
      .populate("comments.userId", "username displayName profilePicture");

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error commenting on post" });
  }
};

exports.likeComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const userId = req.user.id;
    if (!comment.likes.includes(userId)) {
      comment.likes.push(userId);
    } else {
      comment.likes = comment.likes.filter((id) => id.toString() !== userId);
    }
    await post.save();
    res.status(200).json({ message: "Comment like toggled", likes: comment.likes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error liking comment" });
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
