import React, { useState } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { getSessionUserId } from '../../utils/session';
import './AppLayout.css';

const AppLayout = ({ children }) => {
  const isLoggedIn = Boolean(getSessionUserId());
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // We will build CreatePostModal later. For now, it just toggles state.
  const handleOpenCreateModal = () => setCreateModalOpen(true);
  const handleCloseCreateModal = () => setCreateModalOpen(false);

  if (!isLoggedIn) {
    return <div className="app-guest">{children}</div>;
  }

  return (
    <div className="app-layout">
      <Sidebar onOpenCreateModal={handleOpenCreateModal} />
      <main className="app-main-content">
        {children}
      </main>
      <BottomNav onOpenCreateModal={handleOpenCreateModal} />

      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={handleCloseCreateModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Create Post Modal (Placeholder)</h2>
            <button onClick={handleCloseCreateModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
