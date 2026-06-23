import React, { useState, useEffect } from "react";
import "./Notifications.css";
import { motion } from "framer-motion";
import { Bell, Heart, MessageCircle, UserPlus, Star } from "lucide-react";
import ProfileImage from "../../img/profileImg.jpg";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking grouped notifications
    const mockNotifications = [
      {
        group: "Today",
        items: [
          {
            id: "1",
            type: "like",
            user: { name: "Sarah Connor", handle: "sarahc", avatar: ProfileImage },
            message: "liked your recent post about technology.",
            time: "2 mins ago",
            unread: true,
            postImage: "https://via.placeholder.com/150",
          },
          {
            id: "2",
            type: "comment",
            user: { name: "John Doe", handle: "johndoe", avatar: ProfileImage },
            message: "commented: 'This is an amazing insight!'",
            time: "1 hour ago",
            unread: true,
            postImage: "https://via.placeholder.com/150",
          }
        ]
      },
      {
        group: "Yesterday",
        items: [
          {
            id: "3",
            type: "follow",
            user: { name: "Alice Smith", handle: "alice_s", avatar: ProfileImage },
            message: "started following you.",
            time: "1d",
            unread: false,
          }
        ]
      },
      {
        group: "This Week",
        items: [
          {
            id: "4",
            type: "mention",
            user: { name: "Tech Weekly", handle: "techweekly", avatar: ProfileImage },
            message: "mentioned you in a post.",
            time: "3d",
            unread: false,
            postImage: "https://via.placeholder.com/150",
          }
        ]
      }
    ];

    setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 500);
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

  const markAsRead = (groupId, notifId) => {
    setNotifications(notifications.map(group => {
      if (group.group === groupId) {
        return {
          ...group,
          items: group.items.map(n => n.id === notifId ? { ...n, unread: false } : n)
        };
      }
      return group;
    }));
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
        <div className="notificationsHeader">
          <h1>Notifications</h1>
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
                <div className="suggestionBox">
                  <UserPlus size={24} />
                  <span>Find Friends</span>
                </div>
                <div className="suggestionBox">
                  <Star size={24} />
                  <span>Trending Posts</span>
                </div>
              </div>

              <button className="primaryCTA">Explore FutureMedia</button>
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
