import React, { useState } from "react";
import "./Post.css";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import { apiFetch } from "../../utils/api";
import { motion } from "framer-motion";
import ProfileImage from "../../img/profileImg.jpg";

const Post = ({ data, attribute }) => {
  const [liked, setLiked] = useState(attribute?.likes || 0);

  const url =
    attribute?.format === "image"
      ? `data:image/jpeg;base64,${attribute.image}`
      : "";

  const handleLikes = async () => {
    try {
      const response = await apiFetch(`/api/posts/like/${attribute._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const resp = await response.json();
        if (typeof resp.likes === "number") {
          setLiked(resp.likes);
        }
      }
    } catch (error) {
      console.error("Failed to update like:", error);
    }
  };

  const isLikedByUser = attribute?.likedUser?.includes(
    localStorage.getItem("userId")
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="post-card"
    >
      <div className="post-header">
        <div className="post-header-user">
          <div className="post-avatar">
             <img src={attribute?.profilePicture || ProfileImage} alt="Avatar" />
          </div>
          <div className="post-user-info">
            <span className="post-username">{attribute?.name || 'User'}</span>
            <span className="post-time">2h ago</span>
          </div>
        </div>
        <MoreHorizontal className="post-menu-icon" size={24} color="var(--color-text-muted)" />
      </div>

      {attribute?.format === "image" && (
        <div className="post-media-container">
          <img className="post-media" src={url} alt="Post media" />
        </div>
      )}

      <div className="post-actions-container">
        <div className="post-actions-left">
          <motion.div whileTap={{ scale: 0.8 }} onClick={handleLikes}>
            <Heart 
              size={28} 
              fill={isLikedByUser ? "var(--color-error)" : "none"} 
              color={isLikedByUser ? "var(--color-error)" : "var(--color-text)"}
              className="action-icon"
            />
          </motion.div>
          <MessageCircle size={28} color="var(--color-text)" className="action-icon" />
          <Share2 size={28} color="var(--color-text)" className="action-icon" />
        </div>
        <Bookmark size={28} color="var(--color-text)" className="action-icon" />
      </div>

      <div className="post-content">
        <span className="post-likes">{liked} likes</span>
        <div className="post-caption-container">
          <span className="post-caption-username">{attribute?.name || 'User'}</span>
          <span className="post-caption-text">{attribute?.desc}</span>
        </div>
        <span className="post-comments-preview">View all 12 comments</span>
        <span className="post-add-comment">Add a comment...</span>
      </div>
    </motion.div>
  );
};

export default Post;
