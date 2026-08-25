import React, { useCallback, useEffect, useState } from "react";
import "./Posts.css";
import "../Post/Post.css";
import ProfileImage from "../../img/profileImg.jpg";
import { apiFetch } from "../../utils/api";
import { getSessionUserId } from "../../utils/session";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Pencil, Trash2, Globe, Lock } from "lucide-react";
import ActionBar from "../Actions/ActionBar";

const normalizePost = (post) => {
  const source = post || {};
  const id = source._id || `post-${Math.random().toString(36).slice(2, 10)}`;
  const userId = source.userId || {};
  const name = userId.displayName || userId.username || source.name || "User";
  const username = userId.username || source.username || "user";
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
    hashtags: Array.isArray(source.hashtags) ? source.hashtags : [],
    visibility: source.visibility || "public",
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
    createdAt: source.createdAt || new Date().toISOString(),
  };
};

const renderCaptionWithHashtags = (caption) => {
  if (!caption) return null;
  const parts = caption.split(/(#[a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('#')) {
      const tagClean = part.replace('#', '');
      return (
        <Link
          key={idx}
          to={`/search?q=%23${encodeURIComponent(tagClean)}`}
          className="postHashtagLink"
          onClick={(e) => e.stopPropagation()}
          style={{ color: 'var(--fm-primary)', fontWeight: 600, textDecoration: 'none' }}
        >
          {part}
        </Link>
      );
    }
    return part;
  });
};

const Posts = ({ singlePostId }) => {
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
      const url = singlePostId ? `/api/v1/posts/${singlePostId}` : "/api/v1/feed/home?limit=20";
      const response = await apiFetch(url);
      if (!response.ok) {
        // Fallback to /api/v1/posts
        const fallbackRes = await apiFetch("/api/v1/posts?limit=20");
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          const items = Array.isArray(fallbackData.data) ? fallbackData.data : Array.isArray(fallbackData) ? fallbackData : [];
          setPosts(items.map(normalizePost));
        } else {
          setPosts([]);
        }
        return;
      }

      const payload = await response.json();
      let rawList = [];

      if (singlePostId) {
        const item = payload.data || payload;
        rawList = item && item._id ? [item] : [];
      } else {
        const data = payload.data || payload;
        rawList = Array.isArray(data) ? data : Array.isArray(data?.posts) ? data.posts : [];
      }

      setPosts(rawList.map(normalizePost));
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [singlePostId]);

  useEffect(() => {
    fetchPosts({ showLoader: true });
  }, [fetchPosts]);

  const timeAgo = (isoDate) => {
    if (!isoDate) return "";
    const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return new Date(isoDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const handleLikes = async (post) => {
    if (!currentUserId) {
      toast.error("Please login to like posts");
      return;
    }

    const postId = post._id;
    const isLiked = Array.isArray(post.likes) && post.likes.some((id) => String(typeof id === 'object' ? id?._id || id : id) === String(currentUserId));

    // Optimistic Update
    setPosts((cur) =>
      cur.map((p) => {
        if (p._id !== postId) return p;
        const currentLikes = Array.isArray(p.likes) ? p.likes : [];
        const nextLikes = isLiked
          ? currentLikes.filter((id) => String(typeof id === 'object' ? id?._id || id : id) !== String(currentUserId))
          : [...currentLikes, currentUserId];
        return { ...p, likes: nextLikes };
      })
    );

    try {
      const response = await apiFetch(`/api/v1/posts/${postId}/like`, { method: "POST" });
      if (!response.ok) {
        fetchPosts();
      }
    } catch {
      fetchPosts();
    }
  };

  const handleDeletePost = async (post) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    const postId = post._id;
    setPendingActionId(`delete-${postId}`);

    try {
      const response = await apiFetch(`/api/v1/posts/${postId}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error("Could not delete post");
        return;
      }
      setPosts((cur) => cur.filter((p) => p._id !== postId));
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setPendingActionId("");
    }
  };

  const handleCommentSubmit = async (e, post) => {
    e.preventDefault();
    if (!currentUserId) {
      toast.error("Please login to comment");
      return;
    }

    const text = (commentDrafts[post._id] || "").trim();
    if (!text) return;

    try {
      const response = await apiFetch(`/api/v1/posts/${post._id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        toast.error("Failed to post comment");
        return;
      }

      const payload = await response.json();
      const newComment = payload.data || payload;

      setPosts((cur) =>
        cur.map((p) => {
          if (p._id !== post._id) return p;
          return { ...p, comments: [...(p.comments || []), newComment] };
        })
      );

      setCommentDrafts((prev) => ({ ...prev, [post._id]: "" }));
    } catch {
      toast.error("Network error while submitting comment");
    }
  };

  const handleCommentDelete = async (postId, commentId) => {
    try {
      const res = await apiFetch(`/api/v1/posts/${postId}/comment/${commentId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((cur) =>
          cur.map((p) => {
            if (p._id !== postId) return p;
            return { ...p, comments: (p.comments || []).filter((c) => c._id !== commentId) };
          })
        );
        toast.success("Comment deleted");
      }
    } catch {
      toast.error("Could not delete comment");
    }
  };

  const handleShare = async (post) => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.name}`,
          text: post.desc,
          url: postUrl,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(postUrl);
      toast.success("Link copied to clipboard! 📋");
    }
  };

  if (loading) {
    return (
      <div className="Posts">
        {[1, 2, 3].map((n) => (
          <div className="Post" key={n} style={{ padding: '1.5rem', background: 'var(--fm-surface)', border: '1px solid var(--fm-border)', borderRadius: 'var(--radius-card)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--fm-surface-soft)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '120px', height: '14px', background: 'var(--fm-surface-soft)', borderRadius: '4px', marginBottom: '0.5rem' }} />
                <div style={{ width: '80px', height: '10px', background: 'var(--fm-surface-soft)', borderRadius: '4px' }} />
              </div>
            </div>
            <div style={{ width: '100%', height: '280px', background: 'var(--fm-surface-soft)', borderRadius: 'var(--radius-md)' }} />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="Posts">
        <div className="Post" style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--fm-surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--fm-border)' }}>
          <h3 style={{ color: 'var(--fm-text)', margin: '0 0 0.5rem' }}>No posts in your feed yet</h3>
          <p style={{ color: 'var(--fm-text-muted)', margin: '0 0 1.5rem', fontSize: '0.92rem' }}>
            Follow creators or share your first photo to get started!
          </p>
          <button
            type="button"
            className="saveBtn"
            onClick={() => navigate('/explore')}
            style={{ padding: '8px 20px', fontSize: '0.88rem' }}
          >
            Explore Creators
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="Posts">
      {posts.map((post) => (
        <PostItem 
          key={post._id}
          post={post}
          currentUserId={currentUserId}
          openComments={openComments}
          commentDrafts={commentDrafts}
          brokenMediaIds={brokenMediaIds}
          pendingActionId={pendingActionId}
          doubleClickLikeId={doubleClickLikeId}
          handleLikes={handleLikes}
          handleDeletePost={handleDeletePost}
          handleCommentSubmit={handleCommentSubmit}
          handleCommentDelete={handleCommentDelete}
          handleShare={handleShare}
          setPosts={setPosts}
          setCommentDrafts={setCommentDrafts}
          setOpenComments={setOpenComments}
          setDoubleClickLikeId={setDoubleClickLikeId}
          setBrokenMediaIds={setBrokenMediaIds}
          timeAgo={timeAgo}
          navigate={navigate}
          ProfileImage={ProfileImage}
          toast={toast}
          apiFetch={apiFetch}
        />
      ))}
    </div>
  );
};

const PostItem = React.memo(({ 
  post, currentUserId, openComments, commentDrafts, brokenMediaIds, 
  pendingActionId, doubleClickLikeId, handleLikes, handleDeletePost, 
  handleCommentSubmit, handleCommentDelete, handleShare, setPosts,
  setCommentDrafts, setOpenComments, setDoubleClickLikeId, setBrokenMediaIds, 
  timeAgo, navigate, ProfileImage, toast, apiFetch 
}) => {
  const isLiked = Array.isArray(post.likes) && post.likes.some((id) => String(typeof id === 'object' ? id?._id || id : id) === String(currentUserId));
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
          onClick={() => post.username && navigate(`/profile/${post.username}`)}
          style={{ cursor: "pointer" }}
          onError={(e) => { e.target.src = ProfileImage; }}
        />
        <div className="postHeaderInfo">
          <div className="postHeaderTitleRow">
            <span
              className="postName"
              onClick={() => post.username && navigate(`/profile/${post.username}`)}
              style={{ cursor: "pointer" }}
            >
              {post.name || post.username}
            </span>
            <span className="postDot">•</span>
            <span className="postTime">{timeAgo(post.createdAt)}</span>
            <span className="postDot">•</span>
            <span className="postVisibilityBadge" title={post.visibility === 'private' ? 'Private' : 'Public'} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: 'var(--fm-text-muted)' }}>
              {post.visibility === 'private' ? <Lock size={12} /> : <Globe size={12} />}
              {post.visibility === 'private' ? 'Private' : 'Public'}
            </span>
          </div>
          <span className="postHandle" style={{ fontSize: '0.8rem', color: 'var(--fm-text-muted)' }}>@{post.username}</span>
        </div>
        {isOwner && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
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
              <Pencil size={18} />
            </button>
            <button
              type="button"
              className="postDeleteBtn"
              title="Delete post"
              disabled={isDeleting}
              onClick={() => handleDeletePost(post)}
            >
              {isDeleting ? "…" : <Trash2 size={18} />}
            </button>
          </div>
        )}
      </div>

      {/* Media */}
      {(post.mediaArray && post.mediaArray.length > 0 ? post.mediaArray : (post.imageUrl ? [post.imageUrl] : [])).length > 0 && !hasBrokenMedia && (
        <div
          className="postImageContainer"
          style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", gap: "2px", position: "relative" }}
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
                  loading="lazy"
                  onError={() => setBrokenMediaIds((prev) => ({ ...prev, [post._id]: true }))}
                />
              )}
            </div>
          ))}

          {doubleClickLikeId === post._id && (
            <div className="doubleClickHeart">
              <Heart size={64} fill="#FF8A4C" color="#FF8A4C" />
            </div>
          )}
        </div>
      )}

      {/* Action Bar */}
      <ActionBar
        postId={post._id}
        isLiked={isLiked}
        likeCount={post.likes?.length || 0}
        commentCount={commentCount}
        onLikeToggle={() => handleLikes(post)}
        onCommentClick={() =>
          setOpenComments((prev) => ({ ...prev, [post._id]: !prev[post._id] }))
        }
        onShareClick={() => handleShare(post)}
      />

      {/* Caption & Hashtags */}
      {post.desc && (
        <div className="detail" style={{ padding: "8px 16px 4px 16px" }}>
          <div className="postCaption" style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "6px", fontSize: "0.92rem", lineHeight: "1.5", wordBreak: "break-word" }}>
            <span
              className="captionUsername"
              onClick={() => post.username && navigate(`/profile/${post.username}`)}
              style={{ fontWeight: 700, cursor: "pointer", color: "var(--fm-text)", display: "inline-block" }}
            >
              @{post.username}
            </span>
            <span className="captionText" style={{ color: "var(--fm-text)", flex: "1 1 auto" }}>
              {renderCaptionWithHashtags(post.desc)}
            </span>
          </div>
        </div>
      )}

      {/* Comments section */}
      {isCommentOpen && (
        <div className="commentsSection">
          <div className="commentsList">
            {post.comments?.length === 0 ? (
              <p className="noComments">No comments yet. Be the first to comment!</p>
            ) : (
              post.comments?.map((comment, idx) => {
                const author = comment.userId || {};
                const authorName = author.displayName || author.username || comment.userName || "User";
                const isCommentAuthor = String(author._id || author) === String(currentUserId);

                return (
                  <div key={comment._id || idx} className="commentItem">
                    <img
                      src={author.profilePicture || ProfileImage}
                      alt={authorName}
                      className="commentAvatar"
                      onError={(e) => { e.target.src = ProfileImage; }}
                    />
                    <div className="commentBubble">
                      <strong>{authorName}</strong>
                      <p>{comment.text}</p>
                    </div>
                    {isCommentAuthor && (
                      <button
                        type="button"
                        className="commentDeleteBtn"
                        onClick={() => handleCommentDelete(post._id, comment._id)}
                        title="Delete comment"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={(e) => handleCommentSubmit(e, post)} className="commentForm">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentDrafts[post._id] || ""}
              onChange={(e) =>
                setCommentDrafts((prev) => ({ ...prev, [post._id]: e.target.value }))
              }
              className="commentInput"
            />
            <button
              type="submit"
              disabled={!(commentDrafts[post._id] || "").trim()}
              className="commentSubmitBtn"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
});

export default Posts;
