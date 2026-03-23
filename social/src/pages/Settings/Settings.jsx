import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileLeft from "../../components/ProfileLeft/ProfileLeft";
import RightSide from "../../components/RightSide/RightSide";
import "./Settings.css";
import { apiFetch } from "../../utils/api";
import { getStoredUserProfile, persistUserSession } from "../../utils/session";

const Settings = () => {
  const navigate = useNavigate();
  const storedProfile = getStoredUserProfile();
  const [displayName, setDisplayName] = useState(storedProfile.displayName);
  const [bio, setBio] = useState(storedProfile.bio);
  const [website, setWebsite] = useState(storedProfile.website);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("userId")) {
      navigate("/");
    }
  }, [navigate]);

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

      const response = await apiFetch(`/api/users/${storedProfile.userId}/profile`, {
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

      persistUserSession(await response.json());
      window.dispatchEvent(new Event("profile:updated"));
      setSaved(true);
    } catch (saveError) {
      setError("Unable to save changes.");
    } finally {
      setIsSaving(false);
    }

    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="SettingsPage">
      <ProfileLeft />
      <div className="SettingsCenter">
        <div className="settingsCard">
          <h2>Account Settings</h2>
          <p>Customize your profile details and social identity.</p>

          <form onSubmit={handleSave} className="settingsForm">
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />

            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself"
              rows={4}
            />

            <label htmlFor="website">Website</label>
            <input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://your-site.com"
            />

            <button className="button settingsSaveButton" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            {saved ? <span className="settingsSaved">Saved successfully.</span> : null}
            {error ? <span className="settingsError">{error}</span> : null}
          </form>
        </div>
      </div>
      <RightSide />
    </div>
  );
};

export default Settings;
