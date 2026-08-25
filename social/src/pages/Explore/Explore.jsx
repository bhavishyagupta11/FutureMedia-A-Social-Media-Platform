import React, { useState, useEffect } from "react";
import "./Explore.css";
import { motion } from "framer-motion";
import Masonry from "react-masonry-css";
import { Heart, MessageCircle, Compass, Hash, Users, TrendingUp } from "lucide-react";
import { apiFetch } from "../../utils/api";
import ProfileImage from "../../img/profileImg.jpg";
import { useNavigate } from "react-router-dom";

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
    default: 4,
    1400: 3,
    900: 2,
    768: 1
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
        setPosts(prev => skipVal === 0 ? data : [...prev, ...data]);
      }
    } catch (error) {
      console.error("Failed to load explore posts", error);
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
          setTrendingTags(tags);
        }
      } catch (err) {
        console.error('Failed to load trending tags', err);
      }
    };
    fetchTrending();
  }, []);

  const filteredPosts = posts.filter((post) => 
    post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.userId?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="exploreTrending"
        >
          <h3 className="trendingTitle"><TrendingUp size={18} /> Trending</h3>
          <div className="trendingChips">
            {trendingTags.map(t => (
              <button
                key={t.tag}
                className="trendingChip"
                onClick={() => navigate(`/search?q=${encodeURIComponent(t.tag)}`)}
              >
                <Hash size={14} />
                <span className="chipTag">#{t.tag}</span>
                <span className="chipCount">{t.postCount >= 1000 ? `${(t.postCount / 1000).toFixed(1)}K` : t.postCount} posts</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="exploreLoading">Discovering amazing content...</div>
      ) : (
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {filteredPosts.length === 0 ? (
            <div className="explorePremiumEmptyState">
              <Compass size={64} className="emptyStateIcon" />
              <h2>No posts yet</h2>
              <p>Discover creators, trending hashtags, and recommended users to fill your feed.</p>
              
              <div className="emptyStateSuggestions">
                <div className="suggestionBox" onClick={() => navigate('/explore')}>
                  <Hash size={24} />
                  <span>Trending</span>
                </div>
                <div className="suggestionBox" onClick={() => navigate('/search')}>
                  <Users size={24} />
                  <span>Creators</span>
                </div>
              </div>

              <button className="primaryCTA" onClick={() => navigate('/search')}>Start Discovering</button>
            </div>
          ) : (
            filteredPosts.map((post, index) => {
              const media = post.media && post.media.length > 0 ? post.media[0] : null;
              const image = media ? media.url : post.imageUrl;
              
              const isVideo = media ? media.type === "video" : (image && image.match(/\.(mp4|webm|ogg)$/i));
              const url = image ? (image.startsWith("http") ? image : `${process.env.REACT_APP_API_BASE_URL || "http://localhost:8080"}${image}`) : null;
              const authorUsername = post.userId?.username || post.user?.username || "user";

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5) }}
                  key={post._id}
                  className="masonryItem"
                  style={{ background: 'var(--color-card)', cursor: 'pointer' }}
                  onClick={() => navigate(`/profile/${authorUsername}`)}
                >
                  {url ? (
                    isVideo ? (
                      <video src={url} className="masonryImage" style={{ objectFit: "cover" }} />
                    ) : (
                      <img src={url} alt="Post" className="masonryImage" />
                    )
                  ) : (
                    <div style={{ padding: '2rem 1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--color-text)', fontSize: '1.2rem', fontWeight: 600, wordBreak: 'break-word', minHeight: '150px' }}>
                      {post.caption || "Text Post"}
                    </div>
                  )}
                  <div className="masonryOverlay">
                    <div className="masonryAuthor">
                      <img 
                        src={post.userId?.profilePicture || ProfileImage} 
                        alt="Author" 
                        className="masonryAvatar" 
                      />
                      <span className="masonryAuthorName">
                        {post.userId?.displayName || post.userId?.username || post.user?.displayName || post.user?.username || "Unknown"}
                      </span>
                    </div>
                    <div className="masonryStats">
                      <span className="masonryStat">
                        <Heart size={16} fill={post.likes?.length > 0 ? "white" : "none"} /> {post.likes?.length || 0}
                      </span>
                      <span className="masonryStat">
                        <MessageCircle size={16} /> {post.comments?.length || 0}
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
