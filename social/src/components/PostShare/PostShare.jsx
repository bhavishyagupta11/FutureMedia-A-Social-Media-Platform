import React, { useRef, useState } from "react";
import "./PostShare.css";
import { Image as ImageIcon, Video, X, Smile, Globe } from "lucide-react";
import { apiFetch } from "../../utils/api";
import ProfileImage from "../../img/profileImg.jpg";
import { motion, AnimatePresence } from "framer-motion";

const PostShare = ({ onPostCreated, isCompact = true }) => {
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [desc, setDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("");

  const imageRef = useRef(null);
  const videoRef = useRef(null);

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
    if (!(event.target.files && event.target.files.length > 0)) return;
    const files = Array.from(event.target.files);
    setVideo(null);
    const newImages = files.map(file => ({
      file: file,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
    }));
    setImage(newImages);
    setStatus("", "");
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

    const userId = localStorage.getItem("userId");
    if (!userId) {
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

      const createdPost = await response.json().catch(() => null);

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
    >
      <img src={localStorage.getItem("image") || ProfileImage} alt="profile" />
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
            
            <button
              type="button"
              className="iconOption"
              title="Add Emoji"
            >
              <Smile size={20} />
            </button>
          </div>

          <div className="actionGroup">
            <div className="audienceSelector" title="Everyone can reply">
              <Globe size={14} />
              <span>Everyone</span>
            </div>
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
