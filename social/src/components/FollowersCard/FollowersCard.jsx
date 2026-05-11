import React, { useEffect, useState } from "react";
import "./FollowersCard.css";
import { apiFetch } from "../../utils/api";
import ProfileImage from "../../img/profileImg.jpg";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const FollowersCard = () => {
  const [users, setUsers] = useState([]);
  const [loadingUserId, setLoadingUserId] = useState("");
  const [followedIds, setFollowedIds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/api/users/suggestions")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  }, []);

  const handleFollow = async (user) => {
    try {
      setLoadingUserId(user._id);
      const isFollowing = followedIds.includes(user._id);
      const endpoint = isFollowing
        ? `/api/users/unfollow/${user._id}`
        : `/api/users/follow/${user._id}`;

      const response = await apiFetch(endpoint, { method: "POST" });
      if (!response.ok) { toast.error("Could not update follow"); return; }

      if (isFollowing) {
        setFollowedIds((cur) => cur.filter((id) => id !== user._id));
        toast(`Unfollowed @${user.username}`, { autoClose: 1200 });
      } else {
        setFollowedIds((cur) => [...cur, user._id]);
        toast.success(`Following @${user.username}! 🎉`, { autoClose: 1500 });
      }
      window.dispatchEvent(new Event("profile:updated"));
    } catch { toast.error("Network error"); }
    finally { setLoadingUserId(""); }
  };

  if (users.length === 0) return null;

  return (
    <div className="FollowersCard">
      <h3>Suggested for you</h3>
      {users.map((user) => {
        const isFollowing = followedIds.includes(user._id);
        return (
          <div className="follower" key={user._id}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, cursor: "pointer" }}
              onClick={() => navigate(`/profile/${user._id}`)}>
              <img
                src={user.profilePicture || ProfileImage}
                alt={user.username}
                className="followerImage"
              />
              <div className="name">
                <span>{user.displayName || user.username}</span>
                <span>@{user.username}</span>
              </div>
            </div>
            <button
              className={`button fc-button${isFollowing ? " following" : ""}`}
              onClick={() => handleFollow(user)}
              disabled={loadingUserId === user._id}
            >
              {loadingUserId === user._id ? "…" : isFollowing ? "Unfollow" : "Follow"}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default FollowersCard;
