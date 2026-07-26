import React, { useState } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import ShareModal from '../ShareModal/ShareModal';
import { getSessionUserId } from '../../utils/session';
import './AppLayout.css';

const AppLayout = ({ children }) => {
  const isLoggedIn = Boolean(getSessionUserId());
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const handleOpenCreateModal = () => setCreateModalOpen(true);

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
      <ShareModal modalOpened={isCreateModalOpen} setModalOpened={setCreateModalOpen} />
    </div>
  );
};

export default AppLayout;
