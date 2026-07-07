import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Stories from "../../../components/Stories/Stories";
import PostShare from "../../../components/PostShare/PostShare";
import Posts from "../../../components/Posts/Posts";
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
      <div className="home-content">
        <Stories />
        <PostShare />
        <Posts />
      </div>
    </div>
  );
};

export default Home;
