import React, { useEffect, useMemo, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import ProfileImage from "../../img/profileImg.jpg";
import "./LogoSearch.css";
import { apiFetch } from "../../utils/api";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

const normalizeMediaUrl = (imageUrl) => {
  if (!imageUrl) {
    return "";
  }

  return imageUrl.startsWith("/") ? `${API_BASE_URL}${imageUrl}` : imageUrl;
};

const LogoSearch = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ users: [], posts: [] });
  const [message, setMessage] = useState("Search people or posts");
  const navigate = useNavigate();

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setResults({ users: [], posts: [] });
      setLoading(false);
      setMessage(trimmedQuery.length === 1 ? "Keep typing to search" : "Search people or posts");
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await apiFetch(`/api/users/search?q=${encodeURIComponent(trimmedQuery)}`);
        
        if (!response.ok) {
          throw new Error("Failed to search");
        }
        // The original setMessage and return were inside the if block.
        // The instruction's snippet seems to imply they should be outside or removed.
        // To maintain syntactic correctness and the spirit of the original error handling,
        // I'll assume the throw replaces the previous actions within the if block,
        // and the catch block will now handle the "Unable to search right now" message.

        const payload = await response.json();
        setResults({
          users: Array.isArray(payload.users) ? payload.users : [],
          posts: Array.isArray(payload.posts) ? payload.posts : [],
        });

        const totalResults =
          (Array.isArray(payload.users) ? payload.users.length : 0) +
          (Array.isArray(payload.posts) ? payload.posts.length : 0);

        setMessage(totalResults === 0 ? "No matches found" : `Found ${totalResults} result${totalResults === 1 ? "" : "s"}`);
      } catch (error) {
        setResults({ users: [], posts: [] });
        setMessage("Unable to search right now");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const postResults = useMemo(
    () =>
      results.posts.map((post) => ({
        ...post,
        imageUrl: normalizeMediaUrl(post.imageUrl),
      })),
    [results.posts]
  );

  return (
    <div className="LogoSearch">
      <div className="SearchBarCard">
        <div className="searchHeader">
          <div className="searchHeading">
            <div className="searchBadge" aria-hidden="true">
              <SearchIcon fontSize="small" />
            </div>
            <div>
              <strong>Search</strong>
              <span>Find people and posts fast</span>
            </div>
          </div>
          <div className="Search">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people and posts"
              aria-label="Search people and posts"
            />
            <div className="s-icon" aria-hidden="true">
              <SearchIcon fontSize="small" />
            </div>
          </div>
        </div>

        <div className="SearchResultsCard">
          <div className="searchStatusRow">
            <span className="searchTitle">Discover</span>
            <span className="searchMeta">{loading ? "Searching..." : message}</span>
          </div>

          <div className="searchSection">
            <span className="searchSectionTitle">People</span>
            <div className="searchList">
              {results.users.length > 0 ? (
                results.users.map((user) => (
                  <div className="searchResultItem" key={user._id} style={{ cursor: "pointer" }} onClick={() => navigate(`/profile/${user._id}`)}>
                    <img
                      src={user.img || ProfileImage}
                      alt={user.displayName || user.username}
                      className="searchAvatar"
                    />
                    <div className="searchText">
                      <strong>{user.displayName || `${user.firstName} ${user.lastName}`.trim() || "FSM User"}</strong>
                      <span>@{user.username}</span>
                      {user.bio ? <small>{user.bio}</small> : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="searchEmpty">No people to show yet.</div>
              )}
            </div>
          </div>

          <div className="searchSection">
            <span className="searchSectionTitle">Posts</span>
            <div className="searchList">
              {postResults.length > 0 ? (
                postResults.map((post) => (
                  <div className="searchResultItem searchPostItem" key={post._id}>
                    {post.imageUrl ? (
                      post.format === "video" ? (
                        <video className="searchPostThumb" src={post.imageUrl} muted />
                      ) : (
                        <img className="searchPostThumb" src={post.imageUrl} alt={post.name || "Post"} />
                      )
                    ) : (
                      <div className="searchPostThumb searchPostFallback">{post.format === "video" ? "VID" : "POST"}</div>
                    )}

                    <div className="searchText">
                      <strong>{post.user?.displayName || post.name || "FSM Post"}</strong>
                      <span>{post.desc || "Shared a new post"}</span>
                      <small>@{post.user?.username || "fsm"}</small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="searchEmpty">No posts to show yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoSearch;
