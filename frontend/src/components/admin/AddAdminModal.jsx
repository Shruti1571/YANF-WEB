import React from 'react';

export default function AddAdminModal({
  showAddAdminModal,
  setShowAddAdminModal,
  newAdminUsername,
  setNewAdminUsername,
  newAdminPassword,
  setNewAdminPassword,
  newAdminEmail,
  setNewAdminEmail,
  addAdminMsg,
  handleAddAdminSubmit
}) {
  if (!showAddAdminModal) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#08111a', border: '1px solid var(--ice)', padding: '28px', maxWidth: '440px', width: '100%', borderRadius: '6px' }}>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--ice)', marginBottom: '16px' }}>+ Create New Admin User</h3>
        {addAdminMsg && <div style={{ fontSize: '0.85rem', marginBottom: '14px', color: 'var(--ink)' }}>{addAdminMsg}</div>}
        <form onSubmit={handleAddAdminSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', color: 'var(--ink-dim)', display: 'block', marginBottom: '4px' }}>New Admin Username</label>
            <input type="text" value={newAdminUsername} onChange={(e) => setNewAdminUsername(e.target.value)} required style={{ width: '100%', padding: '10px', background: 'rgba(6,13,20,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.88rem' }} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', color: 'var(--ink-dim)', display: 'block', marginBottom: '4px' }}>Password</label>
            <input type="password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} required style={{ width: '100%', padding: '10px', background: 'rgba(6,13,20,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.88rem' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', color: 'var(--ink-dim)', display: 'block', marginBottom: '4px' }}>Email (for 2FA OTPs)</label>
            <input type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} required style={{ width: '100%', padding: '10px', background: 'rgba(6,13,20,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.88rem' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={() => setShowAddAdminModal(false)}>Close</button>
            <button type="submit" className="btn solid">Create Admin</button>
          </div>
        </form>
      </div>
    </div>
  );
}
