import React, { useEffect, useRef, useState } from "react";
import "./EditProfile.css";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { getSessionUserId, getStoredUserProfile, persistUserSession, resolveAvatar } from "../../utils/session";
import ProfileImage from "../../img/profileImg.jpg";
import { toast } from "react-toastify";
import { Camera, Image as ImageIcon, ArrowLeft } from "lucide-react";

const EditProfile = () => {
  const navigate = useNavigate();
  const currentUserId = getSessionUserId();
  const avatarFileRef = useRef();
  const coverFileRef = useRef();

  const [form, setForm] = useState({
    displayName: "",
    username: "",
    bio: "",
    website: "",
    location: "",
    profession: "",
    isPrivate: false
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [currentAvatar, setCurrentAvatar] = useState(ProfileImage);

  const [coverPreview, setCoverPreview] = useState(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState(null);
  const [currentCover, setCurrentCover] = useState("");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) {
      navigate("/");
      return;
    }

    const stored = getStoredUserProfile();
    setForm({
      displayName: stored.displayName || "",
      username: stored.username || "",
      bio: stored.bio || "",
      website: stored.website || "",
      location: stored.location || "",
      profession: stored.profession || "",
      isPrivate: stored.isPrivate ?? false
    });
    setCurrentAvatar(resolveAvatar(stored));
    setCurrentCover(stored.coverImage || "");

    apiFetch(`/api/v1/users/${currentUserId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((payload) => {
        if (!payload) return;
        const data = payload.data || payload;
        setForm({
          displayName: data.displayName || "",
          username: data.username || "",
          bio: data.bio || "",
          website: data.website || "",
          location: data.location || "",
          profession: data.profession || "",
          isPrivate: data.isPrivate ?? false
        });
        setCurrentAvatar(resolveAvatar(data));
        setCurrentCover(data.coverImage || "");
        persistUserSession(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUserId, navigate]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file for avatar");
      return;
    }
    setSelectedAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file for cover photo");
      return;
    }
    setSelectedCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("displayName", form.displayName.trim());
      formData.append("username", form.username.trim().replace(/^@/, ""));
      formData.append("bio", form.bio);
      formData.append("website", form.website.trim());
      formData.append("location", form.location.trim());
      formData.append("profession", form.profession.trim());
      formData.append("isPrivate", form.isPrivate);

      if (selectedAvatarFile) formData.append("profilePicture", selectedAvatarFile);
      if (selectedCoverFile) formData.append("coverImage", selectedCoverFile);

      const response = await apiFetch(`/api/v1/users/${currentUserId}/profile`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        toast.error(errData.message || "Failed to update profile");
        return;
      }

      const updatedData = await response.json();
      const updatedUser = updatedData.data || updatedData;

      persistUserSession(updatedUser);
      window.dispatchEvent(new Event("profile:updated"));
      window.dispatchEvent(new Event("session:updated"));

      toast.success("Profile updated successfully! ✨", { autoClose: 2000 });
      navigate(`/profile/${updatedUser.username || currentUserId}`);
    } catch {
      toast.error("Network error while saving profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="EditProfilePage">
        <div className="editProfileCard" style={{ alignItems: "center", justifyContent: "center", minHeight: "350px" }}>
          <div className="fm-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="EditProfilePage">
      <div className="editProfileCard">
        <div className="editProfileHeader">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="cancelBtn"
              onClick={() => navigate(-1)}
              style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: "4px" }}
              aria-label="Back"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <h2 className="editProfileTitle">Edit Profile</h2>
          </div>
        </div>

        {/* ─── Cover Image Uploader ─── */}
        <div className="editCoverSection">
          {coverPreview || currentCover ? (
            <img
              src={coverPreview || currentCover}
              alt="cover"
              className="editCoverImage"
            />
          ) : (
            <div className="editCoverPlaceholder">
              <span>No cover image set</span>
            </div>
          )}
          <div className="editCoverOverlay" onClick={() => coverFileRef.current.click()}>
            <ImageIcon size={14} /> Change Cover
          </div>
          <input
            ref={coverFileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleCoverChange}
          />
        </div>

        {/* ─── Avatar Uploader ─── */}
        <div className="editAvatarSection">
          <div className="editAvatarWrapper" onClick={() => avatarFileRef.current.click()} title="Change avatar photo">
            <img
              src={avatarPreview || currentAvatar}
              alt="avatar"
              className="editAvatar"
              onError={(e) => { e.target.src = ProfileImage; }}
            />
            <div className="editAvatarOverlay">
              <Camera size={18} />
              <span>Change</span>
            </div>
          </div>
          <input
            ref={avatarFileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
          <div className="editAvatarInfo">
            <h4>{form.displayName || form.username || "Profile Photo"}</h4>
            <p>Click avatar or cover photo to upload a new image</p>
          </div>
        </div>

        {/* ─── Form Fields ─── */}
        <form onSubmit={handleSubmit} className="editProfileForm">
          <div className="editFormRow">
            <div className="editField">
              <label>Display Name</label>
              <input
                type="text"
                placeholder="e.g. Snehil Khokhar"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                required
              />
            </div>

            <div className="editField">
              <label>Username</label>
              <div className="usernameInputContainer">
                <span className="usernamePrefix">@</span>
                <input
                  type="text"
                  placeholder="username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.replace(/^@/, '') })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="editFormRow">
            <div className="editField">
              <label>Profession / Title</label>
              <input
                type="text"
                placeholder="e.g. Street Photographer & Visual Artist"
                value={form.profession}
                onChange={(e) => setForm({ ...form, profession: e.target.value })}
              />
            </div>

            <div className="editField">
              <label>Location</label>
              <input
                type="text"
                placeholder="e.g. Delhi, India"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </div>

          <div className="editField">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label>Bio</label>
              <span className="charCounter">{form.bio.length} / 250</span>
            </div>
            <textarea
              placeholder="Write a short bio describing yourself, your craft, and your interests..."
              value={form.bio}
              maxLength={250}
              rows={3}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>

          <div className="editField">
            <label>Website / Portfolio URL</label>
            <input
              type="url"
              placeholder="https://snehilkhokhar.com"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>

          <div className="editToggleField">
            <div className="toggleLabelGroup">
              <strong>Private Account</strong>
              <span>Only approved followers can view your photos and stories</span>
            </div>
            <input
              type="checkbox"
              checked={form.isPrivate}
              onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
              style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--fm-primary)" }}
            />
          </div>

          <div className="editProfileActions">
            <button
              type="button"
              className="cancelBtn"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="saveBtn"
              disabled={saving}
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
