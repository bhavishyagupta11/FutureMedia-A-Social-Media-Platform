import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import ProfileImage from '../../img/profileImg.jpg';
import { CREATORS } from '../../constants/mediaAssets';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './SuggestedUsers.css';

const DEFAULT_SUGGESTIONS = [
  { _id: 'snehil-default', username: CREATORS.snehil.username, displayName: CREATORS.snehil.name, profilePicture: CREATORS.snehil.avatar },
  { _id: 'sahil-default', username: CREATORS.sahil.username, displayName: CREATORS.sahil.name, profilePicture: CREATORS.sahil.avatar },
  { _id: 'garvit-default', username: CREATORS.garvit.username, displayName: CREATORS.garvit.name, profilePicture: CREATORS.garvit.avatar },
  { _id: 'vipul-default', username: CREATORS.vipul.username, displayName: CREATORS.vipul.name, profilePicture: CREATORS.vipul.avatar },
  { _id: 'priya-default', username: CREATORS.priya.username, displayName: CREATORS.priya.name, profilePicture: CREATORS.priya.avatar },
];

const SuggestedUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMap, setStatusMap] = useState({});
  const [loadingFollow, setLoadingFollow] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiFetch('/api/v1/users/suggested');
        if (res.ok) {
          const payload = await res.json();
          const data = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
          const finalUsers = data.length > 0 ? data.slice(0, 5) : DEFAULT_SUGGESTIONS;
          setUsers(finalUsers);

          const initialStatusMap = {};
          finalUsers.forEach((u) => {
            initialStatusMap[u._id] = u.status || (u.isFollowing ? "following" : (u.isRequested ? "requested" : "none"));
          });
          setStatusMap(initialStatusMap);
        } else {
          setUsers(DEFAULT_SUGGESTIONS);
        }
      } catch (err) {
        setUsers(DEFAULT_SUGGESTIONS);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleFollowToggle = async (user) => {
    const userId = user._id;
    const currentStatus = statusMap[userId] || "none";

    if (String(userId).endsWith("-default")) {
      const nextStatus = currentStatus === "following" ? "none" : "following";
      setStatusMap((prev) => ({ ...prev, [userId]: nextStatus }));
      toast.success(nextStatus === "following" ? `Following @${user.username}!` : `Unfollowed @${user.username}`, { autoClose: 1500 });
      return;
    }

    try {
      setLoadingFollow((prev) => ({ ...prev, [userId]: true }));

      const isActionUnfollow = currentStatus === "following" || currentStatus === "requested";
      const endpoint = isActionUnfollow
        ? `/api/v1/users/${userId}/unfollow`
        : `/api/v1/users/${userId}/follow`;

      const response = await apiFetch(endpoint, { method: "POST" });
      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload?.message || "Could not update follow status");
        return;
      }

      const resData = payload.data || payload;
      const newStatus = resData.status || (resData.requested ? "requested" : (resData.following ? "following" : "none"));

      setStatusMap((prev) => ({ ...prev, [userId]: newStatus }));

      if (newStatus === "requested") {
        toast.info("Follow request sent", { autoClose: 1500 });
      } else if (newStatus === "following") {
        toast.success("Following!", { autoClose: 1500 });
      } else {
        toast.info("Unfollowed", { autoClose: 1500 });
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoadingFollow((prev) => ({ ...prev, [userId]: false }));
    }
  };

  if (loading) return <div className="SuggestedUsers suggested-loading">Loading suggestions...</div>;

  return (
    <div className="SuggestedUsers">
      <h3>Suggested for you</h3>
      <div className="suggestions-list">
        {users.length === 0 ? (
          <p className="no-suggestions">No suggestions right now.</p>
        ) : (
          users.map((user) => {
            const status = statusMap[user._id] || "none";
            const isLoading = loadingFollow[user._id];

            let buttonText = "Follow";
            let buttonClass = "follow-btn";

            if (status === "requested") {
              buttonText = "Requested";
              buttonClass = "follow-btn requested";
            } else if (status === "following") {
              buttonText = "Following";
              buttonClass = "follow-btn following";
            }

            return (
              <div key={user._id} className="suggestion-item">
                <Link to={`/profile/${user.username || user._id}`} className="suggestion-avatar">
                  <img src={user.profilePicture || ProfileImage} alt={user.username} />
                </Link>
                <div className="suggestion-info">
                  <Link to={`/profile/${user.username || user._id}`}>
                    <strong>{user.displayName || user.username}</strong>
                  </Link>
                  <span>@{user.username}</span>
                </div>
                <button
                  className={buttonClass}
                  onClick={() => handleFollowToggle(user)}
                  disabled={isLoading}
                >
                  {isLoading ? '...' : buttonText}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SuggestedUsers;
