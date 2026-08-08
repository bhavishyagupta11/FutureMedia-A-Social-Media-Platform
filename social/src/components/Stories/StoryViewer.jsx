import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Trash2 } from 'lucide-react';
import './StoryViewer.css';
import { apiFetch } from '../../utils/api';
import { getStoredUserProfile, resolveAvatar } from '../../utils/session';
import toast from 'react-hot-toast';
import ProfileImage from '../../img/profileImg.jpg';

const FONT_SIZE_MAP = {
  small: '1.25rem',
  normal: '1.75rem',
  large: '2.5rem',
  '1.2rem': '1.25rem',
  '1.5rem': '1.75rem',
  '2rem': '2.5rem'
};

const StoryViewer = ({ storyGroups, initialGroupIndex, onClose, onStoryDeleted }) => {
  const currentProfile = getStoredUserProfile() || {};
  const currentUserId = currentProfile.userId;

  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [videoDuration, setVideoDuration] = useState(5000); // default 5s
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

  const videoRef = useRef(null);
  const group = storyGroups[currentGroupIndex];
  const story = group?.stories?.[currentStoryIndex];

  // Escape key listener to close viewer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!story || !group) {
      onClose();
      return;
    }

    // Mark as viewed in backend if not self
    if (currentUserId && String(group.user?._id) !== String(currentUserId)) {
      apiFetch(`/api/v1/stories/${story._id}/view`, { method: 'PUT' }).catch(console.error);
    }

    setProgress(0);
    const durationMs = story.mediaType === 'video' ? Math.max(3000, videoDuration) : 5000;
    const intervalTime = 50;
    const stepIncrement = (intervalTime / durationMs) * 100;

    let interval;
    if (!isPaused && !showViewersModal) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + stepIncrement;
        });
      }, intervalTime);
    }

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupIndex, currentStoryIndex, isPaused, showViewersModal, videoDuration, story]);

  const handleNext = () => {
    if (currentStoryIndex < group.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
      const prevGroupStories = storyGroups[currentGroupIndex - 1].stories;
      setCurrentStoryIndex(prevGroupStories.length - 1);
      setProgress(0);
    }
  };

  const handleDeleteCurrentStory = async () => {
    if (!story) return;
    if (!window.confirm("Are you sure you want to delete this story?")) return;

    try {
      const res = await apiFetch(`/api/v1/stories/${story._id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Story deleted");
        if (onStoryDeleted) onStoryDeleted();
        
        if (group.stories.length <= 1) {
          onClose();
        } else {
          group.stories.splice(currentStoryIndex, 1);
          if (currentStoryIndex >= group.stories.length) {
            setCurrentStoryIndex(group.stories.length - 1);
          }
          setProgress(0);
        }
      } else {
        toast.error("Failed to delete story");
      }
    } catch (e) {
      toast.error("Failed to delete story");
    }
  };

  const fetchViewers = async () => {
    if (!story) return;
    setIsPaused(true);
    setLoadingViewers(true);
    setShowViewersModal(true);
    try {
      const res = await apiFetch(`/api/v1/stories/${story._id}/viewers`);
      if (res.ok) {
        const payload = await res.json();
        setViewersList(payload.data || payload || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingViewers(false);
    }
  };

  if (!story || !group) return null;

  const isOwner = currentUserId && String(group.user?._id) === String(currentUserId);
  const mediaUrl = story.mediaUrl 
    ? (story.mediaUrl.startsWith("http") ? story.mediaUrl : `${process.env.REACT_APP_API_BASE_URL || "http://localhost:8080"}${story.mediaUrl}`) 
    : "";

  const userAvatarUrl = resolveAvatar(group.user);

  return (
    <AnimatePresence>
      <motion.div 
        className="story-viewer-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div 
          className="story-viewer-content"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          onTouchCancel={() => setIsPaused(false)}
        >
          {/* Top Progress Segmented Bar */}
          <div className="story-progress-container">
            {group.stories.map((s, idx) => (
              <div key={s._id || idx} className="story-progress-bg">
                <div 
                  className="story-progress-fill"
                  style={{
                    width: idx < currentStoryIndex ? '100%' : idx === currentStoryIndex ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* User Header */}
          <div className="story-header">
            <div className="story-header-user">
              <img 
                src={userAvatarUrl} 
                alt={group.user?.username || 'user'} 
                className="story-viewer-avatar" 
                onError={(e) => { e.target.src = ProfileImage; }}
              />
              <div className="story-viewer-info">
                <span className="story-viewer-username">
                  {group.user?.displayName || group.user?.username || 'User'}
                </span>
                <span className="story-viewer-time">
                  {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="story-header-actions">
              {isOwner && (
                <button 
                  type="button"
                  className="story-delete-btn" 
                  onClick={(e) => { e.stopPropagation(); handleDeleteCurrentStory(); }}
                  title="Delete Story"
                  aria-label="Delete Story"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button 
                type="button"
                className="story-close-btn" 
                onClick={(e) => { e.stopPropagation(); onClose(); }} 
                title="Close (Esc)"
                aria-label="Close Story"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Media / Content Body */}
          <div className="story-media-container">
            {story.mediaType === 'text' ? (
              <div 
                className="story-text-container" 
                style={{ background: story.background || 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}
              >
                <span 
                  className="story-text-content" 
                  style={{ 
                    fontSize: FONT_SIZE_MAP[story.fontSize] || story.fontSize || '1.75rem', 
                    color: story.textColor || '#ffffff',
                    textAlign: story.textAlign || 'center',
                    fontFamily: story.fontFamily || 'sans-serif'
                  }}
                >
                  {story.text}
                </span>
              </div>
            ) : story.mediaType === 'video' ? (
              <video 
                ref={videoRef}
                src={mediaUrl} 
                autoPlay 
                playsInline 
                muted 
                className="story-media" 
                onLoadedMetadata={(e) => {
                  if (e.target.duration) {
                    setVideoDuration(e.target.duration * 1000);
                  }
                }}
                onEnded={handleNext} 
              />
            ) : (
              <img src={mediaUrl} alt="Story" className="story-media" />
            )}

            {story.caption && (
              <div className="story-caption-overlay">
                {story.caption}
              </div>
            )}
          </div>

          {/* Owner View Tracking Pill */}
          {isOwner && (
            <div 
              className="story-views-pill" 
              onClick={(e) => { e.stopPropagation(); fetchViewers(); }}
            >
              <Eye size={16} /> {story.seenBy?.length || 0} views
            </div>
          )}

          {/* Tap Navigation Areas */}
          <div className="story-nav left" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
          <div className="story-nav right" onClick={(e) => { e.stopPropagation(); handleNext(); }} />
        </div>

        {/* Viewers Sheet / Modal */}
        {showViewersModal && (
          <div className="viewers-sheet-overlay" onClick={() => { setShowViewersModal(false); setIsPaused(false); }}>
            <motion.div 
              className="viewers-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="viewers-sheet-header">
                <h4>Viewed by {viewersList.length}</h4>
                <button className="modal-close-btn" onClick={() => { setShowViewersModal(false); setIsPaused(false); }}>
                  <X size={20} />
                </button>
              </div>

              <div className="viewers-list">
                {loadingViewers ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Loading viewers...
                  </div>
                ) : viewersList.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No views yet
                  </div>
                ) : (
                  viewersList.map((viewer) => (
                    <div key={viewer._id} className="viewer-item">
                      <img 
                        src={resolveAvatar(viewer)} 
                        alt={viewer.username} 
                        className="viewer-avatar" 
                        onError={(e) => { e.target.src = ProfileImage; }}
                      />
                      <div className="viewer-info">
                        <span className="viewer-name">{viewer.displayName || viewer.username}</span>
                        <span className="viewer-handle">@{viewer.username}</span>
                      </div>
                      <span className="viewer-time">
                        {viewer.viewedAt ? new Date(viewer.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryViewer;
