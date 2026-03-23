import React, { useState } from "react";
import "./Post.css";
import Comment from "../../img/comment.png";
import Share from "../../img/share.png";
import Heart from "../../img/like.png";
import NotLike from "../../img/notlike.png";
import { apiFetch } from "../../utils/api";

const Post = ({ data, attribute }) => {
  const [liked, setLiked] = useState(attribute?.likes || 0);

  const url =
    attribute.format === "image"
      ? `data:image/jpeg;base64,${attribute.image}`
      : "";

  const handleLikes = async () => {
    console.log("Attributes", attribute);

    const formData = {
      _id: attribute._id,
      userId: localStorage.getItem("userId"),
    };

    try {
      const response = await apiFetch(`/api/posts/like/${attribute._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      console.log("like response", response);

      if (response.ok) {
        const resp = await response.json();
        console.log("Result : ", resp);
        // keep same functionality: update like count from server response if available
        if (typeof resp.likes === "number") {
          setLiked(resp.likes);
        }
      }
    } catch (error) {
      console.error("Failed to update like:", error);
    }
  };

  const isLikedByUser = attribute.likedUser?.includes(
    localStorage.getItem("userId")
  );

  return (
    <div className="Post">
      {attribute.format === "image" && (
        <img src={url} alt="imagePost" />
      )}

      <div className="postReact">
        <img
          src={isLikedByUser ? Heart : NotLike}
          alt="like"
          style={{ cursor: "pointer" }}
          onClick={handleLikes}
        />
        <img src={Comment} alt="" style={{ cursor: "pointer" }} />
        <img src={Share} alt="" style={{ cursor: "pointer" }} />
      </div>

      <span style={{ color: "var(--gray)", fontSize: "12px" }}>
        {liked} likes
      </span>

      <div className="detail">
        <span>
          <b>{attribute.name}</b>
        </span>
        <span> {attribute.desc === undefined ? "" : attribute.desc}</span>
      </div>
    </div>
  );
};

export default Post;
