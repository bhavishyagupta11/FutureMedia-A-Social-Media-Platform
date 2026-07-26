import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import ProfileImage from '../../img/profileImg.jpg';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './SuggestedUsers.css';

const SuggestedUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});
  const [loadingFollow, setLoadingFollow] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiFetch('/api/v1/users/suggested');
        if (res.ok) {
          const payload = await res.json();
          const data = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
          setUsers(data.slice(0, 5)); // Limit to 5
        }
      } catch (err) {
        console.error("Failed to fetch suggested users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleFollow = async (userId) => {
    try {
      setLoadingFollow(prev => ({ ...prev, [userId]: true }));
      const isFollowing = followingMap[userId];
      
      const endpoint = isFollowing
        ? `/api/v1/users/${userId}/unfollow`
        : `/api/v1/users/${userId}/follow`;
        
      const response = await apiFetch(endpoint, { method: "POST" });
      if (!response.ok) { 
        const errData = await response.json();
        toast.error(errData?.message || "Could not update follow status"); 
        return; 
      }

      setFollowingMap(prev => ({ ...prev, [userId]: !isFollowing }));
      toast.success(isFollowing ? "Unfollowed" : "Following!", { autoClose: 1500 });
    } catch { 
      toast.error("Network error"); 
    } finally { 
      setLoadingFollow(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (loading) return <div className="glass-card suggested-loading">Loading suggestions...</div>;

  return (
    <div className="glass-card SuggestedUsers">
      <h3>Suggested for you</h3>
      <div className="suggestions-list">
        {users.length === 0 ? (
          <p className="no-suggestions">No suggestions right now.</p>
        ) : (
          users.map(user => {
            const isFollowing = followingMap[user._id];
            const isLoading = loadingFollow[user._id];
            return (
              <div key={user._id} className="suggestion-item">
                <Link to={`/profile/${user._id}`} className="suggestion-avatar">
                  <img src={user.profilePicture || ProfileImage} alt={user.username} />
                </Link>
                <div className="suggestion-info">
                  <Link to={`/profile/${user._id}`}>
                    <strong>{user.displayName || user.username}</strong>
                  </Link>
                  <span>@{user.username}</span>
                </div>
                <button 
                  className={`follow-btn ${isFollowing ? 'following' : ''}`}
                  onClick={() => handleFollow(user._id)}
                  disabled={isLoading}
                >
                  {isLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
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
