import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Chat.css";
import { useNavigate, useLocation } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { getSessionUserId } from "../../utils/session";
import ProfileImage from "../../img/profileImg.jpg";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Paperclip, X, MessageSquare, MoreVertical, Smile, Mic } from "lucide-react";

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

  // Setup socket
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
      if (!activeChatRef.current || activeChatRef.current._id !== msg.chat?._id) {
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
      .then((data) => setChats(Array.isArray(data) ? data : []))
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
      const chat = await r.json();
      setActiveChat(chat);
      loadMessages(chat._id);
      fetchChats();
      socket.emit("join chat", chat._id);
      apiFetch(`/api/v1/chat/${chat._id}/read`, { method: "PUT" }).catch(console.error);
    } catch (e) { console.error(e); }
  };

  const loadMessages = async (chatId) => {
    setLoadingMessages(true);
    try {
      const r = await apiFetch(`/api/v1/chat/messages/${chatId}`);
      if (!r.ok) return;
      const data = await r.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoadingMessages(false); }
  };

  const selectChat = (chat) => {
    setActiveChat(chat);
    loadMessages(chat._id);
    socket.emit("join chat", chat._id);
    setIsTyping(false);
    apiFetch(`/api/v1/chat/${chat._id}/read`, { method: "PUT" }).catch(console.error);
  };

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || !activeChat) return;
    socket.emit("stop typing", activeChat._id);
    setTyping(false);
    setNewMessage("");

    try {
      const r = await apiFetch("/api/v1/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: activeChat._id, content }),
      });
      if (!r.ok) return;
      const msg = await r.json();
      socket.emit("new message", { ...msg, chat: { ...activeChat, participants: activeChat.participants } });
      setMessages((prev) => [...prev, msg]);
      fetchChats();
    } catch (e) { console.error(e); }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected || !activeChat) return;
    if (!typing) {
      setTyping(true);
      socket.emit("typing", activeChat._id);
    }
    setTimeout(() => {
      setTyping(false);
      socket.emit("stop typing", activeChat._id);
    }, 2500);
  };

  // Search users to chat with
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      apiFetch(`/api/v1/users/search?query=${encodeURIComponent(searchQuery)}`)
        .then((r) => r.ok ? r.json() : {})
        .then((data) => setSearchResults(data.users || []))
        .catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getOtherParticipant = (chat) => {
    if (!chat?.participants) return null;
    return chat.participants.find((p) => String(p._id) !== String(currentUserId));
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
                {searchResults.map((u) => (
                  <div key={u._id} className="chatSearchItem" onClick={() => { openChatWith(u._id); setSearchQuery(""); setSearchResults([]); }}>
                    <img src={u.profilePicture || ProfileImage} alt={u.username} />
                    <div>
                      <strong>{u.displayName || u.username}</strong>
                      <span>@{u.username}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="chatListItems">
          {chats.length === 0 ? (
            <p className="chatEmpty">No conversations yet.<br />Search above to start chatting!</p>
          ) : (
            chats.map((chat, i) => {
              const other = getOtherParticipant(chat);
              if (!other) return null;
              const isActive = activeChat?._id === chat._id;
              return (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={chat._id}
                  className={`chatItem ${isActive ? "activeChatItem" : ""}`}
                  onClick={() => selectChat(chat)}
                >
                  <img src={other.profilePicture || ProfileImage} alt={other.username} />
                  <div className="chatItemInfo">
                    <strong>{other.displayName || other.username}</strong>
                    <span>{chat.latestMessage?.content || "Start a conversation"}</span>
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
              <MessageSquare size={64} className="chatPlaceholderIcon" />
            </div>
            <h2>Start Chatting</h2>
            <p>Connect with your friends, share photos, and stay in touch.</p>
            <button className="primaryCTA" onClick={() => document.querySelector('.chatSearch').focus()}>
              Send Message
            </button>
          </div>
        ) : (
          <>
            <div className="chatWindowHeader">
              {(() => {
                const other = getOtherParticipant(activeChat);
                return other ? (
                  <>
                    <img src={other.profilePicture || ProfileImage} alt={other.username} className="chatHeaderAvatar" />
                    <div className="chatHeaderInfo">
                      <strong>{other.displayName || other.username}</strong>
                      <span>@{other.username}</span>
                    </div>
                  </>
                ) : null;
              })()}
              <div className="chatActions">
                <button 
                  className="chatActionBtn" 
                  onClick={async () => {
                    if (window.confirm("Delete this conversation?")) {
                      // Backend route doesn't exist yet but let's wire it assuming it will
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
                      key={msg._id} 
                      className={`chatBubbleWrapper ${isMine ? "mine" : "theirs"}`}
                    >
                      {!isMine && (
                        <img
                          src={msg.sender?.profilePicture || ProfileImage}
                          alt={msg.sender?.username}
                          className="chatBubbleAvatar"
                        />
                      )}
                      <div className="chatBubble">
                        <p>{msg.content}</p>
                        <span className="chatBubbleTime">
                          {formatTime(msg.createdAt)}
                          {isMine && (
                            <span className="readReceipt" style={{ marginLeft: "4px", fontSize: "10px", color: (msg.status === "read" || (msg.readBy && msg.readBy.length > 0)) ? "#4db8ff" : "inherit" }}>
                              {(msg.status === "read" || (msg.readBy && msg.readBy.length > 0)) ? "✓✓" : "✓"}
                            </span>
                          )}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="chatBubbleWrapper theirs"
                >
                  <div className="chatBubble typingBubble">
                    <span className="dot" /><span className="dot" /><span className="dot" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chatInputContainer">
              <div className="chatInputRow">
                <button className="chatAttachBtn">
                  <Smile size={20} />
                </button>
                <input
                  type="text"
                  placeholder="Message..."
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                  className="chatInput"
                />
                <div className="chatInputActions">
                  {newMessage.trim() ? (
                    <button className="chatSendBtn" onClick={sendMessage}>
                      <Send size={18} />
                    </button>
                  ) : (
                    <>
                      <button className="chatAttachBtn">
                        <Paperclip size={20} />
                      </button>
                      <button className="chatAttachBtn">
                        <Mic size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default Chat;
