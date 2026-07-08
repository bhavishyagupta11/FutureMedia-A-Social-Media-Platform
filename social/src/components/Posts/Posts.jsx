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
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const normalizePost = (post) => {
  const source = post || {};
  const id = source._id || `demo-${Math.random().toString(36).slice(2, 10)}`;
  const userId = source.userId || {};
  const name = userId.displayName || userId.username || source.name || "FSM User";
  const username = userId.username || source.username || "fsm";
  const avatar = userId.profilePicture || source.avatar || source.img || ProfileImage;
  const ownerId = userId._id || source.userId || "";

  const mediaArray = Array.isArray(source.media) ? source.media : [];
  const primaryMedia = mediaArray.length > 0 ? mediaArray[0] : null;
  const rawImageUrl = primaryMedia ? primaryMedia.url : source.imageUrl;

  return {
    _id: id,
    ownerId,
    name,
    username,
    desc: source.caption || source.desc || "",
    likes: Array.isArray(source.likes) ? source.likes : [],
    comments: Array.isArray(source.comments) ? source.comments : [],
    format: primaryMedia ? primaryMedia.type : source.format || "image",
    mediaArray: mediaArray.map(m => {
      const url = m.url;
      return url.startsWith("/") ? `${process.env.REACT_APP_API_BASE_URL || "http://localhost:8080"}${url}` : url;
    }),
    imageUrl: rawImageUrl
      ? rawImageUrl.startsWith("/")
        ? `${process.env.REACT_APP_API_BASE_URL || "http://localhost:8080"}${rawImageUrl}`
        : rawImageUrl
      : "",
    avatar,
    isDemo: Boolean(source.isDemo),
    createdAt: source.createdAt || new Date().toISOString(),
  };
};

const withDemoFallback = (realPosts) => {
  const normalized = Array.isArray(realPosts) ? realPosts : [];
  if (normalized.length === 0) return PostsData.map(normalizePost);
  return normalized;
};

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [pendingActionId, setPendingActionId] = useState("");
  const [brokenMediaIds, setBrokenMediaIds] = useState({});
  const [doubleClickLikeId, setDoubleClickLikeId] = useState(null);
  const currentUserId = getSessionUserId();
  const navigate = useNavigate();

  const fetchPosts = useCallback(async ({ showLoader = false } = {}) => {
    if (showLoader) setLoading(true);
    try {
      const response = await apiFetch("/api/v1/posts/feed");
      if (!response.ok) { setPosts(withDemoFallback([])); return; }
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) { setPosts(withDemoFallback([])); return; }
      setPosts(withDemoFallback(data.map(normalizePost)));
    } catch {
      setPosts(withDemoFallback([]));
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts({ showLoader: true }); }, [fetchPosts]);

  useEffect(() => {
    const handlePostCreated = (event) => {
      const created = event?.detail?.post;
      if (created?._id) {
        const n = normalizePost(created);
        setPosts((cur) => [n, ...cur.filter((p) => p._id !== n._id)]);
      } else {
        fetchPosts();
      }
    };
    window.addEventListener("post:created", handlePostCreated);
    return () => window.removeEventListener("post:created", handlePostCreated);
  }, [fetchPosts]);

  const handleLikes = async (post) => {
    if (post.isDemo || String(post._id).startsWith("demo-")) {
      setPosts((cur) => cur.map((p) => p._id === post._id ? { ...p, likes: [...p.likes, "demo"] } : p));
      return;
    }
    try {
      setPendingActionId(`like-${post._id}`);
      const response = await apiFetch(`/api/v1/posts/${post._id}/like`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (response.ok) {
        const data = await response.json();
        const liked = data.liked;
        setPosts((cur) => cur.map((p) => {
          if (p._id !== post._id) return p;
          const newLikes = liked
            ? [...p.likes.filter((id) => id !== currentUserId), currentUserId]
            : p.likes.filter((id) => id !== currentUserId);
          return { ...p, likes: newLikes };
        }));
        toast(liked ? "❤️ Post liked!" : "Post unliked", { autoClose: 1000 });
      }
    } catch { toast.error("Failed to update like"); }
    finally { setPendingActionId(""); }
  };

  const handleDeletePost = async (post) => {
    if (post.isDemo || String(post._id).startsWith("demo-")) return;
    if (!window.confirm("Delete this post?")) return;
    try {
      setPendingActionId(`delete-${post._id}`);
      const response = await apiFetch(`/api/v1/posts/${post._id}`, { method: "DELETE" });
      if (response.ok) {
        setPosts((cur) => cur.filter((p) => p._id !== post._id));
        toast.success("Post deleted");
      } else {
        toast.error("Could not delete post");
      }
    } catch { toast.error("Failed to delete post"); }
    finally { setPendingActionId(""); }
  };

  const handleCommentSubmit = async (post) => {
    const text = (commentDrafts[post._id] || "").trim();
    if (!text) { toast.warn("Write something first!"); return; }

    if (post.isDemo || String(post._id).startsWith("demo-")) {
      setPosts((cur) => cur.map((p) => p._id === post._id
        ? { ...p, comments: [...p.comments, { _id: `local-${Date.now()}`, userId: currentUserId, text }] }
        : p));
      setCommentDrafts((cur) => ({ ...cur, [post._id]: "" }));
      setOpenComments((cur) => ({ ...cur, [post._id]: true }));
      return;
    }

    try {
      setPendingActionId(`comment-${post._id}`);
      const response = await apiFetch(`/api/v1/posts/${post._id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) { toast.error("Could not post comment"); return; }
      const updatedPost = await response.json();
      setPosts((cur) => cur.map((p) => p._id === post._id ? { ...p, comments: updatedPost.comments || p.comments } : p));
      setCommentDrafts((cur) => ({ ...cur, [post._id]: "" }));
      setOpenComments((cur) => ({ ...cur, [post._id]: true }));
      toast.success("Comment posted");
    } catch { toast.error("Failed to post comment"); }
    finally { setPendingActionId(""); }
  };

  const handleCommentDelete = async (post, comment) => {
    if (!comment?._id) return;
    if (String(comment._id).startsWith("local-")) {
      setPosts((cur) => cur.map((p) => p._id === post._id ? { ...p, comments: p.comments.filter((c) => c._id !== comment._id) } : p));
      return;
    }
    try {
      setPendingActionId(`del-comment-${comment._id}`);
      const response = await apiFetch(`/api/v1/posts/comment/${post._id}/${comment._id}`, { method: "DELETE" });
      if (!response.ok) { toast.error("Could not remove comment"); return; }
      const updated = await response.json();
      setPosts((cur) => cur.map((p) => p._id === post._id ? { ...p, comments: updated.comments || p.comments } : p));
      toast("Comment removed", { autoClose: 1200 });
    } catch { toast.error("Failed to remove comment"); }
    finally { setPendingActionId(""); }
  };

  const handleShare = async (post) => {
    const text = `Check out @${post.username}'s post on FSM: ${post.desc || "New post"}`;
    try {
      if (navigator.share) await navigator.share({ title: `${post.name} on FSM`, text });
      else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      toast("Link copied!", { autoClose: 1200 });
    } catch { /* user cancelled */ }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) return <div className="Posts"><div className="postsLoader">Loading your feed...</div></div>;

  return (
    <div className="Posts">
      {posts.map((post) => {
        const isLiked = post.likes.includes(currentUserId);
        const isCommentOpen = Boolean(openComments[post._id]);
        const commentCount = post.comments?.length || 0;
        const isOwner = String(post.ownerId) === String(currentUserId);
        const hasBrokenMedia = Boolean(brokenMediaIds[post._id]);
        const isDeleting = pendingActionId === `delete-${post._id}`;

        return (
          <div className="Post" key={post._id}>
            {/* Header */}
            <div className="postHeader">
              <img
                src={post.avatar || ProfileImage}
                alt={post.name}
                className="postAvatar"
                onClick={() => post.ownerId && navigate(`/profile/${post.ownerId}`)}
                style={{ cursor: post.ownerId ? "pointer" : "default" }}
              />
              <div className="postHeaderInfo">
                <div className="postHeaderTitleRow">
                  <span
                    className="postName"
                    onClick={() => post.ownerId && navigate(`/profile/${post.ownerId}`)}
                    style={{ cursor: post.ownerId ? "pointer" : "default" }}
                  >
                    {post.username}
                  </span>
                  <span className="postDot">•</span>
                  <span className="postTime">{timeAgo(post.createdAt)}</span>
                </div>
              </div>
              {isOwner && !post.isDemo && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="postDeleteBtn"
                    title="Edit post"
                    onClick={async () => {
                      const newCaption = window.prompt("Edit your caption:", post.desc);
                      if (newCaption !== null) {
                        try {
                          const response = await apiFetch(`/api/v1/posts/${post._id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ caption: newCaption }),
                          });
                          if (response.ok) {
                            const updated = await response.json();
                            setPosts((cur) => cur.map((p) => p._id === post._id ? { ...p, desc: updated.caption || newCaption } : p));
                            toast.success("Post updated!");
                          } else { toast.error("Could not update post"); }
                        } catch { toast.error("Failed to update post"); }
                      }
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    className="postDeleteBtn"
                    title="Delete post"
                    disabled={isDeleting}
                    onClick={() => handleDeletePost(post)}
                  >
                    {isDeleting ? "…" : "🗑"}
                  </button>
                </div>
              )}
            </div>

            {/* Media */}
            {(post.mediaArray && post.mediaArray.length > 0 ? post.mediaArray : (post.imageUrl ? [post.imageUrl] : [])).length > 0 && !hasBrokenMedia && (
              <div 
                className="postImageContainer" 
                style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", gap: "2px" }}
                onDoubleClick={() => {
                  if (!isLiked) handleLikes(post);
                  setDoubleClickLikeId(post._id);
                  setTimeout(() => setDoubleClickLikeId(null), 1000);
                }}
              >
                {(post.mediaArray && post.mediaArray.length > 0 ? post.mediaArray : (post.imageUrl ? [post.imageUrl] : [])).map((url, idx) => (
                  <div key={idx} style={{ flex: "0 0 100%", scrollSnapAlign: "center", position: "relative" }}>
                    {url.match(/\.(mp4|webm|ogg)$/i) || post.format === 'video' ? (
                      <video src={url} controls className="postImage" style={{ width: "100%", maxHeight: "500px", objectFit: "contain", backgroundColor: "#000" }} />
                    ) : (
                      <img
                        src={url}
                        alt="post media"
                        className="postImage"
                        style={{ width: "100%", objectFit: "cover" }}
                        onError={() => setBrokenMediaIds((cur) => ({ ...cur, [post._id]: true }))}
                      />
                    )}
                    {doubleClickLikeId === post._id && (
                      <div className="heartOverlay">
                        <img src={Heart} alt="heart" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {(post.imageUrl || (post.mediaArray && post.mediaArray.length > 0)) && hasBrokenMedia && (
              <div className="postMediaFallback">Media could not be loaded.</div>
            )}

            <div className="postReact">
              <div className="reactItem" onClick={() => handleLikes(post)}>
                <img src={isLiked ? Heart : NotLike} alt="like" />
              </div>
              <div className="reactItem" onClick={() => setOpenComments((cur) => ({ ...cur, [post._id]: !isCommentOpen }))}>
                <img src={Comment} alt="comment" />
              </div>
              <div className="reactItem" onClick={() => handleShare(post)}>
                <img src={Share} alt="share" />
              </div>
              <div className="reactItem" onClick={async () => {
                if (post.isDemo) return;
                try {
                  const res = await apiFetch(`/api/v1/posts/${post._id}/save`, { method: "PUT" });
                  if (res.ok) toast.success("Post saved!");
                } catch { toast.error("Failed to save post"); }
              }}>
                <span style={{ fontSize: "24px", lineHeight: "1" }}>🔖</span>
              </div>
            </div>

            {/* Content & Caption */}
            <div className="postContentWrapper">
              {post.likes.length > 0 && (
                <div className="postLikesCount">{post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}</div>
              )}
              
              {post.desc && (
                <div className="postCaption">
                  <span 
                    className="captionUsername"
                    onClick={() => post.ownerId && navigate(`/profile/${post.ownerId}`)}
                    style={{ cursor: post.ownerId ? "pointer" : "default" }}
                  >
                    {post.name}
                  </span>
                  <span className="captionText">{post.desc}</span>
                </div>
              )}

              {commentCount > 0 && !isCommentOpen && (
                <div 
                  className="viewAllComments" 
                  onClick={() => setOpenComments((cur) => ({ ...cur, [post._id]: true }))}
                >
                  View all {commentCount} comments
                </div>
              )}
            </div>

            {isCommentOpen && (
              <div className="postComments">
                <div className="commentComposer">
                  <input
                    type="text"
                    value={commentDrafts[post._id] || ""}
                    onChange={(e) => setCommentDrafts((cur) => ({ ...cur, [post._id]: e.target.value }))}
                    placeholder="Write a comment..."
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCommentSubmit(post); } }}
                  />
                  <button
                    type="button"
                    className="button commentButton"
                    disabled={pendingActionId === `comment-${post._id}`}
                    onClick={() => handleCommentSubmit(post)}
                  >
                    {pendingActionId === `comment-${post._id}` ? "Posting..." : "Post"}
                  </button>
                </div>
                {commentCount > 0 ? (
                  <div className="commentList">
                    {post.comments.map((comment) => {
                      const commenter = comment.userId || {};
                      const commenterName = commenter.displayName || commenter.username || comment.userName || "User";
                      const commenterAvatar = commenter.profilePicture || ProfileImage;
                      const commenterId = commenter._id || comment.userId || "";
                      const canDelete = String(commenterId) === String(currentUserId) || String(comment._id).startsWith("local-");

                      return (
                        <div className="commentItem" key={comment._id}>
                          <img
                            src={commenterAvatar}
                            alt={commenterName}
                            className="commentAvatar"
                            onClick={() => commenterId && navigate(`/profile/${commenterId}`)}
                            style={{ cursor: commenterId ? "pointer" : "default" }}
                          />
                          <div className="commentBody">
                            <strong
                              onClick={() => commenterId && navigate(`/profile/${commenterId}`)}
                              style={{ cursor: commenterId ? "pointer" : "default" }}
                            >
                              {commenterName}
                            </strong>
                            <span>{comment.text}</span>
                          </div>
                          <div style={{ display: "flex", gap: "4px" }}>
                            {canDelete && (
                              <button
                                className="commentDeleteButton"
                                title="Edit comment"
                                onClick={async () => {
                                  const newText = window.prompt("Edit your comment:", comment.text);
                                  if (newText && newText !== comment.text) {
                                    try {
                                      const res = await apiFetch(`/api/v1/posts/${post._id}/comment/${comment._id}`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ text: newText })
                                      });
                                      if (res.ok) {
                                        const updated = await res.json();
                                        setPosts((cur) => cur.map((p) => p._id === post._id ? { ...p, comments: updated.comments || p.comments } : p));
                                        toast.success("Comment updated");
                                      }
                                    } catch { toast.error("Failed to update comment"); }
                                  }
                                }}
                              >
                                ✏️
                              </button>
                            )}
                            {canDelete && (
                              <button
                                className="commentDeleteButton"
                                disabled={pendingActionId === `del-comment-${comment._id}`}
                                onClick={() => handleCommentDelete(post, comment)}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="emptyComments">No comments yet. Start the conversation.</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Posts;
