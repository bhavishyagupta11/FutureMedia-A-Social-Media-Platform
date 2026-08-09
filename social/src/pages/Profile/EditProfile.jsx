import React, { useEffect, useRef, useState } from "react";
import "./Profile.css";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { getSessionUserId, getStoredUserProfile, persistUserSession, resolveAvatar } from "../../utils/session";
import ProfileImage from "../../img/profileImg.jpg";
import { toast } from "react-toastify";

const EditProfile = () => {
  const navigate = useNavigate();
  const currentUserId = getSessionUserId();
  const fileRef = useRef();

  const [form, setForm] = useState({ displayName: "", bio: "", website: "" });
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentAvatar, setCurrentAvatar] = useState(ProfileImage);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUserId) { navigate("/"); return; }
    
    const stored = getStoredUserProfile();
    setForm({
      displayName: stored.displayName || "",
      bio: stored.bio || "",
      website: stored.website || "",
    });
    setCurrentAvatar(resolveAvatar(stored));

    apiFetch(`/api/v1/users/${currentUserId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((payload) => {
        if (!payload) return;
        const data = payload.data || payload;
        setForm({
          displayName: data.displayName || "",
          bio: data.bio || "",
          website: data.website || "",
        });
        setCurrentAvatar(resolveAvatar(data));
        persistUserSession(data);
      })
      .catch(console.error);
  }, [currentUserId, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("displayName", form.displayName);
      formData.append("bio", form.bio);
      formData.append("website", form.website);
      if (selectedFile) formData.append("profilePicture", selectedFile);

      const response = await apiFetch(`/api/v1/users/${currentUserId}/profile`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) { toast.error("Failed to update profile"); return; }

      const updatedData = await response.json();
      const updatedUser = updatedData.data || updatedData;

      persistUserSession(updatedUser);
      toast.success("Profile updated! ✨", { autoClose: 1500 });
      navigate(`/profile/${currentUserId}`);
    } catch { toast.error("Network error while saving"); }
    finally { setSaving(false); }
  };

  return (
    <div className="EditProfilePage">
      <div className="editProfileCard">
        <h2>Edit Profile</h2>

        <div className="editAvatarSection">
          <div className="editAvatarWrapper" onClick={() => fileRef.current.click()}>
            <img src={preview || currentAvatar} alt="avatar" className="editAvatar" onError={(e) => { e.target.src = ProfileImage; }} />
            <div className="editAvatarOverlay">📷 Change</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="d-none" style={{ display: "none" }} onChange={handleFileChange} />
        </div>

        <form onSubmit={handleSubmit} className="editProfileForm">
          <div className="editField">
            <label>Display Name</label>
            <input
              type="text"
              placeholder="Your full name"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
          </div>
          <div className="editField">
            <label>Bio</label>
            <textarea
              placeholder="Tell people about yourself..."
              value={form.bio}
              rows={3}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <div className="editField">
            <label>Website</label>
            <input
              type="url"
              placeholder="https://yoursite.com"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>

          <div className="editProfileActions">
            <button type="button" className="button cancelBtn" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="button saveBtn" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
