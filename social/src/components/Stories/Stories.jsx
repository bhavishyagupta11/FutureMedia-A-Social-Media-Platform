import React, { useState, useEffect, useCallback } from 'react';
import './Stories.css';
import { Plus } from 'lucide-react';
import { getStoredUserProfile, resolveAvatar } from '../../utils/session';
import { apiFetch } from '../../utils/api';
import StoryViewer from './StoryViewer';
import CreateStoryModal from './CreateStoryModal';
import ProfileImage from '../../img/profileImg.jpg';

const Stories = () => {
  const [profile, setProfile] = useState(getStoredUserProfile() || {});
  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const currentUserId = profile.userId;
  const userAvatar = resolveAvatar(profile);

  const sortStoryGroups = useCallback((groups, myId) => {
    if (!Array.isArray(groups)) return [];

    let myGroup = null;
    const unseenGroups = [];
    const seenGroups = [];

    groups.forEach((group) => {
      const uid = String(group.user?._id || group.user?.id || group.user?.username);
      const isMyGroup = myId && uid === String(myId);

      if (isMyGroup) {
        myGroup = group;
      } else {
        const isFullySeen = group.stories && group.stories.length > 0 && group.stories.every(s =>
          s.seenBy?.some(v => String(v.user?._id || v.user || v) === String(myId))
        );

        if (isFullySeen) {
          seenGroups.push(group);
        } else {
          unseenGroups.push(group);
        }
      }
    });

    return [
      ...(myGroup ? [myGroup] : []),
      ...unseenGroups,
      ...seenGroups
    ];
  }, []);

  const fetchStories = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/stories');
      if (res.ok) {
        const payload = await res.json();
        const data = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : []);
        setStoryGroups(sortStoryGroups(data, currentUserId));
      } else {
        setStoryGroups([]);
      }
    } catch (e) {
      setStoryGroups([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, sortStoryGroups]);

  useEffect(() => {
    fetchStories();

    const handleSessionUpdate = () => {
      const p = getStoredUserProfile() || {};
      setProfile(p);
    };

    window.addEventListener('session:updated', handleSessionUpdate);
    window.addEventListener('profile:updated', handleSessionUpdate);

    return () => {
      window.removeEventListener('session:updated', handleSessionUpdate);
      window.removeEventListener('profile:updated', handleSessionUpdate);
    };
  }, [fetchStories]);

  const handleStoryViewed = (storyId, targetUserIdentifier) => {
    setStoryGroups(prevGroups => {
      const updated = prevGroups.map(group => {
        const uid = String(group.user?._id || group.user?.id || group.user?.username);
        if (uid === String(targetUserIdentifier)) {
          const updatedStories = group.stories.map(s => {
            if (String(s._id) === String(storyId)) {
              const seen = s.seenBy || [];
              if (!seen.some(v => String(v.user?._id || v.user || v) === String(currentUserId))) {
                return {
                  ...s,
                  seenBy: [...seen, { user: currentUserId, viewedAt: new Date().toISOString() }]
                };
              }
            }
            return s;
          });
          return { ...group, stories: updatedStories };
        }
        return group;
      });

      return sortStoryGroups(updated, currentUserId);
    });
  };

  // Find my story group if I have active stories
  const myGroupIndex = storyGroups.findIndex(g => String(g.user?._id) === String(currentUserId));
  const myStoryGroup = myGroupIndex !== -1 ? storyGroups[myGroupIndex] : null;

  // Check if my story group is fully seen
  const isMyStorySeen = myStoryGroup?.stories?.every(s =>
    s.seenBy?.some(v => String(v.user?._id || v.user || v) === String(currentUserId))
  );

  return (
    <>
      <div className="stories-container">
        {/* YOUR STORY ITEM */}
        <div className="story-item create-story">
          <div
            className={`story-avatar-container ${myStoryGroup ? `has-story ${isMyStorySeen ? 'seen' : ''}` : ''}`}
            onClick={() => {
              if (myStoryGroup) {
                setViewerIndex(myGroupIndex);
              } else {
                setIsCreateModalOpen(true);
              }
            }}
          >
            <img
              src={userAvatar}
              alt="Your Story"
              className="story-avatar"
              onError={(e) => { e.target.src = ProfileImage; }}
            />
            <div
              className="create-story-badge"
              onClick={(e) => {
                e.stopPropagation();
                setIsCreateModalOpen(true);
              }}
              title="Add to story"
            >
              <Plus size={14} strokeWidth={3} />
            </div>
          </div>
          <span className="story-username">Your Story</span>
        </div>

        {/* OTHER USERS' STORIES */}
        {!loading && storyGroups.map((group, index) => {
          if (String(group.user?._id) === String(currentUserId)) return null;

          const isSeen = group.stories?.length > 0 && group.stories.every(s =>
            s.seenBy?.some(v => String(v.user?._id || v.user || v) === String(currentUserId))
          );

          return (
            <div
              className="story-item"
              key={group.user?._id || group.user?.username || index}
              onClick={() => setViewerIndex(index)}
            >
              <div className={`story-avatar-container has-story ${isSeen ? 'seen' : ''}`}>
                <img 
                  src={resolveAvatar(group.user)} 
                  alt={group.user?.username || 'user'} 
                  className="story-avatar" 
                  onError={(e) => { e.target.src = ProfileImage; }}
                />
              </div>
              <span className="story-username">
                {group.user?.displayName || group.user?.username || 'User'}
              </span>
            </div>
          );
        })}
      </div>

      {/* STORY CREATION MODAL */}
      <CreateStoryModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onStoryCreated={fetchStories}
      />

      {/* STORY VIEWER MODAL */}
      {viewerIndex !== null && storyGroups[viewerIndex] && (
        <StoryViewer 
          storyGroups={storyGroups} 
          initialGroupIndex={viewerIndex} 
          onClose={() => setViewerIndex(null)}
          onStoryDeleted={fetchStories}
          onStoryViewed={handleStoryViewed}
        />
      )}
    </>
  );
};

export default Stories;
