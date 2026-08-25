import React, { useState, useEffect } from "react";
import "./Profile.css";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { getStoredUserProfile, resolveAvatar } from "../../utils/session";
import ProfileImage from "../../img/profileImg.jpg";
import { CREATORS, POST_MEDIA } from "../../constants/mediaAssets";
import { toast } from "react-toastify";
import { Lock, Heart, MessageCircle, Check, X, ShieldAlert, Settings as SettingsIcon } from "lucide-react";
import StoryViewer from "../../components/Stories/StoryViewer";

const CREATORS_PROFILES_MAP = {
  bhavishyagupta: {
    _id: "bhavishya-gupta-id",
    username: CREATORS.bhavishya.username,
    displayName: CREATORS.bhavishya.name,
    profession: "Digital creator • Photography • Technology",
    bio: "Building ideas for the future. Exploring generative design systems, photography, and creative code.",
    location: "Bangalore, India",
    profilePicture: CREATORS.bhavishya.avatar,
    followers: ["u1", "u2", "u3", "u4"],
    following: ["u1", "u2"],
    isPrivate: false,
    mockPosts: [
      { _id: "b-p1", imageUrl: POST_MEDIA.creativeCoding, caption: "Kinetic WebGL shaders running at 60fps", likes: [1,2,3,4], comments: [1,2] },
      { _id: "b-p2", imageUrl: POST_MEDIA.urbanSunset, caption: "City dusk sunset and atmospheric skyline", likes: [1,2,3], comments: [1] },
      { _id: "b-p3", imageUrl: POST_MEDIA.galleryPhoto3, caption: "Micro shader experiments in real-time", likes: [1,2,3,4,5], comments: [1,2,3] }
    ]
  },
  snehilkhokhar: {
    _id: "snehil-khokhar-id",
    username: CREATORS.snehil.username,
    displayName: CREATORS.snehil.name,
    profession: "Street & Documentary Photographer",
    bio: "Chasing evening light, 35mm prime grain, and geometry in urban spaces.",
    location: "Delhi, India",
    profilePicture: CREATORS.snehil.avatar,
    followers: ["u1", "u2", "u3"],
    following: ["u1"],
    isPrivate: false,
    mockPosts: [
      { _id: "s-p1", imageUrl: POST_MEDIA.streetPhoto, caption: "Street Light Study on 35mm f/1.4", likes: [1,2,3], comments: [1] },
      { _id: "s-p2", imageUrl: POST_MEDIA.galleryPhoto2, caption: "Dusk Waves & long exposure shadows", likes: [1,2], comments: [] },
      { _id: "s-p3", imageUrl: POST_MEDIA.cameraLens, caption: "Shadows 02 series", likes: [1,2,3,4], comments: [1,2] }
    ]
  },
  sahilsingh: {
    _id: "sahil-singh-id",
    username: CREATORS.sahil.username,
    displayName: CREATORS.sahil.name,
    profession: "Spatial UI & Design Systems Architect",
    bio: "Obsessed with micro-interactions, layout physics, and tactile software.",
    location: "Mumbai, India",
    profilePicture: CREATORS.sahil.avatar,
    followers: ["u1", "u2", "u3", "u4"],
    following: ["u1", "u2", "u3"],
    isPrivate: false,
    mockPosts: [
      { _id: "sa-p1", imageUrl: POST_MEDIA.designWorkspace, caption: "Design system tokens and workspace setup", likes: [1,2,3], comments: [1] },
      { _id: "sa-p2", imageUrl: POST_MEDIA.abstractShapes, caption: "Geometric abstraction study", likes: [1,2], comments: [] },
      { _id: "sa-p3", imageUrl: POST_MEDIA.architecture, caption: "Architectural minimal forms", likes: [1,2,3,4], comments: [1] }
    ]
  }
};

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
  const [userStoriesGroup, setUserStoriesGroup] = useState(null);
  const [showStoryViewer, setShowStoryViewer] = useState(false);

  useEffect(() => {
    setError(false);
    const identifier = profileIdentifier || "me";
    const normalizedKey = identifier.toLowerCase().replace("@", "");

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

        apiFetch(`/api/v1/stories/user/${userData._id}`)
          .then(res => res.ok ? res.json() : null)
          .then(storiesPayload => {
            if (storiesPayload && storiesPayload.data && storiesPayload.data.stories?.length > 0) {
              setUserStoriesGroup(storiesPayload.data);
            } else {
              setUserStoriesGroup(null);
            }
          })
          .catch(() => setUserStoriesGroup(null));
      })
      .catch((err) => {
        console.error(err);
        if (CREATORS_PROFILES_MAP[normalizedKey]) {
          const creatorData = CREATORS_PROFILES_MAP[normalizedKey];
          setUser(creatorData);
          setPosts(creatorData.mockPosts || []);
          setError(false);
        } else {
          setError(true);
        }
      });

    fetchUserPosts(identifier);
  }, [profileIdentifier, currentUserId]);

  const fetchUserPosts = (identifier) => {
    const normalizedKey = identifier.toLowerCase().replace("@", "");
    apiFetch(`/api/v1/posts/user/${identifier}`)
      .then((r) => r.ok ? r.json() : [])
      .then((payload) => {
        const postsData = payload.data || payload;
        const finalPosts = Array.isArray(postsData) ? postsData : [];
        if (finalPosts.length > 0) {
          setPosts(finalPosts);
        } else if (CREATORS_PROFILES_MAP[normalizedKey]) {
          setPosts(CREATORS_PROFILES_MAP[normalizedKey].mockPosts || []);
        }
      })
      .catch(() => {
        if (CREATORS_PROFILES_MAP[normalizedKey]) {
          setPosts(CREATORS_PROFILES_MAP[normalizedKey].mockPosts || []);
        }
      });
  };

  const handleFollow = async () => {
    try {
      setLoadingFollow(true);
      const isMock = String(user?._id).endsWith("-id");

      if (isMock) {
        setIsFollowing(!isFollowing);
        toast.success(isFollowing ? "Unfollowed creator" : "Following creator!");
        return;
      }

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
        toast.info("Follow request sent");
      } else if (payload.following || payload.status === "following") {
        setIsFollowing(true);
        setIsRequested(false);
        toast.success("Following user");
      } else {
        setIsFollowing(false);
        setIsRequested(false);
        toast.info("Unfollowed user");
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
      const res = await apiFetch(`/api/v1/users/${user._id}/accept-follow`, { method: "POST" });
      if (res.ok) {
        setHasIncomingRequest(false);
        toast.success("Follow request accepted!");
        if (user.followers && !user.followers.some(f => String(f._id || f) === String(currentUserId))) {
          setUser(prev => ({
            ...prev,
            followers: [...(prev.followers || []), currentUserId]
          }));
        }
      } else {
        toast.error("Failed to accept request");
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
      const res = await apiFetch(`/api/v1/users/${user._id}/reject-follow`, { method: "POST" });
      if (res.ok) {
        setHasIncomingRequest(false);
        toast.info("Follow request rejected");
      } else {
        toast.error("Failed to reject request");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoadingFollow(false);
    }
  };

  if (error) {
    return (
      <div className="ProfilePage">
        <div className="emptyState" style={{ background: "var(--fm-surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--fm-border)" }}>
          <h2>Profile Not Found</h2>
          <p>The user you are looking for does not exist or has been removed.</p>
          <button className="primaryCTA" onClick={() => navigate("/home")} style={{ marginTop: "1rem" }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="ProfilePage">
        <div className="profileLoading">
          <div className="profileLoadingSpinner" />
        </div>
      </div>
    );
  }

  const isOwnProfile = String(user._id) === String(currentUserId) || (!profileIdentifier || profileIdentifier === "me");
  const isAuthorized = !user.isPrivate || isFollowing || isOwnProfile;
  const avatarUrl = resolveAvatar(user);

  return (
    <div className="ProfilePage">
      {/* INCOMING FOLLOW REQUEST BANNER */}
      {hasIncomingRequest && (
        <div className="incoming-request-banner">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <ShieldAlert color="var(--fm-primary)" size={24} />
            <div>
              <strong style={{ color: "var(--fm-text)", display: "block" }}>Follow Request</strong>
              <span style={{ color: "var(--fm-text-secondary)", fontSize: "0.9rem" }}>@{user.username} wants to follow your account.</span>
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
          className={`profileAvatarWrapper ${userStoriesGroup ? 'has-active-story' : ''}`}
          onClick={() => {
            if (userStoriesGroup) setShowStoryViewer(true);
          }}
          title={userStoriesGroup ? "Click to view story" : ""}
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
                <>
                  <button className="profileBtn editBtn" onClick={() => navigate("/profile/edit")}>
                    Edit profile
                  </button>
                  <button className="profileBtn settingsBtn" onClick={() => navigate("/settings")} title="Settings" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <SettingsIcon size={16} /> Settings
                  </button>
                </>
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
          <div className="privateProfileGuard">
            <div className="lockIconCircle">
              <Lock size={32} color="var(--fm-primary)" />
            </div>
            <h2>This Account is Private</h2>
            <p>
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
                    const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
                    const fullUrl = image ? (image.startsWith("http") ? image : `${API_BASE}${image}`) : null;

                    return (
                      <div 
                        key={post._id} 
                        className="profileGridItem"
                        onClick={() => navigate(`/post/${post._id}`)}
                      >
                        {fullUrl ? (
                          isVideo ? (
                            <video src={fullUrl} className="gridMedia" />
                          ) : (
                            <img src={fullUrl} alt="Post" className="gridMedia" loading="lazy" />
                          )
                        ) : (
                          <div className="textPostPreview" style={{ padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", fontWeight: 600, color: "var(--fm-text)" }}>
                            <p>{post.caption || "Text Post"}</p>
                          </div>
                        )}
                        <div className="gridOverlay">
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
              <div className="userFollowList">
                {user.followers?.length === 0 ? (
                  <div className="emptyState"><p>No followers yet</p></div>
                ) : (
                  user.followers?.map((follower) => {
                    const fName = follower.displayName || follower.username || "User";
                    const fHandle = follower.username || follower._id || "user";
                    const fAvatar = follower.profilePicture || ProfileImage;
                    return (
                      <div
                        key={follower._id || follower}
                        className="userFollowItem"
                        onClick={() => navigate(`/profile/${fHandle}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <img src={fAvatar} alt={fName} className="userFollowAvatar" />
                        <div className="userFollowInfo">
                          <strong style={{ color: "var(--fm-text)" }}>{fName}</strong>
                          <span>@{fHandle}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === "following" && (
              <div className="userFollowList">
                {user.following?.length === 0 ? (
                  <div className="emptyState"><p>Not following anyone yet</p></div>
                ) : (
                  user.following?.map((followed) => {
                    const fName = followed.displayName || followed.username || "User";
                    const fHandle = followed.username || followed._id || "user";
                    const fAvatar = followed.profilePicture || ProfileImage;
                    return (
                      <div
                        key={followed._id || followed}
                        className="userFollowItem"
                        onClick={() => navigate(`/profile/${fHandle}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <img src={fAvatar} alt={fName} className="userFollowAvatar" />
                        <div className="userFollowInfo">
                          <strong style={{ color: "var(--fm-text)" }}>{fName}</strong>
                          <span>@{fHandle}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showStoryViewer && userStoriesGroup && (
        <StoryViewer
          storyGroups={[userStoriesGroup]}
          initialGroupIndex={0}
          onClose={() => setShowStoryViewer(false)}
        />
      )}
    </div>
  );
};

export default Profile;
