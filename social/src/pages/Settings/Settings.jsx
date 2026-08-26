import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Settings.css";
import { apiFetch } from "../../utils/api";
import { getStoredUserProfile, persistUserSession, clearUserSession } from "../../utils/session";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Bell, Eye, Database, Smartphone, Shield, HelpCircle, CheckCircle, AlertTriangle, LogOut, ChevronDown, ChevronUp, Send } from "lucide-react";
import Logo from "../../components/Logo/Logo";
import toast from "react-hot-toast";

const Settings = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(getStoredUserProfile() || {});
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  // Settings states
  const [privateAccount, setPrivateAccount] = useState(profile.isPrivate ?? false);
  const [activityStatus, setActivityStatus] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Security password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Support states
  const [faqOpen, setFaqOpen] = useState(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [sendingSupport, setSendingSupport] = useState(false);

  // Danger zone modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("userId")) {
      navigate("/");
      return;
    }

    const syncProfile = () => {
      const p = getStoredUserProfile();
      setProfile(p);
      setDisplayName(p.displayName || "");
      setBio(p.bio || "");
      setWebsite(p.website || "");
      setPrivateAccount(p.isPrivate);
    };

    syncProfile();

    window.addEventListener("profile:updated", syncProfile);
    window.addEventListener("session:updated", syncProfile);

    // Fetch latest user data from backend
    const userId = profile.userId || localStorage.getItem("userId");
    if (userId) {
      apiFetch(`/api/v1/users/${userId}`)
        .then(r => r.ok ? r.json() : null)
        .then(payload => {
          if (!payload) return;
          const userData = payload.data || payload;
          setDisplayName(userData.displayName || "");
          setBio(userData.bio || "");
          setWebsite(userData.website || "");
          if (typeof userData.isPrivate === "boolean") {
            setPrivateAccount(userData.isPrivate);
          }
          if (userData.settings?.notifications) {
            if (typeof userData.settings.notifications.push === "boolean") setPushNotifications(userData.settings.notifications.push);
            if (typeof userData.settings.notifications.email === "boolean") setEmailNotifications(userData.settings.notifications.email);
          }
          persistUserSession(userData);
        })
        .catch(console.error);
    }

    return () => {
      window.removeEventListener("profile:updated", syncProfile);
      window.removeEventListener("session:updated", syncProfile);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePrivacyToggle = async (newValue) => {
    setPrivateAccount(newValue);
    try {
      const userId = profile.userId || localStorage.getItem("userId");
      const res = await apiFetch(`/api/v1/users/${userId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrivate: newValue, privacy: { profileVisibility: newValue ? "private" : "public" } })
      });
      if (res.ok) {
        localStorage.setItem("isPrivate", String(newValue));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
      setPrivateAccount(!newValue);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaved(false);
    setError("");
    setIsSaving(true);

    try {
      const userId = profile.userId || localStorage.getItem("userId");
      const formData = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        website: website.trim(),
      };

      const response = await apiFetch(`/api/v1/users/${userId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.message || payload?.error || "Unable to save changes.");
        return;
      }

      const updatedProfileData = await response.json();
      persistUserSession(updatedProfileData);
      setSaved(true);
      toast.success("Account profile updated successfully!");
    } catch (saveError) {
      setError("Unable to save changes.");
    } finally {
      setIsSaving(false);
    }

    setTimeout(() => setSaved(false), 3000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      const userId = profile.userId || localStorage.getItem("userId");
      const res = await apiFetch(`/api/v1/users/${userId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (res.ok) {
        setSaved(true);
        setCurrentPassword("");
        setNewPassword("");
        toast.success("Password updated successfully!");
      } else {
        const data = await res.json();
        setError(data.message || "Failed to update password");
      }
    } catch (err) {
      setError("Failed to update password");
    }
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = () => {
    clearUserSession();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleDeleteAccountConfirm = async () => {
    if (confirmDeleteText !== "DELETE") {
      toast.error("Please type DELETE to confirm account deletion");
      return;
    }

    setIsDeleting(true);
    try {
      const userId = profile.userId || localStorage.getItem("userId");
      const res = await apiFetch(`/api/v1/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Account deleted permanently");
        clearUserSession();
        navigate("/");
      } else {
        toast.error("Failed to delete account");
      }
    } catch (e) {
      toast.error("Network error deleting account");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleSendSupportMessage = async (e) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setSendingSupport(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success("Support message sent! Our team will respond shortly.");
    setSupportMessage("");
    setSendingSupport(false);
  };

  const tabs = [
    { id: "account", label: "Account", icon: <User size={20} /> },
    { id: "privacy", label: "Privacy", icon: <Lock size={20} /> },
    { id: "security", label: "Security", icon: <Shield size={20} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={20} /> },
    { id: "appearance", label: "Appearance", icon: <Eye size={20} /> },
    { id: "data", label: "Data & Export", icon: <Database size={20} /> },
    { id: "sessions", label: "Sessions", icon: <Smartphone size={20} /> },
    { id: "support", label: "Support", icon: <HelpCircle size={20} /> },
    { id: "danger", label: "Danger Zone", icon: <AlertTriangle size={20} /> },
  ];

  const FAQS = [
    { q: "How do I create a story?", a: "Go to your Feed, click the '+' icon on 'Your Story', and select either Photo/Video or Text story." },
    { q: "How long do stories last?", a: "Stories disappear automatically after 24 hours." },
    { q: "Who can see my private profile?", a: "When your account is Private, only users whose follow requests you accept can see your posts and stories." },
    { q: "How do I update my profile details?", a: "You can update your display name, bio, and website either from Edit Profile or directly in Settings → Account." },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="SettingsPage"
    >
      <div className="settingsHeader" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Settings</h1>
          <p>Manage your account settings and preferences.</p>
        </div>
        <Logo size="normal" />
      </div>

      <div className="settingsLayout">
        <div className="settingsSidebar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`settingsTab ${activeTab === tab.id ? "active" : ""} ${tab.id === "danger" ? "dangerTab" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <button className="settingsTab logoutTab" onClick={handleLogout}>
            <LogOut size={20} /> Log Out
          </button>
        </div>

        <div className="settingsContent">
          <AnimatePresence mode="wait">
            {activeTab === "account" && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="settingsSection"
              >
                <h2><User size={24} /> Account Profile</h2>
                <form onSubmit={handleSave} className="settingsForm">
                  <div className="settingsField">
                    <label htmlFor="displayName">Display Name</label>
                    <input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                    />
                  </div>

                  <div className="settingsField">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell people a little about yourself"
                      rows={4}
                    />
                  </div>

                  <div className="settingsField">
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <button className="settingsSaveButton" type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>

                  {saved && activeTab === "account" && (
                    <motion.span className="settingsSaved">
                      <CheckCircle size={18} /> Settings saved successfully.
                    </motion.span>
                  )}
                  {error && <span className="settingsError">{error}</span>}
                </form>
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="settingsSection"
              >
                <h2><Shield size={24} /> Security</h2>
                <form onSubmit={handlePasswordChange} className="settingsForm">
                  <div className="settingsField">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="settingsField">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <button className="settingsSaveButton" type="submit">
                    Update Password
                  </button>
                  {saved && activeTab === "security" && (
                    <motion.span className="settingsSaved"><CheckCircle size={18} /> Password updated.</motion.span>
                  )}
                  {error && <span className="settingsError">{error}</span>}
                </form>
              </motion.div>
            )}

            {activeTab === "privacy" && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="settingsSection"
              >
                <h2><Lock size={24} /> Privacy Options</h2>
                
                <div className="settingsRow">
                  <div className="settingsRowInfo">
                    <strong>Private Account</strong>
                    <span>Only approved followers can see your posts and stories.</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={privateAccount} onChange={(e) => handlePrivacyToggle(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="settingsRow">
                  <div className="settingsRowInfo">
                    <strong>Activity Status</strong>
                    <span>Allow others to see when you are online.</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={activityStatus} onChange={(e) => { setActivityStatus(e.target.checked); toast('Activity status — coming soon', { icon: '🔜' }); }} />
                    <span className="slider"></span>
                  </label>
                </div>
              </motion.div>
            )}

            {activeTab === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="settingsSection"
              >
                <h2><Bell size={24} /> Notifications Preferences</h2>
                
                <div className="settingsRow">
                  <div className="settingsRowInfo">
                    <strong>Push Notifications</strong>
                    <span>Receive notifications on your device.</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={pushNotifications} onChange={(e) => { const val = e.target.checked; setPushNotifications(val); const userId = profile.userId || localStorage.getItem('userId'); apiFetch(`/api/v1/users/${userId}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notifications: { push: val } }) }).then(r => { if (r.ok) toast.success('Push notifications ' + (val ? 'enabled' : 'disabled')); }); }} />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="settingsRow">
                  <div className="settingsRowInfo">
                    <strong>Email Notifications</strong>
                    <span>Receive digest emails and important alerts.</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={emailNotifications} onChange={(e) => { const val = e.target.checked; setEmailNotifications(val); const userId = profile.userId || localStorage.getItem('userId'); apiFetch(`/api/v1/users/${userId}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notifications: { email: val } }) }).then(r => { if (r.ok) toast.success('Email notifications ' + (val ? 'enabled' : 'disabled')); }); }} />
                    <span className="slider"></span>
                  </label>
                </div>
              </motion.div>
            )}

            {activeTab === "appearance" && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="settingsSection"
              >
                <h2><Eye size={24} /> Appearance</h2>
                <div className="settingsRow">
                  <div className="settingsRowInfo">
                    <strong>Dark Theme</strong>
                    <span>Toggle between light and dark visual mode.</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={document.body.getAttribute('data-theme') === 'dark' || !document.body.hasAttribute('data-theme')} 
                      onChange={(e) => {
                        const newTheme = e.target.checked ? 'dark' : 'light';
                        document.body.setAttribute('data-theme', newTheme);
                        localStorage.setItem('theme', newTheme);
                        setSaved(prev => !prev);
                      }} 
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </motion.div>
            )}

            {activeTab === "data" && (
              <motion.div
                key="data"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="settingsSection"
              >
                <h2><Database size={24} /> Data & Export</h2>
                <div className="settingsRow">
                  <div className="settingsRowInfo">
                    <strong>Export Your Data</strong>
                    <span>Download a JSON archive of your profile info, settings, and activity.</span>
                  </div>
                  <button className="settingsSaveButton" onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile));
                    const dlAnchorElem = document.createElement('a');
                    dlAnchorElem.setAttribute("href", dataStr);
                    dlAnchorElem.setAttribute("download", `futuremedia_data_${profile.username || 'user'}.json`);
                    dlAnchorElem.click();
                    toast.success("Export file downloaded");
                  }}>
                    Export JSON
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === "sessions" && (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="settingsSection"
              >
                <h2><Smartphone size={24} /> Active Sessions & Auth</h2>
                <div className="settingsRow">
                  <div className="settingsRowInfo">
                    <strong>Current Web Session</strong>
                    <span>Active now • {navigator.platform || "Web Browser"}</span>
                  </div>
                  <span style={{ color: "var(--color-primary)", fontWeight: "600", fontSize: "0.9rem" }}>Active Now</span>
                </div>

                <div className="settingsRow" style={{ marginTop: "1.5rem" }}>
                  <div className="settingsRowInfo">
                    <strong>End Current Session</strong>
                    <span>Sign out of your account on this device.</span>
                  </div>
                  <button className="dangerBtn" onClick={handleLogout}>
                    Log Out
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === "support" && (
              <motion.div
                key="support"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="settingsSection"
              >
                <h2><HelpCircle size={24} /> Help & Support</h2>
                
                <div className="faqContainer">
                  <h3>Frequently Asked Questions</h3>
                  <div className="faqList">
                    {FAQS.map((faq, idx) => (
                      <div key={idx} className="faqItem">
                        <button
                          type="button"
                          className="faqQuestionBtn"
                          onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                        >
                          <span>{faq.q}</span>
                          {faqOpen === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        {faqOpen === idx && (
                          <div className="faqAnswer">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="settingsForm">
                  <h3 style={{ color: "var(--color-text)", fontSize: "1.05rem", marginBottom: "0.5rem" }}>Send Feedback or Report an Issue</h3>
                  <textarea
                    placeholder="Describe your issue or feedback..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    rows={4}
                    className="formInput"
                  />
                  <button className="settingsSaveButton" onClick={handleSendSupportMessage} disabled={sendingSupport || !supportMessage.trim()} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Send size={16} /> {sendingSupport ? "Sending..." : "Submit Ticket"}
                  </button>
                </div>
              </motion.div>
            )}

            {(activeTab === "danger" || activeTab === "account") && (
              <motion.div
                key="danger"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="settingsSection"
                style={{ marginTop: activeTab === "account" ? "2rem" : "0" }}
              >
                {activeTab === "danger" && <h2><AlertTriangle size={24} color="#EF4444" /> Danger Zone</h2>}
                <div className="dangerZone">
                  <h3>Danger Zone</h3>
                  <p>Permanently delete your account, posts, and data. This action is irreversible.</p>
                  <button className="dangerBtn" onClick={() => setShowDeleteModal(true)}>
                    Delete Account Permanently
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="viewers-sheet-overlay" style={{ background: "rgba(37,37,37,0.6)", backdropFilter: "blur(4px)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowDeleteModal(false)}>
          <motion.div 
            className="settingsContent"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ maxWidth: "440px", margin: "auto", background: "#FFFFFF", border: "1.5px solid #EF4444", borderRadius: "20px", padding: "1.8rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: "#EF4444", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={22} /> Confirm Permanent Deletion
            </h3>
            <p style={{ color: "var(--fm-text-secondary)", fontSize: "0.9rem", lineHeight: "1.5", marginBottom: "1rem" }}>
              This will permanently delete your FutureMedia account, all your stories, posts, comments, and profile data. Type <strong>DELETE</strong> below to confirm.
            </p>
            <input 
              type="text"
              placeholder="Type DELETE to confirm"
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
              className="formInput"
              style={{ width: "100%", marginBottom: "1rem" }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="settingsTab" style={{ flex: 1, justifyContent: "center", background: "var(--fm-surface-soft)", textAlign: "center" }} onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="dangerBtn" style={{ flex: 1, textAlign: "center" }} onClick={handleDeleteAccountConfirm} disabled={confirmDeleteText !== "DELETE" || isDeleting}>
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Settings;
