import React from 'react';
import { NavLink } from 'react-router-dom';
import { House, Search, Compass, SquarePlus, Bell, MessageCircleMore, User } from 'lucide-react';
import { getStoredUserProfile } from '../../utils/session';
import './BottomNav.css';

const BottomNav = ({ onOpenCreateModal }) => {
  const { userId, username } = getStoredUserProfile();

  return (
    <nav className="bottom-nav">
      <NavLink to="/home" className={({ isActive }) => isActive ? 'bnav-item active' : 'bnav-item'} aria-label="Home">
        <House size={22} />
      </NavLink>

      <NavLink to="/search" className={({ isActive }) => isActive ? 'bnav-item active' : 'bnav-item'} aria-label="Search">
        <Search size={22} />
      </NavLink>

      <NavLink to="/explore" className={({ isActive }) => isActive ? 'bnav-item active' : 'bnav-item'} aria-label="Explore">
        <Compass size={22} />
      </NavLink>

      <button className="bnav-item bnav-fab" onClick={onOpenCreateModal} aria-label="Create Post">
        <SquarePlus size={22} color="#fff" />
      </button>

      <NavLink to="/notifications" className={({ isActive }) => isActive ? 'bnav-item active' : 'bnav-item'} aria-label="Notifications">
        <Bell size={22} />
      </NavLink>

      <NavLink to="/messages" className={({ isActive }) => isActive ? 'bnav-item active' : 'bnav-item'} aria-label="Messages">
        <MessageCircleMore size={22} />
      </NavLink>

      <NavLink to={`/profile/${username || userId}`} className={({ isActive }) => isActive ? 'bnav-item active' : 'bnav-item'} aria-label="Profile">
        <User size={22} />
      </NavLink>
    </nav>
  );
};

export default BottomNav;
