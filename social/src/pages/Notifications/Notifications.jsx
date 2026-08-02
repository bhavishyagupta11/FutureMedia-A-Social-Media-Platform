import React, { useState, useEffect } from "react";
import "./Notifications.css";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Heart, MessageCircle, UserPlus, Star, Check, X, ArrowRight } from "lucide-react";
import ProfileImage from "../../img/profileImg.jpg";
import { apiFetch } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await apiFetch("/api/v1/notifications");
      if (response.ok) {
        const payload = await response.json();
        const data = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type) => {
    const t = (type || "").toLowerCase();
    switch (t) {
      case "like": return <Heart size={14} color="#fff" fill="#fff" />;
      case "comment": return <MessageCircle size={14} color="#fff" fill="#fff" />;
      case "follow":
      case "follow_request": return <UserPlus size={14} color="#fff" />;
      case "mention": return <Star size={14} color="#fff" fill="#fff" />;
      default: return <Bell size={14} color="#fff" />;
    }
  };

  const getIconColor = (type) => {
    const t = (type || "").toLowerCase();
    switch (t) {
      case "like": return "#f43f5e";
      case "comment": return "#3b82f6";
      case "follow":
      case "follow_request": return "#10b981";
      case "mention": return "#eab308";
      default: return "var(--color-primary)";
    }
  };

  const handleAcceptRequest = async (notif) => {
    const senderId = notif.sender?._id || notif.sender;
    const notifId = notif._id;
    if (!senderId) return;

    try {
      setActionLoading(prev => ({ ...prev, [notifId]: true }));
      const res = await apiFetch(`/api/v1/users/follow-requests/${senderId}/accept`, { method: "POST" });
      if (res.ok) {
        toast.success("Follow request accepted!");
        setNotifications(prev => prev.map(n => n._id === notifId ? {
          ...n,
          type: "follow",
          body: "is now following you",
          sender: { ...n.sender, relationshipStatus: "following" }
        } : n));
      } else {
        const data = await res.json();
        toast.error(data?.message || "Failed to accept request");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setActionLoading(prev => ({ ...prev, [notifId]: false }));
    }
  };

  const handleRejectRequest = async (notif) => {
    const senderId = notif.sender?._id || notif.sender;
    const notifId = notif._id;
    if (!senderId) return;

    try {
      setActionLoading(prev => ({ ...prev, [notifId]: true }));
      const res = await apiFetch(`/api/v1/users/follow-requests/${senderId}/reject`, { method: "POST" });
      if (res.ok) {
        toast.info("Follow request removed");
        await apiFetch(`/api/v1/notifications/${notifId}`, { method: "DELETE" });
        setNotifications(prev => prev.filter(n => n._id !== notifId));
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setActionLoading(prev => ({ ...prev, [notifId]: false }));
    }
  };

  const handleNotificationClick = (notif) => {
    const t = (notif.type || "").toLowerCase();
    const senderHandle = notif.sender?.username;
    
    if (notif.deepLink) {
      navigate(notif.deepLink);
      return;
    }

    if (t === "follow_request" || t === "follow") {
      if (senderHandle) navigate(`/profile/${senderHandle}`);
    } else if (t === "message") {
      navigate("/messages");
    } else if (notif.entityId) {
      navigate(`/post/${notif.entityId}`);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await apiFetch("/api/v1/notifications/read-all", { method: "PUT" });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success("All notifications marked as read");
      }
    } catch (e) {
      console.error(e);
    }
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
          {notifications.length > 0 && (
            <button className="primaryCTA" style={{ padding: "8px 16px", fontSize: "14px" }} onClick={markAllRead}>
              Mark all as read
            </button>
          )}
        </div>

        <div className="notificationsItems">
          {loading ? (
            <div className="notificationsEmptyState">
              <h2>Loading notifications...</h2>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notificationsEmptyState">
              <Bell size={64} className="emptyStateIcon" />
              <h2>You're all caught up!</h2>
              <p>When you interact with creators or receive follow requests, your notifications will appear here.</p>
              
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
            <AnimatePresence>
              {notifications.map((notif, index) => {
                const sender = notif.sender || {};
                const senderName = sender.displayName || sender.username || "Someone";
                const senderHandle = sender.username || "user";
                const avatar = sender.profilePicture || ProfileImage;
                const type = (notif.type || "").toLowerCase();
                const isBusy = actionLoading[notif._id];

                return (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    key={notif._id}
                    className={`notificationItem ${!notif.read ? "unread" : ""}`}
                  >
                    {/* SENDER AVATAR - CLICKABLE TO PROFILE */}
                    <div 
                      className="notificationAvatarWrapper"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/profile/${senderHandle}`)}
                    >
                      <img src={avatar} alt={senderName} className="notificationAvatar" />
                      <div className="notificationTypeBadge" style={{ backgroundColor: getIconColor(type) }}>
                        {getIconForType(type)}
                      </div>
                    </div>
                    
                    {/* NOTIFICATION CONTENT */}
                    <div className="notificationContent" onClick={() => handleNotificationClick(notif)} style={{ cursor: "pointer" }}>
                      <p>
                        <strong 
                          style={{ cursor: "pointer" }}
                          onClick={(e) => { e.stopPropagation(); navigate(`/profile/${senderHandle}`); }}
                        >
                          {senderName}
                        </strong>{" "}
                        {notif.body}
                      </p>
                      <span className="notificationTime">{new Date(notif.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>

                    {/* ACTION AREA */}
                    <div className="notificationActions">
                      {type === "follow_request" ? (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            className="notif-btn notif-accept"
                            onClick={() => handleAcceptRequest(notif)}
                            disabled={isBusy}
                          >
                            <Check size={14} /> Accept
                          </button>
                          <button
                            className="notif-btn notif-delete"
                            onClick={() => handleRejectRequest(notif)}
                            disabled={isBusy}
                          >
                            <X size={14} /> Delete
                          </button>
                        </div>
                      ) : type === "follow" ? (
                        <button
                          className="notif-btn notif-view"
                          onClick={() => navigate(`/profile/${senderHandle}`)}
                        >
                          Visit Profile
                        </button>
                      ) : (
                        <button
                          className="notif-btn notif-view"
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>

                    {!notif.read && <div className="unreadIndicator" />}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Notifications;
