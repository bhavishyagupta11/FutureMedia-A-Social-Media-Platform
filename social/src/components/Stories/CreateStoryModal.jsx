import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Type, UploadCloud, Send, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import './CreateStoryModal.css';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';

const GRADIENTS = [
  { name: 'Peach Glow', bg: 'linear-gradient(135deg, #FF8A4C, #F9783A)' },
  { name: 'Warm Sunset', bg: 'linear-gradient(135deg, #FF8A4C, #F5D8DC)' },
  { name: 'Sage Meadow', bg: 'linear-gradient(135deg, #A8C98F, #648D47)' },
  { name: 'Lavender Dream', bg: 'linear-gradient(135deg, #E6DDF0, #B899D8)' },
  { name: 'Charcoal Minimal', bg: 'linear-gradient(135deg, #3A3632, #252525)' },
  { name: 'Warm Apricot', bg: 'linear-gradient(135deg, #FFE2D2, #FF8A4C)' },
];

const FONTS = [
  { label: 'Sans', value: 'sans-serif' },
  { label: 'Serif', value: 'serif' },
  { label: 'Mono', value: 'monospace' },
  { label: 'Cursive', value: 'cursive' }
];

const FONT_SIZE_MAP = {
  small: '1.25rem',
  normal: '1.75rem',
  large: '2.5rem',
};

const FONT_SIZE_OPTIONS = [
  { key: 'small', label: 'Small' },
  { key: 'normal', label: 'Normal' },
  { key: 'large', label: 'Large' },
];

const CreateStoryModal = ({ isOpen, onClose, onStoryCreated }) => {
  const [activeTab, setActiveTab] = useState('media'); // 'media' | 'text'
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [caption, setCaption] = useState('');
  
  // Text Story states
  const [storyText, setStoryText] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0].bg);
  const [fontSizeKey, setFontSizeKey] = useState('normal'); // 'small' | 'normal' | 'large'
  const [textAlign, setTextAlign] = useState('center');
  const [fontFamily, setFontFamily] = useState('sans-serif');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size exceeds 20MB limit');
      return;
    }

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

        if (storyText.trim().length > 280) {
          toast.error('Text story cannot exceed 280 characters', { id: toastId });
          setIsSubmitting(false);
          return;
        }

        const payload = {
          mediaType: 'text',
          text: storyText.trim(),
          background: selectedGradient,
          fontSize: fontSizeKey,
          textColor: '#ffffff',
          textAlign: textAlign,
          fontFamily: fontFamily,
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
            <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
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
                    <span className="dropzone-hint">Supports PNG, JPG, MP4, WEBM (up to 20MB)</span>
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
                    <button className="remove-media-btn" onClick={handleClearMedia} aria-label="Remove media">
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
                    maxLength={300}
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
                    style={{ 
                      fontSize: FONT_SIZE_MAP[fontSizeKey] || '1.75rem', 
                      color: '#ffffff',
                      textAlign: textAlign,
                      fontFamily: fontFamily
                    }}
                    maxLength={280}
                    rows={4}
                  />
                  <div className="char-counter">
                    {storyText.length}/280
                  </div>
                </div>

                {/* Alignment & Font Family Controls */}
                <div className="story-options-row">
                  <span className="options-label">Text Alignment & Font Family</span>
                  <div className="typography-tools-row">
                    <div className="alignment-group">
                      <button
                        type="button"
                        className={`tool-btn ${textAlign === 'left' ? 'active' : ''}`}
                        aria-pressed={textAlign === 'left'}
                        onClick={() => setTextAlign('left')}
                        title="Align Left"
                      >
                        <AlignLeft size={16} />
                      </button>
                      <button
                        type="button"
                        className={`tool-btn ${textAlign === 'center' ? 'active' : ''}`}
                        aria-pressed={textAlign === 'center'}
                        onClick={() => setTextAlign('center')}
                        title="Align Center"
                      >
                        <AlignCenter size={16} />
                      </button>
                      <button
                        type="button"
                        className={`tool-btn ${textAlign === 'right' ? 'active' : ''}`}
                        aria-pressed={textAlign === 'right'}
                        onClick={() => setTextAlign('right')}
                        title="Align Right"
                      >
                        <AlignRight size={16} />
                      </button>
                    </div>

                    <div className="font-family-group">
                      {FONTS.map(f => (
                        <button
                          key={f.value}
                          type="button"
                          className={`tool-btn ${fontFamily === f.value ? 'active' : ''}`}
                          aria-pressed={fontFamily === f.value}
                          style={{ fontFamily: f.value }}
                          onClick={() => setFontFamily(f.value)}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
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
                  <div className="font-size-segmented-control">
                    {FONT_SIZE_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        className={`font-size-btn ${fontSizeKey === opt.key ? 'active' : ''}`}
                        aria-pressed={fontSizeKey === opt.key}
                        onClick={() => setFontSizeKey(opt.key)}
                      >
                        {opt.label}
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
