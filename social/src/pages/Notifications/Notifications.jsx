import React, { useState, useEffect } from "react";
import "./Notifications.css";
import { motion } from "framer-motion";
import { Bell, Heart, MessageCircle, UserPlus, Star } from "lucide-react";
import ProfileImage from "../../img/profileImg.jpg";
import { apiFetch } from "../../utils/api";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await apiFetch("/api/v1/notifications");
        if (response.ok) {
          const payload = await response.json();
          const data = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
          if (data.length > 0) {
            // Group them simply as "Recent"
            setNotifications([{ group: "Recent", items: data.map(n => ({
              id: n._id,
              type: n.type.toLowerCase(),
              user: { name: n.sender?.displayName || n.sender?.username, handle: n.sender?.username, avatar: n.sender?.profilePicture || ProfileImage },
              message: n.body,
              time: new Date(n.createdAt).toLocaleDateString(),
              unread: !n.read,
              link: n.deepLink
            })) }]);
          } else {
            setNotifications([]);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const getIconForType = (type) => {
    switch (type) {
      case "like": return <Heart size={14} color="#fff" fill="#fff" />;
      case "comment": return <MessageCircle size={14} color="#fff" fill="#fff" />;
      case "follow": return <UserPlus size={14} color="#fff" />;
      case "mention": return <Star size={14} color="#fff" fill="#fff" />;
      default: return <Bell size={14} color="#fff" />;
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case "like": return "#f43f5e";
      case "comment": return "#3b82f6";
      case "follow": return "#10b981";
      case "mention": return "#eab308";
      default: return "var(--color-primary)";
    }
  };

  const markAsRead = async (groupId, notifId) => {
    try {
      const res = await apiFetch(`/api/v1/notifications/${notifId}/read`, { method: "PUT" });
      if (res.ok) {
        setNotifications(notifications.map(group => {
          if (group.group === groupId) {
            return {
              ...group,
              items: group.items.map(n => n.id === notifId ? { ...n, unread: false } : n)
            };
          }
          return group;
        }));
      }
    } catch (e) { console.error(e); }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="NotificationsPage"
    >
      <div className="notifications-timeline">
        <div className="notificationsHeader" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Notifications</h1>
          <button 
            className="primaryCTA" 
            style={{ padding: "8px 16px", fontSize: "14px" }}
            onClick={async () => {
              try {
                const res = await apiFetch("/api/v1/notifications/read-all", { method: "PUT" });
                if (res.ok) {
                  setNotifications(notifications.map(group => ({
                    ...group,
                    items: group.items.map(n => ({ ...n, unread: false }))
                  })));
                }
              } catch (e) { console.error(e); }
            }}
          >
            Mark all as read
          </button>
        </div>

        <div className="notificationsItems">
          {loading ? (
            <div className="notificationsEmptyState">
              <h2>Loading...</h2>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notificationsEmptyState">
              <Bell size={64} className="emptyStateIcon" />
              <h2>You're all caught up!</h2>
              <p>When you interact with others or they interact with you, your notifications will appear here.</p>
              
              <div className="emptyStateSuggestions">
                <div className="suggestionBox" onClick={() => navigate('/search')}>
                  <UserPlus size={24} />
                  <span>Find Friends</span>
                </div>
                <div className="suggestionBox" onClick={() => navigate('/explore')}>
                  <Star size={24} />
                  <span>Trending Posts</span>
                </div>
              </div>

              <button className="primaryCTA" onClick={() => navigate('/explore')}>Explore FutureMedia</button>
            </div>
          ) : (
            notifications.map((group, gIndex) => (
              <div key={gIndex} className="notificationGroup">
                <h3 className="notificationGroupTitle">{group.group}</h3>
                {group.items.map((notif, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={notif.id}
                    className={`notificationItem ${notif.unread ? "unread" : ""}`}
                    onClick={() => markAsRead(group.group, notif.id)}
                  >
                    <div className="notificationAvatarWrapper">
                      <img src={notif.user.avatar} alt="User" className="notificationAvatar" />
                      <div className="notificationTypeBadge" style={{ backgroundColor: getIconColor(notif.type) }}>
                        {getIconForType(notif.type)}
                      </div>
                    </div>
                    
                    <div className="notificationContent">
                      <p>
                        <strong>{notif.user.name}</strong> {notif.message}
                      </p>
                      <span className="notificationTime">{notif.time}</span>
                    </div>

                    {notif.type === "follow" ? (
                      <button className="notification-action-btn">Follow</button>
                    ) : notif.postImage ? (
                      <img src={notif.postImage} alt="Post preview" className="notificationPostPreview" />
                    ) : null}

                    {notif.unread && <div className="unreadIndicator" />}
                  </motion.div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Notifications;
