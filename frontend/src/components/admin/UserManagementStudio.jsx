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

  const initial = currentUser?.username ? currentUser.username[0].toUpperCase() : 'A';
  const username = currentUser?.username || 'divyanshu';

  return (
    <div className="user-management-studio">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 460px) 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* ADD NEW ADMIN FORM CARD */}
        <div className="studio-card">
          <div className="studio-section-header">
            <h2>Create Admin User</h2>
            <p>Invite mentors and geopolitical analysts to access YANF Studio.</p>
          </div>

          {addAdminMsg && (
            <div style={{ 
              padding: '12px 16px', 
              background: addAdminMsg.startsWith('✅') ? '#dcfce7' : '#fee2e2', 
              color: addAdminMsg.startsWith('✅') ? '#15803d' : '#b91c1c', 
              border: addAdminMsg.startsWith('✅') ? '1px solid #86efac' : '1px solid #fca5a5', 
              borderRadius: '8px', 
              marginBottom: '20px', 
              fontSize: '13px',
              fontWeight: '500' 
            }}>
              {addAdminMsg}
            </div>
          )}

          <form onSubmit={handleAddAdminSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label className="studio-label">Username *</label>
              <input
                type="text"
                className="studio-input"
                value={newAdminUsername}
                onChange={(e) => setNewAdminUsername(e.target.value)}
                placeholder="e.g. mentor_alex"
                required
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label className="studio-label">Password *</label>
              <input
                type="password"
                className="studio-input"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className="studio-label">Email (For 2FA OTP Passcodes) *</label>
              <input
                type="email"
                className="studio-input"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="alex@yanfglobal.com"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Creating Admin...' : '+ Create Admin User'}
            </button>
          </form>
        </div>

        {/* ACTIVE TEAM ADMINISTRATORS LIST CARD */}
        <div className="studio-card">
          <div className="studio-section-header">
            <h2>Active Team Administrators</h2>
            <p>Verified administrators with publishing permissions.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              padding: '16px 20px', 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px' 
            }}>
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '50%', 
                background: '#1e1e1e', 
                color: '#ffffff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '16px', 
                fontWeight: '700',
                flexShrink: 0
              }}>
                {initial}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>{username}</span>
                  <span className="badge published" style={{ fontSize: '11px', textTransform: 'none', letterSpacing: 'normal' }}>
                    Active Session
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Role: <span style={{ color: '#2563eb', fontWeight: '500' }}>Lead Administrator</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
