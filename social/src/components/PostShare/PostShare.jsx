import React, { useRef, useState } from "react";
import "./PostShare.css";
import { UilScenery, UilPlayCircle, UilTimes } from "@iconscout/react-unicons";
import { apiFetch } from "../../utils/api";
import ProfileImage from "../../img/profileImg.jpg";

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
    if (!(event.target.files && event.target.files[0])) return;
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      setVideo(null);
      setImage({
        file: file,
        previewUrl: URL.createObjectURL(file),
        base64String: e.target.result,
        fileName: file.name,
      });
      setStatus("", "");
    };

    reader.readAsDataURL(file);
  };

  const onVideoChange = (event) => {
    if (!(event.target.files && event.target.files[0])) return;
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      setImage(null);
      setVideo({
        file: file,
        previewUrl: URL.createObjectURL(file),
        base64String: e.target.result,
        fileName: file.name,
      });
      setStatus("", "");
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("", "");

    const selectedMedia = image || video;
    if (!selectedMedia) {
      setStatus("error", "Please select a photo or video before sharing.");
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
      formData.append("image", selectedMedia.file);
      formData.append("caption", desc.trim());

      const response = await apiFetch("/api/posts", {
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
    <form className={`PostShare ${isCompact ? "PostShareCompact" : ""}`} onSubmit={handleSubmit}>
      <img src={localStorage.getItem("image") || ProfileImage} alt="profile" />
      <div>
        <div className="InputContainer">
          <input
            placeholder="What's happening?"
            type="text"
            className="input"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        <div className="postOptions">
          <button
            type="button"
            className="option optionPhoto"
            onClick={() => imageRef.current && imageRef.current.click()}
          >
            <UilScenery style={{ marginRight: 5 }} />
            Photo
          </button>

          <button
            type="button"
            className="option optionVideo"
            onClick={() => videoRef.current && videoRef.current.click()}
          >
            <UilPlayCircle style={{ marginRight: 5 }} />
            Video
          </button>

          <button type="submit" className="button-share" disabled={isSubmitting}>
            {isSubmitting ? "Uploading..." : "Share Post"}
          </button>

          <div style={{ display: "none" }}>
            <input
              type="file"
              name="file"
              ref={imageRef}
              accept="image/*"
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

        {(image || video) && (
          <div className="selectedMediaPill">
            <span>{image ? image.fileName : video.fileName}</span>
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
          </div>
        )}

        {image && (
          <div className="previewImage">
            <UilTimes onClick={() => setImage(null)} />
            <img src={image.previewUrl} alt="preview" />
          </div>
        )}

        {video && (
          <div className="previewImage">
            <UilTimes onClick={() => setVideo(null)} />
            <video src={video.previewUrl} controls className="previewVideo">
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {statusMessage ? <p className={`shareStatus ${statusType}`}>{statusMessage}</p> : null}
      </div>
    </form>
  );
};

export default PostShare;
