import React from "react";
import "./Logo.css";
import fullLogo from "../../assets/logos/futuremedia_full_logo.png";
import compactLogo from "../../assets/logos/futuremedia_compact_logo.png";

const Logo = ({
  variant = "compact", // "compact" | "full" | "responsive"
  size = "normal",     // "small" | "normal" | "large" | "hero"
  className = "",
  alt = "FutureMedia",
  onClick,
  style = {}
}) => {
  if (variant === "full") {
    return (
      <div
        className={`futuremedia-logo variant-full ${size} ${className}`}
        onClick={onClick}
        style={style}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <img
          src={fullLogo}
          alt={alt}
          className="fm-logo-img fm-full-logo"
          loading="eager"
        />
      </div>
    );
  }

  if (variant === "responsive") {
    return (
      <div
        className={`futuremedia-logo variant-responsive ${size} ${className}`}
        onClick={onClick}
        style={style}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <img
          src={fullLogo}
          alt={alt}
          className="fm-logo-img fm-full-logo fm-logo-desktop"
          loading="eager"
        />
        <img
          src={compactLogo}
          alt={alt}
          className="fm-logo-img fm-compact-logo fm-logo-mobile"
          loading="eager"
        />
      </div>
    );
  }

  // Default: compact squircle logo
  return (
    <div
      className={`futuremedia-logo variant-compact ${size} ${className}`}
      onClick={onClick}
      style={style}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <img
        src={compactLogo}
        alt={alt}
        className="fm-logo-img fm-compact-logo"
        loading="eager"
      />
    </div>
  );
};

export const FutureMediaLogo = Logo;
export default Logo;
