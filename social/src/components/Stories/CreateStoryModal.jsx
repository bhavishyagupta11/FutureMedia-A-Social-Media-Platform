import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Type, UploadCloud, Send } from 'lucide-react';
import './CreateStoryModal.css';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';

const GRADIENTS = [
  { name: 'Indigo Purple', bg: 'linear-gradient(135deg, #4F46E5, #7C3AED)' },
  { name: 'Pink Violet', bg: 'linear-gradient(135deg, #EC4899, #8B5CF6)' },
  { name: 'Sunset Red', bg: 'linear-gradient(135deg, #F97316, #EF4444)' },
  { name: 'Emerald Cyan', bg: 'linear-gradient(135deg, #10B981, #06B6D4)' },
  { name: 'Midnight', bg: 'linear-gradient(135deg, #1E1B4B, #0F172A)' },
  { name: 'Golden Amber', bg: 'linear-gradient(135deg, #F59E0B, #D97706)' },
];

const CreateStoryModal = ({ isOpen, onClose, onStoryCreated }) => {
  const [activeTab, setActiveTab] = useState('media'); // 'media' | 'text'
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [caption, setCaption] = useState('');
  
  // Text Story states
  const [storyText, setStoryText] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0].bg);
  const [fontSize, setFontSize] = useState('1.5rem');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setFilePreview(url);
  };

  const handleClearMedia = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading('Publishing story...');

    try {
      let res;
      if (activeTab === 'media') {
        if (!selectedFile) {
          toast.error('Please select an image or video first', { id: toastId });
          setIsSubmitting(false);
          return;
        }

        const formData = new FormData();
        formData.append('media', selectedFile);
        formData.append('caption', caption);
        formData.append('mediaType', selectedFile.type.startsWith('video') ? 'video' : 'image');

        res = await apiFetch('/api/v1/stories', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Text story
        if (!storyText.trim()) {
          toast.error('Please type a message for your story', { id: toastId });
          setIsSubmitting(false);
          return;
        }

        const payload = {
          mediaType: 'text',
          text: storyText.trim(),
          background: selectedGradient,
          fontSize: fontSize,
          textColor: '#ffffff',
          caption: caption,
        };

        res = await apiFetch('/api/v1/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast.success('Story published!', { id: toastId });
        handleClearMedia();
        setStoryText('');
        setCaption('');
        onStoryCreated();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || 'Failed to publish story', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error. Failed to publish story', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="create-story-modal-overlay" onClick={onClose}>
        <motion.div 
          className="create-story-modal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="create-story-header">
            <h3>Create Story</h3>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="create-story-tabs">
            <button 
              className={`story-tab-btn ${activeTab === 'media' ? 'active' : ''}`}
              onClick={() => setActiveTab('media')}
            >
              <ImageIcon size={18} /> Photo / Video
            </button>
            <button 
              className={`story-tab-btn ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTab('text')}
            >
              <Type size={18} /> Text Story
            </button>
          </div>

          <div className="create-story-body">
            {activeTab === 'media' ? (
              <>
                {!filePreview ? (
                  <div 
                    className="file-upload-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud size={48} className="dropzone-icon" />
                    <span className="dropzone-text">Click to choose image or video</span>
                    <span className="dropzone-hint">Supports PNG, JPG, MP4, WEBM (up to 24h expiration)</span>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,video/*"
                      style={{ display: 'none' }}
                    />
                  </div>
                ) : (
                  <div className="story-preview-container">
                    {selectedFile?.type.startsWith('video') ? (
                      <video src={filePreview} controls className="story-preview-media" />
                    ) : (
                      <img src={filePreview} alt="Story Preview" className="story-preview-media" />
                    )}
                    <button className="remove-media-btn" onClick={handleClearMedia}>
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="story-options-row">
                  <span className="options-label">Caption (Optional)</span>
                  <input 
                    type="text" 
                    placeholder="Add a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="caption-input"
                  />
                </div>
              </>
            ) : (
              <>
                <div 
                  className="text-story-canvas"
                  style={{ background: selectedGradient }}
                >
                  <textarea 
                    placeholder="Start typing your story..."
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    style={{ fontSize: fontSize, color: '#ffffff' }}
                    rows={4}
                  />
                </div>

                <div className="story-options-row">
                  <span className="options-label">Background Theme</span>
                  <div className="bg-palette">
                    {GRADIENTS.map((g) => (
                      <div 
                        key={g.name}
                        className={`bg-swatch ${selectedGradient === g.bg ? 'active' : ''}`}
                        style={{ background: g.bg }}
                        onClick={() => setSelectedGradient(g.bg)}
                        title={g.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="story-options-row">
                  <span className="options-label">Font Size</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['1.2rem', '1.5rem', '2rem'].map((sz, idx) => (
                      <button
                        key={sz}
                        type="button"
                        style={{
                          flex: 1,
                          padding: '0.4rem',
                          background: fontSize === sz ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.85rem'
                        }}
                        onClick={() => setFontSize(sz)}
                      >
                        {idx === 0 ? 'Small' : idx === 1 ? 'Normal' : 'Large'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="create-story-footer">
            <button className="cancel-modal-btn" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button 
              className="publish-story-btn" 
              onClick={handleSubmit}
              disabled={isSubmitting || (activeTab === 'media' && !selectedFile) || (activeTab === 'text' && !storyText.trim())}
            >
              <Send size={16} /> {isSubmitting ? 'Publishing...' : 'Publish Story'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateStoryModal;
