import React from 'react';
import { NavLink } from 'react-router-dom';
import { House, Compass, SquarePlus, MessageCircleMore, User } from 'lucide-react';
import { getStoredUserProfile } from '../../utils/session';
import './BottomNav.css';

const BottomNav = ({ onOpenCreateModal }) => {
  const { userId, username } = getStoredUserProfile();

  return (
    <nav className="bottom-nav">
      <NavLink to="/home" className={({ isActive }) => isActive ? 'bnav-item active' : 'bnav-item'} aria-label="Home">
        <House size={24} />
      </NavLink>

      <NavLink to="/explore" className={({ isActive }) => isActive ? 'bnav-item active' : 'bnav-item'} aria-label="Explore">
        <Compass size={24} />
      </NavLink>

      <button className="bnav-item bnav-fab" onClick={onOpenCreateModal} aria-label="Create Post">
        <SquarePlus size={24} color="#fff" />
      </button>

      <NavLink to="/messages" className={({ isActive }) => isActive ? 'bnav-item active' : 'bnav-item'} aria-label="Messages">
        <MessageCircleMore size={24} />
      </NavLink>

      <NavLink to={`/profile/${username || userId}`} className={({ isActive }) => isActive ? 'bnav-item active' : 'bnav-item'} aria-label="Profile">
        <User size={24} />
      </NavLink>
    </nav>
  );
};

export default BottomNav;
