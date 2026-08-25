import React from "react";
import "./Logo.css";

const Logo = ({ size = "normal", className = "" }) => {
  return (
    <div className={`futuremedia-logo ${size} ${className}`} aria-label="FutureMedia">
      <div className="fm-logo-badge">
        <span className="fm-logo-text">FM</span>
      </div>
    </div>
  );
};

export default Logo;
