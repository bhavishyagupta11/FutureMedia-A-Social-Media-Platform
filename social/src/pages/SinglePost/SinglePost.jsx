import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Posts from "../../components/Posts/Posts";
import { ArrowLeft } from "lucide-react";

const SinglePost = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="SinglePostPage"
      style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}
    >
      <button 
        onClick={() => navigate(-1)} 
        style={{ background: 'transparent', border: 'none', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '2rem', fontSize: '1rem', fontWeight: 600 }}
      >
        <ArrowLeft size={20} /> Back
      </button>
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-card)', padding: '1rem', border: '1px solid var(--color-border)' }}>
        <Posts singlePostId={id} />
      </div>
    </motion.div>
  );
};

export default SinglePost;
