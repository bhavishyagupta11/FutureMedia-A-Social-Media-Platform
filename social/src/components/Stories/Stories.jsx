import React, { useState, useEffect, useRef } from 'react';
import './Stories.css';
import { Plus } from 'lucide-react';
import { getStoredUserProfile } from '../../utils/session';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';
import StoryViewer from './StoryViewer';

const Stories = () => {
  const profile = getStoredUserProfile() || {};
  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerIndex, setViewerIndex] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const res = await apiFetch('/api/v1/stories');
      if (res.ok) {
        const payload = await res.json();
        setStoryGroups(Array.isArray(payload.data) ? payload.data : (Array.isArray(payload) ? payload : []));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('media', file);

    try {
      toast.loading('Uploading story...', { id: 'storyUpload' });
      const res = await apiFetch('/api/v1/stories', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        toast.success('Story published!', { id: 'storyUpload' });
        fetchStories();
      } else {
        toast.error('Failed to upload story', { id: 'storyUpload' });
      }
    } catch (err) {
      toast.error('Failed to upload story', { id: 'storyUpload' });
    }
  };

  return (
    <>
      <div className="stories-container">
        <div className="story-item create-story">
          <div className="story-avatar-container" onClick={() => fileInputRef.current?.click()}>
            <img src={profile.avatar || 'https://i.pravatar.cc/150?u=myprofile'} alt="Your Story" className="story-avatar" />
            <div className="create-story-btn">
              <Plus size={16} strokeWidth={3} />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleCreateStory} 
              accept="image/*,video/*" 
              style={{ display: 'none' }} 
            />
          </div>
          <span className="story-username">Your Story</span>
        </div>

        {!loading && storyGroups.map((group, index) => (
          <div className="story-item" key={group.user._id} onClick={() => setViewerIndex(index)}>
            <div className="story-avatar-container has-story">
              <img src={group.user.profilePicture || 'https://i.pravatar.cc/150'} alt={group.user.username} className="story-avatar" />
            </div>
            <span className="story-username">{group.user.displayName || group.user.username}</span>
          </div>
        ))}
      </div>

      {viewerIndex !== null && (
        <StoryViewer 
          storyGroups={storyGroups} 
          initialGroupIndex={viewerIndex} 
          onClose={() => setViewerIndex(null)} 
        />
      )}
    </>
  );
};

export default Stories;
