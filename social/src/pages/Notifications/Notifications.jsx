import React, { useState, useEffect } from "react";
import "./Notifications.css";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Heart, MessageCircle, UserPlus, Star, Check, X, ArrowRight } from "lucide-react";
import ProfileImage from "../../img/profileImg.jpg";
import { CREATORS } from "../../constants/mediaAssets";
import { apiFetch } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const DEFAULT_NOTIFICATIONS = [
  {
    _id: "notif-1",
    sender: { displayName: CREATORS.snehil.name, username: CREATORS.snehil.username, profilePicture: CREATORS.snehil.avatar },
    type: "like",
    body: "liked your latest photo series.",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    _id: "notif-2",
    sender: { displayName: CREATORS.sahil.name, username: CREATORS.sahil.username, profilePicture: CREATORS.sahil.avatar },
    type: "comment",
    body: "commented: 'The motion curves look incredibly fluid!'",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    _id: "notif-3",
    sender: { displayName: CREATORS.priya.name, username: CREATORS.priya.username, profilePicture: CREATORS.priya.avatar },
    type: "follow",
    body: "started following you.",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  }
];

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
        setNotifications(data.length > 0 ? data : DEFAULT_NOTIFICATIONS);
      } else {
        setNotifications(DEFAULT_NOTIFICATIONS);
      }
    } catch (e) {
      setNotifications(DEFAULT_NOTIFICATIONS);
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
      case "like": return "var(--fm-primary)";
      case "comment": return "#5B96E8";
      case "follow":
      case "follow_request": return "var(--fm-sage-dark)";
      case "mention": return "#D9822B";
      default: return "var(--fm-primary)";
    }
  };

  const handleAcceptRequest = async (notif) => {
    const senderId = notif.sender?._id || notif.sender;
    if (!senderId) return;

    if (String(notif._id).startsWith("notif-")) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isAccepted: true } : n))
      );
      toast.success("Follow request accepted!");
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [notif._id]: true }));
      const response = await apiFetch(`/api/v1/users/${senderId}/accept-follow`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Follow request accepted!");
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isAccepted: true } : n))
        );
      } else {
        toast.error(data.message || "Failed to accept request");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [notif._id]: false }));
    }
  };

  const handleRejectRequest = async (notif) => {
    const senderId = notif.sender?._id || notif.sender;
    if (!senderId) return;

    if (String(notif._id).startsWith("notif-")) {
      setNotifications((prev) => prev.filter((n) => n._id !== notif._id));
      toast.info("Follow request rejected");
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [notif._id]: true }));
      const response = await apiFetch(`/api/v1/users/${senderId}/reject-follow`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast.info("Follow request rejected");
        setNotifications((prev) => prev.filter((n) => n._id !== notif._id));
      } else {
        toast.error(data.message || "Failed to reject request");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [notif._id]: false }));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiFetch("/api/v1/notifications/read-all", { method: "PUT" });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read && !String(notif._id).startsWith("notif-")) {
      try {
        await apiFetch(`/api/v1/notifications/${notif._id}/read`, { method: "PUT" });
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
      } catch (e) {
        console.error(e);
      }
    }

    if (notif.post) {
      navigate(`/post/${notif.post._id || notif.post}`);
    } else if (notif.sender) {
      navigate(`/profile/${notif.sender.username || notif.sender._id || notif.sender}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="NotificationsPage"
    >
      <div className="notificationsContainer">
        <div className="notificationsHeader">
          <h1>Notifications</h1>
          {notifications.some(n => !n.read) && (
            <button className="markAllReadBtn" onClick={handleMarkAllAsRead}>
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
                      {type === "follow_request" && !notif.isAccepted ? (
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
                      ) : type === "follow_request" && notif.isAccepted ? (
                        <span className="requestAcceptedText">Accepted</span>
                      ) : notif.post ? (
                        <button className="viewPostBtn" onClick={() => handleNotificationClick(notif)}>
                          <ArrowRight size={16} />
                        </button>
                      ) : null}
                    </div>
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
