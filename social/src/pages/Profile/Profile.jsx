import React, { useEffect, useState } from "react";
import "./Profile.css";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { getSessionUserId, getStoredUserProfile } from "../../utils/session";
import ProfileImage from "../../img/profileImg.jpg";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Lock, Bookmark, Link as LinkIcon, Grid, Users, Heart } from "lucide-react";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { username: paramUsername } = useParams();
  const currentUserId = getSessionUserId();
  const storedUser = getStoredUserProfile();
  const profileIdentifier = paramUsername || storedUser.username || currentUserId;

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!currentUserId) { navigate("/"); return; }
    if (!profileIdentifier) return;

    apiFetch(`/api/v1/users/${profileIdentifier}`)
      .then((r) => {
        if (!r.ok) {
          setError(true);
          return null;
        }
        return r.json();
      })
      .then((payload) => {
        if (!payload) return;
        const userData = payload.data || payload;
        setUser(userData);

        if (userData.followers) {
          setIsFollowing(userData.followers.some((f) => {
            const fid = f._id || f;
            return String(fid) === String(currentUserId);
          }));
        }

        if (userData.followRequests) {
          setIsRequested(userData.followRequests.some((r) => {
            const rid = r._id || r;
            return String(rid) === String(currentUserId);
          }));
        }
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      });

    apiFetch(`/api/v1/posts/user/${profileIdentifier}`)
      .then((r) => r.ok ? r.json() : [])
      .then((payload) => {
        const postsData = payload.data || payload;
        setPosts(Array.isArray(postsData) ? postsData : []);
      })
      .catch(console.error);
  }, [profileIdentifier, currentUserId, navigate]);

  const handleFollow = async () => {
    try {
      setLoadingFollow(true);
      const endpoint = (isFollowing || isRequested)
        ? `/api/v1/users/${user?._id || profileIdentifier}/unfollow`
        : `/api/v1/users/${user?._id || profileIdentifier}/follow`;

      const response = await apiFetch(endpoint, { method: "POST" });
      if (!response.ok) { 
        const errData = await response.json();
        toast.error(errData?.message || "Could not update follow status"); 
        return; 
      }

      const resData = await response.json();
      const payload = resData.data || resData;

      if (payload.requested) {
        setIsRequested(true);
        setIsFollowing(false);
        toast.info(`Follow request sent to @${user?.username}!`);
      } else if (payload.following) {
        setIsFollowing(true);
        setIsRequested(false);
        toast.success(`Now following @${user?.username}! 🎉`, { autoClose: 1500 });
      } else {
        setIsFollowing(false);
        setIsRequested(false);
        toast.info(payload.message || `Unfollowed @${user?.username}`);
      }
    } catch { 
      toast.error("Network error"); 
    } finally { 
      setLoadingFollow(false); 
    }
  };

  const isOwnProfile = user 
    ? (String(user._id) === String(currentUserId) || user.username === storedUser.username)
    : false;

  const isAuthorized = isOwnProfile || !user?.isPrivate || isFollowing;

  if (error) return (
    <div className="profileLoading" style={{ color: "var(--color-text)", textAlign: "center", padding: "2rem" }}>
      <h2>User not found</h2>
      <p>The profile you are looking for does not exist or has been removed.</p>
      <button className="primaryCTA" onClick={() => navigate("/home")} style={{ marginTop: "1rem" }}>Return Home</button>
    </div>
  );

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
                    className={`profileBtn ${isFollowing ? "unfollowBtn" : isRequested ? "requestedBtn" : "followBtn"}`}
                    onClick={handleFollow}
                    disabled={loadingFollow}
                  >
                    {loadingFollow ? "..." : isFollowing ? "Following" : isRequested ? "Requested" : "Follow"}
                  </button>
                  <button className="profileBtn messageBtn" onClick={() => navigate("/messages", { state: { startChatWith: user._id } })}>
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="profileStats">
            <div className="statItem">
              <strong>{isAuthorized ? posts.length : 0}</strong> posts
            </div>
            <div className="statItem" onClick={() => isAuthorized && setTab("followers")} style={{ cursor: isAuthorized ? "pointer" : "default" }}>
              <strong>{user.followers?.length || 0}</strong> followers
            </div>
            <div className="statItem" onClick={() => isAuthorized && setTab("following")} style={{ cursor: isAuthorized ? "pointer" : "default" }}>
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

      {/* Main Content: Protected vs Authorized */}
      {!isAuthorized ? (
        <div className="private-profile-card">
          <div className="private-icon-pill">
            <Lock size={36} color="var(--color-primary, #7C3AED)" />
          </div>
          <h3>This Account is Private</h3>
          <p>Follow @{user.username} to see their posts, photos, and activity.</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="profileTabs">
            {[
              { id: "posts", icon: <Grid size={18} />, label: "Posts" },
              { id: "followers", icon: <Users size={18} />, label: "Followers" },
              { id: "following", icon: <Users size={18} />, label: "Following" },
              { id: "saved", icon: <Bookmark size={18} />, label: "Saved" }
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

          {/* Grid Content */}
          <div className="profileGrid">
            {tab === "posts" && (
              posts.length === 0 ? (
                <div className="emptyState">
                  <Grid size={48} color="var(--color-text-secondary)" />
                  <p>No posts yet</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post._id} className="gridItem" onClick={() => navigate(`/post/${post._id}`)}>
                    {post.media && post.media[0] ? (
                      post.media[0].type === "video" ? (
                        <video src={post.media[0].url} className="gridMedia" />
                      ) : (
                        <img src={post.media[0].url} alt="post" className="gridMedia" />
                      )
                    ) : (
                      <div className="textPostPreview">
                        <p>{post.caption}</p>
                      </div>
                    )}
                    <div className="gridItemOverlay">
                      <span><Heart size={18} fill="#fff" /> {post.likes?.length || 0}</span>
                    </div>
                  </div>
                ))
              )
            )}

            {tab === "followers" && (
              <div className="userList">
                {user.followers?.map((f) => (
                  <div key={f._id} className="userListItem" onClick={() => navigate(`/profile/${f.username || f._id}`)}>
                    <img src={f.profilePicture || ProfileImage} alt={f.username} />
                    <span>@{f.username}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === "following" && (
              <div className="userList">
                {user.following?.map((f) => (
                  <div key={f._id} className="userListItem" onClick={() => navigate(`/profile/${f.username || f._id}`)}>
                    <img src={f.profilePicture || ProfileImage} alt={f.username} />
                    <span>@{f.username}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === "saved" && (
              <div className="emptyState">
                <Bookmark size={48} color="var(--color-text-secondary)" />
                <p>Saved posts are private to you</p>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default ProfilePage;
