import React, { useState, useEffect } from "react";
import "./Explore.css";
import { motion } from "framer-motion";
import Masonry from "react-masonry-css";
import { Heart, MessageCircle, Compass, TrendingUp } from "lucide-react";
import { apiFetch } from "../../utils/api";
import ProfileImage from "../../img/profileImg.jpg";
import { CREATORS, POST_MEDIA } from "../../constants/mediaAssets";
import { useNavigate } from "react-router-dom";

const DEFAULT_EXPLORE_POSTS = [
  {
    _id: "exp-1",
    imageUrl: POST_MEDIA.creativeCoding,
    caption: "Generative particle shaders running at 60fps in WebGL 2.0. #generative #creativecoding #webgl",
    category: "Technology",
    userId: { username: CREATORS.ananya.username, displayName: CREATORS.ananya.name, profilePicture: CREATORS.ananya.avatar },
    likes: ["1", "2", "3", "4", "5"],
    comments: ["c1", "c2"],
  },
  {
    _id: "exp-2",
    imageUrl: POST_MEDIA.streetPhoto,
    caption: "Atmospheric street photography along the central avenue at dusk. #photography #35mm #streetphoto",
    category: "Photography",
    userId: { username: CREATORS.snehil.username, displayName: CREATORS.snehil.name, profilePicture: CREATORS.snehil.avatar },
    likes: ["1", "2", "3", "4"],
    comments: ["c1"],
  },
  {
    _id: "exp-3",
    imageUrl: POST_MEDIA.designWorkspace,
    caption: "Spatial UI architecture and physical workspace design tokens. #art #technology #design",
    category: "Technology",
    userId: { username: CREATORS.sahil.username, displayName: CREATORS.sahil.name, profilePicture: CREATORS.sahil.avatar },
    likes: ["1", "2", "3", "4", "5", "6"],
    comments: ["c1", "c2", "c3"],
  },
  {
    _id: "exp-4",
    imageUrl: POST_MEDIA.architecture,
    caption: "Clean concrete geometry and minimal shadows. #architecture #art #design",
    category: "Art",
    userId: { username: CREATORS.priya.username, displayName: CREATORS.priya.name, profilePicture: CREATORS.priya.avatar },
    likes: ["1", "2", "3"],
    comments: [],
  },
  {
    _id: "exp-5",
    imageUrl: POST_MEDIA.urbanSunset,
    caption: "Dusk skyline and sunset gradient over the city. #travel #photography #goldenhour",
    category: "Travel",
    userId: { username: CREATORS.bhavishya.username, displayName: CREATORS.bhavishya.name, profilePicture: CREATORS.bhavishya.avatar },
    likes: ["1", "2", "3", "4", "5", "6", "7"],
    comments: ["c1", "c2"],
  },
  {
    _id: "exp-6",
    imageUrl: POST_MEDIA.abstractShapes,
    caption: "Exploring color harmony, kinetic typography, and editorial layout. #fashion #art #branding",
    category: "Fashion",
    userId: { username: CREATORS.garvit.username, displayName: CREATORS.garvit.name, profilePicture: CREATORS.garvit.avatar },
    likes: ["1", "2", "3", "4"],
    comments: ["c1"],
  }
];

const Explore = () => {
  const navigate = useNavigate();
  const [searchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendingTags, setTrendingTags] = useState([]);

  const categories = ["All", "Trending", "Photography", "Art", "Technology", "Fashion", "Travel"];

  // Responsive Masonry breakpoints for Desktop, Tablet, and Mobile
  const breakpointColumnsObj = {
    default: 3,
    1400: 3,
    900: 2,
    600: 1
  };

  useEffect(() => {
    fetchExplorePosts();
  }, [activeCategory]);

  const fetchExplorePosts = async (skipVal = 0) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/v1/feed/explore?limit=30&skip=${skipVal}`);
      if (res.ok) {
        const payload = await res.json();
        const data = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
        if (data.length > 0) {
          setPosts(prev => skipVal === 0 ? data : [...prev, ...data]);
        } else {
          setPosts(DEFAULT_EXPLORE_POSTS);
        }
      } else {
        setPosts(DEFAULT_EXPLORE_POSTS);
      }
    } catch (error) {
      setPosts(DEFAULT_EXPLORE_POSTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await apiFetch('/api/v1/feed/trending/hashtags?limit=10');
        if (res.ok) {
          const payload = await res.json();
          const tags = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
          if (tags.length > 0) {
            setTrendingTags(tags);
          } else {
            setTrendingTags([
              { tag: "creativecoding", postCount: 2840 },
              { tag: "35mm", postCount: 1950 },
              { tag: "streetphotography", postCount: 1420 },
              { tag: "designsystems", postCount: 1100 },
              { tag: "futuremedia", postCount: 890 }
            ]);
          }
        } else {
          setTrendingTags([
            { tag: "creativecoding", postCount: 2840 },
            { tag: "35mm", postCount: 1950 },
            { tag: "streetphotography", postCount: 1420 },
            { tag: "designsystems", postCount: 1100 },
            { tag: "futuremedia", postCount: 890 }
          ]);
        }
      } catch (err) {
        setTrendingTags([
          { tag: "creativecoding", postCount: 2840 },
          { tag: "35mm", postCount: 1950 },
          { tag: "streetphotography", postCount: 1420 },
          { tag: "designsystems", postCount: 1100 },
          { tag: "futuremedia", postCount: 890 }
        ]);
      }
    };
    fetchTrending();
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.userId?.username?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeCategory === "All") return true;
    if (activeCategory === "Trending") return true;

    const cat = activeCategory.toLowerCase();
    const caption = (post.caption || "").toLowerCase();
    const postCat = (post.category || "").toLowerCase();
    return postCat === cat || caption.includes(cat) || caption.includes(`#${cat}`);
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="ExplorePage"
    >
      <div className="exploreHeader">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Discover
        </motion.h1>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="exploreCategories"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              className={`exploreCategoryBtn ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </motion.div>
      </div>

      {trendingTags.length > 0 && (
        <div className="exploreTrendingBar">
          <div className="exploreTrendingTitle">
            <TrendingUp size={18} color="var(--fm-primary)" />
            <span>Trending:</span>
          </div>
          <div className="exploreTrendingTags">
            {trendingTags.map(t => (
              <span
                key={t.tag}
                className="exploreTagChip"
                onClick={() => navigate(`/search?q=${encodeURIComponent(t.tag)}`)}
              >
                #{t.tag} ({t.postCount >= 1000 ? `${(t.postCount / 1000).toFixed(1)}k` : t.postCount})
              </span>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="exploreLoading" style={{ textAlign: "center", padding: "3rem", color: "var(--fm-text-muted)" }}>Discovering amazing content...</div>
      ) : (
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {filteredPosts.length === 0 ? (
            <div className="explorePremiumEmptyState" style={{ textAlign: "center", padding: "4rem 1rem", background: "var(--fm-surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--fm-border)", gridColumn: "1 / -1" }}>
              <Compass size={56} color="var(--fm-primary)" style={{ margin: "0 auto 1rem" }} />
              <h2>No posts found for "{activeCategory}"</h2>
              <p style={{ color: "var(--fm-text-secondary)", marginBottom: "1.5rem" }}>Try exploring another category or discover trending hashtags.</p>
              <button className="primaryCTA" onClick={() => setActiveCategory("All")}>View All Posts</button>
            </div>
          ) : (
            filteredPosts.map((post, index) => {
              const media = post.media && post.media.length > 0 ? post.media[0] : null;
              const image = media ? media.url : post.imageUrl;
              
              const isVideo = media ? media.type === "video" : (image && image.match(/\.(mp4|webm|ogg)$/i));
              const url = image ? (image.startsWith("http") ? image : `${process.env.REACT_APP_API_BASE_URL || "http://localhost:8080"}${image}`) : null;
              const authorUsername = post.userId?.username || post.user?.username || "user";
              const authorDisplayName = post.userId?.displayName || post.userId?.username || post.user?.displayName || post.user?.username || "Creator";
              const authorAvatar = post.userId?.profilePicture || ProfileImage;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.4) }}
                  key={post._id}
                  className="masonryItem"
                  onClick={() => navigate(`/profile/${authorUsername}`)}
                >
                  {url ? (
                    isVideo ? (
                      <video src={url} className="masonryImage" style={{ objectFit: "cover" }} />
                    ) : (
                      <img src={url} alt="Post" className="masonryImage" loading="lazy" />
                    )
                  ) : (
                    <div style={{ padding: '2rem 1.2rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--fm-text)', fontSize: '1.05rem', fontWeight: 600, minHeight: '140px' }}>
                      {post.caption || "Text Post"}
                    </div>
                  )}
                  <div className="masonryOverlay">
                    <div className="masonryUserInfo">
                      <img
                        src={authorAvatar}
                        alt={authorDisplayName}
                        className="masonryAvatar"
                      />
                      <span className="masonryUsername">
                        {authorDisplayName}
                      </span>
                    </div>
                    <div className="masonryStats">
                      <span className="masonryStatItem">
                        <Heart size={15} fill={post.likes?.length > 0 ? "white" : "none"} /> {post.likes?.length || 0}
                      </span>
                      <span className="masonryStatItem">
                        <MessageCircle size={15} /> {post.comments?.length || 0}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </Masonry>
      )}
    </motion.div>
  );
};

export default Explore;
