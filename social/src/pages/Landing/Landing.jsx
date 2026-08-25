import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
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
  Grid
} from "lucide-react";
import Logo from "../../components/Logo/Logo";
import ProfileImage from "../../img/profileImg.jpg";
import PostPic1 from "../../img/postpic1.jpg";
import PostPic2 from "../../img/postpic2.jpg";
import PostPic3 from "../../img/postpic3.JPG";
import { getSessionUserId } from "../../utils/session";
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

  const isLoggedIn = Boolean(getSessionUserId());

  const heroMediaSlides = [PostPic1, PostPic2, PostPic3];

  const storyDemos = [
    {
      name: "Aria Sterling",
      time: "4h ago",
      avatar: ProfileImage,
      quote: '"The best ideas arrive when you give yourself permission to experiment without a final destination in mind."',
      views: "482 views",
      reactions: "❤️ 94"
    },
    {
      name: "Julian Ross",
      time: "2h ago",
      avatar: PostPic1,
      quote: '"Exploring texture and golden hour light through the 35mm lens in the old quarters."',
      views: "312 views",
      reactions: "🔥 76"
    },
    {
      name: "Maya Lin",
      time: "1h ago",
      avatar: PostPic2,
      quote: '"Generative shader experiment #42 — reactive particle flows responding to ambient audio."',
      views: "594 views",
      reactions: "✨ 128"
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  return (
    <div className="fm-landing">
      {/* ─── Ambient Atmospheric Lighting ─────────────────────────────────── */}
      <div className="fm-ambient-glow glow-1" />
      <div className="fm-ambient-glow glow-2" />
      <div className="fm-ambient-glow glow-3" />
      <div className="fm-ambient-glow glow-4" />
      <div className="fm-grid-overlay" />

      {/* ─── 1. Refined Sticky Navbar ─────────────────────────────────────── */}
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
                <Link to="/login" className="fm-nav-signin">
                  Sign In
                </Link>
                <Link to="/signup" className="fm-btn-primary fm-btn-nav">
                  Get Started Free <ArrowRight size={15} />
                </Link>
              </>
            )}

            <button
              className="fm-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fm-mobile-menu"
            >
              <button className="fm-mobile-link" onClick={() => scrollToSection("features")}>
                Features
              </button>
              <button className="fm-mobile-link" onClick={() => scrollToSection("stories")}>
                24-Hour Stories
              </button>
              <button className="fm-mobile-link" onClick={() => scrollToSection("conversations")}>
                Real-Time Messaging
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
                    <Link to="/login" className="fm-btn-secondary full-width" onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                    <Link to="/signup" className="fm-btn-primary full-width" onClick={() => setMobileMenuOpen(false)}>
                      Get Started Free <ArrowRight size={16} />
                    </Link>
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
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="fm-hero-badge"
            >
              <Sparkles size={13} className="fm-badge-icon" />
              <span>THE NEXT-GENERATION CREATOR & SOCIAL PLATFORM</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="fm-hero-title"
            >
              Connect. <br />
              <span className="fm-gradient-text">Share.</span> <br />
              Grow Together.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="fm-hero-subtitle"
            >
              FutureMedia brings creators, passionate communities, and live conversations
              together in one unified home — built for expressing your visual world, discovering original craft,
              and belonging to something alive.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="fm-hero-actions"
            >
              <Link to="/signup" className="fm-btn-primary fm-btn-large">
                Start Your Journey <ArrowRight size={18} />
              </Link>
              <button
                className="fm-btn-secondary fm-btn-large"
                onClick={() => scrollToSection("features")}
              >
                <Compass size={18} /> Explore Platform
              </button>
            </motion.div>

            {/* 3 Core Trust Pillars */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="fm-hero-pillars"
            >
              <div className="fm-pillar-item">
                <div className="fm-pillar-dot" />
                <span>Real-Time Interaction</span>
              </div>
              <div className="fm-pillar-divider" />
              <div className="fm-pillar-item">
                <div className="fm-pillar-dot" />
                <span>Creator-First Identity</span>
              </div>
              <div className="fm-pillar-divider" />
              <div className="fm-pillar-item">
                <div className="fm-pillar-dot" />
                <span>Community-Driven</span>
              </div>
            </motion.div>

            {/* ─── 3. Hero Layered Social Ecosystem Visual ────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="fm-hero-composition"
            >
              {/* Floating Layer 1: Top-Left Story Ring */}
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
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
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
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

              {/* Central Living Post Card */}
              <div className="fm-center-post-card">
                <div className="fm-post-header">
                  <div className="fm-post-author-box">
                    <img src={ProfileImage} alt="Creator" className="fm-post-avatar" />
                    <div>
                      <div className="fm-author-name-row">
                        <span className="fm-author-name">Aria Sterling</span>
                        <span className="fm-verified-badge" title="Verified Creator">
                          ✓
                        </span>
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

                {/* Media Carousel Showcase */}
                <div className="fm-post-media-container">
                  <img
                    src={heroMediaSlides[activeMediaSlide]}
                    alt="Generative Art Showcase"
                    className="fm-post-image"
                  />
                  <div className="fm-media-badge">
                    <ImageIcon size={13} /> {activeMediaSlide + 1} / {heroMediaSlides.length}
                  </div>

                  {/* Carousel Dots Switcher */}
                  <div className="fm-carousel-dots">
                    {heroMediaSlides.map((_, idx) => (
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
                    >
                      <Heart
                        size={17}
                        fill={likedHeroPost ? "#EF4444" : "none"}
                        color={likedHeroPost ? "#EF4444" : "currentColor"}
                      />
                      <span>{likeCount.toLocaleString()}</span>
                    </button>
                    <button className="fm-eng-btn" onClick={() => scrollToSection("conversations")}>
                      <MessageCircleMore size={17} />
                      <span>84</span>
                    </button>
                    <button className="fm-eng-btn">
                      <Share2 size={17} />
                      <span>312</span>
                    </button>
                  </div>
                  <button
                    className={`fm-eng-btn fm-save-btn ${savedHeroPost ? "active-save" : ""}`}
                    onClick={() => setSavedHeroPost(!savedHeroPost)}
                  >
                    <Bookmark size={17} fill={savedHeroPost ? "var(--color-primary)" : "none"} />
                  </button>
                </div>

                {/* Inline Comment Preview */}
                <div className="fm-post-comment-preview">
                  <img src={PostPic2} alt="Commenter" className="fm-comment-avatar" />
                  <div className="fm-comment-content">
                    <span className="fm-commenter-name">Julian Ross:</span>
                    <span className="fm-comment-text">The motion curves on slide 2 are breathtaking. Absolutely inspiring! 🔥</span>
                  </div>
                </div>
              </div>

              {/* Floating Layer 3: Bottom-Left Direct Message */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
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
                animate={{ y: [0, 7, 0] }}
                transition={{ duration: 4.9, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                className="fm-float-card fm-float-trending"
              >
                <div className="fm-trend-float-icon">
                  <Flame size={17} />
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

        {/* ─── 4. Qualitative Architecture & Product Trust Bar ────────────── */}
        <section className="fm-trust-section">
          <div className="fm-trust-container">
            <p className="fm-trust-eyebrow">BUILT FOR CREATORS, COMMUNITIES & CURIOUS MINDS</p>
            <div className="fm-trust-grid">
              <div className="fm-trust-card">
                <div className="fm-trust-icon">
                  <Zap size={22} />
                </div>
                <div className="fm-trust-num">Instant</div>
                <div className="fm-trust-label">Real-Time Socket.IO Messaging & Live Presence</div>
              </div>

              <div className="fm-trust-card">
                <div className="fm-trust-icon">
                  <Clock size={22} />
                </div>
                <div className="fm-trust-num">24-Hour</div>
                <div className="fm-trust-label">Ephemeral Stories with Automatic TTL Expiration</div>
              </div>

              <div className="fm-trust-card">
                <div className="fm-trust-icon">
                  <TrendingUp size={22} />
                </div>
                <div className="fm-trust-num">Weighted</div>
                <div className="fm-trust-label">Dynamic Velocity & Creator Diversity Discovery</div>
              </div>

              <div className="fm-trust-card">
                <div className="fm-trust-icon">
                  <ShieldCheck size={22} />
                </div>
                <div className="fm-trust-num">8 Layers</div>
                <div className="fm-trust-label">Defense-in-Depth Privacy & Object-Level Access</div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 5. Editorial Bento Capabilities Grid ───────────────────────── */}
        <section className="fm-section" id="features">
          <div className="fm-container">
            <div className="fm-section-header">
              <div className="fm-section-tag">
                <Sparkles size={13} /> CAPABILITIES
              </div>
              <h2 className="fm-section-title">
                Everything creators need to <br />
                <span className="fm-gradient-text">share, connect & be discovered.</span>
              </h2>
              <p className="fm-section-description">
                A unified creative canvas designed for high-resolution visual storytelling,
                low-latency conversations, and authentic community belonging.
              </p>
            </div>

            {/* Asymmetrical Bento Grid */}
            <div className="fm-bento-grid">
              {/* Bento 1: Dominant Flagship Feature (2 Columns Wide) */}
              <div className="fm-bento-card bento-wide bento-highlight">
                <div className="fm-bento-glow" />
                <div className="fm-bento-content">
                  <div className="fm-bento-top">
                    <div className="fm-bento-badge">Flagship Feature</div>
                    <div className="fm-feature-num">01</div>
                  </div>
                  <h3 className="fm-bento-title">Multi-Media Expression & Visual Feeds</h3>
                  <p className="fm-bento-desc">
                    Publish multi-photo carousels, 4K video clips, location tags, and automated
                    Unicode hashtag parsing. Experience edge-to-edge media clarity engineered without heavy compression artifacts.
                  </p>

                  <div className="fm-bento-tags-row">
                    <span className="fm-bento-chip"><ImageIcon size={13} /> Multi-Slide Carousels</span>
                    <span className="fm-bento-chip"><Video size={13} /> 4K Video Support</span>
                    <span className="fm-bento-chip"><Hash size={13} /> Auto Hashtag Extraction</span>
                  </div>
                </div>

                <div className="fm-bento-visual-preview">
                  <div className="fm-bento-media-stack">
                    <img src={PostPic1} alt="Media 1" className="stack-img main" />
                    <img src={PostPic2} alt="Media 2" className="stack-img sub" />
                  </div>
                </div>
              </div>

              {/* Bento 2: Ephemeral 24h Stories */}
              <div className="fm-bento-card bento-tall">
                <div className="fm-bento-top">
                  <div className="fm-feature-icon-wrap">
                    <Clock size={20} />
                  </div>
                  <div className="fm-feature-num">02</div>
                </div>
                <h3 className="fm-bento-title">24-Hour Ephemeral Stories</h3>
                <p className="fm-bento-desc">
                  Share spontaneous reflections, typography thoughts, and behind-the-scenes snapshots with real-time viewer tracking that naturally disappear after 24 hours.
                </p>

                {/* Mini Interactive Story Simulation */}
                <div className="fm-bento-story-mini">
                  <div className="fm-mini-story-ring">
                    <img src={ProfileImage} alt="Story User" />
                  </div>
                  <div className="fm-mini-story-text">
                    "Creating without expectations..."
                  </div>
                  <div className="fm-mini-story-stat">
                    <Eye size={12} /> 482 live viewers
                  </div>
                </div>
              </div>

              {/* Bento 3: Real-Time Messaging */}
              <div className="fm-bento-card">
                <div className="fm-bento-top">
                  <div className="fm-feature-icon-wrap">
                    <MessageCircleMore size={20} />
                  </div>
                  <div className="fm-feature-num">03</div>
                </div>
                <h3 className="fm-bento-title">Real-Time Messaging</h3>
                <p className="fm-bento-desc">
                  Low-latency 1-on-1 and group direct chats with Socket.IO room isolation, media attachments, live typing indicators, and instant read receipts.
                </p>
                <div className="fm-bento-chat-indicator">
                  <div className="fm-chat-online-dot" />
                  <span>Room-Isolated WebSocket Pipeline</span>
                </div>
              </div>

              {/* Bento 4: Dynamic Discovery & Trending */}
              <div className="fm-bento-card">
                <div className="fm-bento-top">
                  <div className="fm-feature-icon-wrap">
                    <TrendingUp size={20} />
                  </div>
                  <div className="fm-feature-num">04</div>
                </div>
                <h3 className="fm-bento-title">Dynamic Discovery</h3>
                <p className="fm-bento-desc">
                  Personalized Explore feeds ranked by engagement velocity, recency decay, and creator diversity algorithms to prevent repetitive echo chambers.
                </p>
                <div className="fm-bento-tag-cloud">
                  <span>#generative</span>
                  <span>#35mm</span>
                  <span>#webgl</span>
                  <span>#creativecoding</span>
                </div>
              </div>

              {/* Bento 5: Creator Identity (2 Columns Wide) */}
              <div className="fm-bento-card bento-wide">
                <div className="fm-bento-content">
                  <div className="fm-bento-top">
                    <div className="fm-feature-icon-wrap">
                      <Users size={20} />
                    </div>
                    <div className="fm-feature-num">05</div>
                  </div>
                  <h3 className="fm-bento-title">Creator Identity & Portfolio Showcase</h3>
                  <p className="fm-bento-desc">
                    Establish your distinct presence with custom avatars, verified creator badges, curated portfolio grids, saved collections, and granular follower insights.
                  </p>
                  <div className="fm-bento-tags-row">
                    <span className="fm-bento-chip"><BadgeCheck size={13} /> Verified Creator Badge</span>
                    <span className="fm-bento-chip"><Grid size={13} /> Curated Grid Showcase</span>
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

              {/* Bento 6: Granular Privacy Controls */}
              <div className="fm-bento-card">
                <div className="fm-bento-top">
                  <div className="fm-feature-icon-wrap">
                    <Lock size={20} />
                  </div>
                  <div className="fm-feature-num">06</div>
                </div>
                <h3 className="fm-bento-title">Privacy & Audience Control</h3>
                <p className="fm-bento-desc">
                  Toggle seamlessly between public reach and followers-only privacy, review pending follow requests, and control who can view and interact with your media.
                </p>
                <div className="fm-bento-privacy-toggle">
                  <span className="active"><Globe size={12} /> Public</span>
                  <span><Lock size={12} /> Private</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 6. Alternating Deep-Dive Product Story Showcases ────────────── */}

        {/* Showcase A: Content Creation */}
        <section className="fm-showcase-section" id="showcase-create">
          <div className="fm-container">
            <div className="fm-showcase-grid">
              <div className="fm-showcase-content">
                <div className="fm-section-tag">
                  <Sparkles size={13} /> CONTENT STUDIO
                </div>
                <h2 className="fm-showcase-title">
                  Create without <br />
                  <span className="fm-gradient-text">shrinking the story.</span>
                </h2>
                <p className="fm-showcase-desc">
                  Whether dropping a 10-slide architectural photography carousel, sharing a high-frame-rate
                  video moment, or starting an in-depth creative thread, our intuitive composer gives you the creative freedom to express your story with full media fidelity.
                </p>

                <div className="fm-showcase-points">
                  <div className="fm-point-item">
                    <CheckCircle2 size={18} className="fm-point-icon" />
                    <div>
                      <strong>Drag-and-Drop Media Carousels</strong>
                      <p>Seamlessly upload and preview multi-asset collections with smart aspect ratios.</p>
                    </div>
                  </div>
                  <div className="fm-point-item">
                    <CheckCircle2 size={18} className="fm-point-icon" />
                    <div>
                      <strong>Audience & Privacy Switcher</strong>
                      <p>Toggle post visibility instantly between Public reach and Private follower access.</p>
                    </div>
                  </div>
                  <div className="fm-point-item">
                    <CheckCircle2 size={18} className="fm-point-icon" />
                    <div>
                      <strong>Automatic Hashtag Indexing</strong>
                      <p>Hashtags are auto-extracted from captions and aggregated into real-time discovery channels.</p>
                    </div>
                  </div>
                </div>

                <Link to="/signup" className="fm-btn-primary fm-btn-inline">
                  Start Creating on FM <ChevronRight size={16} />
                </Link>
              </div>

              {/* Interactive Mockup: Composer UI */}
              <div className="fm-showcase-visual">
                <div className="fm-composer-mockup glass-card">
                  <div className="fm-composer-header">
                    <img src={ProfileImage} alt="User avatar" className="fm-mock-avatar" />
                    <div className="fm-composer-input-sim">
                      <span className="fm-input-text">Capturing golden hour in the city with the new prime lens...</span>
                      <span className="fm-input-tags"> #streetphotography #35mm #goldenhour</span>
                    </div>
                  </div>

                  <div className="fm-composer-media-grid">
                    <div className="fm-media-slot main-slot">
                      <img src={PostPic2} alt="Uploaded preview" />
                      <div className="fm-slot-badge">Cover Image</div>
                    </div>
                    <div className="fm-media-slot sub-slot">
                      <img src={PostPic1} alt="Second preview" />
                    </div>
                  </div>

                  <div className="fm-composer-toolbar">
                    <div className="fm-tool-icons">
                      <button className="fm-tool-btn active"><ImageIcon size={17} /></button>
                      <button className="fm-tool-btn"><Video size={17} /></button>
                      <button className="fm-tool-btn"><Hash size={17} /></button>
                    </div>
                    <div className="fm-composer-actions">
                      <div className="fm-mock-pill"><Globe size={12} /> Public</div>
                      <button className="fm-mock-post-btn">Post</button>
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
                <div className="fm-story-showcase-card glass-card">
                  <div className="fm-story-tray-demo">
                    <div
                      className={`fm-story-pill ${activeStoryIdx === 0 ? "active" : ""}`}
                      onClick={() => setActiveStoryIdx(0)}
                    >
                      <div className={`fm-story-ring ${activeStoryIdx === 0 ? "active" : ""}`}>
                        <img src={ProfileImage} alt="Aria" />
                      </div>
                      <span>Your Story</span>
                    </div>
                    <div
                      className={`fm-story-pill ${activeStoryIdx === 1 ? "active" : ""}`}
                      onClick={() => setActiveStoryIdx(1)}
                    >
                      <div className={`fm-story-ring ${activeStoryIdx === 1 ? "active" : ""}`}>
                        <img src={PostPic1} alt="Julian" />
                      </div>
                      <span>Julian</span>
                    </div>
                    <div
                      className={`fm-story-pill ${activeStoryIdx === 2 ? "active" : ""}`}
                      onClick={() => setActiveStoryIdx(2)}
                    >
                      <div className={`fm-story-ring ${activeStoryIdx === 2 ? "active" : ""}`}>
                        <img src={PostPic2} alt="Maya" />
                      </div>
                      <span>Maya</span>
                    </div>
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
                        <Eye size={13} /> {storyDemos[activeStoryIdx].views}
                      </div>
                      <div className="fm-story-react-bubble">
                        {storyDemos[activeStoryIdx].reactions}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="fm-showcase-content">
                <div className="fm-section-tag">
                  <Clock size={13} /> 24-HOUR MOMENTS
                </div>
                <h2 className="fm-showcase-title">
                  Some moments are <br />
                  <span className="fm-gradient-text">meant to disappear.</span>
                </h2>
                <p className="fm-showcase-desc">
                  Not every creative thought needs to stay permanently on your grid. Stories give you the freedom
                  to share ephemeral thoughts, behind-the-scenes snapshots, and spontaneous reflections with your inner circle.
                </p>

                <div className="fm-showcase-points">
                  <div className="fm-point-item">
                    <CheckCircle2 size={18} className="fm-point-icon" />
                    <div>
                      <strong>Rich Typography & Gradients</strong>
                      <p>Create full-screen typographic text stories with customizable alignments and color themes.</p>
                    </div>
                  </div>
                  <div className="fm-point-item">
                    <CheckCircle2 size={18} className="fm-point-icon" />
                    <div>
                      <strong>Real-Time Viewer Analytics</strong>
                      <p>Inspect who has viewed your story with timestamped viewer logs and instant reactions.</p>
                    </div>
                  </div>
                  <div className="fm-point-item">
                    <CheckCircle2 size={18} className="fm-point-icon" />
                    <div>
                      <strong>Automatic Database TTL Cleanup</strong>
                      <p>Expired stories automatically disappear after 24 hours through high-efficiency database TTL indexing.</p>
                    </div>
                  </div>
                </div>

                <Link to="/signup" className="fm-btn-primary fm-btn-inline">
                  Try Stories on FM <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Showcase C: Real-Time Messaging */}
        <section className="fm-showcase-section" id="conversations">
          <div className="fm-container">
            <div className="fm-showcase-grid">
              <div className="fm-showcase-content">
                <div className="fm-section-tag">
                  <MessageCircleMore size={13} /> DIRECT & GROUP CHAT
                </div>
                <h2 className="fm-showcase-title">
                  Conversations move at the <br />
                  <span className="fm-gradient-text">speed of the moment.</span>
                </h2>
                <p className="fm-showcase-desc">
                  Deepen relationships through real-time direct messaging. Send high-res media,
                  collaborate on creative projects, and experience instantaneous communication powered by Socket.IO room isolation.
                </p>

                <div className="fm-showcase-points">
                  <div className="fm-point-item">
                    <CheckCircle2 size={18} className="fm-point-icon" />
                    <div>
                      <strong>Room-Isolated WebSocket Delivery</strong>
                      <p>Targeted user socket rooms ensure private, zero-leakage message distribution.</p>
                    </div>
                  </div>
                  <div className="fm-point-item">
                    <CheckCircle2 size={18} className="fm-point-icon" />
                    <div>
                      <strong>Live Typing & Delivery Status</strong>
                      <p>Natural conversation flow with animated typing bubbles and read receipts.</p>
                    </div>
                  </div>
                  <div className="fm-point-item">
                    <CheckCircle2 size={18} className="fm-point-icon" />
                    <div>
                      <strong>Media Attachments & Rich Previews</strong>
                      <p>Share photos, video clips, and creative links directly within your conversation stream.</p>
                    </div>
                  </div>
                </div>

                <Link to="/signup" className="fm-btn-primary fm-btn-inline">
                  Start Chatting <ChevronRight size={16} />
                </Link>
              </div>

              {/* Visual: Chat Interface Mockup */}
              <div className="fm-showcase-visual">
                <div className="fm-chat-mockup glass-card">
                  <div className="fm-chat-header">
                    <div className="fm-chat-user-status">
                      <div className="fm-chat-avatar-wrap">
                        <img src={PostPic1} alt="Marcus" />
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
                    <button className="fm-chat-send-btn"><Send size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 7. Creator Spotlight & Identity Showcase ────────────────────── */}
        <section className="fm-section fm-creators-spotlight-section" id="creators">
          <div className="fm-container">
            <div className="fm-section-header">
              <div className="fm-section-tag">
                <Users size={13} /> CREATOR IDENTITY
              </div>
              <h2 className="fm-section-title">
                Your identity is <br />
                <span className="fm-gradient-text">more than a profile.</span>
              </h2>
              <p className="fm-section-description">
                Showcase your creative body of work, share 24h moments, and build an authentic audience with verified creator status and curated media galleries.
              </p>
            </div>

            <div className="fm-creator-portfolio-card glass-card">
              <div className="fm-creator-banner">
                <div className="fm-banner-gradient" />
                <div className="fm-banner-badge">Featured Creator Spotlight</div>
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
                    Generative Visual Artist & Interactive Media Designer. Exploring shader curves, computational typography, and ambient sonic textures.
                  </p>

                  <div className="fm-c-metrics-row">
                    <div className="fm-c-metric">
                      <strong>14.8k</strong> <span>Followers</span>
                    </div>
                    <div className="fm-c-metric">
                      <strong>428</strong> <span>Following</span>
                    </div>
                    <div className="fm-c-metric">
                      <strong>92</strong> <span>Media Drops</span>
                    </div>
                  </div>
                </div>

                <div className="fm-creator-actions-box">
                  <button className="fm-btn-primary fm-btn-follow">Follow Creator</button>
                  <button className="fm-btn-secondary fm-btn-msg-icon"><MessageCircleMore size={18} /></button>
                </div>
              </div>

              {/* Creator Media Grid Showcase */}
              <div className="fm-creator-media-gallery">
                <div className="fm-gallery-item">
                  <img src={PostPic1} alt="Drop 1" />
                  <div className="fm-gallery-overlay">
                    <span>❤️ 1.4k</span>
                    <span>💬 84</span>
                  </div>
                </div>
                <div className="fm-gallery-item">
                  <img src={PostPic2} alt="Drop 2" />
                  <div className="fm-gallery-overlay">
                    <span>❤️ 980</span>
                    <span>💬 46</span>
                  </div>
                </div>
                <div className="fm-gallery-item">
                  <img src={PostPic3} alt="Drop 3" />
                  <div className="fm-gallery-overlay">
                    <span>❤️ 2.1k</span>
                    <span>💬 112</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 8. Communities Ecosystem ────────────────────────────────────── */}
        <section className="fm-section" id="communities">
          <div className="fm-container">
            <div className="fm-section-header">
              <div className="fm-section-tag">
                <Users size={13} /> COMMUNITY SPACES
              </div>
              <h2 className="fm-section-title">
                People aren't just posting here. <br />
                <span className="fm-gradient-text">They're finding their people.</span>
              </h2>
              <p className="fm-section-description">
                From niche visual arts to emerging tech, music production, and indie game dev —
                gather in communities where shared passion drives every interaction.
              </p>
            </div>

            <div className="fm-community-grid">
              <div className="fm-comm-card">
                <div className="fm-comm-card-top">
                  <div className="fm-comm-badge-cat">Visual Arts</div>
                  <div className="fm-comm-members-count">
                    <Users size={13} /> 28.6k members
                  </div>
                </div>
                <h3 className="fm-comm-name">Generative Art & Shaders</h3>
                <p className="fm-comm-desc">
                  A gathering space for digital artists, GLSL shader coders, and creative technologists sharing daily algorithms and renders.
                </p>
                <div className="fm-comm-avatars-row">
                  <div className="fm-avatar-stack">
                    <img src={ProfileImage} alt="User 1" />
                    <img src={PostPic1} alt="User 2" />
                    <img src={PostPic2} alt="User 3" />
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
                  <div className="fm-comm-badge-cat featured">Featured Community</div>
                  <div className="fm-comm-members-count">
                    <Users size={13} /> 41.2k members
                  </div>
                </div>
                <h3 className="fm-comm-name">Independent Photographers</h3>
                <p className="fm-comm-desc">
                  Curated street, documentary, and portrait photography. Weekly photo essays, critique sessions, and gear explorations.
                </p>
                <div className="fm-comm-avatars-row">
                  <div className="fm-avatar-stack">
                    <img src={PostPic2} alt="User 1" />
                    <img src={ProfileImage} alt="User 2" />
                    <img src={PostPic1} alt="User 3" />
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
                  <div className="fm-comm-badge-cat">Design & Tech</div>
                  <div className="fm-comm-members-count">
                    <Users size={13} /> 19.8k members
                  </div>
                </div>
                <h3 className="fm-comm-name">Design Systems & UI Engineering</h3>
                <p className="fm-comm-desc">
                  Exploring high-craft interfaces, interactive micro-interactions, responsive design systems, and frontend performance.
                </p>
                <div className="fm-comm-avatars-row">
                  <div className="fm-avatar-stack">
                    <img src={PostPic1} alt="User 1" />
                    <img src={PostPic2} alt="User 2" />
                    <img src={ProfileImage} alt="User 3" />
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

        {/* ─── 9. Editorial Creator Perspectives ──────────────────────────── */}
        <section className="fm-section fm-creators-section">
          <div className="fm-container">
            <div className="fm-section-header">
              <div className="fm-section-tag">
                <Sparkles size={13} /> CREATOR PERSPECTIVES
              </div>
              <h2 className="fm-section-title">
                Your audience. Your voice. <br />
                <span className="fm-gradient-text">Your authentic space.</span>
              </h2>
              <p className="fm-section-description">
                Designed to reward creative substance over empty metrics. Here's why leading creators call FutureMedia home.
              </p>
            </div>

            <div className="fm-quotes-grid">
              <div className="fm-quote-card">
                <div className="fm-quote-mark">“</div>
                <p className="fm-quote-text">
                  FutureMedia feels like the internet we fell in love with: rich visual quality,
                  real discussions in the comment threads, and zero algorithmic noise drowning out genuine craft.
                </p>
                <div className="fm-quote-author">
                  <img src={ProfileImage} alt="Aria Sterling" className="fm-quote-avatar" />
                  <div>
                    <div className="fm-quote-name">Aria Sterling</div>
                    <div className="fm-quote-role">Generative Visual Artist & Director</div>
                  </div>
                </div>
              </div>

              <div className="fm-quote-card">
                <div className="fm-quote-mark">“</div>
                <p className="fm-quote-text">
                  The combination of 24h temporary stories and rich photo carousels lets me share both
                  spontaneous daily thoughts and polished project milestones without cluttering my grid.
                </p>
                <div className="fm-quote-author">
                  <img src={PostPic1} alt="Marcus Vance" className="fm-quote-avatar" />
                  <div>
                    <div className="fm-quote-name">Marcus Vance</div>
                    <div className="fm-quote-role">Editorial Photographer & Writer</div>
                  </div>
                </div>
              </div>

              <div className="fm-quote-card">
                <div className="fm-quote-mark">“</div>
                <p className="fm-quote-text">
                  The community discovery actually works. Our design guild grew organically because
                  the explore engine values meaningful engagement over spam velocity.
                </p>
                <div className="fm-quote-author">
                  <img src={PostPic2} alt="Maya Lin" className="fm-quote-avatar" />
                  <div>
                    <div className="fm-quote-name">Maya Lin</div>
                    <div className="fm-quote-role">Lead Creative Technologist</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 10. Final Grand CTA Section ─────────────────────────────────── */}
        <section className="fm-cta-section">
          <div className="fm-container">
            <div className="fm-cta-panel">
              <div className="fm-cta-glow" />
              <div className="fm-cta-content">
                <div className="fm-section-tag center">
                  <Sparkles size={13} /> JOIN THE FUTURE
                </div>
                <h2 className="fm-cta-title">
                  Your media deserves <br />
                  <span className="fm-gradient-text">a place to live.</span>
                </h2>
                <p className="fm-cta-desc">
                  Create. Share. Connect. Discover what's next. Join thousands of creators and communities building the next generation of social media.
                </p>

                <div className="fm-cta-buttons">
                  <Link to="/signup" className="fm-btn-primary fm-btn-large">
                    Start Your Journey <ArrowRight size={18} />
                  </Link>
                  <button
                    className="fm-btn-secondary fm-btn-large"
                    onClick={() => scrollToSection("features")}
                  >
                    Explore FutureMedia
                  </button>
                </div>

                <div className="fm-cta-subtext">
                  <span>✦ Free forever for creators</span>
                  <span>•</span>
                  <span>✦ No credit card required</span>
                  <span>•</span>
                  <span>✦ Real-time community access</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── 11. Polished Multi-Column Footer ──────────────────────────────── */}
      <footer className="fm-footer">
        <div className="fm-footer-container">
          <div className="fm-footer-top">
            <div className="fm-footer-brand-col">
              <div className="fm-footer-logo-row">
                <Logo size="normal" />
                <span className="fm-brand-name">FutureMedia</span>
              </div>
              <p className="fm-footer-bio">
                The modern social media platform connecting creators, communities, and real-time conversations.
              </p>
              <div className="fm-footer-tagline">
                Connect. Share. Inspire.
              </div>
            </div>

            <div className="fm-footer-nav-grid">
              <div className="fm-footer-col">
                <h4 className="fm-footer-head">Platform</h4>
                <ul className="fm-footer-list">
                  <li><button onClick={() => scrollToSection("features")}>Features</button></li>
                  <li><button onClick={() => scrollToSection("stories")}>Stories & Moments</button></li>
                  <li><button onClick={() => scrollToSection("conversations")}>Real-Time Chat</button></li>
                  <li><button onClick={() => scrollToSection("communities")}>Communities</button></li>
                  <li><Link to="/explore">Explore Discovery</Link></li>
                </ul>
              </div>

              <div className="fm-footer-col">
                <h4 className="fm-footer-head">Ecosystem</h4>
                <ul className="fm-footer-list">
                  <li><button onClick={() => scrollToSection("creators")}>Creators Studio</button></li>
                  <li><Link to="/search">Hashtags & Trends</Link></li>
                  <li><Link to="/signup">Join Community</Link></li>
                  <li><Link to="/login">Sign In</Link></li>
                </ul>
              </div>

              <div className="fm-footer-col">
                <h4 className="fm-footer-head">Account</h4>
                <ul className="fm-footer-list">
                  <li><Link to="/signup">Create Account</Link></li>
                  <li><Link to="/login">Login</Link></li>
                  <li><Link to="/forgot-password">Password Reset</Link></li>
                  <li><Link to="/settings">User Settings</Link></li>
                </ul>
              </div>

              <div className="fm-footer-col">
                <h4 className="fm-footer-head">Company & Legal</h4>
                <ul className="fm-footer-list">
                  <li><span className="fm-footer-muted">Privacy Policy</span></li>
                  <li><span className="fm-footer-muted">Terms of Service</span></li>
                  <li><span className="fm-footer-muted">Community Guidelines</span></li>
                  <li><span className="fm-footer-muted">Security Center</span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="fm-footer-bottom">
            <p className="fm-copyright">
              © {new Date().getFullYear()} FutureMedia Inc. All rights reserved. Built with craft for the global creative web.
            </p>
            <div className="fm-social-links">
              <span className="fm-social-badge">v2.0 Production</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
