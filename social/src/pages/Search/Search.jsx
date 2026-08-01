import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Hash, UserPlus, TrendingUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Search.css';
import ProfileImage from '../../img/profileImg.jpg';
import { apiFetch } from '../../utils/api';

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);

  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [usersRes, postsRes] = await Promise.all([
          apiFetch("/api/v1/users/suggested"),
          apiFetch("/api/v1/posts/feed?limit=50")
        ]);

        if (usersRes.ok) {
          const payload = await usersRes.json();
          const users = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
          setSuggestedUsers(users.map(u => ({ id: u._id, name: u.displayName || u.username, handle: u.username, avatar: u.profilePicture || ProfileImage })));
        }

        if (postsRes.ok) {
          const payload = await postsRes.json();
          const posts = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
          const tagCount = {};
          posts.forEach(p => p.hashtags && p.hashtags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
          }));
          const sortedTags = Object.entries(tagCount).sort((a,b) => b[1] - a[1]).slice(0, 5).map(t => t[0]);
          setTrendingTags(sortedTags.map(t => t.startsWith('#') ? t : `#${t}`));
        }

        const savedSearches = JSON.parse(localStorage.getItem("recentSearches") || "[]");
        setRecentSearches(savedSearches);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInitialData();
  }, []);

  const saveRecentSearch = (queryStr) => {
    const saved = JSON.parse(localStorage.getItem("recentSearches") || "[]");
    const updated = [queryStr, ...saved.filter(s => s !== queryStr)].slice(0, 5);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
    setRecentSearches(updated);
  };

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Search effect
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    
    const fetchSearch = async () => {
      try {
        const [userRes, postRes] = await Promise.all([
          apiFetch(`/api/v1/users/search?query=${encodeURIComponent(debouncedQuery)}`),
          apiFetch(`/api/v1/posts/search?query=${encodeURIComponent(debouncedQuery)}`)
        ]);

        let combined = [];

        if (userRes.ok) {
          const payload = await userRes.json();
          const users = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
          combined = [...combined, ...users.map(u => ({
            type: 'user', id: u._id, name: u.displayName || u.username, handle: u.username, avatar: u.profilePicture || ProfileImage
          }))];
        }

        if (postRes.ok) {
          const payload = await postRes.json();
          const posts = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
          // just taking the first few hashtags or matching hashtags
          const tags = new Set();
          posts.forEach(p => {
            if (p.hashtags) {
              p.hashtags.forEach(tag => {
                if (tag.toLowerCase().includes(debouncedQuery.toLowerCase())) {
                  tags.add(tag);
                }
              });
            }
          });
          combined = [...combined, ...Array.from(tags).slice(0, 5).map(t => ({
            type: 'tag', name: t.startsWith('#') ? t : `#${t}`
          }))];
        }

        setResults(combined);
        saveRecentSearch(debouncedQuery);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    fetchSearch();
    
  }, [debouncedQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="search-page"
    >
      <div className="search-header">
        <div className="search-input-container">
          <SearchIcon size={20} color="var(--color-text-muted)" />
          <input 
            type="text" 
            placeholder="Search users, posts, or tags..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            autoFocus
          />
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
                  {results.length === 0 ? (
                    <p className="search-meta">No results found.</p>
                  ) : (
                    results.map((r, i) => (
                      <div 
                        key={i} 
                        className="search-result-item"
                        onClick={() => r.type === 'user' && navigate(`/profile/${r.handle || r.id}`)}
                        style={{ cursor: r.type === 'user' ? 'pointer' : 'default' }}
                      >
                        {r.type === 'user' ? (
                          <>
                            <img src={r.avatar} alt={r.name} className="result-avatar" />
                            <div className="result-info">
                              <strong>{r.name}</strong>
                              <span>@{r.handle}</span>
                            </div>
                            <button 
                              className="result-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${r.handle || r.id}`);
                              }}
                            >
                              View
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="result-icon-bg"><Hash size={20} color="var(--color-primary)" /></div>
                            <div className="result-info">
                              <strong>{r.name}</strong>
                              <span>Trending Tag</span>
                            </div>
                          </>
                        )}
                      </div>
                    ))
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
                    {trendingTags.map((tag, i) => (
                      <span key={i} className="tag-chip" onClick={() => setQuery(tag.replace('#', ''))}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="search-column">
                  <h3 className="section-title"><UserPlus size={18} /> Suggested for you</h3>
                  <div className="suggested-users">
                    {suggestedUsers.map(user => (
                      <div 
                        key={user.id} 
                        className="suggested-user-card"
                        onClick={() => navigate(`/profile/${user.handle || user.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <img src={user.avatar} alt={user.name} />
                        <div className="suggested-user-info">
                          <strong>{user.name}</strong>
                          <span>@{user.handle}</span>
                        </div>
                        <button 
                          className="follow-sm-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile/${user.handle || user.id}`);
                          }}
                        >
                          View Profile
                        </button>
                      </div>
                    ))}
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
