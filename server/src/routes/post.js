const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const postModel = require("../models/postModels");
const User = require("../models/userModel");

const app = express();

function generateRandomNumber() {
  return Math.floor(100000 + Math.random() * 900000);
}

const uploadsRoot = path.resolve(__dirname, "../uploads");

const ensureDirectory = async (directoryPath) => {
  await fs.mkdir(directoryPath, { recursive: true });
};

const sanitizeFileName = (value) =>
  String(value || "fsm-post")
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "fsm-post";

const createFileFromBase64 = async (base64Value, directoryPath, namePrefix) => {
  const [meta = "", encoded = ""] = String(base64Value || "").split(";base64,");
  const extensionMatch = meta.match(/data:(?:image|video)\/([a-zA-Z0-9.+-]+)/);
  const extension = extensionMatch?.[1]?.replace("jpeg", "jpg") || "bin";
  const fileName = `${sanitizeFileName(namePrefix)}-${generateRandomNumber()}.${extension}`;
  const filePath = path.join(directoryPath, fileName);

  await fs.writeFile(filePath, encoded, { encoding: "base64" });

  return filePath;
};

const extractMimeType = (base64Value, format) => {
  const [meta = ""] = String(base64Value || "").split(";base64,");
  const mimeMatch = meta.match(/^data:([^;]+)$/);
  if (mimeMatch?.[1]) {
    return mimeMatch[1];
  }

  return format === "video" ? "video/mp4" : "image/jpeg";
};

const detectMimeTypeFromFile = async (filePath, format) => {
  try {
    const handle = await fs.open(filePath, "r");
    const buffer = Buffer.alloc(16);
    await handle.read(buffer, 0, 16, 0);
    await handle.close();

    if (buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      return "image/png";
    }

    if (buffer.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
      return "image/jpeg";
    }

    if (buffer.slice(0, 6).toString("ascii") === "GIF87a" || buffer.slice(0, 6).toString("ascii") === "GIF89a") {
      return "image/gif";
    }

    if (buffer.slice(0, 4).toString("ascii") === "RIFF" && buffer.slice(8, 12).toString("ascii") === "WEBP") {
      return "image/webp";
    }

    if (buffer.slice(4, 8).toString("ascii") === "ftyp") {
      return format === "video" ? "video/mp4" : "application/octet-stream";
    }
  } catch (_) {}

  return format === "video" ? "video/mp4" : "image/jpeg";
};

const mapPostForClient = (post) => {
  const source = typeof post.toObject === "function" ? post.toObject() : post;
  const user = source.userId && typeof source.userId === "object" ? source.userId : null;
  return {
    _id: String(source._id),
    name:
      user?.displayName ||
      source.name ||
      `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
      "FSM User",
    username: user?.username || "fsm",
    desc: source.desc || "",
    likes: Number(source.likes || 0),
    liked: Boolean(source.liked),
    likedUser: Array.isArray(source.likedUser) ? source.likedUser : [],
    comments: Array.isArray(source.comments)
      ? source.comments.map((comment) => ({
          _id: String(comment._id),
          userId: String(comment.userId),
          userName: comment.userName,
          text: comment.text,
          createdAt: comment.createdAt,
        }))
      : [],
    format: source.format || "image",
    imageUrl: source.imgPath ? `/api/post/media/${String(source._id)}` : "",
    avatar: user?.img || "",
    userId: user?._id ? String(user._id) : String(source.userId || ""),
    createdAt: source.createdAt || null,
    updatedAt: source.updatedAt || null,
  };
};

const fetchPosts = async () => {
  const posts = await postModel
    .find()
    .sort({ createdAt: -1 })
    .populate("userId", "firstName lastName displayName username img");

  return posts.map(mapPostForClient);
};

app.get("/fetchAllPosts", async (req, res) => {
  try {
    const posts = await fetchPosts();
    res.status(200).json(posts);
  } catch (err) {
    console.log("Error ", err);
    res.status(500).send({ message: err.message || err });
  }
});

app.get("/all", async (req, res) => {
  try {
    const posts = await fetchPosts();
    res.status(200).json(posts);
  } catch (err) {
    console.log("Error ", err);
    res.status(500).send({ message: err.message || err });
  }
});

app.get("/media/:postId", async (req, res) => {
  try {
    const post = await postModel.findById(req.params.postId);
    if (!post || !post.imgPath) {
      return res.status(404).send("Media not found.");
    }

    const resolvedPath = path.resolve(post.imgPath);
    const mimeType = post.mimeType || (await detectMimeTypeFromFile(resolvedPath, post.format));

    res.setHeader("Cache-Control", "public, max-age=86400");
    res.type(mimeType);
    return res.sendFile(resolvedPath);
  } catch (err) {
    console.log("Error ", err);
    return res.status(500).send({ message: err.message || err });
  }
});

app.post("/upload", async (req, res) => {
  try {
    const imageBlob = req.body.images;
    const imageName = `${req.body.name || "FSM User"}`;
    const userId = req.body.userId;

    if (!imageBlob || !userId) {
      return res.status(400).send("Image and userId are required.");
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found.");
    }

    const uploadDir = path.join(uploadsRoot, "image");
    await ensureDirectory(uploadDir);
    const imagePath = await createFileFromBase64(imageBlob, uploadDir, imageName);

    const postdata = new postModel({
      imgPath: imagePath,
      name: user.displayName || imageName,
      format: "image",
      mimeType: extractMimeType(imageBlob, "image"),
      userId,
      desc: req.body.desc || "",
      likes: Number(req.body.likes || 0),
      liked: Boolean(req.body.liked),
    });
    await postdata.save();

    res.status(201).json(mapPostForClient(await postdata.populate("userId", "firstName lastName displayName username img")));
  } catch (err) {
    console.log("Error ", err);
    res.status(500).send({ message: err.message || err });
  }
});

app.post("/upload/video", async (req, res) => {
  try {
    const videoBlob = req.body.images;
    const imageName = `${req.body.name || "FSM User"}`;
    const userId = req.body.userId;

    if (!videoBlob || !userId) {
      return res.status(400).send("Video and userId are required.");
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found.");
    }

    const uploadDir = path.join(uploadsRoot, "video");
    await ensureDirectory(uploadDir);
    const videoPath = await createFileFromBase64(videoBlob, uploadDir, imageName);

    const postdata = new postModel({
      imgPath: videoPath,
      name: user.displayName || imageName,
      format: "video",
      mimeType: extractMimeType(videoBlob, "video"),
      desc: req.body.desc || "",
      likes: Number(req.body.likes || 0),
      liked: Boolean(req.body.liked),
      userId,
    });
    await postdata.save();

    res.status(201).json(mapPostForClient(await postdata.populate("userId", "firstName lastName displayName username img")));
  } catch (err) {
    console.log("Error ", err);
    res.status(500).send({ message: err.message || err });
  }
});

module.exports = app;
