import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Chat.css";
import { useNavigate, useLocation } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { getSessionUserId } from "../../utils/session";
import ProfileImage from "../../img/profileImg.jpg";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, X, MessageCircleMore, MoreVertical } from "lucide-react";

const ENDPOINT = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
let socket;

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserId = getSessionUserId();
  const messagesEndRef = useRef();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typing, setTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const activeChatRef = useRef(activeChat);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  // Setup socket connection
  useEffect(() => {
    if (!currentUserId) { navigate("/"); return; }
    socket = io(ENDPOINT);
    socket.emit("setup", { _id: currentUserId });
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
    return () => { socket.disconnect(); };
  }, [currentUserId, navigate]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      const active = activeChatRef.current;
      if (!active || active._id !== msg.chat?._id) {
        toast(`💬 New message from @${msg.sender?.username || "someone"}`, { autoClose: 3000 });
        setChats((prev) => prev.map((c) =>
          c._id === msg.chat?._id ? { ...c, latestMessage: msg } : c
        ));
      } else {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on("message received", handler);
    return () => socket.off("message received", handler);
  }, []);

  // Fetch existing chats
  const fetchChats = useCallback(() => {
    apiFetch("/api/v1/chat")
      .then((r) => r.ok ? r.json() : [])
      .then((res) => {
        const data = res.data || res;
        setChats(Array.isArray(data) ? data : []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  // Auto-start chat if navigated with state
  useEffect(() => {
    const startWith = location.state?.startChatWith;
    if (startWith) openChatWith(startWith);
  }, []); // eslint-disable-line

  const openChatWith = async (userId) => {
    try {
      const r = await apiFetch("/api/v1/chat/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!r.ok) return;
      const payload = await r.json();
      const chat = payload.data || payload;
      if (!chat || !chat._id) return;

      setActiveChat(chat);
      loadMessages(chat._id);
      fetchChats();
      if (socket) socket.emit("join chat", chat._id);
      apiFetch(`/api/v1/chat/${chat._id}/read`, { method: "PUT" }).catch(console.error);
    } catch (e) { console.error(e); }
  };

  const loadMessages = async (chatId) => {
    if (!chatId) return;
    setLoadingMessages(true);
    try {
      const r = await apiFetch(`/api/v1/chat/messages/${chatId}`);
      if (!r.ok) return;
      const payload = await r.json();
      const data = payload.data || payload;
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoadingMessages(false); }
  };

  const selectChat = (chat) => {
    if (!chat || !chat._id) return;
    setActiveChat(chat);
    loadMessages(chat._id);
    if (socket) socket.emit("join chat", chat._id);
    setIsTyping(false);
    apiFetch(`/api/v1/chat/${chat._id}/read`, { method: "PUT" }).catch(console.error);
  };

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || !activeChat || !activeChat._id) return;

    if (socket) socket.emit("stop typing", activeChat._id);
    setTyping(false);
    setNewMessage("");

    try {
      const r = await apiFetch("/api/v1/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: activeChat._id, content }),
      });
      if (!r.ok) return;
      const payload = await r.json();
      const msg = payload.data || payload;
      
      if (socket) socket.emit("new message", { ...msg, chat: { ...activeChat, participants: activeChat.participants } });
      setMessages((prev) => [...prev, msg]);
      fetchChats();
    } catch (e) { console.error(e); }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected || !activeChat) return;
    if (!typing) {
      setTyping(true);
      if (socket) socket.emit("typing", activeChat._id);
    }
    const lastTypingTime = new Date().getTime();
    const timerLength = 3000;
    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        if (socket) socket.emit("stop typing", activeChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  // Search users for new conversation
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const handler = setTimeout(() => {
      apiFetch(`/api/v1/users/search?query=${encodeURIComponent(searchQuery)}`)
        .then((r) => r.ok ? r.json() : [])
        .then((res) => {
          const data = res.data || res;
          setSearchResults(Array.isArray(data) ? data : []);
        })
        .catch(console.error);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getOtherParticipant = (chat) => {
    if (!chat?.participants || !Array.isArray(chat.participants)) return null;
    return chat.participants.find((p) => String(p._id || p) !== String(currentUserId));
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="ChatPage"
    >
      {/* Left panel — chat list */}
      <div className="chatList">
        <div className="chatListHeader">
          <h3>Messages</h3>
          <div className="chatSearchWrapper">
            <Search className="chatSearchIcon" size={18} />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="chatSearch"
            />
          </div>
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="chatSearchResults"
              >
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="chatSearchResultItem"
                    onClick={() => {
                      setSearchResults([]);
                      setSearchQuery("");
                      openChatWith(user.username || user._id);
                    }}
                  >
                    <img src={user.profilePicture || ProfileImage} alt={user.username} />
                    <div>
                      <strong>{user.displayName || user.username}</strong>
                      <span>@{user.username}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="chatItemsScroll">
          {chats.length === 0 ? (
            <div className="noChatsState">
              <p>No conversations yet.</p>
              <span>Search above to start chatting!</span>
            </div>
          ) : (
            chats.map((chat) => {
              const other = getOtherParticipant(chat);
              const isSelected = activeChat?._id === chat._id;
              if (!other) return null;
              return (
                <motion.div
                  key={chat._id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`chatItem ${isSelected ? "active" : ""}`}
                  onClick={() => selectChat(chat)}
                >
                  <div className="chatItemAvatarWrapper">
                    <img src={other.profilePicture || ProfileImage} alt={other.username} className="chatItemAvatar" />
                    <span className="onlineBadge" />
                  </div>
                  <div className="chatItemInfo">
                    <strong className="chatItemName">{other.displayName || other.username}</strong>
                    <span className="chatItemPreview">
                      {chat.latestMessage ? chat.latestMessage.content : "Started a conversation"}
                    </span>
                  </div>
                  {chat.latestMessage && (
                    <span className="chatItemTime">{formatTime(chat.latestMessage.createdAt)}</span>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel — active chat */}
      <div className="chatWindow">
        {!activeChat ? (
          <div className="chatPremiumPlaceholder">
            <div className="chatPremiumPlaceholderIconWrapper">
              <MessageCircleMore size={64} className="chatPlaceholderIcon" />
            </div>
            <h2>Start Chatting</h2>
            <p>Connect with your friends, share photos, and stay in touch.</p>
            <button className="primaryCTA" onClick={() => document.querySelector('.chatSearch')?.focus()}>
              Send Message
            </button>
          </div>
        ) : (
          <>
            <div className="chatWindowHeader">
              {(() => {
                const other = getOtherParticipant(activeChat);
                return other ? (
                  <div 
                    style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
                    onClick={() => navigate(`/profile/${other.username}`)}
                  >
                    <img src={other.profilePicture || ProfileImage} alt={other.username} className="chatHeaderAvatar" />
                    <div className="chatHeaderInfo">
                      <strong>{other.displayName || other.username}</strong>
                      <span>@{other.username}</span>
                    </div>
                  </div>
                ) : null;
              })()}
              <div className="chatActions">
                <button 
                  className="chatActionBtn" 
                  onClick={async () => {
                    if (window.confirm("Delete this conversation?")) {
                      try {
                        const res = await apiFetch(`/api/v1/chat/${activeChat._id}`, { method: 'DELETE' });
                        if (res.ok) {
                          setActiveChat(null);
                          fetchChats();
                        }
                      } catch (e) {
                        toast.error("Failed to delete chat");
                      }
                    }
                  }}
                >
                  <MoreVertical size={20} />
                </button>
                <button className="chatActionBtn chatCloseBtn" onClick={() => setActiveChat(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="chatMessages">
              {loadingMessages ? (
                <div className="chatMessagesLoading">Loading messages...</div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = String(msg.sender?._id || msg.sender) === String(currentUserId);
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.02, 0.5) }}
                      key={msg._id || index} 
                      className={`chatBubbleWrapper ${isMine ? "mine" : "theirs"}`}
                    >
                      {!isMine && (
                        <img
                          src={msg.sender?.profilePicture || ProfileImage}
                          alt="sender"
                          className="chatBubbleAvatar"
                        />
                      )}
                      <div className="chatBubble">
                        <p>{msg.content}</p>
                        <span className="chatBubbleTime">{formatTime(msg.createdAt || Date.now())}</span>
                      </div>
                    </motion.div>
                  );
                })
              )}
              {isTyping && (
                <div className="typingIndicator">
                  <span>typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chatInputBar">
              <input
                type="text"
                placeholder="Message..."
                value={newMessage}
                onChange={handleTyping}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="chatInput"
              />
              <button 
                className="chatSendBtn"
                onClick={sendMessage}
                disabled={!newMessage.trim()}
              >
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default Chat;
