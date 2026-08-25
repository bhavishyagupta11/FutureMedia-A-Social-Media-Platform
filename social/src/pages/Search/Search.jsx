import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search as SearchIcon, UserPlus, TrendingUp, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Search.css';
import ProfileImage from '../../img/profileImg.jpg';
import { apiFetch } from '../../utils/api';

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);

  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q') || '';
    if (q) {
      setQuery(q);
      setDebouncedQuery(q);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [usersRes, trendingRes] = await Promise.all([
          apiFetch("/api/v1/users/suggested"),
          apiFetch("/api/v1/feed/trending/hashtags?limit=6")
        ]);

        if (usersRes.ok) {
          const payload = await usersRes.json();
          const users = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
          setSuggestedUsers(users.map(u => ({
            id: u._id,
            name: u.displayName || u.username,
            handle: u.username,
            avatar: u.profilePicture || ProfileImage
          })));
        }

        if (trendingRes.ok) {
          const payload = await trendingRes.json();
          const tags = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
          setTrendingTags(tags.map(t => {
            const tagName = typeof t === 'string' ? t : (t.tag || '');
            return tagName.startsWith('#') ? tagName : `#${tagName}`;
          }).filter(Boolean));
        }

        const savedSearches = JSON.parse(localStorage.getItem("recentSearches") || '["photography", "design", "creativecoding"]');
        setRecentSearches(savedSearches);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInitialData();
  }, []);

  const saveRecentSearch = (queryStr) => {
    if (!queryStr || queryStr.trim().length < 2) return;
    const clean = queryStr.trim();
    const saved = JSON.parse(localStorage.getItem("recentSearches") || "[]");
    const updated = [clean, ...saved.filter(s => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
    setRecentSearches(updated);
  };

  // Debounce query (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Execute Search
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsSearching(true);

    const cleanTerm = debouncedQuery.replace(/^#|^@/, '').trim();

    const fetchSearch = async () => {
      try {
        const [userRes, postRes] = await Promise.all([
          apiFetch(`/api/v1/users/search?query=${encodeURIComponent(cleanTerm)}`),
          apiFetch(`/api/v1/posts/search?query=${encodeURIComponent(cleanTerm)}`)
        ]);

        let foundUsers = [];
        let foundPosts = [];
        let foundTags = [];

        if (userRes.ok) {
          const payload = await userRes.json();
          const users = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
          foundUsers = users.map(u => ({
            id: u._id,
            name: u.displayName || u.username,
            handle: u.username,
            avatar: u.profilePicture || ProfileImage,
            bio: u.bio || u.profession || ""
          }));
        }

        if (postRes.ok) {
          const payload = await postRes.json();
          const posts = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
          foundPosts = posts.map(p => ({
            id: p._id,
            desc: p.desc || p.caption || "",
            imageUrl: p.mediaArray?.[0] || p.imageUrl || p.image,
            mediaArray: p.mediaArray || [],
            author: p.userId || {},
            authorName: p.userId?.displayName || p.userId?.username || p.username || "Creator",
            authorHandle: p.userId?.username || p.username || "",
            authorAvatar: p.userId?.profilePicture || ProfileImage,
            likesCount: Array.isArray(p.likes) ? p.likes.length : 0,
            commentsCount: Array.isArray(p.comments) ? p.comments.length : 0,
            hashtags: p.hashtags || []
          }));

          const tagSet = new Set();
          posts.forEach(p => {
            if (Array.isArray(p.hashtags)) {
              p.hashtags.forEach(tag => {
                if (tag.toLowerCase().includes(cleanTerm.toLowerCase())) {
                  tagSet.add(tag.toLowerCase());
                }
              });
            }
          });
          if (cleanTerm.length >= 2) {
            tagSet.add(cleanTerm.toLowerCase());
          }
          foundTags = Array.from(tagSet).slice(0, 6);
        }

        setResults({ users: foundUsers, posts: foundPosts, tags: foundTags });
        saveRecentSearch(debouncedQuery);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    fetchSearch();
  }, [debouncedQuery]);

  const hasAnyResults = results.users?.length > 0 || results.posts?.length > 0 || results.tags?.length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="search-page"
    >
      <div className="search-header">
        <div className="search-input-container">
          <SearchIcon size={20} color="var(--fm-text-muted)" />
          <input
            type="text"
            placeholder="Search people, posts, or hashtags"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setDebouncedQuery(''); setResults({ users: [], posts: [], tags: [] }); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fm-text-muted)', display: 'flex', alignItems: 'center' }}
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="search-content">
        <AnimatePresence mode="wait">
          {query ? (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="search-results-section"
            >
              {isSearching ? (
                <div className="search-skeletons">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="search-skeleton-item">
                      <div className="skeleton-avatar" />
                      <div className="skeleton-text" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="search-results-list">
                  <h3 className="section-title">Results for "{debouncedQuery}"</h3>

                  {!hasAnyResults ? (
                    <p className="search-meta" style={{ color: "var(--fm-text-muted)", padding: "1.5rem 0" }}>
                      No people, posts, or hashtags found matching "{debouncedQuery}".
                    </p>
                  ) : (
                    <>
                      {/* Tags Bar */}
                      {results.tags?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          {results.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="tag-chip"
                              onClick={() => setQuery(`#${tag}`)}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Matching Users */}
                      {results.users?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div className="search-section-header">
                            <h4>People</h4>
                          </div>
                          {results.users.map((u) => (
                            <div
                              key={u.id}
                              className="search-result-item"
                              onClick={() => navigate(`/profile/${u.handle || u.id}`)}
                              style={{ cursor: 'pointer' }}
                            >
                              <img src={u.avatar} alt={u.name} className="result-avatar" onError={(e) => { e.target.src = ProfileImage; }} />
                              <div className="result-info">
                                <strong>{u.name}</strong>
                                <span>@{u.handle}</span>
                              </div>
                              <button
                                type="button"
                                className="result-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/profile/${u.handle || u.id}`);
                                }}
                              >
                                View Profile
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Matching Posts */}
                      {results.posts?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                          <div className="search-section-header">
                            <h4>Posts</h4>
                          </div>
                          <div className="search-posts-grid">
                            {results.posts.map((post) => (
                              <div
                                key={post.id}
                                className="search-post-card"
                                onClick={() => post.authorHandle && navigate(`/profile/${post.authorHandle}`)}
                              >
                                <div className="search-post-header">
                                  <img
                                    src={post.authorAvatar}
                                    alt={post.authorName}
                                    className="search-post-avatar"
                                    onError={(e) => { e.target.src = ProfileImage; }}
                                  />
                                  <div className="search-post-author-info">
                                    <strong>{post.authorName}</strong>
                                    <span>@{post.authorHandle}</span>
                                  </div>
                                </div>

                                {post.imageUrl && (
                                  <img
                                    src={post.imageUrl}
                                    alt="post media"
                                    className="search-post-image"
                                    loading="lazy"
                                  />
                                )}

                                {post.desc && (
                                  <p className="search-post-caption">
                                    {post.desc}
                                  </p>
                                )}

                                <div className="search-post-stats">
                                  <span className="search-post-stat-item">
                                    ❤️ {post.likesCount}
                                  </span>
                                  <span className="search-post-stat-item">
                                    💬 {post.commentsCount}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="explore"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="search-explore-section"
            >
              <div className="search-grid">
                <div className="search-column">
                  <h3 className="section-title"><Clock size={18} /> Recent</h3>
                  <div className="recent-searches">
                    {recentSearches.map((s, i) => (
                      <div key={i} className="recent-item" onClick={() => setQuery(s)}>
                        <SearchIcon size={16} /> {s}
                      </div>
                    ))}
                  </div>

                  <h3 className="section-title" style={{ marginTop: '24px' }}><TrendingUp size={18} /> Trending Tags</h3>
                  <div className="trending-tags">
                    {trendingTags.length === 0 ? (
                      <span style={{ color: "var(--fm-text-muted)", fontSize: "0.85rem" }}>Loading trending tags...</span>
                    ) : (
                      trendingTags.map((tag, i) => (
                        <span key={i} className="tag-chip" onClick={() => setQuery(tag.replace('#', ''))}>
                          {tag}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="search-column">
                  <h3 className="section-title"><UserPlus size={18} /> Suggested Creators</h3>
                  <div className="suggested-users">
                    {suggestedUsers.length === 0 ? (
                      <span style={{ color: "var(--fm-text-muted)", fontSize: "0.85rem" }}>No suggestions right now.</span>
                    ) : (
                      suggestedUsers.map(user => (
                        <div
                          key={user.id}
                          className="suggested-user-card"
                          onClick={() => navigate(`/profile/${user.handle || user.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <img src={user.avatar} alt={user.name} onError={(e) => { e.target.src = ProfileImage; }} />
                          <div className="suggested-user-info">
                            <strong>{user.name}</strong>
                            <span>@{user.handle}</span>
                          </div>
                          <button
                            type="button"
                            className="follow-sm-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/profile/${user.handle || user.id}`);
                            }}
                          >
                            View
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Search;
