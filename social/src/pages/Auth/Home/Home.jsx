import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Stories from "../../../components/Stories/Stories";
import PostShare from "../../../components/PostShare/PostShare";
import Posts from "../../../components/Posts/Posts";
import SuggestedUsers from "../../../components/SuggestedUsers/SuggestedUsers";
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!localStorage.getItem("userId")) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="Home">
      <div className="home-main-feed">
        <Stories />
        <PostShare />
        <Posts />
      </div>
      <div className="home-right-sidebar">
        <SuggestedUsers />
      </div>
    </div>
  );
};

export default Home;
