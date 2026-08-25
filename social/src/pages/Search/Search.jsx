import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search as SearchIcon, Hash, UserPlus, TrendingUp, Clock, X } from 'lucide-react';
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

        let combined = [];

        if (userRes.ok) {
          const payload = await userRes.json();
          const users = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
          combined = [...combined, ...users.map(u => ({
            type: 'user',
            id: u._id,
            name: u.displayName || u.username,
            handle: u.username,
            avatar: u.profilePicture || ProfileImage
          }))];
        }

        if (postRes.ok) {
          const payload = await postRes.json();
          const posts = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
          const tags = new Set();
          posts.forEach(p => {
            if (Array.isArray(p.hashtags)) {
              p.hashtags.forEach(tag => {
                if (tag.toLowerCase().includes(cleanTerm.toLowerCase())) {
                  tags.add(tag.toLowerCase());
                }
              });
            }
          });

          // Also include the search term itself as a tag if valid
          if (cleanTerm.length >= 2) {
            tags.add(cleanTerm.toLowerCase());
          }

          combined = [
            ...Array.from(tags).slice(0, 5).map(t => ({
              type: 'tag',
              name: `#${t}`
            })),
            ...combined
          ];
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
          <SearchIcon size={20} color="var(--fm-text-muted)" />
          <input
            type="text"
            placeholder="Search users, posts, or tags (e.g. Snehil, #photography)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setDebouncedQuery(''); setResults([]); }}
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
                  {results.length === 0 ? (
                    <p className="search-meta" style={{ color: "var(--fm-text-muted)", padding: "1.5rem 0" }}>
                      No users or tags found matching "{debouncedQuery}".
                    </p>
                  ) : (
                    results.map((r, i) => (
                      <div 
                        key={i} 
                        className="search-result-item"
                        onClick={() => {
                          if (r.type === 'user') {
                            navigate(`/profile/${r.handle || r.id}`);
                          } else if (r.type === 'tag') {
                            setQuery(r.name.replace('#', ''));
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {r.type === 'user' ? (
                          <>
                            <img src={r.avatar} alt={r.name} className="result-avatar" onError={(e) => { e.target.src = ProfileImage; }} />
                            <div className="result-info">
                              <strong>{r.name}</strong>
                              <span>@{r.handle}</span>
                            </div>
                            <button 
                              type="button"
                              className="result-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${r.handle || r.id}`);
                              }}
                            >
                              View Profile
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="result-icon-bg"><Hash size={20} color="var(--fm-primary)" /></div>
                            <div className="result-info">
                              <strong>{r.name}</strong>
                              <span>Hashtag</span>
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
