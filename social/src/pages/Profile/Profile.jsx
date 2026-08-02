import React, { useState, useEffect } from "react";
import "./Profile.css";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { getStoredUserProfile } from "../../utils/session";
import ProfileImage from "../../img/profileImg.jpg";
import { toast } from "react-toastify";
import { Lock, Heart, MessageCircle, Check, X, ShieldAlert } from "lucide-react";

const Profile = () => {
  const { username: profileIdentifier } = useParams();
  const navigate = useNavigate();
  const storedUser = getStoredUserProfile();
  const currentUserId = storedUser.userId;

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [hasIncomingRequest, setHasIncomingRequest] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    const identifier = profileIdentifier || "me";

    apiFetch(`/api/v1/users/${identifier}`)
      .then((r) => {
        if (!r.ok) throw new Error("Profile not found");
        return r.json();
      })
      .then((payload) => {
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

        // Fetch logged-in user profile to check if target user sent us an incoming request
        if (currentUserId && String(userData._id) !== String(currentUserId)) {
          apiFetch(`/api/v1/users/${currentUserId}`)
            .then(res => res.ok ? res.json() : null)
            .then(mePayload => {
              if (mePayload) {
                const meData = mePayload.data || mePayload;
                if (meData.followRequests) {
                  const incoming = meData.followRequests.some(req => String(req._id || req) === String(userData._id));
                  setHasIncomingRequest(incoming);
                }
              }
            })
            .catch(console.error);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      });

    fetchUserPosts(identifier);
  }, [profileIdentifier, currentUserId]);

  const fetchUserPosts = (identifier) => {
    apiFetch(`/api/v1/posts/user/${identifier}`)
      .then((r) => r.ok ? r.json() : [])
      .then((payload) => {
        const postsData = payload.data || payload;
        setPosts(Array.isArray(postsData) ? postsData : []);
      })
      .catch(console.error);
  };

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

      if (payload.requested || payload.status === "requested") {
        setIsRequested(true);
        setIsFollowing(false);
        toast.info(`Follow request sent to @${user?.username}!`);
      } else if (payload.following || payload.status === "following") {
        setIsFollowing(true);
        setIsRequested(false);
        toast.success(`Now following @${user?.username}! 🎉`, { autoClose: 1500 });
        fetchUserPosts(user?._id || profileIdentifier);
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

  const handleAcceptIncomingRequest = async () => {
    try {
      setLoadingFollow(true);
      const res = await apiFetch(`/api/v1/users/follow-requests/${user._id}/accept`, { method: "POST" });
      if (res.ok) {
        toast.success(`Accepted follow request from @${user.username}!`);
        setHasIncomingRequest(false);
        setIsFollowing(true);
        fetchUserPosts(user._id);
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoadingFollow(false);
    }
  };

  const handleRejectIncomingRequest = async () => {
    try {
      setLoadingFollow(true);
      const res = await apiFetch(`/api/v1/users/follow-requests/${user._id}/reject`, { method: "POST" });
      if (res.ok) {
        toast.info(`Declined follow request from @${user.username}`);
        setHasIncomingRequest(false);
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
      {/* INCOMING FOLLOW REQUEST BANNER */}
      {hasIncomingRequest && (
        <div className="glass-card incoming-request-banner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", marginBottom: "1.5rem", borderRadius: "16px", background: "rgba(124, 58, 237, 0.12)", border: "1px solid var(--color-primary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <ShieldAlert color="var(--color-primary)" size={24} />
            <div>
              <strong style={{ color: "var(--color-text)", display: "block" }}>Follow Request</strong>
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>@{user.username} wants to follow your account.</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="primaryCTA" style={{ padding: "6px 16px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }} onClick={handleAcceptIncomingRequest} disabled={loadingFollow}>
              <Check size={14} /> Accept
            </button>
            <button className="profileBtn" style={{ padding: "6px 16px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }} onClick={handleRejectIncomingRequest} disabled={loadingFollow}>
              <X size={14} /> Delete
            </button>
          </div>
        </div>
      )}

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
                  {isRequested && (
                    <button className="profileBtn cancelReqBtn" onClick={handleFollow} disabled={loadingFollow}>
                      Cancel Request
                    </button>
                  )}
                  <button className="profileBtn messageBtn" onClick={() => navigate("/messages", { state: { startChatWith: user._id } })}>
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="profileStats">
            <div className="stat">
              <span className="statValue">{posts.length}</span>
              <span className="statLabel">posts</span>
            </div>
            <div className="stat" onClick={() => isAuthorized && setActiveTab("followers")} style={{ cursor: isAuthorized ? "pointer" : "default" }}>
              <span className="statValue">{user.followers?.length || 0}</span>
              <span className="statLabel">followers</span>
            </div>
            <div className="stat" onClick={() => isAuthorized && setActiveTab("following")} style={{ cursor: isAuthorized ? "pointer" : "default" }}>
              <span className="statValue">{user.following?.length || 0}</span>
              <span className="statLabel">following</span>
            </div>
          </div>

          <div className="profileBioSection">
            <h2 className="profileName">{user.displayName || user.username}</h2>
            {user.profession && <p className="profileProfession">{user.profession}</p>}
            {user.bio && <p className="profileBio">{user.bio}</p>}
            {user.location && <p className="profileLocation">📍 {user.location}</p>}
          </div>
        </motion.div>
      </div>

      {/* Profile Tabs & Content */}
      <div className="profileContentSection">
        <div className="profileTabs">
          <button className={`tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
            POSTS
          </button>
          {isAuthorized && (
            <>
              <button className={`tab ${activeTab === 'followers' ? 'active' : ''}`} onClick={() => setActiveTab('followers')}>
                FOLLOWERS ({user.followers?.length || 0})
              </button>
              <button className={`tab ${activeTab === 'following' ? 'active' : ''}`} onClick={() => setActiveTab('following')}>
                FOLLOWING ({user.following?.length || 0})
              </button>
            </>
          )}
        </div>

        {!isAuthorized ? (
          <div className="glass-card privateProfileGuard" style={{ padding: "4rem 2rem", textAlign: "center", marginTop: "1rem" }}>
            <div className="lockIconCircle" style={{ margin: "0 auto 1.5rem", width: "70px", height: "70px", borderRadius: "50%", background: "rgba(124, 58, 237, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Lock size={32} color="var(--color-primary)" />
            </div>
            <h2 style={{ color: "var(--color-text)", fontSize: "1.5rem", marginBottom: "0.5rem" }}>This Account is Private</h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "1rem", maxWidth: "450px", margin: "0 auto 1.5rem" }}>
              Follow @{user.username} to see their photos, videos, and social updates.
            </p>
            {isRequested ? (
              <button className="profileBtn requestedBtn" onClick={handleFollow} disabled={loadingFollow}>
                {loadingFollow ? "..." : "Follow Request Sent (Cancel)"}
              </button>
            ) : (
              <button className="primaryCTA" onClick={handleFollow} disabled={loadingFollow}>
                {loadingFollow ? "..." : "Request to Follow"}
              </button>
            )}
          </div>
        ) : (
          <div className="profileTabContent" style={{ marginTop: "1rem" }}>
            {activeTab === "posts" && (
              posts.length === 0 ? (
                <div className="emptyState">
                  <p>No posts yet</p>
                </div>
              ) : (
                <div className="profileGrid">
                  {posts.map((post) => {
                    const media = post.media && post.media.length > 0 ? post.media[0] : null;
                    const image = media ? media.url : post.imageUrl;
                    const isVideo = media ? media.type === "video" : (image && image.match(/\.(mp4|webm|ogg)$/i));
                    const fullUrl = image ? (image.startsWith("http") ? image : `${API_BASE}${image}`) : null;

                    return (
                      <div 
                        key={post._id} 
                        className="gridItem"
                        onClick={() => navigate(`/post/${post._id}`)}
                      >
                        {fullUrl ? (
                          isVideo ? (
                            <video src={fullUrl} className="gridMedia" />
                          ) : (
                            <img src={fullUrl} alt="Post" className="gridMedia" />
                          )
                        ) : (
                          <div className="textPostPreview">
                            <p>{post.caption || "Text Post"}</p>
                          </div>
                        )}
                        <div className="gridItemOverlay">
                          <span><Heart size={18} fill="#fff" /> {post.likes?.length || 0}</span>
                          <span><MessageCircle size={18} fill="#fff" /> {post.comments?.length || 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {activeTab === "followers" && (
              <div className="userList">
                {user.followers?.length === 0 ? (
                  <div className="emptyState"><p>No followers yet</p></div>
                ) : (
                  user.followers?.map((follower) => (
                    <div 
                      key={follower._id || follower} 
                      className="userListItem"
                      onClick={() => navigate(`/profile/${follower.username || follower._id}`)}
                    >
                      <img src={follower.profilePicture || ProfileImage} alt="Avatar" />
                      <div>
                        <strong style={{ display: "block", color: "var(--color-text)" }}>{follower.displayName || follower.username}</strong>
                        <span>@{follower.username}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "following" && (
              <div className="userList">
                {user.following?.length === 0 ? (
                  <div className="emptyState"><p>Not following anyone yet</p></div>
                ) : (
                  user.following?.map((followed) => (
                    <div 
                      key={followed._id || followed} 
                      className="userListItem"
                      onClick={() => navigate(`/profile/${followed.username || followed._id}`)}
                    >
                      <img src={followed.profilePicture || ProfileImage} alt="Avatar" />
                      <div>
                        <strong style={{ display: "block", color: "var(--color-text)" }}>{followed.displayName || followed.username}</strong>
                        <span>@{followed.username}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Profile;
