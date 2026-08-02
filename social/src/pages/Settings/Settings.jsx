import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Settings.css";
import { apiFetch } from "../../utils/api";
import { getStoredUserProfile, persistUserSession } from "../../utils/session";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Bell, Eye, Database, Smartphone, Shield, HelpCircle, CheckCircle } from "lucide-react";
import Logo from "../../components/Logo/Logo";

const Settings = () => {
  const navigate = useNavigate();
  const storedProfile = getStoredUserProfile() || {};
  const [displayName, setDisplayName] = useState(storedProfile.displayName || "");
  const [bio, setBio] = useState(storedProfile.bio || "");
  const [website, setWebsite] = useState(storedProfile.website || "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  // Mocked states for UI demonstration
  const [privateAccount, setPrivateAccount] = useState(getStoredUserProfile().isPrivate ?? false);
  const [activityStatus, setActivityStatus] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("userId")) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const userId = storedProfile.userId;
    if (!userId) return;
    apiFetch(`/api/v1/users/${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(payload => {
        if (!payload) return;
        const userData = payload.data || payload;
        if (typeof userData.isPrivate === "boolean") {
          setPrivateAccount(userData.isPrivate);
          localStorage.setItem("isPrivate", String(userData.isPrivate));
        }
        if (typeof userData.settings?.notifications?.push === "boolean") {
          setPushNotifications(userData.settings.notifications.push);
        }
        if (typeof userData.settings?.notifications?.email === "boolean") {
          setEmailNotifications(userData.settings.notifications.email);
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePrivacyToggle = async (newValue) => {
    setPrivateAccount(newValue);
    try {
      const res = await apiFetch(`/api/v1/users/${storedProfile.userId}/settings`, {
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
      setPrivateAccount(!newValue); // Revert on failure
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaved(false);
    setError("");
    setIsSaving(true);

    try {
      const formData = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        website: website.trim(),
      };

      const response = await apiFetch(`/api/v1/users/${storedProfile.userId}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.error || "Unable to save changes.");
        return;
      }

      // Also save settings
      const settingsData = {
        privacy: { profileVisibility: privateAccount ? "private" : "public" },
        notifications: { push: pushNotifications, email: emailNotifications }
      };

      await apiFetch(`/api/v1/users/${storedProfile.userId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData)
      });

      persistUserSession(await response.json());
      window.dispatchEvent(new Event("profile:updated"));
      setSaved(true);
    } catch (saveError) {
      setError("Unable to save changes.");
    } finally {
      setIsSaving(false);
    }

    setTimeout(() => setSaved(false), 3000);
  };

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/v1/users/${storedProfile.userId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (res.ok) {
        setSaved(true);
        setCurrentPassword("");
        setNewPassword("");
      } else {
        const data = await res.json();
        setError(data.message || "Failed to update password");
      }
    } catch (err) {
      setError("Failed to update password");
    }
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        const res = await apiFetch(`/api/v1/users/${storedProfile.userId}`, { method: "DELETE" });
        if (res.ok) {
          localStorage.removeItem("userId");
          localStorage.removeItem("token");
          navigate("/");
        }
      } catch (e) {
        setError("Failed to delete account");
      }
    }
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
              className={`settingsTab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
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
                      placeholder="Your name"
                    />
                  </div>

                  <div className="settingsField">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell people about yourself"
                      rows={4}
                    />
                  </div>

                  <div className="settingsField">
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://your-site.com"
                    />
                  </div>

                  <button className="settingsSaveButton" type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>

                  {saved && activeTab === "account" && (
                    <motion.span 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="settingsSaved"
                    >
                      <CheckCircle size={18} /> Settings saved successfully.
                    </motion.span>
                  )}
                  {error && <span className="settingsError">{error}</span>}
                </form>

                <div className="dangerZone">
                  <h3>Danger Zone</h3>
                  <p>Irreversible and destructive actions.</p>
                  <button className="dangerBtn" onClick={handleDeleteAccount}>Delete Account</button>
                </div>
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
                    <span>Only approved followers can see your posts.</span>
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
                    <input type="checkbox" checked={activityStatus} onChange={(e) => setActivityStatus(e.target.checked)} />
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
                    <input type="checkbox" checked={pushNotifications} onChange={(e) => setPushNotifications(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="settingsRow">
                  <div className="settingsRowInfo">
                    <strong>Email Notifications</strong>
                    <span>Receive digest emails and important alerts.</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />
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
                    <span>Download a copy of your posts, profile info, and connections.</span>
                  </div>
                  <button className="settingsSaveButton" onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storedProfile));
                    const dlAnchorElem = document.createElement('a');
                    dlAnchorElem.setAttribute("href", dataStr);
                    dlAnchorElem.setAttribute("download", "futuremedia_data.json");
                    dlAnchorElem.click();
                  }}>
                    Download JSON
                  </button>
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
                    <strong>Dark Mode</strong>
                    <span>Toggle between light and dark themes.</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={document.body.getAttribute('data-theme') === 'dark' || !document.body.hasAttribute('data-theme')} 
                      onChange={(e) => {
                        const newTheme = e.target.checked ? 'dark' : 'light';
                        document.body.setAttribute('data-theme', newTheme);
                        localStorage.setItem('theme', newTheme);
                        // Force re-render of this component
                        setSaved(prev => !prev);
                      }} 
                    />
                    <span className="slider"></span>
                  </label>
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
                style={{ textAlign: "center", padding: "2.5rem 1rem" }}
              >
                <div style={{ marginBottom: "1.5rem" }}>
                  <Logo size="large" />
                </div>
                <h3 style={{ color: "var(--color-text)", fontSize: "1.2rem", fontWeight: "700", marginBottom: "0.5rem" }}>FutureMedia Support & Community</h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", maxWidth: "420px", margin: "0 auto 1.5rem", lineHeight: "1.6" }}>
                  Connect with creators, share your thoughts, and inspire the community. Need help or have feedback? Reach out to our team.
                </p>
                <a href="mailto:support@futuremedia.bullishpath.in" className="settingsSaveButton" style={{ textDecoration: "none", display: "inline-block" }}>
                  Contact Support
                </a>
              </motion.div>
            )}

            {activeTab !== "account" && activeTab !== "privacy" && activeTab !== "notifications" && activeTab !== "security" && activeTab !== "data" && activeTab !== "appearance" && activeTab !== "support" && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="settingsSection"
              >
                <h2>Coming Soon</h2>
                <p style={{ color: "var(--color-text-muted)" }}>This settings section is being updated for V2.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
