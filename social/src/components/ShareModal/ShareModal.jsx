import React from "react";
import PostShare from "../PostShare/PostShare";
import "./ShareModal.css";

const ShareModal = ({ modalOpened, setModalOpened, onPostCreated }) => {
  if (!modalOpened) return null;

  return (
    <div className="shareModalOverlay" onClick={() => setModalOpened(false)}>
      <div className="shareModalCard" onClick={(e) => e.stopPropagation()}>
        <div className="shareModalHeader">
          <h3>Create New Post</h3>
          <button
            type="button"
            className="shareModalClose"
            onClick={() => setModalOpened(false)}
          >
            Close
          </button>
        </div>

        <p className="shareModalTips">Share what's on your mind.</p>

        <PostShare
          isCompact={false}
          onPostCreated={() => {
            if (typeof onPostCreated === "function") {
              onPostCreated();
            }
            setModalOpened(false);
          }}
        />
      </div>
    </div>
  );
};

export default ShareModal;
