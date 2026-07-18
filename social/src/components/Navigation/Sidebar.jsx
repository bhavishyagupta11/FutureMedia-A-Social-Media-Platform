import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Compass, Search, MessageCircle, Bell, PlusSquare, User, Settings, LogOut } from 'lucide-react';
import { getSessionUserId, clearUserSession } from '../../utils/session';
import Logo from '../Logo/Logo';
import './Sidebar.css';

const Sidebar = ({ onOpenCreateModal }) => {
  const navigate = useNavigate();
  const userId = getSessionUserId();

  const handleLogout = () => {
    clearUserSession();
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Logo size="normal" />
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/home" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Home size={28} />
          <span className="nav-label">Home</span>
        </NavLink>

        <NavLink to="/explore" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Compass size={28} />
          <span className="nav-label">Explore</span>
        </NavLink>

        <NavLink to="/search" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Search size={28} />
          <span className="nav-label">Search</span>
        </NavLink>

        <NavLink to="/messages" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <MessageCircle size={28} />
          <span className="nav-label">Messages</span>
        </NavLink>

        <NavLink to="/notifications" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Bell size={28} />
          <span className="nav-label">Notifications</span>
        </NavLink>

        <div className="nav-item" onClick={onOpenCreateModal}>
          <PlusSquare size={28} />
          <span className="nav-label">Create</span>
        </div>

        <NavLink to={`/profile/${userId}`} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <User size={28} />
          <span className="nav-label">Profile</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Settings size={28} />
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
