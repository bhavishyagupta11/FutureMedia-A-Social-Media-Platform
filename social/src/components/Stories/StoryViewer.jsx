import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import './StoryViewer.css';
import { apiFetch } from '../../utils/api';

const StoryViewer = ({ storyGroups, initialGroupIndex, onClose }) => {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const group = storyGroups[currentGroupIndex];
  const story = group?.stories[currentStoryIndex];

  useEffect(() => {
    if (!story) {
      onClose();
      return;
    }

    if (!story.seenBy?.includes(localStorage.getItem('userId'))) {
      apiFetch(`/api/v1/stories/${story._id}/view`, { method: 'PUT' }).catch(console.error);
    }

    let interval;
    if (!isPaused) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + 1; // 100 steps in 5 seconds = 50ms per step
        });
      }, (story.mediaType === 'video' ? 150 : 50)); // video gives more time, ideally use video events
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupIndex, currentStoryIndex, isPaused, story]);

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
      setCurrentStoryIndex(storyGroups[currentGroupIndex - 1].stories.length - 1);
      setProgress(0);
    }
  };

  if (!story) return null;

  const url = story.mediaUrl.startsWith("http") ? story.mediaUrl : `${process.env.REACT_APP_API_BASE_URL || "http://localhost:8080"}${story.mediaUrl}`;

  return (
    <AnimatePresence>
      <motion.div 
        className="story-viewer-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button className="story-close-btn" onClick={onClose}><X size={32} /></button>
        
        <div className="story-viewer-content" onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)}>
          {/* Progress Bars */}
          <div className="story-progress-container">
            {group.stories.map((s, idx) => (
              <div key={s._id} className="story-progress-bg">
                <div 
                  className="story-progress-fill"
                  style={{
                    width: idx < currentStoryIndex ? '100%' : idx === currentStoryIndex ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          <div className="story-header">
            <img src={group.user.profilePicture || 'https://i.pravatar.cc/150'} alt={group.user.username} className="story-viewer-avatar" />
            <span className="story-viewer-username">{group.user.displayName || group.user.username}</span>
            <span className="story-viewer-time">{new Date(story.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>

          <div className="story-media-container">
            {story.mediaType === 'video' ? (
              <video src={url} autoPlay playsInline className="story-media" onEnded={handleNext} />
            ) : (
              <img src={url} alt="Story" className="story-media" />
            )}
          </div>

          {group.user._id === localStorage.getItem('userId') && (
            <div className="story-views">
              <Eye size={16} /> {story.seenBy?.length || 0} views
            </div>
          )}

          <div className="story-nav left" onClick={(e) => { e.stopPropagation(); handlePrev(); }}>
            <ChevronLeft size={32} />
          </div>
          <div className="story-nav right" onClick={(e) => { e.stopPropagation(); handleNext(); }}>
            <ChevronRight size={32} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryViewer;
