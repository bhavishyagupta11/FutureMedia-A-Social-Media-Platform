import React, { useCallback, useEffect, useState } from "react";
import "./Posts.css";
import "../Post/Post.css";
import { PostsData } from "../../Data/PostsData";
import Comment from "../../img/comment.png";
import Share from "../../img/share.png";
import Heart from "../../img/like.png";
import NotLike from "../../img/notlike.png";
import ProfileImage from "../../img/profileImg.jpg";
import { apiFetch } from "../../utils/api";
import { getSessionUserId } from "../../utils/session";

const normalizePost = (post) => {
  const source = post || {};
  const id = source._id || `demo-${Math.random().toString(36).slice(2, 10)}`;

  return {
    _id: id,
    name: source.name || "FSM User",
    username: source.username || "fsm",
    desc: source.caption || source.desc || "",
    likes: Number(source.likes || 0),
    likedUser: Array.isArray(source.likedUser) ? source.likedUser : [],
    comments: Array.isArray(source.comments) ? source.comments : [],
    format: source.format || "text",
    imageUrl: source.imageUrl
      ? source.imageUrl.startsWith("/")
        ? `${process.env.REACT_APP_API_BASE_URL || "http://localhost:8080"}${source.imageUrl}`
        : source.imageUrl
      : "",
    avatar: source.avatar || source.img || ProfileImage,
    isDemo: Boolean(source.isDemo),
  };
};

const withDemoFallback = (realPosts) => {
  const normalizedRealPosts = Array.isArray(realPosts) ? realPosts : [];
  const demos = PostsData.map(normalizePost);

  if (normalizedRealPosts.length === 0) {
    return demos;
  }

  // Keep real posts first, then add demo posts so feed is never visually empty.
  return [...normalizedRealPosts, ...demos];
};

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [pendingActionId, setPendingActionId] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [commentMessage, setCommentMessage] = useState("");
  const [brokenMediaIds, setBrokenMediaIds] = useState({});
  const currentUserId = getSessionUserId();

  const showCommentMessage = (message) => {
    setCommentMessage(message);
    window.setTimeout(() => setCommentMessage(""), 2200);
  };

  const fetchPosts = useCallback(async ({ showLoader = false } = {}) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const response = await apiFetch("/api/posts/feed");
      if (!response.ok) {
        setPosts(withDemoFallback([]));
        return;
      }

      const converted = await response.json();
      if (!Array.isArray(converted) || converted.length === 0) {
        setPosts(withDemoFallback([]));
        return;
      }

      setPosts(withDemoFallback(converted.map(normalizePost)));
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setPosts(withDemoFallback([]));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchPosts({ showLoader: true });
  }, [fetchPosts]);

  useEffect(() => {
    const handlePostCreated = (event) => {
      const createdPost = event?.detail?.post;

      if (createdPost && createdPost._id) {
        const normalizedCreatedPost = normalizePost(createdPost);
        setPosts((current) => {
          const withoutSamePost = current.filter((item) => item._id !== normalizedCreatedPost._id);
          return [normalizedCreatedPost, ...withoutSamePost];
        });
        return;
      }

      fetchPosts();
    };

    window.addEventListener("post:created", handlePostCreated);
    return () => window.removeEventListener("post:created", handlePostCreated);
  }, [fetchPosts]);

  const handleLikes = async (post) => {
    const userId = getSessionUserId();

    if (post.isDemo || String(post._id).startsWith("demo-")) {
      setPosts((current) =>
        current.map((item) =>
          item._id === post._id ? { ...item, likes: item.likes + 1 } : item
        )
      );
      return;
    }

    try {
      setPendingActionId(`like-${post._id}`);
      const response = await apiFetch(`/api/posts/like/${post._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setPosts((current) =>
          current.map((item) =>
            item._id === post._id
              ? {
                  ...item,
                  likes: Number(updatedPost.likes || 0),
                  likedUser: Array.isArray(updatedPost.likedUser) ? updatedPost.likedUser : [],
                }
              : item
          )
        );
      }
    } catch (error) {
      console.error("Failed to update like:", error);
    } finally {
      setPendingActionId("");
    }
  };

  const handleCommentSubmit = async (post) => {
    const text = (commentDrafts[post._id] || "").trim();
    if (!text) {
      showCommentMessage("Write something before posting a comment.");
      return;
    }

    const userId = getSessionUserId();

    if (!userId) {
      showCommentMessage("Please log in again before commenting.");
      return;
    }

    if (post.isDemo || String(post._id).startsWith("demo-")) {
      setPosts((current) =>
        current.map((item) =>
          item._id === post._id
            ? {
                ...item,
                comments: [
                  ...(Array.isArray(item.comments) ? item.comments : []),
                  {
                    _id: `local-comment-${Date.now()}`,
                    userId,
                    userName: "You",
                    text,
                  },
                ],
              }
            : item
        )
      );
      setCommentDrafts((current) => ({ ...current, [post._id]: "" }));
      setOpenComments((current) => ({ ...current, [post._id]: true }));
      showCommentMessage("Comment added.");
      return;
    }

    try {
      setPendingActionId(`comment-${post._id}`);
      const response = await apiFetch(`/api/posts/comment/${post._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        showCommentMessage(payload?.error || "Unable to post comment right now.");
        return;
      }

      const updatedPost = await response.json();
      setPosts((current) =>
        current.map((item) =>
          item._id === post._id
            ? {
                ...item,
                comments: Array.isArray(updatedPost.comments) ? updatedPost.comments : item.comments,
              }
            : item
        )
      );
      setCommentDrafts((current) => ({ ...current, [post._id]: "" }));
      setOpenComments((current) => ({ ...current, [post._id]: true }));
      showCommentMessage("Comment posted.");
    } catch (error) {
      console.error("Failed to add comment:", error);
      showCommentMessage("Unable to post comment right now.");
    } finally {
      setPendingActionId("");
    }
  };

  const handleCommentDelete = async (post, comment) => {
    if (!comment?._id) {
      return;
    }

    if (String(comment._id).startsWith("local-comment-")) {
      setPosts((current) =>
        current.map((item) =>
          item._id === post._id
            ? {
                ...item,
                comments: (item.comments || []).filter((entry) => entry._id !== comment._id),
              }
            : item
        )
      );
      showCommentMessage("Comment removed.");
      return;
    }

    try {
      setPendingActionId(`delete-comment-${comment._id}`);
      const response = await apiFetch(
        `/api/posts/comment/${post._id}/${comment._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        showCommentMessage(payload?.error || "Unable to remove comment right now.");
        return;
      }

      const updatedPost = await response.json();
      setPosts((current) =>
        current.map((item) =>
          item._id === post._id
            ? {
                ...item,
                comments: Array.isArray(updatedPost.comments) ? updatedPost.comments : item.comments,
              }
            : item
        )
      );
      showCommentMessage("Comment removed.");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      showCommentMessage("Unable to remove comment right now.");
    } finally {
      setPendingActionId("");
    }
  };

  const handleShare = async (post) => {
    const shareText = `Check out ${post.name}'s post on FSM: ${post.desc || "New post"} `;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${post.name} on FSM`,
          text: shareText.trim(),
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText.trim());
      }

      setShareMessage(`Shared ${post.name}'s post.`);
      window.setTimeout(() => setShareMessage(""), 1800);
    } catch (error) {
      console.error("Failed to share post:", error);
    }
  };

  if (loading) {
    return (
      <div className="Posts">
        <div className="postsLoader">Loading your feed...</div>
      </div>
    );
  }

  return (
    <div className="Posts">
      {shareMessage ? <div className="postsLoader">{shareMessage}</div> : null}
      {commentMessage ? <div className="postsLoader">{commentMessage}</div> : null}
      {posts.map((post) => {
        const isLikedByUser = post.likedUser?.includes(currentUserId);
        const isCommentOpen = Boolean(openComments[post._id]);
        const commentCount = post.comments?.length || 0;
        const hasBrokenMedia = Boolean(brokenMediaIds[post._id]);

        return (
          <div className="Post" key={post._id}>
            <div className="postHeader">
              <img src={post.avatar || ProfileImage} alt={post.name} className="postAvatar" />
              <div>
                <span className="postName">{post.name}</span>
                <span className="postUser">@{post.username}</span>
              </div>
            </div>

            {post.format === "image" && post.imageUrl && !hasBrokenMedia ? (
              <img
                src={post.imageUrl}
                alt="post"
                onError={() =>
                  setBrokenMediaIds((current) => ({ ...current, [post._id]: true }))
                }
              />
            ) : null}
            {post.format === "video" && post.imageUrl && !hasBrokenMedia ? (
              <video src={post.imageUrl} controls className="postVideo">
                Your browser does not support the video tag.
              </video>
            ) : null}
            {post.imageUrl && hasBrokenMedia ? (
              <div className="postMediaFallback">
                This media could not be loaded.
              </div>
            ) : null}

            {post.desc ? <p className="postDesc">{post.desc}</p> : null}

            <div className="postReact">
              <img
                src={isLikedByUser ? Heart : NotLike}
                alt="like"
                style={{ cursor: "pointer" }}
                onClick={() => handleLikes(post)}
              />
              <img
                src={Comment}
                alt="comment"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  setOpenComments((current) => ({ ...current, [post._id]: !isCommentOpen }))
                }
              />
              <img
                src={Share}
                alt="share"
                style={{ cursor: "pointer" }}
                onClick={() => handleShare(post)}
              />
            </div>

            <div className="postMetaRow">
              <span className="postLikes">{post.likes} likes</span>
              <span className="postLikes">{commentCount} comments</span>
            </div>

            {isCommentOpen ? (
              <div className="postComments">
                <div className="commentComposer">
                  <input
                    type="text"
                    value={commentDrafts[post._id] || ""}
                    onChange={(event) =>
                      setCommentDrafts((current) => ({
                        ...current,
                        [post._id]: event.target.value,
                      }))
                    }
                    placeholder="Write a comment..."
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleCommentSubmit(post);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="button commentButton"
                    disabled={pendingActionId === `comment-${post._id}`}
                    onClick={() => handleCommentSubmit(post)}
                  >
                    {pendingActionId === `comment-${post._id}` ? "Posting..." : "Comment"}
                  </button>
                </div>

                {commentCount > 0 ? (
                  <div className="commentList">
                    {post.comments.map((comment) => (
                      <div className="commentItem" key={comment._id}>
                        <div className="commentItemTop">
                          <strong>{comment.userName}</strong>
                          {String(comment.userId || "") === String(currentUserId) ||
                          String(comment._id).startsWith("local-comment-") ? (
                            <button
                              type="button"
                              className="commentDeleteButton"
                              disabled={pendingActionId === `delete-comment-${comment._id}`}
                              onClick={() => handleCommentDelete(post, comment)}
                            >
                              {pendingActionId === `delete-comment-${comment._id}` ? "Removing..." : "Remove"}
                            </button>
                          ) : null}
                        </div>
                        <span>{comment.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="emptyComments">No comments yet. Start the conversation.</div>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default Posts;
