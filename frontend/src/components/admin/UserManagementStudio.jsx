import React, { useState } from 'react';
import { addNewAdminUser } from '../../services/api';

export default function UserManagementStudio({ currentUser }) {
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addAdminMsg, setAddAdminMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddAdminSubmit = async (e) => {
    e.preventDefault();
    setAddAdminMsg('');
    setLoading(true);
    try {
      const res = await addNewAdminUser({
        username: newAdminUsername,
        password: newAdminPassword,
        email: newAdminEmail
      });
      setAddAdminMsg(`✅ ${res.message}`);
      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminEmail('');
    } catch (err) {
      setAddAdminMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 480px) 1fr', gap: '32px', alignItems: 'start' }}>
      {/* ADD NEW ADMIN FORM CARD */}
      <div className="studio-card">
        <div className="studio-section-header">
          <h2>👥 Create Admin User</h2>
          <p>Invite mentors and geopolitical analysts to access YANF Studio.</p>
        </div>

        {addAdminMsg && (
          <div style={{ padding: '12px 16px', background: addAdminMsg.startsWith('✅') ? 'rgba(143,208,255,0.1)' : 'rgba(255,100,100,0.1)', border: '1px solid var(--line)', borderRadius: '12px', marginBottom: '20px', fontSize: '0.88rem' }}>
            {addAdminMsg}
          </div>
        )}

        <form onSubmit={handleAddAdminSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ice)', marginBottom: '6px' }}>
              Username *
            </label>
            <input
              type="text"
              value={newAdminUsername}
              onChange={(e) => setNewAdminUsername(e.target.value)}
              placeholder="e.g. mentor_alex"
              required
              style={{ width: '100%', padding: '14px', background: 'rgba(6,13,20,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.92rem', borderRadius: '12px' }}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ice)', marginBottom: '6px' }}>
              Password *
            </label>
            <input
              type="password"
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              style={{ width: '100%', padding: '14px', background: 'rgba(6,13,20,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.92rem', borderRadius: '12px' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ice)', marginBottom: '6px' }}>
              Email (For 2FA OTP Passcodes) *
            </label>
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="alex@yanfglobal.com"
              required
              style={{ width: '100%', padding: '14px', background: 'rgba(6,13,20,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.92rem', borderRadius: '12px' }}
            />
          </div>

          <button
            type="submit"
            className="liquid-btn"
            disabled={loading}
          >
            {loading ? 'Creating Admin...' : '+ Create Admin User'}
          </button>
        </form>
      </div>

      {/* ACTIVE TEAM ADMINISTRATORS LIST CARD */}
      <div className="studio-card">
        <div className="studio-section-header">
          <h2>🛡️ Active Team Administrators</h2>
          <p>Verified administrators with publishing permissions.</p>
        </div>

        <div className="user-card-grid">
          <div className="user-card">
            <div className="user-avatar">{currentUser?.username ? currentUser.username[0].toUpperCase() : 'A'}</div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--ink)' }}>{currentUser?.username || 'divyanshu'}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ice)', fontFamily: 'var(--mono)', marginTop: '2px' }}>Role: Lead Administrator</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-dim)', marginTop: '4px' }}>Status: Active Session</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
