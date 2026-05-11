import React, { useEffect, useState } from "react";
import "./Profile.css";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { getSessionUserId } from "../../utils/session";
import ProfileImage from "../../img/profileImg.jpg";
import { toast } from "react-toastify";

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

    apiFetch(`/api/users/${profileId}`)
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

    apiFetch(`/api/posts/user/${profileId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [profileId, currentUserId, navigate]);

  const handleFollow = async () => {
    try {
      setLoadingFollow(true);
      const endpoint = isFollowing
        ? `/api/users/unfollow/${profileId}`
        : `/api/users/follow/${profileId}`;
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
    <div className="ProfilePage">
      {/* Cover + Avatar */}
      <div className="profileCover">
        <div className="profileCoverGradient" />
        <div className="profileAvatarWrapper">
          <img src={avatarUrl} alt={user.username} className="profileAvatar" />
        </div>
      </div>

      {/* Info */}
      <div className="profileInfo">
        <div className="profileNames">
          <h2>{user.displayName || user.username}</h2>
          <span className="profileUsername">@{user.username}</span>
          {user.bio && <p className="profileBio">{user.bio}</p>}
          {user.website && (
            <a href={user.website} target="_blank" rel="noreferrer" className="profileWebsite">
              🔗 {user.website}
            </a>
          )}
        </div>

        <div className="profileStats">
          <div className="statItem">
            <strong>{posts.length}</strong>
            <span>Posts</span>
          </div>
          <div className="statItem" onClick={() => setTab("followers")} style={{ cursor: "pointer" }}>
            <strong>{user.followers?.length || 0}</strong>
            <span>Followers</span>
          </div>
          <div className="statItem" onClick={() => setTab("following")} style={{ cursor: "pointer" }}>
            <strong>{user.following?.length || 0}</strong>
            <span>Following</span>
          </div>
        </div>

        <div className="profileActions">
          {isOwnProfile ? (
            <button className="button profileBtn editBtn" onClick={() => navigate("/profile/edit")}>
              ✏️ Edit Profile
            </button>
          ) : (
            <button
              className={`button profileBtn ${isFollowing ? "unfollowBtn" : "followBtn"}`}
              onClick={handleFollow}
              disabled={loadingFollow}
            >
              {loadingFollow ? "…" : isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}
          {!isOwnProfile && (
            <button className="button profileBtn messageBtn" onClick={() => navigate("/chat", { state: { startChatWith: profileId } })}>
              💬 Message
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="profileTabs">
        <button className={`tab ${tab === "posts" ? "activeTab" : ""}`} onClick={() => setTab("posts")}>Posts</button>
        <button className={`tab ${tab === "followers" ? "activeTab" : ""}`} onClick={() => setTab("followers")}>Followers</button>
        <button className={`tab ${tab === "following" ? "activeTab" : ""}`} onClick={() => setTab("following")}>Following</button>
      </div>

      {/* Tab content */}
      <div className="profileTabContent">
        {tab === "posts" && (
          <div className="profilePostsGrid">
            {posts.length === 0 ? (
              <p className="profileEmpty">No posts yet.</p>
            ) : (
              posts.map((post) => (
                <div className="profilePostThumb" key={post._id}>
                  <img src={post.imageUrl} alt={post.caption || "post"} />
                  <div className="profilePostOverlay">
                    <span>❤️ {post.likes?.length || 0}</span>
                    <span>💬 {post.comments?.length || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "followers" && (
          <div className="profilePeopleList">
            {(user.followers || []).length === 0 ? (
              <p className="profileEmpty">No followers yet.</p>
            ) : (
              user.followers.map((f) => {
                const fid = f._id || f;
                const fname = f.displayName || f.username || "User";
                const favatar = f.profilePicture || ProfileImage;
                return (
                  <div className="profilePersonRow" key={String(fid)} onClick={() => navigate(`/profile/${fid}`)}>
                    <img src={favatar} alt={fname} />
                    <div>
                      <strong>{fname}</strong>
                      {f.username && <span>@{f.username}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "following" && (
          <div className="profilePeopleList">
            {(user.following || []).length === 0 ? (
              <p className="profileEmpty">Not following anyone yet.</p>
            ) : (
              user.following.map((f) => {
                const fid = f._id || f;
                const fname = f.displayName || f.username || "User";
                const favatar = f.profilePicture || ProfileImage;
                return (
                  <div className="profilePersonRow" key={String(fid)} onClick={() => navigate(`/profile/${fid}`)}>
                    <img src={favatar} alt={fname} />
                    <div>
                      <strong>{fname}</strong>
                      {f.username && <span>@{f.username}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
