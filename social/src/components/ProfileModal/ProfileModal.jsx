import React, { useState } from "react";
import "./ProfileModal.css";
import { apiFetch } from "../../utils/api";
import { getStoredUserProfile, persistUserSession } from "../../utils/session";

const ProfileModal = ({ modalOpened, setModalOpened }) => {
  const storedProfile = getStoredUserProfile();
  const [displayName, setDisplayName] = useState(storedProfile.displayName);
  const [bio, setBio] = useState(storedProfile.bio);
  const [website, setWebsite] = useState(storedProfile.website);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  if (!modalOpened) return null;

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const response = await apiFetch(`/api/users/${storedProfile.userId}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim(),
          website: website.trim(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.error || "Unable to save profile.");
        return;
      }

      persistUserSession(await response.json());
      window.dispatchEvent(new Event("profile:updated"));
    } catch (saveError) {
      setError("Unable to save profile.");
      return;
    } finally {
      setIsSaving(false);
    }

    setModalOpened(false);
  };

  return (
    <div className="profileModalOverlay" onClick={() => setModalOpened(false)}>
      <div className="profileModalCard" onClick={(e) => e.stopPropagation()}>
        <div className="profileModalHeader">
          <h3>Edit Profile</h3>
          <button type="button" onClick={() => setModalOpened(false)}>
            Close
          </button>
        </div>

        <form className="profileModalForm" onSubmit={handleSave}>
          <label htmlFor="profile-name">Display Name</label>
          <input
            id="profile-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />

          <label htmlFor="profile-bio">Bio</label>
          <textarea
            id="profile-bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write a short bio"
          />

          <label htmlFor="profile-website">Website</label>
          <input
            id="profile-website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://your-site.com"
          />

          <button className="button profileSaveButton" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </button>
          {error ? <span style={{ color: "#c34453", fontWeight: 600 }}>{error}</span> : null}
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
