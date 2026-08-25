import React, { useState, useEffect } from "react";
import "./Explore.css";
import { motion } from "framer-motion";
import Masonry from "react-masonry-css";
import { Heart, MessageCircle, Compass, TrendingUp } from "lucide-react";
import { apiFetch } from "../../utils/api";
import ProfileImage from "../../img/profileImg.jpg";
import { useNavigate } from "react-router-dom";

const Explore = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendingTags, setTrendingTags] = useState([]);

  const categories = ["All", "Trending", "Photography", "Design", "Technology", "Art", "Architecture"];

  const breakpointColumnsObj = {
    default: 3,
    1400: 3,
    900: 2,
    600: 1
  };

  useEffect(() => {
    const fetchExplorePosts = async () => {
      setLoading(true);
      try {
        const res = await apiFetch("/api/v1/posts?limit=40");
        if (res.ok) {
          const payload = await res.json();
          const data = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : []);
          setPosts(data);
        } else {
          setPosts([]);
        }
      } catch (error) {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExplorePosts();
  }, []);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await apiFetch('/api/v1/feed/trending/hashtags?limit=10');
        if (res.ok) {
          const payload = await res.json();
          const tags = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : []);
          setTrendingTags(tags);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTrending();
  }, []);

  const filteredPosts = posts.filter((post) => {
    if (activeCategory === "All" || activeCategory === "Trending") return true;

    const cat = activeCategory.toLowerCase();
    const caption = (post.caption || "").toLowerCase();
    const hashtags = Array.isArray(post.hashtags) ? post.hashtags.map(h => h.toLowerCase()) : [];

    return caption.includes(cat) || caption.includes(`#${cat}`) || hashtags.includes(cat);
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
        <div className="exploreLoading" style={{ textAlign: "center", padding: "3rem", color: "var(--fm-text-muted)" }}>
          Discovering creators and photography...
        </div>
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
              const authorUsername = post.userId?.username || post.username || "user";
              const authorDisplayName = post.userId?.displayName || post.userId?.username || post.displayName || "Creator";
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
                        onError={(e) => { e.target.src = ProfileImage; }}
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
