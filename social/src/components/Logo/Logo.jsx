import React from "react";
import "./Logo.css";

const Logo = ({ size = "normal" }) => {
  return (
    <div className={`futuremedia-logo ${size}`}>
      <span className="fm-f">F</span>
      <span className="fm-m">M</span>
      <span className="fm-text">FutureMedia</span>
    </div>
  );
};

export default Logo;
