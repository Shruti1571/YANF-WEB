import React from 'react';

export default function AdminHeader({ currentUser, handleLogout }) {
  const userInitial = currentUser?.username?.charAt(0)?.toUpperCase() || 'A';
  const username = currentUser?.username || 'Admin';

  return (
    <header className="glass-header">
      <div className="header-left">
        <h1 className="header-title">Admin Dashboard</h1>
      </div>

      <div className="header-right">
        <div className="user-profile-badge">
          <div className="user-avatar">{userInitial}</div>
          <span className="user-name">{username}</span>
        </div>
        <button
          type="button"
          className="header-logout-btn"
          onClick={handleLogout}
          title="Logout"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
