import React from "react";
import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import ActionButton from "./ActionButton";
import "./ActionBar.css";

const ActionBar = ({ 
  isLiked, 
  onLike, 
  onCommentToggle, 
  onShare, 
  isSaved, 
  onSave,
  className = ""
}) => {
  return (
    <div className={`ActionBar ${className}`}>
      <ActionButton
        icon={Heart}
        active={isLiked}
        onClick={onLike}
        ariaLabel={isLiked ? "Unlike" : "Like"}
        title="Like"
        variant="like"
      />
      <ActionButton
        icon={MessageCircle}
        onClick={onCommentToggle}
        ariaLabel="Comment"
        title="Comment"
        variant="comment"
      />
      <ActionButton
        icon={Send}
        onClick={onShare}
        ariaLabel="Share"
        title="Share"
        variant="share"
      />
      <div className="action-bar-spacer" />
      <ActionButton
        icon={Bookmark}
        active={isSaved}
        onClick={onSave}
        ariaLabel={isSaved ? "Unsave" : "Save"}
        title="Save"
        variant="save"
      />
    </div>
  );
};

export default React.memo(ActionBar);
