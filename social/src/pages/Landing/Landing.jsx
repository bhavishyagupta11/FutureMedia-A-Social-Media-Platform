import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Compass,
  MessageCircleMore,
  Heart,
  Bookmark,
  Share2,
  TrendingUp,
  Hash,
  Users,
  ShieldCheck,
  Zap,
  Clock,
  Image as ImageIcon,
  Video,
  Menu,
  X,
  ChevronRight,
  CheckCircle2,
  Flame,
  Globe,
  Lock,
  Eye,
  Send,
  BadgeCheck,
  Grid,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { toast } from "react-toastify";
import { useMutation } from "@tanstack/react-query";
import Logo from "../../components/Logo/Logo";
import ProfileImage from "../../img/profileImg.jpg";
import { apiFetch } from "../../utils/api";
import { getSessionUserId, persistUserSession } from "../../utils/session";
import "./Landing.css";

const Landing = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [likedHeroPost, setLikedHeroPost] = useState(false);
  const [savedHeroPost, setSavedHeroPost] = useState(false);
  const [likeCount, setLikeCount] = useState(1420);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [activeMediaSlide, setActiveMediaSlide] = useState(0);

  // Auth Modal State: null | "login" | "signup" | "forgot-password"
  const [authModal, setAuthModal] = useState(null);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendStatus, setResendStatus] = useState({ loading: false, success: false, error: "" });

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupFieldErrors, setSignupFieldErrors] = useState({});

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState("");

  const isLoggedIn = Boolean(getSessionUserId());

  // Editorial Media Visuals for the Hero Showcase (CSS/SVG based, warm & creative)
  const heroVisuals = [
    {
      id: 1,
      title: "Generative Shaders & Kinetic Flow",
      category: "Creative Coding",
      gradient: "linear-gradient(135deg, #FFE2D2 0%, #FF8A4C 45%, #E6DDF0 100%)",
      accent: "#FF8A4C",
      stats: "60 FPS • WebGL 2.0",
      tag: "#generative"
    },
    {
      id: 2,
      title: "Atmospheric Dusk & Shadow Roll-off",
      category: "35mm Photography",
      gradient: "linear-gradient(135deg, #E6F0E0 0%, #A8C98F 50%, #FFE2D2 100%)",
      accent: "#648D47",
      stats: "35mm Prime • f/1.4",
      tag: "#streetphoto"
    },
    {
      id: 3,
      title: "Micro-Interactions & Fluid Design",
      category: "UI Architecture",
      gradient: "linear-gradient(135deg, #F4F0F8 0%, #F5D8DC 50%, #FFD8B8 100%)",
      accent: "#D96C6C",
      stats: "Design Tokens • Tokens Studio",
      tag: "#designsystems"
    }
  ];

  const storyDemos = [
    {
      name: "Aria Sterling",
      time: "4h ago",
      avatar: ProfileImage,
      quote: '"Working on a new generative shader series today. Trying to keep the geometry clean."',
      views: "482 views",
      reactions: "❤️ 94",
      accent: "#FF8A4C"
    },
    {
      name: "Julian Ross",
      time: "2h ago",
      avatar: ProfileImage,
      quote: '"Took the 35mm out at dusk to test the new lens coating. Loving the shadow roll-off."',
      views: "312 views",
      reactions: "🔥 76",
      accent: "#A8C98F"
    },
    {
      name: "Maya Lin",
      time: "1h ago",
      avatar: ProfileImage,
      quote: '"Testing particle physics at 60fps in the browser. Code link coming soon in the thread."',
      views: "594 views",
      reactions: "✨ 128",
      accent: "#E6DDF0"
    }
  ];

  // Scroll listener for sticky navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock background scroll while modal is open
  useEffect(() => {
    if (authModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [authModal]);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && authModal) {
        setAuthModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [authModal]);

  const handleHeroLike = () => {
    if (likedHeroPost) {
      setLikedHeroPost(false);
      setLikeCount((c) => c - 1);
    } else {
      setLikedHeroPost(true);
      setLikeCount((c) => c + 1);
    }
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const openModal = (mode) => {
    setMobileMenuOpen(false);
    setUnverifiedEmail("");
    setSignupFieldErrors({});
    setAuthModal(mode);
  };

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await apiFetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        const err = new Error(data.message || "Login failed");
        err.code = data.code;
        throw err;
      }
      return data;
    },
    onSuccess: (data) => {
      persistUserSession(data.data || data);
      toast.success("Welcome back!");
      setAuthModal(null);
      navigate("/home");
    },
    onError: (error) => {
      if (error.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(loginIdentifier.trim());
        toast.error("Please verify your email address to log in.");
      } else {
        toast.error(error.message || "Invalid credentials.");
      }
    },
  });

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const normalizedIdentifier = loginIdentifier.trim();
    if (!normalizedIdentifier || !loginPassword) {
      toast.warn("Username/email and password are required.");
      return;
    }
    loginMutation.mutate({ username: normalizedIdentifier, password: loginPassword });
  };

  const handleResendFromLogin = async () => {
    if (!unverifiedEmail) return;
    setResendStatus({ loading: true, success: false, error: "" });
    try {
      const res = await apiFetch("/api/v1/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendStatus({ loading: false, success: true, error: "" });
        toast.success("Verification email sent! Please check your inbox.");
      } else {
        setResendStatus({ loading: false, success: false, error: data.message || "Failed to resend email." });
        toast.error(data.message || "Failed to resend link.");
      }
    } catch {
      setResendStatus({ loading: false, success: false, error: "Network error. Please try again." });
    }
  };

  // Signup Mutation
  const signupMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await apiFetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        if (data.errors && Array.isArray(data.errors)) {
          const formattedErrors = {};
          data.errors.forEach(err => { formattedErrors[err.field] = err.message; });
          const err = new Error(data.message);
          err.isValidation = true;
          err.errors = formattedErrors;
          throw err;
        }
        throw new Error(data.message || "Registration failed");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Account created successfully! Please check your email to verify.");
      setAuthModal("login");
    },
    onError: (error) => {
      if (error.isValidation) {
        setSignupFieldErrors(error.errors || {});
        toast.error(error.message || "Please fix the validation errors.");
      } else {
        toast.error(error.message || "Network or server error.");
      }
    },
  });

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    setSignupFieldErrors({});

    if (signupPassword !== signupConfirmPassword) {
      setSignupFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    signupMutation.mutate({
      email: signupEmail.trim(),
      username: signupUsername.trim(),
      password: signupPassword,
    });
  };

  // Forgot Password Mutation
  const forgotMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await apiFetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send reset email");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Password reset email sent! Check your inbox.");
      setAuthModal("login");
    },
    onError: (error) => toast.error(error.message || "Failed to send reset link"),
  });

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.warn("Please enter your email address.");
      return;
    }
    forgotMutation.mutate({ email: forgotEmail.trim() });
  };

  return (
    <div className="fm-landing">
      {/* ─── 1. Sticky Editorial Navigation ──────────────────────────────── */}
      <header className={`fm-navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="fm-nav-container">
          <div className="fm-nav-left" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <Logo size="normal" className="fm-nav-logo" />
            <span className="fm-brand-name">
              Future<span className="fm-accent-text">Media</span>
            </span>
          </div>

          <nav className="fm-nav-center">
            <button className="fm-nav-link" onClick={() => scrollToSection("features")}>
              Features
            </button>
            <button className="fm-nav-link" onClick={() => scrollToSection("stories")}>
              Stories
            </button>
            <button className="fm-nav-link" onClick={() => scrollToSection("conversations")}>
              Messaging
            </button>
            <button className="fm-nav-link" onClick={() => scrollToSection("communities")}>
              Communities
            </button>
            <button className="fm-nav-link" onClick={() => scrollToSection("creators")}>
              Creators
            </button>
          </nav>

          <div className="fm-nav-right">
            {isLoggedIn ? (
              <button className="fm-btn-primary fm-btn-nav" onClick={() => navigate("/home")}>
                Go to Feed <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <button className="fm-nav-signin" onClick={() => openModal("login")}>
                  Log In
                </button>
                <button className="fm-btn-primary fm-btn-nav" onClick={() => openModal("signup")}>
                  Get Started <ArrowRight size={15} />
                </button>
              </>
            )}

            <button
              className="fm-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="fm-mobile-menu"
            >
              <button className="fm-mobile-link" onClick={() => scrollToSection("features")}>
                Features
              </button>
              <button className="fm-mobile-link" onClick={() => scrollToSection("stories")}>
                Stories
              </button>
              <button className="fm-mobile-link" onClick={() => scrollToSection("conversations")}>
                Messaging
              </button>
              <button className="fm-mobile-link" onClick={() => scrollToSection("communities")}>
                Communities
              </button>
              <button className="fm-mobile-link" onClick={() => scrollToSection("creators")}>
                Creators
              </button>
              <div className="fm-mobile-auth-actions">
                {isLoggedIn ? (
                  <button className="fm-btn-primary full-width" onClick={() => navigate("/home")}>
                    Go to Feed <ArrowRight size={16} />
                  </button>
                ) : (
                  <>
                    <button className="fm-btn-secondary full-width" onClick={() => openModal("login")}>
                      Log In
                    </button>
                    <button className="fm-btn-primary full-width" onClick={() => openModal("signup")}>
                      Get Started <ArrowRight size={16} />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="fm-main-content">
        {/* ─── 2. Hero Section ────────────────────────────────────────────── */}
        <section className="fm-hero-section">
          <div className="fm-hero-container">
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="fm-hero-title"
            >
              Connect. <br />
              <span className="fm-gradient-text">Share.</span> <br />
              Grow Together.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="fm-hero-subtitle"
            >
              A warm, creative place for the things you make, the people you know, and the conversations you want to keep up with.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="fm-hero-actions"
            >
              <button className="fm-btn-primary fm-btn-large" onClick={() => openModal("signup")}>
                Create Account <ArrowRight size={17} />
              </button>
              <button
                className="fm-btn-secondary fm-btn-large"
                onClick={() => scrollToSection("features")}
              >
                <Compass size={17} /> Explore Platform
              </button>
            </motion.div>

            {/* Factual Capability Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22 }}
              className="fm-hero-pillars"
            >
              <div className="fm-pillar-item">
                <div className="fm-pillar-dot" />
                <span>Real-Time Chat</span>
              </div>
              <div className="fm-pillar-divider" />
              <div className="fm-pillar-item">
                <div className="fm-pillar-dot sage" />
                <span>Photos, Video & Stories</span>
              </div>
              <div className="fm-pillar-divider" />
              <div className="fm-pillar-item">
                <div className="fm-pillar-dot lavender" />
                <span>Community Spaces</span>
              </div>
            </motion.div>

            {/* ─── 3. Layered Social Ecosystem Showcase ────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.26 }}
              className="fm-hero-composition"
            >
              {/* Floating Layer 1: Top-Left Story Card */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut" }}
                className="fm-float-card fm-float-story"
              >
                <div className="fm-story-ring-active">
                  <img src={ProfileImage} alt="Elena Vance" className="fm-story-avatar" />
                </div>
                <div className="fm-story-info">
                  <div className="fm-story-name">Elena Vance</div>
                  <div className="fm-story-time">
                    <Clock size={11} /> 2h ago • Story
                  </div>
                </div>
                <div className="fm-story-badge">Live</div>
              </motion.div>

              {/* Floating Layer 2: Top-Right Community Guild */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                className="fm-float-card fm-float-community"
              >
                <div className="fm-comm-header">
                  <div className="fm-comm-icon-wrap">
                    <Users size={15} />
                  </div>
                  <div>
                    <div className="fm-comm-title">Creative Tech Guild</div>
                    <div className="fm-comm-count">14.2k active members</div>
                  </div>
                </div>
                <div className="fm-comm-tags">
                  <span className="fm-tag-chip">#generative</span>
                  <span className="fm-tag-chip">#design</span>
                </div>
              </motion.div>

              {/* Central White Post Card */}
              <div className="fm-center-post-card">
                <div className="fm-post-header">
                  <div className="fm-post-author-box">
                    <img src={ProfileImage} alt="Creator" className="fm-post-avatar" />
                    <div>
                      <div className="fm-author-name-row">
                        <span className="fm-author-name">Aria Sterling</span>
                        <span className="fm-verified-badge" title="Verified Creator">✓</span>
                        <span className="fm-post-time">• 18m ago</span>
                      </div>
                      <div className="fm-author-handle">@ariasterling</div>
                    </div>
                  </div>
                  <div className="fm-audience-pill">
                    <Globe size={11} /> Public
                  </div>
                </div>

                <p className="fm-post-caption">
                  Finalizing the kinetic visual identity for next week's drop. Built entirely with
                  interactive shader curves and generative audio synthesis. Excited to share the full project with the community! ✨
                  <span className="fm-caption-hashtags"> #motiondesign #generative #futuremedia</span>
                </p>

                {/* Editorial Visual Artwork Preview */}
                <div className="fm-post-media-container">
                  <div
                    className="fm-post-art-canvas"
                    style={{ background: heroVisuals[activeMediaSlide].gradient }}
                  >
                    <div className="fm-art-inner">
                      <div className="fm-art-badge-top">
                        <Sparkles size={13} />
                        <span>{heroVisuals[activeMediaSlide].category}</span>
                      </div>
                      <h4 className="fm-art-title">{heroVisuals[activeMediaSlide].title}</h4>
                      <div className="fm-art-footer">
                        <span className="fm-art-tag">{heroVisuals[activeMediaSlide].tag}</span>
                        <span className="fm-art-stats">{heroVisuals[activeMediaSlide].stats}</span>
                      </div>
                    </div>
                  </div>

                  <div className="fm-media-badge">
                    <ImageIcon size={13} /> {activeMediaSlide + 1} / {heroVisuals.length}
                  </div>

                  {/* Carousel Switcher */}
                  <div className="fm-carousel-dots">
                    {heroVisuals.map((_, idx) => (
                      <button
                        key={idx}
                        className={`fm-dot-btn ${activeMediaSlide === idx ? "active" : ""}`}
                        onClick={() => setActiveMediaSlide(idx)}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="fm-post-engagement-bar">
                  <div className="fm-eng-actions">
                    <button
                      className={`fm-eng-btn ${likedHeroPost ? "active-like" : ""}`}
                      onClick={handleHeroLike}
                      aria-label="Like post"
                    >
                      <Heart
                        size={17}
                        fill={likedHeroPost ? "#FF8A4C" : "none"}
                        color={likedHeroPost ? "#FF8A4C" : "currentColor"}
                      />
                      <span>{likeCount.toLocaleString()}</span>
                    </button>
                    <button
                      className="fm-eng-btn"
                      onClick={() => scrollToSection("conversations")}
                      aria-label="View comments"
                    >
                      <MessageCircleMore size={17} />
                      <span>84</span>
                    </button>
                    <button className="fm-eng-btn" aria-label="Share post">
                      <Share2 size={17} />
                      <span>312</span>
                    </button>
                  </div>
                  <button
                    className={`fm-eng-btn fm-save-btn ${savedHeroPost ? "active-save" : ""}`}
                    onClick={() => setSavedHeroPost(!savedHeroPost)}
                    aria-label="Save post"
                  >
                    <Bookmark size={17} fill={savedHeroPost ? "var(--fm-primary)" : "none"} />
                  </button>
                </div>

                {/* Inline Comment Preview */}
                <div className="fm-post-comment-preview">
                  <img src={ProfileImage} alt="Julian" className="fm-comment-avatar" />
                  <div className="fm-comment-content">
                    <span className="fm-commenter-name">Julian Ross:</span>
                    <span className="fm-comment-text">The motion curves on slide 2 are breathtaking. Absolutely inspiring! 🔥</span>
                  </div>
                </div>
              </div>

              {/* Floating Layer 3: Bottom-Left Direct Message */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="fm-float-card fm-float-chat"
              >
                <div className="fm-chat-float-head">
                  <div className="fm-chat-online-dot" />
                  <span className="fm-chat-float-title">Direct Message</span>
                </div>
                <div className="fm-chat-float-body">
                  <p className="fm-chat-float-msg">"Sent you the collaboration project files!"</p>
                  <div className="fm-chat-typing">
                    <span className="fm-dot" />
                    <span className="fm-dot" />
                    <span className="fm-dot" />
                    <span className="fm-typing-label">Marcus is typing...</span>
                  </div>
                </div>
              </motion.div>

              {/* Floating Layer 4: Bottom-Right Trending Tag */}
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                className="fm-float-card fm-float-trending"
              >
                <div className="fm-trend-float-icon">
                  <Flame size={16} />
                </div>
                <div>
                  <div className="fm-trend-tag">#creativecoding</div>
                  <div className="fm-trend-stats">
                    <TrendingUp size={11} /> 28.4k posts this week
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ─── 4. Capability Summary Cards ─────────────────────────────────── */}
        <section className="fm-trust-section">
          <div className="fm-trust-container">
            <div className="fm-trust-grid">
              <div className="fm-trust-card">
                <div className="fm-trust-icon peach">
                  <Zap size={20} />
                </div>
                <div className="fm-trust-num">Live Chat</div>
                <div className="fm-trust-label">Fast 1-on-1 and group messaging</div>
              </div>

              <div className="fm-trust-card">
                <div className="fm-trust-icon sage">
                  <Clock size={20} />
                </div>
                <div className="fm-trust-num">24h Stories</div>
                <div className="fm-trust-label">Share moments that expire in a day</div>
              </div>

              <div className="fm-trust-card">
                <div className="fm-trust-icon pink">
                  <TrendingUp size={20} />
                </div>
                <div className="fm-trust-num">Explore Feeds</div>
                <div className="fm-trust-label">Find work and topics you care about</div>
              </div>

              <div className="fm-trust-card">
                <div className="fm-trust-icon lavender">
                  <ShieldCheck size={20} />
                </div>
                <div className="fm-trust-num">Audience Control</div>
                <div className="fm-trust-label">Choose who sees every post</div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 5. Bento Capabilities Grid ─────────────────────────────────── */}
        <section className="fm-section" id="features">
          <div className="fm-container">
            <div className="fm-section-header">
              <div className="fm-section-tag">FEATURES</div>
              <h2 className="fm-section-title">
                Share more than <br />
                <span className="fm-gradient-text">just a photo.</span>
              </h2>
              <p className="fm-section-description">
                Photos, videos, 24h stories, direct messaging, and finding people with shared interests.
              </p>
            </div>

            {/* Asymmetrical Bento Grid */}
            <div className="fm-bento-grid">
              {/* Bento 1: Multi-Media Posts */}
              <div className="fm-bento-card bento-wide">
                <div className="fm-bento-content">
                  <div className="fm-bento-top">
                    <div className="fm-bento-badge">Media Posts</div>
                    <div className="fm-feature-num">01</div>
                  </div>
                  <h3 className="fm-bento-title">Multi-Photo & Video Posts</h3>
                  <p className="fm-bento-desc">
                    Post photos, video, and the things you're working on without squeezing everything into one format. Slide carousels, hashtags, and clean resolution.
                  </p>
                  <div className="fm-bento-tags-row">
                    <span className="fm-bento-chip"><ImageIcon size={13} /> Photo Carousels</span>
                    <span className="fm-bento-chip"><Video size={13} /> Video Clips</span>
                    <span className="fm-bento-chip"><Hash size={13} /> Auto Hashtags</span>
                  </div>
                </div>

                <div className="fm-bento-visual-preview">
                  <div className="fm-bento-media-stack">
                    <div className="stack-card main-card" style={{ background: "linear-gradient(135deg, #FFE2D2, #FF8A4C)" }}>
                      <Sparkles size={20} color="#FFFFFF" />
                      <span>Interactive Shader 01</span>
                    </div>
                    <div className="stack-card sub-card" style={{ background: "linear-gradient(135deg, #E6F0E0, #A8C98F)" }}>
                      <span>Dusk Palette</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento 2: Ephemeral Stories */}
              <div className="fm-bento-card">
                <div className="fm-bento-top">
                  <div className="fm-feature-icon-wrap sage">
                    <Clock size={18} />
                  </div>
                  <div className="fm-feature-num">02</div>
                </div>
                <h3 className="fm-bento-title">Some posts don't need to stay.</h3>
                <p className="fm-bento-desc">
                  Share something for the moment and let it disappear after 24 hours. See who watched with real-time viewer lists.
                </p>

                <div className="fm-bento-story-mini">
                  <div className="fm-mini-story-ring">
                    <img src={ProfileImage} alt="Story User" />
                  </div>
                  <div className="fm-mini-story-text">
                    "Working on some new sketches today..."
                  </div>
                  <div className="fm-mini-story-stat">
                    <Eye size={12} /> 482 viewers
                  </div>
                </div>
              </div>

              {/* Bento 3: Real-Time Messaging */}
              <div className="fm-bento-card">
                <div className="fm-bento-top">
                  <div className="fm-feature-icon-wrap peach">
                    <MessageCircleMore size={18} />
                  </div>
                  <div className="fm-feature-num">03</div>
                </div>
                <h3 className="fm-bento-title">Talk while it's happening.</h3>
                <p className="fm-bento-desc">
                  Keep conversations moving with direct messages, media sharing, and live typing activity.
                </p>
                <div className="fm-bento-chat-indicator">
                  <div className="fm-chat-online-dot" />
                  <span>Live message delivery</span>
                </div>
              </div>

              {/* Bento 4: Dynamic Discovery */}
              <div className="fm-bento-card">
                <div className="fm-bento-top">
                  <div className="fm-feature-icon-wrap lavender">
                    <TrendingUp size={18} />
                  </div>
                  <div className="fm-feature-num">04</div>
                </div>
                <h3 className="fm-bento-title">See what's getting people talking.</h3>
                <p className="fm-bento-desc">
                  Find posts, creators, and conversations based on what people are actually sharing.
                </p>
                <div className="fm-bento-tag-cloud">
                  <span>#generative</span>
                  <span>#35mm</span>
                  <span>#design</span>
                  <span>#creativecoding</span>
                </div>
              </div>

              {/* Bento 5: Creator Identity */}
              <div className="fm-bento-card bento-wide">
                <div className="fm-bento-content">
                  <div className="fm-bento-top">
                    <div className="fm-feature-icon-wrap pink">
                      <Users size={18} />
                    </div>
                    <div className="fm-feature-num">05</div>
                  </div>
                  <h3 className="fm-bento-title">Make your profile yours.</h3>
                  <p className="fm-bento-desc">
                    Show your work, your interests, and the things you want people to find. Pin your best posts and customize your bio.
                  </p>
                  <div className="fm-bento-tags-row">
                    <span className="fm-bento-chip"><BadgeCheck size={13} /> Verified Creator Badge</span>
                    <span className="fm-bento-chip"><Grid size={13} /> Custom Profile Grid</span>
                    <span className="fm-bento-chip"><Bookmark size={13} /> Saved Collections</span>
                  </div>
                </div>

                <div className="fm-bento-profile-snippet">
                  <div className="fm-mini-profile-card">
                    <img src={ProfileImage} alt="Profile" className="fm-mini-p-avatar" />
                    <div>
                      <div className="fm-mini-p-name">Aria Sterling ✓</div>
                      <div className="fm-mini-p-handle">@ariasterling • 14.8k followers</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento 6: Privacy Controls */}
              <div className="fm-bento-card">
                <div className="fm-bento-top">
                  <div className="fm-feature-icon-wrap blue">
                    <Lock size={18} />
                  </div>
                  <div className="fm-feature-num">06</div>
                </div>
                <h3 className="fm-bento-title">Choose who sees it.</h3>
                <p className="fm-bento-desc">
                  Keep a post public, share it with followers, or keep it private. You decide.
                </p>
                <div className="fm-bento-privacy-toggle">
                  <span className="active"><Globe size={12} /> Public</span>
                  <span><Lock size={12} /> Private</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 6. Product Story Showcases ──────────────────────────────────── */}

        {/* Showcase A: Content Creation */}
        <section className="fm-showcase-section" id="showcase-create">
          <div className="fm-container">
            <div className="fm-showcase-grid">
              <div className="fm-showcase-content">
                <div className="fm-section-tag">POSTS</div>
                <h2 className="fm-showcase-title">
                  Post the moment. <br />
                  <span className="fm-gradient-text">Keep the memory.</span>
                </h2>
                <p className="fm-showcase-desc">
                  Drop a photo carousel, share a video, or start a thread. Clean layout, full resolution, no clutter.
                </p>

                <div className="fm-showcase-points">
                  <div className="fm-point-item">
                    <CheckCircle2 size={17} className="fm-point-icon" />
                    <div>
                      <strong>Multi-Photo Carousels</strong>
                      <p>Upload and preview multiple photos in a single post.</p>
                    </div>
                  </div>
                  <div className="fm-point-item">
                    <CheckCircle2 size={17} className="fm-point-icon" />
                    <div>
                      <strong>Audience Switcher</strong>
                      <p>Choose between Public reach and Private followers-only view.</p>
                    </div>
                  </div>
                  <div className="fm-point-item">
                    <CheckCircle2 size={17} className="fm-point-icon" />
                    <div>
                      <strong>Hashtag Indexing</strong>
                      <p>Tags in your captions connect your post to topic feeds automatically.</p>
                    </div>
                  </div>
                </div>

                <button className="fm-btn-primary fm-btn-inline" onClick={() => openModal("signup")}>
                  Create an account <ChevronRight size={16} />
                </button>
              </div>

              {/* Mockup: Composer UI */}
              <div className="fm-showcase-visual">
                <div className="fm-composer-mockup">
                  <div className="fm-composer-header">
                    <img src={ProfileImage} alt="User avatar" className="fm-mock-avatar" />
                    <div className="fm-composer-input-sim">
                      <span className="fm-input-text">Capturing golden hour in the city with the new prime lens...</span>
                      <span className="fm-input-tags"> #streetphotography #35mm #goldenhour</span>
                    </div>
                  </div>

                  <div className="fm-composer-media-grid">
                    <div className="fm-media-slot main-slot" style={{ background: "linear-gradient(135deg, #FFE2D2, #FF8A4C)" }}>
                      <div className="fm-slot-badge">Cover Image</div>
                      <div className="fm-slot-text">Street Light Study</div>
                    </div>
                    <div className="fm-media-slot sub-slot" style={{ background: "linear-gradient(135deg, #E6F0E0, #A8C98F)" }}>
                      <div className="fm-slot-text">Shadows 02</div>
                    </div>
                  </div>

                  <div className="fm-composer-toolbar">
                    <div className="fm-tool-icons">
                      <button className="fm-tool-btn active" aria-label="Photo upload"><ImageIcon size={16} /></button>
                      <button className="fm-tool-btn" aria-label="Video upload"><Video size={16} /></button>
                      <button className="fm-tool-btn" aria-label="Hashtags"><Hash size={16} /></button>
                    </div>
                    <div className="fm-composer-actions">
                      <div className="fm-mock-pill"><Globe size={12} /> Public</div>
                      <button className="fm-mock-post-btn" onClick={() => openModal("signup")}>Post</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Showcase B: Ephemeral Stories */}
        <section className="fm-showcase-section fm-showcase-alt" id="stories">
          <div className="fm-container">
            <div className="fm-showcase-grid reverse">
              {/* Visual: Stories UI */}
              <div className="fm-showcase-visual">
                <div className="fm-story-showcase-card">
                  <div className="fm-story-tray-demo">
                    {storyDemos.map((s, idx) => (
                      <div
                        key={idx}
                        className={`fm-story-pill ${activeStoryIdx === idx ? "active" : ""}`}
                        onClick={() => setActiveStoryIdx(idx)}
                      >
                        <div className={`fm-story-ring ${activeStoryIdx === idx ? "active" : ""}`}>
                          <img src={s.avatar} alt={s.name} />
                        </div>
                        <span>{s.name.split(" ")[0]}</span>
                      </div>
                    ))}
                  </div>

                  {/* Active Story View */}
                  <div className="fm-story-viewer-demo">
                    <div className="fm-story-bars">
                      <div className="fm-bar fill" />
                      <div className="fm-bar progress" />
                      <div className="fm-bar" />
                    </div>

                    <div className="fm-story-meta">
                      <div className="fm-story-user-row">
                        <img
                          src={storyDemos[activeStoryIdx].avatar}
                          alt={storyDemos[activeStoryIdx].name}
                          className="fm-author-sm"
                        />
                        <div>
                          <div className="fm-name-sm">{storyDemos[activeStoryIdx].name}</div>
                          <div className="fm-time-sm">{storyDemos[activeStoryIdx].time}</div>
                        </div>
                      </div>
                    </div>

                    <div className="fm-story-body-content">
                      <div className="fm-story-quote">
                        {storyDemos[activeStoryIdx].quote}
                      </div>
                    </div>

                    <div className="fm-story-footer-stats">
                      <div className="fm-viewers-tag">
                        <Eye size={12} /> {storyDemos[activeStoryIdx].views}
                      </div>
                      <div className="fm-story-react-bubble">
                        {storyDemos[activeStoryIdx].reactions}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="fm-showcase-content">
                <div className="fm-section-tag">STORIES</div>
                <h2 className="fm-showcase-title">
                  Some moments are <br />
                  <span className="fm-gradient-text">meant to disappear.</span>
                </h2>
                <p className="fm-showcase-desc">
                  Not everything belongs permanently on your grid. Stories give you an easy way to share daily thoughts, work in progress, and quick updates.
                </p>

                <div className="fm-showcase-points">
                  <div className="fm-point-item">
                    <CheckCircle2 size={17} className="fm-point-icon" />
                    <div>
                      <strong>Text & Photo Moments</strong>
                      <p>Share fullscreen typographic thoughts or photo snapshots.</p>
                    </div>
                  </div>
                  <div className="fm-point-item">
                    <CheckCircle2 size={17} className="fm-point-icon" />
                    <div>
                      <strong>Viewer Lists & Reactions</strong>
                      <p>See who checked out your story with viewer logs and quick reactions.</p>
                    </div>
                  </div>
                  <div className="fm-point-item">
                    <CheckCircle2 size={17} className="fm-point-icon" />
                    <div>
                      <strong>24-Hour Expiration</strong>
                      <p>Stories automatically clear out after 24 hours.</p>
                    </div>
                  </div>
                </div>

                <button className="fm-btn-primary fm-btn-inline" onClick={() => openModal("signup")}>
                  Try Stories <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Showcase C: Real-Time Messaging */}
        <section className="fm-showcase-section" id="conversations">
          <div className="fm-container">
            <div className="fm-showcase-grid">
              <div className="fm-showcase-content">
                <div className="fm-section-tag">MESSAGING</div>
                <h2 className="fm-showcase-title">
                  Talk while <br />
                  <span className="fm-gradient-text">it's happening.</span>
                </h2>
                <p className="fm-showcase-desc">
                  Direct and group messaging built right into the platform. Share media, send quick replies, and stay connected.
                </p>

                <div className="fm-showcase-points">
                  <div className="fm-point-item">
                    <CheckCircle2 size={17} className="fm-point-icon" />
                    <div>
                      <strong>Live Chat</strong>
                      <p>Fast 1-on-1 and group message delivery.</p>
                    </div>
                  </div>
                  <div className="fm-point-item">
                    <CheckCircle2 size={17} className="fm-point-icon" />
                    <div>
                      <strong>Typing Feedback</strong>
                      <p>See when people are writing back in real time.</p>
                    </div>
                  </div>
                  <div className="fm-point-item">
                    <CheckCircle2 size={17} className="fm-point-icon" />
                    <div>
                      <strong>Media Previews</strong>
                      <p>Share photos, videos, and links directly in conversation.</p>
                    </div>
                  </div>
                </div>

                <button className="fm-btn-primary fm-btn-inline" onClick={() => openModal("signup")}>
                  Start Chatting <ChevronRight size={16} />
                </button>
              </div>

              {/* Visual: Chat Interface Mockup */}
              <div className="fm-showcase-visual">
                <div className="fm-chat-mockup">
                  <div className="fm-chat-header">
                    <div className="fm-chat-user-status">
                      <div className="fm-chat-avatar-wrap">
                        <img src={ProfileImage} alt="Marcus" />
                        <div className="fm-online-indicator" />
                      </div>
                      <div>
                        <div className="fm-chat-user-name">Marcus Vance</div>
                        <div className="fm-chat-user-sub">Active now in Creative Guild</div>
                      </div>
                    </div>
                    <div className="fm-chat-actions">
                      <div className="fm-pill-status">Encrypted</div>
                    </div>
                  </div>

                  <div className="fm-chat-message-list">
                    <div className="fm-chat-msg incoming">
                      <p>Hey Aria! Did you see the new community challenge topic?</p>
                      <span className="fm-msg-time">10:42 AM</span>
                    </div>

                    <div className="fm-chat-msg outgoing">
                      <p>Yes! Just submitted the generative typography series we worked on last night 🚀</p>
                      <span className="fm-msg-time">10:44 AM • Read</span>
                    </div>

                    <div className="fm-chat-msg incoming">
                      <p>Amazing! The feedback on the Explore page is already exploding 🔥</p>
                      <span className="fm-msg-time">10:45 AM</span>
                    </div>

                    <div className="fm-chat-typing-row">
                      <div className="fm-typing-bubble">
                        <span />
                        <span />
                        <span />
                      </div>
                      <span className="fm-typing-text">Marcus is typing...</span>
                    </div>
                  </div>

                  <div className="fm-chat-input-row">
                    <input
                      type="text"
                      placeholder="Write a message..."
                      className="fm-chat-input"
                      readOnly
                      value="Can't wait to see the final community renders!"
                    />
                    <button className="fm-chat-send-btn" onClick={() => openModal("login")} aria-label="Send message">
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 7. Creator Spotlight Section ────────────────────────────────── */}
        <section className="fm-section fm-creators-spotlight-section" id="creators">
          <div className="fm-container">
            <div className="fm-section-header">
              <div className="fm-section-tag">PROFILES</div>
              <h2 className="fm-section-title">
                Your profile should <br />
                <span className="fm-gradient-text">feel like yours.</span>
              </h2>
              <p className="fm-section-description">
                Show your work, pin your favorite posts, and give people a clear sense of what you make.
              </p>
            </div>

            <div className="fm-creator-portfolio-card">
              <div className="fm-creator-banner">
                <div className="fm-banner-badge">Featured Profile</div>
              </div>

              <div className="fm-creator-profile-row">
                <div className="fm-creator-avatar-box">
                  <img src={ProfileImage} alt="Aria Sterling" className="fm-creator-main-avatar" />
                  <div className="fm-creator-verified-icon">✓</div>
                </div>

                <div className="fm-creator-details">
                  <div className="fm-creator-name-row">
                    <h3 className="fm-c-name">Aria Sterling</h3>
                    <span className="fm-c-handle">@ariasterling</span>
                  </div>
                  <p className="fm-c-bio">
                    Digital artist exploring motion, generative visuals, and interactive experiments.
                  </p>

                  <div className="fm-c-metrics-row">
                    <div className="fm-c-metric">
                      <strong>14.8k</strong> <span>Followers</span>
                    </div>
                    <div className="fm-c-metric">
                      <strong>428</strong> <span>Following</span>
                    </div>
                    <div className="fm-c-metric">
                      <strong>92</strong> <span>Posts</span>
                    </div>
                  </div>
                </div>

                <div className="fm-creator-actions-box">
                  <button className="fm-btn-primary fm-btn-follow" onClick={() => openModal("signup")}>
                    Follow Creator
                  </button>
                  <button
                    className="fm-btn-secondary fm-btn-msg-icon"
                    onClick={() => openModal("login")}
                    aria-label="Message Aria"
                  >
                    <MessageCircleMore size={17} />
                  </button>
                </div>
              </div>

              {/* Creator Editorial Media Gallery */}
              <div className="fm-creator-media-gallery">
                <div className="fm-gallery-item" style={{ background: "linear-gradient(135deg, #FFE2D2, #FF8A4C)" }} onClick={() => openModal("login")}>
                  <div className="fm-gallery-inner">
                    <Sparkles size={20} color="#FFF" />
                    <span>Kinetic Series</span>
                  </div>
                  <div className="fm-gallery-overlay">
                    <span>❤️ 1.4k</span>
                    <span>💬 84</span>
                  </div>
                </div>
                <div className="fm-gallery-item" style={{ background: "linear-gradient(135deg, #E6F0E0, #A8C98F)" }} onClick={() => openModal("login")}>
                  <div className="fm-gallery-inner">
                    <span>Dusk Waves</span>
                  </div>
                  <div className="fm-gallery-overlay">
                    <span>❤️ 980</span>
                    <span>💬 46</span>
                  </div>
                </div>
                <div className="fm-gallery-item" style={{ background: "linear-gradient(135deg, #F4F0F8, #F5D8DC)" }} onClick={() => openModal("login")}>
                  <div className="fm-gallery-inner">
                    <span>Micro Shader</span>
                  </div>
                  <div className="fm-gallery-overlay">
                    <span>❤️ 2.1k</span>
                    <span>💬 112</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 8. Communities Section ──────────────────────────────────────── */}
        <section className="fm-section" id="communities">
          <div className="fm-container">
            <div className="fm-section-header">
              <div className="fm-section-tag">COMMUNITIES</div>
              <h2 className="fm-section-title">
                Find people who are <br />
                <span className="fm-gradient-text">into the same things.</span>
              </h2>
              <p className="fm-section-description">
                Spaces organized around photography, generative art, design systems, and creative projects.
              </p>
            </div>

            <div className="fm-community-grid">
              <div className="fm-comm-card">
                <div className="fm-comm-card-top">
                  <div className="fm-comm-badge-cat sage">Visual Arts</div>
                  <div className="fm-comm-members-count">
                    <Users size={13} /> 28.6k members
                  </div>
                </div>
                <h3 className="fm-comm-name">Generative Art & Shaders</h3>
                <p className="fm-comm-desc">
                  People sharing experiments, techniques, and things made with code.
                </p>
                <div className="fm-comm-avatars-row">
                  <div className="fm-avatar-stack">
                    <img src={ProfileImage} alt="User 1" />
                    <img src={ProfileImage} alt="User 2" />
                  </div>
                  <span className="fm-active-indicator">+142 active today</span>
                </div>
                <div className="fm-comm-tags-row">
                  <span>#webgl</span>
                  <span>#shaders</span>
                  <span>#generative</span>
                </div>
              </div>

              <div className="fm-comm-card featured">
                <div className="fm-comm-card-top">
                  <div className="fm-comm-badge-cat peach">Featured Community</div>
                  <div className="fm-comm-members-count">
                    <Users size={13} /> 41.2k members
                  </div>
                </div>
                <h3 className="fm-comm-name">Independent Photographers</h3>
                <p className="fm-comm-desc">
                  Share recent work, talk gear, and find people shooting in the same direction.
                </p>
                <div className="fm-comm-avatars-row">
                  <div className="fm-avatar-stack">
                    <img src={ProfileImage} alt="User 1" />
                    <img src={ProfileImage} alt="User 2" />
                  </div>
                  <span className="fm-active-indicator">+390 active today</span>
                </div>
                <div className="fm-comm-tags-row">
                  <span>#streetphoto</span>
                  <span>#35mm</span>
                  <span>#monochrome</span>
                </div>
              </div>

              <div className="fm-comm-card">
                <div className="fm-comm-card-top">
                  <div className="fm-comm-badge-cat lavender">Design & Tech</div>
                  <div className="fm-comm-members-count">
                    <Users size={13} /> 19.8k members
                  </div>
                </div>
                <h3 className="fm-comm-name">Design Systems & UI Engineering</h3>
                <p className="fm-comm-desc">
                  Patterns, components, accessibility, and the details behind good interfaces.
                </p>
                <div className="fm-comm-avatars-row">
                  <div className="fm-avatar-stack">
                    <img src={ProfileImage} alt="User 1" />
                    <img src={ProfileImage} alt="User 2" />
                  </div>
                  <span className="fm-active-indicator">+88 active today</span>
                </div>
                <div className="fm-comm-tags-row">
                  <span>#designsystems</span>
                  <span>#ui</span>
                  <span>#react</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 9. Perspectives / Social Proof ─────────────────────────────── */}
        <section className="fm-section fm-creators-section">
          <div className="fm-container">
            <div className="fm-section-header">
              <div className="fm-section-tag">PERSPECTIVES</div>
              <h2 className="fm-section-title">
                How people use <br />
                <span className="fm-gradient-text">FutureMedia.</span>
              </h2>
              <p className="fm-section-description">
                A few notes from creators and community members on why they post here.
              </p>
            </div>

            <div className="fm-quotes-grid">
              <div className="fm-quote-card">
                <div className="fm-quote-mark">“</div>
                <p className="fm-quote-text">
                  I wanted somewhere I could post the work without having to turn every post into an advertisement.
                </p>
                <div className="fm-quote-author">
                  <img src={ProfileImage} alt="Aria Sterling" className="fm-quote-avatar" />
                  <div>
                    <div className="fm-quote-name">Aria Sterling</div>
                    <div className="fm-quote-role">Generative Visual Artist</div>
                  </div>
                </div>
              </div>

              <div className="fm-quote-card">
                <div className="fm-quote-mark">“</div>
                <p className="fm-quote-text">
                  The mix of 24h stories and full photo posts lets me share daily process without cluttering my grid.
                </p>
                <div className="fm-quote-author">
                  <img src={ProfileImage} alt="Marcus Vance" className="fm-quote-avatar" />
                  <div>
                    <div className="fm-quote-name">Marcus Vance</div>
                    <div className="fm-quote-role">Photographer & Writer</div>
                  </div>
                </div>
              </div>

              <div className="fm-quote-card">
                <div className="fm-quote-mark">“</div>
                <p className="fm-quote-text">
                  Most of my conversations start with something someone shared in one of the community feeds.
                </p>
                <div className="fm-quote-author">
                  <img src={ProfileImage} alt="Maya Lin" className="fm-quote-avatar" />
                  <div>
                    <div className="fm-quote-name">Maya Lin</div>
                    <div className="fm-quote-role">Creative Technologist</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 10. Final CTA Section ───────────────────────────────────────── */}
        <section className="fm-cta-section">
          <div className="fm-container">
            <div className="fm-cta-panel">
              <div className="fm-cta-content">
                <h2 className="fm-cta-title">
                  Come see what's <br />
                  <span className="fm-gradient-text">happening.</span>
                </h2>
                <p className="fm-cta-desc">
                  Share something, find people, and see what your feed looks like.
                </p>

                <div className="fm-cta-buttons">
                  <button className="fm-btn-primary fm-btn-large" onClick={() => openModal("signup")}>
                    Create Account <ArrowRight size={17} />
                  </button>
                  <button
                    className="fm-btn-secondary fm-btn-large"
                    onClick={() => scrollToSection("features")}
                  >
                    Explore Platform
                  </button>
                </div>

                <div className="fm-cta-subtext">
                  <span>Free to join</span>
                  <span>•</span>
                  <span>No invite needed</span>
                  <span>•</span>
                  <span>Open to everyone</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── 11. Multi-Column Editorial Footer ────────────────────────────── */}
      <footer className="fm-footer">
        <div className="fm-footer-container">
          <div className="fm-footer-top">
            <div className="fm-footer-brand-col">
              <div className="fm-footer-logo-row">
                <Logo size="normal" />
                <span className="fm-brand-name">FutureMedia</span>
              </div>
              <p className="fm-footer-bio">
                A warm social media platform for sharing work, stories, and conversations.
              </p>
              <div className="fm-footer-tagline">
                Connect. Share. Grow Together.
              </div>
            </div>

            <div className="fm-footer-nav-grid">
              <div className="fm-footer-col">
                <h4 className="fm-footer-head">Platform</h4>
                <ul className="fm-footer-list">
                  <li><button onClick={() => scrollToSection("features")}>Features</button></li>
                  <li><button onClick={() => scrollToSection("stories")}>Stories</button></li>
                  <li><button onClick={() => scrollToSection("conversations")}>Messaging</button></li>
                  <li><button onClick={() => scrollToSection("communities")}>Communities</button></li>
                  <li><button onClick={() => scrollToSection("features")}>Explore</button></li>
                </ul>
              </div>

              <div className="fm-footer-col">
                <h4 className="fm-footer-head">Ecosystem</h4>
                <ul className="fm-footer-list">
                  <li><button onClick={() => scrollToSection("creators")}>Creators</button></li>
                  <li><button onClick={() => scrollToSection("features")}>Tags & Trends</button></li>
                  <li><button onClick={() => openModal("signup")}>Join Community</button></li>
                  <li><button onClick={() => openModal("login")}>Sign In</button></li>
                </ul>
              </div>

              <div className="fm-footer-col">
                <h4 className="fm-footer-head">Account</h4>
                <ul className="fm-footer-list">
                  <li><button onClick={() => openModal("signup")}>Create Account</button></li>
                  <li><button onClick={() => openModal("login")}>Log In</button></li>
                  <li><button onClick={() => openModal("forgot-password")}>Password Reset</button></li>
                </ul>
              </div>

              <div className="fm-footer-col">
                <h4 className="fm-footer-head">Company & Legal</h4>
                <ul className="fm-footer-list">
                  <li><span className="fm-footer-muted">Privacy Policy</span></li>
                  <li><span className="fm-footer-muted">Terms of Service</span></li>
                  <li><span className="fm-footer-muted">Community Guidelines</span></li>
                  <li><span className="fm-footer-muted">Security</span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="fm-footer-bottom">
            <p className="fm-copyright">
              © {new Date().getFullYear()} FutureMedia Inc. All rights reserved.
            </p>
            <div className="fm-social-links">
              <span className="fm-social-badge">v2.0 Warm Edition</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── 12. In-Page Authentication Modal (Warm Solid White Card) ─────── */}
      <AnimatePresence>
        {authModal && (
          <div
            className="fm-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setAuthModal(null);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 14 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fm-modal-card"
              style={{ backgroundColor: "#FFFFFF" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="fm-modal-title"
            >
              {/* Close Button */}
              <button
                className="fm-modal-close"
                onClick={() => setAuthModal(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              {/* Modal Brand Header */}
              <div className="fm-modal-header">
                <Logo size="normal" />
                <h3 id="fm-modal-title" className="fm-modal-title">
                  {authModal === "login" && "Log In"}
                  {authModal === "signup" && "Create Account"}
                  {authModal === "forgot-password" && "Reset Password"}
                </h3>
                <p className="fm-modal-subtitle">
                  {authModal === "login" && "Log in to continue to your FutureMedia feed."}
                  {authModal === "signup" && "Build your profile and start sharing in seconds."}
                  {authModal === "forgot-password" && "Enter your email to receive a password reset link."}
                </p>
              </div>

              {/* ── LOGIN FORM ── */}
              {authModal === "login" && (
                <form className="fm-modal-form" onSubmit={handleLoginSubmit}>
                  {unverifiedEmail && (
                    <div className="fm-modal-alert warning">
                      <AlertCircle size={18} className="fm-alert-icon" />
                      <div className="fm-alert-text">
                        <strong>Email Verification Required</strong>
                        <p>Your account is registered but not verified yet.</p>
                        {resendStatus.success ? (
                          <span className="fm-alert-success">✓ Fresh verification email sent! Check your inbox.</span>
                        ) : (
                          <button
                            type="button"
                            className="fm-alert-btn"
                            onClick={handleResendFromLogin}
                            disabled={resendStatus.loading}
                          >
                            {resendStatus.loading ? "Sending..." : "Resend Verification Link"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="fm-input-group">
                    <label htmlFor="modal-login-id">Username or Email</label>
                    <input
                      id="modal-login-id"
                      type="text"
                      placeholder="@username or email"
                      className="fm-form-input"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="fm-input-group">
                    <div className="fm-label-row">
                      <label htmlFor="modal-login-pw">Password</label>
                      <button
                        type="button"
                        className="fm-text-btn"
                        onClick={() => setAuthModal("forgot-password")}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      id="modal-login-pw"
                      type="password"
                      placeholder="Enter your password"
                      className="fm-form-input"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="fm-btn-primary full-width fm-modal-submit"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Logging in..." : "Log In"}
                  </button>

                  <div className="fm-modal-footer">
                    <span>Don't have an account?</span>
                    <button
                      type="button"
                      className="fm-switch-btn"
                      onClick={() => setAuthModal("signup")}
                    >
                      Sign up for free
                    </button>
                  </div>
                </form>
              )}

              {/* ── SIGNUP FORM ── */}
              {authModal === "signup" && (
                <form className="fm-modal-form" onSubmit={handleSignupSubmit}>
                  <div className="fm-input-group">
                    <label htmlFor="modal-signup-email">Email Address</label>
                    <input
                      id="modal-signup-email"
                      type="email"
                      placeholder="you@example.com"
                      className="fm-form-input"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      autoFocus
                    />
                    {signupFieldErrors.email && (
                      <span className="fm-field-error">{signupFieldErrors.email}</span>
                    )}
                  </div>

                  <div className="fm-input-group">
                    <label htmlFor="modal-signup-username">Username</label>
                    <input
                      id="modal-signup-username"
                      type="text"
                      placeholder="@username"
                      className="fm-form-input"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      required
                    />
                    {signupFieldErrors.username && (
                      <span className="fm-field-error">{signupFieldErrors.username}</span>
                    )}
                  </div>

                  <div className="fm-input-row">
                    <div className="fm-input-group">
                      <label htmlFor="modal-signup-pw">Password</label>
                      <input
                        id="modal-signup-pw"
                        type="password"
                        placeholder="At least 8 chars"
                        className="fm-form-input"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                      {signupFieldErrors.password && (
                        <span className="fm-field-error">{signupFieldErrors.password}</span>
                      )}
                    </div>
                    <div className="fm-input-group">
                      <label htmlFor="modal-signup-cpw">Confirm Password</label>
                      <input
                        id="modal-signup-cpw"
                        type="password"
                        placeholder="Repeat password"
                        className="fm-form-input"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                      {signupFieldErrors.confirmPassword && (
                        <span className="fm-field-error">{signupFieldErrors.confirmPassword}</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="fm-btn-primary full-width fm-modal-submit"
                    disabled={signupMutation.isPending}
                  >
                    {signupMutation.isPending ? "Creating account..." : "Create Account"}
                  </button>

                  <div className="fm-modal-footer">
                    <span>Already on FutureMedia?</span>
                    <button
                      type="button"
                      className="fm-switch-btn"
                      onClick={() => setAuthModal("login")}
                    >
                      Log in
                    </button>
                  </div>
                </form>
              )}

              {/* ── FORGOT PASSWORD FORM ── */}
              {authModal === "forgot-password" && (
                <form className="fm-modal-form" onSubmit={handleForgotSubmit}>
                  <div className="fm-input-group">
                    <label htmlFor="modal-forgot-email">Email Address</label>
                    <input
                      id="modal-forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      className="fm-form-input"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    className="fm-btn-primary full-width fm-modal-submit"
                    disabled={forgotMutation.isPending}
                  >
                    {forgotMutation.isPending ? "Sending Link..." : "Send Reset Link"}
                  </button>

                  <div className="fm-modal-footer">
                    <button
                      type="button"
                      className="fm-switch-btn"
                      onClick={() => setAuthModal("login")}
                    >
                      ← Back to Log In
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;
