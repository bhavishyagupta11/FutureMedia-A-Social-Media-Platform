import React, { useRef, useState } from "react";
import "./PostShare.css";
import { ImagePlus as ImageIcon, Video, X, Globe, Lock } from "lucide-react";
import { apiFetch } from "../../utils/api";
import ProfileImage from "../../img/profileImg.jpg";
import { motion, AnimatePresence } from "framer-motion";

import { getSessionUserId, getStoredUserProfile } from "../../utils/session";

const PostShare = ({ onPostCreated, isCompact = true }) => {
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [desc, setDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("");
  const [visibility, setVisibility] = useState('public');

  const toggleVisibility = () => {
    setVisibility(prev => prev === 'public' ? 'private' : 'public');
  };

  const imageRef = useRef(null);
  const videoRef = useRef(null);
  
  const currentUserId = getSessionUserId();
  const profileImage = getStoredUserProfile().image;

  const resetComposer = () => {
    if (imageRef.current) imageRef.current.value = null;
    if (videoRef.current) videoRef.current.value = null;
    setImage(null);
    setVideo(null);
    setDesc("");
  };

  const setStatus = (type, message) => {
    setStatusType(type);
    setStatusMessage(message);
  };

  const onImageChange = (event) => {
    let files;
    if (event.dataTransfer && event.dataTransfer.files) {
      files = Array.from(event.dataTransfer.files);
    } else if (event.target && event.target.files) {
      files = Array.from(event.target.files);
    } else {
      return;
    }
    
    if (!files || files.length === 0) return;
    
    // Separate videos from images
    const videoFiles = files.filter(f => f.type.startsWith('video/'));
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (videoFiles.length > 0) {
      // Just take the first video
      setImage(null);
      setVideo({
        file: videoFiles[0],
        previewUrl: URL.createObjectURL(videoFiles[0]),
        fileName: videoFiles[0].name,
      });
      setStatus("", "");
    } else if (imageFiles.length > 0) {
      setVideo(null);
      const newImages = imageFiles.map(file => ({
        file: file,
        previewUrl: URL.createObjectURL(file),
        fileName: file.name,
      }));
      setImage(newImages);
      setStatus("", "");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onImageChange(e);
  };

  const onVideoChange = (event) => {
    if (!(event.target.files && event.target.files[0])) return;
    const file = event.target.files[0];
    setImage(null);
    setVideo({
      file: file,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
    });
    setStatus("", "");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("", "");

    if (!image && !video && !desc.trim()) {
      setStatus("error", "Please add some content to share.");
      return;
    }

    if (!currentUserId) {
      setStatus("error", "Session expired. Please log in again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (image) {
        image.forEach(img => formData.append("media", img.file));
      } else if (video) {
        formData.append("media", video.file);
      }
      formData.append("caption", desc.trim());
      formData.append("visibility", visibility);

      const response = await apiFetch("/api/v1/posts", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorText = "Failed to upload post.";
        try {
          errorText = await response.text();
        } catch (_) {}
        setStatus("error", errorText);
        return;
      }

      const payload = await response.json().catch(() => null);
      const createdPost = payload?.data || payload;

      setStatus("success", "Post shared successfully.");
      resetComposer();

      window.dispatchEvent(
        new CustomEvent("post:created", {
          detail: { post: createdPost },
        })
      );
      if (typeof onPostCreated === "function") {
        onPostCreated(createdPost);
      }
    } catch (error) {
      setStatus("error", "Unable to share right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`PostShare ${isCompact ? "PostShareCompact" : ""}`} 
      onSubmit={handleSubmit}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <img src={profileImage || ProfileImage} alt="profile" />
      <div>
        <div className="InputContainer">
          <input
            placeholder="Start a thread or share a post..."
            type="text"
            className="input"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        <div className="postOptions">
          <div className="optionGroup">
            <button
              type="button"
              className="iconOption"
              onClick={() => imageRef.current && imageRef.current.click()}
              title="Add Image"
            >
              <ImageIcon size={20} />
            </button>

            <button
              type="button"
              className="iconOption"
              onClick={() => videoRef.current && videoRef.current.click()}
              title="Add Video"
            >
              <Video size={20} />
            </button>
          </div>

          <div className="actionGroup">
            <button
              type="button"
              className={`visibilityToggle ${visibility}`}
              onClick={toggleVisibility}
              title={visibility === 'public' ? 'Visible to everyone' : 'Only visible to followers'}
            >
              {visibility === 'public' ? <Globe size={14} /> : <Lock size={14} />}
              <span>{visibility === 'public' ? 'Public' : 'Private'}</span>
            </button>
            <button type="submit" className="button-share" disabled={isSubmitting || (!desc.trim() && !image && !video)}>
              {isSubmitting ? "Posting..." : "Post"}
            </button>
          </div>

          <div style={{ display: "none" }}>
            <input
              type="file"
              name="file"
              ref={imageRef}
              accept="image/*"
              multiple
              onChange={onImageChange}
            />
            <input
              type="file"
              name="videoFile"
              ref={videoRef}
              accept="video/*"
              onChange={onVideoChange}
            />
          </div>
        </div>

        <AnimatePresence>
          {(image || video) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="selectedMediaPill"
            >
              <span>{image ? `${image.length} image(s) selected` : video.fileName}</span>
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setVideo(null);
                  setStatus("", "");
                }}
              >
                Remove
              </button>
            </motion.div>
          )}

          {image && image.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="previewImage"
              style={{ display: "flex", gap: "8px", overflowX: "auto" }}
            >
              <X size={24} onClick={() => setImage(null)} />
              {image.map((img, idx) => (
                <img key={idx} src={img.previewUrl} alt={`preview ${idx}`} style={{ maxHeight: "200px", objectFit: "cover", borderRadius: "8px" }} />
              ))}
            </motion.div>
          )}

          {video && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="previewImage"
            >
              <X size={24} onClick={() => setVideo(null)} />
              <video src={video.previewUrl} controls className="previewVideo">
                Your browser does not support the video tag.
              </video>
            </motion.div>
          )}
        </AnimatePresence>

        {statusMessage && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`shareStatus ${statusType}`}
          >
            {statusMessage}
          </motion.p>
        )}
      </div>
    </motion.form>
  );
};

export default PostShare;
