import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { House, Compass, Search, MessageCircleMore, Bell, SquarePlus, User, Settings, LogOut } from 'lucide-react';
import { getStoredUserProfile, clearUserSession } from '../../utils/session';
import { apiFetch } from '../../api/axios';
import Logo from '../Logo/Logo';
import './Sidebar.css';

const Sidebar = ({ onOpenCreateModal }) => {
  const navigate = useNavigate();
  const { userId, username } = getStoredUserProfile();

  const handleLogout = async () => {
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    clearUserSession();
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
        <Logo size="normal" />
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/home" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <House className="nav-icon" size={24} />
          <span className="nav-label">Home</span>
        </NavLink>

        <NavLink to="/explore" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Compass className="nav-icon" size={24} />
          <span className="nav-label">Explore</span>
        </NavLink>

        <NavLink to="/search" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Search className="nav-icon" size={24} />
          <span className="nav-label">Search</span>
        </NavLink>

        <NavLink to="/messages" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MessageCircleMore className="nav-icon" size={24} />
          <span className="nav-label">Messages</span>
        </NavLink>

        <NavLink to="/notifications" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Bell className="nav-icon" size={24} />
          <span className="nav-label">Notifications</span>
        </NavLink>

        <button className="nav-item nav-action-btn" onClick={onOpenCreateModal} aria-label="Create Post">
          <SquarePlus className="nav-icon" size={24} />
          <span className="nav-label">Create</span>
        </button>

        <NavLink to={`/profile/${username || userId}`} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <User className="nav-icon" size={24} />
          <span className="nav-label">Profile</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Settings className="nav-icon" size={24} />
          <span className="nav-label">Settings</span>
        </NavLink>

        <div className="nav-item logout-btn" onClick={handleLogout}>
          <LogOut size={28} />
          <span className="nav-label">Logout</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
