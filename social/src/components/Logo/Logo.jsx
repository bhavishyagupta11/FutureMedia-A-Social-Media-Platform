import React from "react";
import "./Logo.css";
import FMLogoImg from "../../img/fm-logo.jpg";

const Logo = ({ size = "normal", className = "" }) => {
  return (
    <div className={`futuremedia-logo ${size} ${className}`}>
      <img src={FMLogoImg} alt="FutureMedia — Connect. Share. Inspire." className="fm-brand-img" />
    </div>
  );
};

export default Logo;
