import React, { useEffect, useState } from "react";
import "./FollowersCard.css";
import { apiFetch } from "../../utils/api";
import ProfileImage from "../../img/profileImg.jpg";
import { getSessionUserId, getStoredUserProfile, persistUserSession } from "../../utils/session";

const FollowersCard = () => {
  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState(getStoredUserProfile().followingList);
  const [loadingUserId, setLoadingUserId] = useState("");

  const fetchUsers = async () => {
    try {
      const response = await apiFetch("/api/users");
      if (!response.ok) {
        console.error("Error fetching users:", response.status);
        setUsers([]);
        return;
      }
      const converted = await response.json();
      setUsers(converted);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const syncSession = () => setFollowing(getStoredUserProfile().followingList);
    window.addEventListener("session:updated", syncSession);
    window.addEventListener("profile:updated", syncSession);
    return () => {
      window.removeEventListener("session:updated", syncSession);
      window.removeEventListener("profile:updated", syncSession);
    };
  }, []);

  const handleFollow = async (follower) => {
    try {
      setLoadingUserId(follower._id);
      
      const isFollowing = following?.includes(follower._id);
      const endpoint = isFollowing ? `/api/users/unfollow/${follower._id}` : `/api/users/follow/${follower._id}`;
      
      const response = await apiFetch(endpoint, {
        method: "POST",
      });

      if (!response.ok) {
        console.error("Error updating follow state:", response.status);
        return;
      }

      // After following/unfollowing, we manually toggle it locally
      const updatedFollowing = isFollowing 
        ? following.filter(id => id !== follower._id)
        : [...(following || []), follower._id];
        
      setFollowing(updatedFollowing);
      
      // Update local storage to keep state synced loosely
      const userProf = getStoredUserProfile();
      userProf.followingList = updatedFollowing;
      persistUserSession(userProf);

      window.dispatchEvent(new Event("profile:updated"));
    } catch (err) {
      console.error("Error updating follow state:", err);
    } finally {
      setLoadingUserId("");
    }
  };

  const currentUserId = getSessionUserId();

  return (
    <div className="FollowersCard">
      <h3>People you may follow</h3>

      {users.length > 0
        ? users
            .filter((item) => item._id !== currentUserId)
            .map((follower) => (
              <div className="follower" key={follower._id}>
                <div>
                  <img
                    src={follower.img || ProfileImage}
                    alt={follower.username}
                    className="followerImage"
                  />
                  <div className="name">
                    <span>{follower.firstName}</span>
                    <span>@{follower.username}</span>
                  </div>
                </div>

                <button
                  className="button fc-button"
                  onClick={() => handleFollow(follower)}
                  disabled={loadingUserId === follower._id}
                >
                  {loadingUserId === follower._id
                    ? "Saving..."
                    : following?.includes(follower._id)
                      ? "Unfollow"
                      : "Follow"}
                </button>
              </div>
            ))
        : null}
    </div>
  );
};

export default FollowersCard;
