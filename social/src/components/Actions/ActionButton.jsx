import React from "react";
import "./ActionButton.css";

const ActionButton = ({ 
  icon: Icon, 
  active = false, 
  onClick, 
  ariaLabel, 
  title, 
  variant = "default", // "like", "comment", "share", "save", "default"
  className = "",
  disabled = false
}) => {
  return (
    <button
      type="button"
      className={`action-btn action-${variant} ${active ? "active" : ""} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
    >
      <Icon 
        className={`action-icon ${active ? "icon-filled pop-animation" : ""}`} 
      />
    </button>
  );
};

export default React.memo(ActionButton);
