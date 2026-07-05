import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, PlusSquare, MessageCircle, User } from 'lucide-react';
import { getSessionUserId } from '../../utils/session';
import './BottomNav.css';

const BottomNav = ({ onOpenCreateModal }) => {
  const userId = getSessionUserId();

  return (
    <nav className="bottom-nav">
      <NavLink to="/home" className={({ isActive }) => isActive ? 'bnav-item active' : 'bnav-item'}>
        <Home size={28} />
      </NavLink>

      <NavLink to="/explore" className={({ isActive }) => isActive ? 'bnav-item active' : 'bnav-item'}>
        <Compass size={28} />
      </NavLink>

      <div className="bnav-item" onClick={onOpenCreateModal}>
        <PlusSquare size={28} />
      </div>

      <NavLink to="/messages" className={({ isActive }) => isActive ? 'bnav-item active' : 'bnav-item'}>
        <MessageCircle size={28} />
      </NavLink>

      <NavLink to={`/profile/${userId}`} className={({ isActive }) => isActive ? 'bnav-item active' : 'bnav-item'}>
        <User size={28} />
      </NavLink>
    </nav>
  );
};

export default BottomNav;
