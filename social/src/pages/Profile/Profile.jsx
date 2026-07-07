import React, { useEffect, useState } from "react";
import "./Profile.css";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { getSessionUserId } from "../../utils/session";
import ProfileImage from "../../img/profileImg.jpg";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, UserPlus, UserMinus, MessageCircle, Heart, MessageSquare, Link as LinkIcon, Grid, Users } from "lucide-react";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const currentUserId = getSessionUserId();
  const profileId = paramId || currentUserId;

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);

  useEffect(() => {
    if (!currentUserId) { navigate("/"); return; }
    if (!profileId) return;

    apiFetch(`/api/v1/users/${profileId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        setUser(data);
        if (data.followers) {
          setIsFollowing(data.followers.some((f) => {
            const fid = f._id || f;
            return String(fid) === String(currentUserId);
          }));
        }
      })
      .catch(console.error);

    apiFetch(`/api/v1/posts/user/${profileId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [profileId, currentUserId, navigate]);

  const handleFollow = async () => {
    try {
      setLoadingFollow(true);
      const endpoint = isFollowing
        ? `/api/v1/users/${profileId}/unfollow`
        : `/api/v1/users/${profileId}/follow`;
      const response = await apiFetch(endpoint, { method: "POST" });
      if (!response.ok) { toast.error("Could not update follow"); return; }

      setIsFollowing((prev) => !prev);
      setUser((prev) => {
        if (!prev) return prev;
        const followers = prev.followers || [];
        if (isFollowing) {
          return { ...prev, followers: followers.filter((f) => String(f._id || f) !== String(currentUserId)) };
        } else {
          return { ...prev, followers: [...followers, { _id: currentUserId }] };
        }
      });
      toast.success(isFollowing ? `Unfollowed @${user?.username}` : `Now following @${user?.username}! 🎉`, { autoClose: 1500 });
    } catch { toast.error("Network error"); }
    finally { setLoadingFollow(false); }
  };

  const isOwnProfile = String(profileId) === String(currentUserId);

  if (!user) return (
    <div className="profileLoading">
      <div className="profileLoadingSpinner" />
    </div>
  );

  const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
  const avatarUrl = user.profilePicture
    ? user.profilePicture.startsWith("/") ? `${API_BASE}${user.profilePicture}` : user.profilePicture
    : ProfileImage;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="ProfilePage"
    >
      {/* Header */}
      <div className="profileHeader">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="profileAvatarWrapper"
        >
          <img src={avatarUrl} alt={user.username} className="profileAvatar" />
        </motion.div>

        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="profileInfo"
        >
          <div className="profileHeaderTop">
            <span className="profileUsername">@{user.username}</span>
            <div className="profileActions">
              {isOwnProfile ? (
                <button className="profileBtn editBtn" onClick={() => navigate("/profile/edit")}>
                  Edit profile
                </button>
              ) : (
                <>
                  <button
                    className={`profileBtn ${isFollowing ? "unfollowBtn" : "followBtn"}`}
                    onClick={handleFollow}
                    disabled={loadingFollow}
                  >
                    {loadingFollow ? "..." : isFollowing ? "Following" : "Follow"}
                  </button>
                  <button className="profileBtn messageBtn" onClick={() => navigate("/messages", { state: { startChatWith: profileId } })}>
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="profileStats">
            <div className="statItem">
              <strong>{posts.length}</strong> posts
            </div>
            <div className="statItem" onClick={() => setTab("followers")} style={{ cursor: "pointer" }}>
              <strong>{user.followers?.length || 0}</strong> followers
            </div>
            <div className="statItem" onClick={() => setTab("following")} style={{ cursor: "pointer" }}>
              <strong>{user.following?.length || 0}</strong> following
            </div>
          </div>

          <div className="profileBioSection">
            <h2 className="profileDisplayName">{user.displayName || user.username}</h2>
            {user.bio && <p className="profileBio">{user.bio}</p>}
            {user.website && (
              <a href={user.website} target="_blank" rel="noreferrer" className="profileWebsite">
                <LinkIcon size={14} /> {user.website}
              </a>
            )}
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="profileTabs">
        {[
          { id: "posts", icon: <Grid size={18} />, label: "Posts" },
          { id: "reels", icon: <Heart size={18} />, label: "Reels" }, /* Using Heart since Play is not imported, let's just use Grid/Heart/Users */
          { id: "tagged", icon: <Users size={18} />, label: "Tagged" },
          { id: "saved", icon: <Heart size={18} />, label: "Saved" }
        ].map((t) => (
          <button 
            key={t.id}
            className={`tab ${tab === t.id ? "activeTab" : ""}`} 
            onClick={() => setTab(t.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {t.icon} {t.label}
            </div>
            {tab === t.id && (
              <motion.div layoutId="activeTabIndicator" className="activeTabIndicator" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="profileTabContent">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {tab === "posts" && (
              <div className="profilePostsGrid">
                {posts.length === 0 ? (
                  <div className="profileEmptyState">
                    <Grid size={64} className="emptyStateIcon" />
                    <h2>No posts yet</h2>
                    <p>When this user shares photos or videos, they will appear here.</p>
                  </div>
                ) : (
                  posts.map((post, i) => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="profilePostThumb" 
                      key={post._id}
                    >
                      <img src={post.imageUrl} alt={post.caption || "post"} />
                      <div className="profilePostOverlay">
                        <div className="overlayItem">
                          <Heart size={20} fill="#fff" /> {post.likes?.length || 0}
                        </div>
                        <div className="overlayItem">
                          <MessageSquare size={20} fill="#fff" /> {post.comments?.length || 0}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {tab === "followers" && (
              <div className="profilePeopleList">
                {(user.followers || []).length === 0 ? (
                  <div className="profileEmptyState">
                    <Users size={64} className="emptyStateIcon" />
                    <h2>No followers yet</h2>
                    <p>Once people start following this user, they'll show up here.</p>
                  </div>
                ) : (
                  user.followers.map((f, i) => {
                    const fid = f._id || f;
                    const fname = f.displayName || f.username || "User";
                    const favatar = f.profilePicture || ProfileImage;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="profilePersonRow" 
                        key={String(fid)} 
                        onClick={() => navigate(`/profile/${fid}`)}
                      >
                        <img src={favatar} alt={fname} />
                        <div>
                          <strong>{fname}</strong>
                          {f.username && <span>@{f.username}</span>}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}

            {tab === "following" && (
              <div className="profilePeopleList">
                {(user.following || []).length === 0 ? (
                  <div className="profileEmptyState">
                    <UserPlus size={64} className="emptyStateIcon" />
                    <h2>Not following anyone</h2>
                    <p>Once this user starts following others, they'll show up here.</p>
                  </div>
                ) : (
                  user.following.map((f, i) => {
                    const fid = f._id || f;
                    const fname = f.displayName || f.username || "User";
                    const favatar = f.profilePicture || ProfileImage;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="profilePersonRow" 
                        key={String(fid)} 
                        onClick={() => navigate(`/profile/${fid}`)}
                      >
                        <img src={favatar} alt={fname} />
                        <div>
                          <strong>{fname}</strong>
                          {f.username && <span>@{f.username}</span>}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
