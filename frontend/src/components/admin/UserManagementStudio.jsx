import React, { useState, useEffect } from 'react';
import { addNewAdminUser, fetchAdminUsers, updateAdminUserPermissions, deleteAdminUser } from '../../services/api';

export default function UserManagementStudio({ currentUser }) {
  const [usersList, setUsersList] = useState([]);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [rolePreset, setRolePreset] = useState('editor'); // 'editor' | 'certs' | 'media' | 'manager' | 'custom'

  // Permission Checkboxes
  const [permissions, setPermissions] = useState({
    blogs: true,
    media: true,
    certificates: false,
    gallery: false,
    hallOfFame: false,
    users: false
  });

  const [editingUserId, setEditingUserId] = useState(null);
  const [editPermissions, setEditPermissions] = useState({});
  const [editIsActive, setEditIsActive] = useState(true);

  const [addAdminMsg, setAddAdminMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const isSuperAdmin = currentUser?.role === 'superadmin';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await fetchAdminUsers();
      setUsersList(data);
    } catch (err) {
      console.warn('API users fetch fallback to local:', err.message);
      // Local fallback state
      setUsersList([
        {
          _id: '1',
          username: currentUser?.username || 'admin',
          email: currentUser?.email || 'aditya@yanfglobal.com',
          role: 'superadmin',
          isActive: true,
          permissions: { blogs: true, media: true, certificates: true, gallery: true, hallOfFame: true, users: true },
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        }
      ]);
    }
  };

  const handleApplyPreset = (preset) => {
    setRolePreset(preset);
    if (preset === 'editor') {
      setPermissions({ blogs: true, media: true, certificates: false, gallery: false, hallOfFame: false, users: false });
    } else if (preset === 'certs') {
      setPermissions({ blogs: false, media: false, certificates: true, gallery: false, hallOfFame: false, users: false });
    } else if (preset === 'media') {
      setPermissions({ blogs: false, media: true, certificates: false, gallery: true, hallOfFame: true, users: false });
    } else if (preset === 'manager') {
      setPermissions({ blogs: true, media: true, certificates: true, gallery: true, hallOfFame: true, users: false });
    } else if (preset === 'superadmin') {
      setPermissions({ blogs: true, media: true, certificates: true, gallery: true, hallOfFame: true, users: true });
    }
  };

  const handleAddAdminSubmit = async (e) => {
    e.preventDefault();
    setAddAdminMsg('');
    setLoading(true);
    try {
      const res = await addNewAdminUser({
        username: newAdminUsername,
        password: newAdminPassword,
        email: newAdminEmail,
        role: rolePreset === 'superadmin' ? 'superadmin' : 'admin',
        permissions
      });
      setAddAdminMsg(`✅ ${res.message}`);
      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminEmail('');
      loadUsers();
    } catch (err) {
      setAddAdminMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userItem) => {
    try {
      const updatedStatus = !userItem.isActive;
      await updateAdminUserPermissions(userItem._id || userItem.id, { isActive: updatedStatus });
      loadUsers();
    } catch (err) {
      alert(`Error updating user status: ${err.message}`);
    }
  };

  const handleStartEdit = (userItem) => {
    setEditingUserId(userItem._id || userItem.id);
    setEditPermissions(userItem.permissions || {});
    setEditIsActive(userItem.isActive !== false);
  };

  const handleSaveEditPermissions = async (userId) => {
    try {
      await updateAdminUserPermissions(userId, {
        permissions: editPermissions,
        isActive: editIsActive
      });
      setEditingUserId(null);
      loadUsers();
    } catch (err) {
      alert(`Failed to save user permissions: ${err.message}`);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteAdminUser(userToDelete._id || userToDelete.id);
      setUserToDelete(null);
      loadUsers();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="user-management-studio" style={{ width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 480px) 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* ADD NEW ADMIN FORM CARD */}
        <div className="studio-card">
          <div className="studio-section-header">
            <h2>Create Admin Account</h2>
            <p>Invite team members with custom role permissions.</p>
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

            <div style={{ marginBottom: '22px' }}>
              <label className="studio-label">Email (For 2FA OTP) *</label>
              <input
                type="email"
                className="studio-input"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="alex@yanfglobal.com"
                required
              />
            </div>

            {/* ROLE PRESET SHORTCUTS */}
            <div style={{ marginBottom: '22px' }}>
              <label className="studio-label" style={{ fontSize: '13px', fontWeight: '600' }}>Role Preset Shortcuts</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('editor')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '20px',
                    border: '1px solid #cbd5e1',
                    background: rolePreset === 'editor' ? '#2563eb' : '#ffffff',
                    color: rolePreset === 'editor' ? '#ffffff' : '#334155',
                    cursor: 'pointer'
                  }}
                >
                  📝 Editor
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('certs')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '20px',
                    border: '1px solid #cbd5e1',
                    background: rolePreset === 'certs' ? '#2563eb' : '#ffffff',
                    color: rolePreset === 'certs' ? '#ffffff' : '#334155',
                    cursor: 'pointer'
                  }}
                >
                  📜 Certs Officer
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('media')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '20px',
                    border: '1px solid #cbd5e1',
                    background: rolePreset === 'media' ? '#2563eb' : '#ffffff',
                    color: rolePreset === 'media' ? '#ffffff' : '#334155',
                    cursor: 'pointer'
                  }}
                >
                  🎨 Media Curator
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('manager')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '20px',
                    border: '1px solid #cbd5e1',
                    background: rolePreset === 'manager' ? '#2563eb' : '#ffffff',
                    color: rolePreset === 'manager' ? '#ffffff' : '#334155',
                    cursor: 'pointer'
                  }}
                >
                  🛡️ Full Manager
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('superadmin')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '20px',
                    border: '1px solid #cbd5e1',
                    background: rolePreset === 'superadmin' ? '#2563eb' : '#ffffff',
                    color: rolePreset === 'superadmin' ? '#ffffff' : '#334155',
                    cursor: 'pointer'
                  }}
                >
                  👑 Super Admin
                </button>
              </div>
            </div>

            {/* GRANULAR PERMISSION CHECKBOXES */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <label className="studio-label" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', display: 'block' }}>
                Module Access Permissions
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label style={{ fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={permissions.blogs}
                    onChange={(e) => { setRolePreset('custom'); setPermissions({ ...permissions, blogs: e.target.checked }); }}
                  />
                  📝 Blog Studio
                </label>

                <label style={{ fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={permissions.media}
                    onChange={(e) => { setRolePreset('custom'); setPermissions({ ...permissions, media: e.target.checked }); }}
                  />
                  🖼️ Media Vault
                </label>

                <label style={{ fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={permissions.certificates}
                    onChange={(e) => { setRolePreset('custom'); setPermissions({ ...permissions, certificates: e.target.checked }); }}
                  />
                  📜 Certificates
                </label>

                <label style={{ fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={permissions.gallery}
                    onChange={(e) => { setRolePreset('custom'); setPermissions({ ...permissions, gallery: e.target.checked }); }}
                  />
                  📸 Event Gallery
                </label>

                <label style={{ fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={permissions.hallOfFame}
                    onChange={(e) => { setRolePreset('custom'); setPermissions({ ...permissions, hallOfFame: e.target.checked }); }}
                  />
                  🏆 Hall of Fame
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '14px' }}
              disabled={loading}
            >
              {loading ? 'Creating Admin...' : '+ Create Admin User'}
            </button>
          </form>
        </div>

        {/* ACTIVE TEAM ADMINISTRATORS LIST CARD */}
        <div className="studio-card">
          <div className="studio-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Team Administrators</h2>
              <p>Manage admin roles, module access, and active account status.</p>
            </div>
            <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', color: '#475569', fontWeight: '600' }}>
              {usersList.length} Accounts
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {usersList.map((userItem, idx) => {
              const uId = userItem._id || userItem.id || idx;
              const isSuper = userItem.role === 'superadmin';
              const isActive = userItem.isActive !== false;
              const isEditingThis = editingUserId === uId;

              return (
                <div 
                  key={uId} 
                  style={{ 
                    background: isActive ? '#ffffff' : '#fef2f2', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '12px', 
                    padding: '20px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '50%', 
                      background: isSuper ? '#0f172a' : '#2563eb', 
                      color: '#ffffff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '17px', 
                      fontWeight: '700',
                      flexShrink: 0
                    }}>
                      {userItem.username ? userItem.username[0].toUpperCase() : 'A'}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div>
                          <span style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginRight: '8px' }}>
                            @{userItem.username}
                          </span>
                          {isSuper ? (
                            <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                              👑 Super Admin
                            </span>
                          ) : (
                            <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>
                              Sub-Admin
                            </span>
                          )}
                        </div>

                        {/* ACTIVE STATUS TOGGLE */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', color: isActive ? '#166534' : '#991b1b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isActive ? '🟢 Active' : '🔴 Inactive'}
                          </span>

                          {!isSuper && isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleToggleActive(userItem)}
                              style={{
                                padding: '4px 10px',
                                fontSize: '11px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: isActive ? '#b91c1c' : '#15803d',
                                cursor: 'pointer'
                              }}
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                        Email: <strong>{userItem.email}</strong>
                      </div>

                      {/* ACTIVE PERMISSIONS BADGES */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {isSuper ? (
                          <span style={{ background: '#f1f5f9', color: '#334155', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>
                            ⚡ Full Access (All Modules)
                          </span>
                        ) : (
                          <>
                            {userItem.permissions?.blogs && <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>📝 Blogs</span>}
                            {userItem.permissions?.media && <span style={{ background: '#f0fdf4', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>🖼️ Media Vault</span>}
                            {userItem.permissions?.certificates && <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>📜 Certs</span>}
                            {userItem.permissions?.gallery && <span style={{ background: '#fae8ff', color: '#86198f', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>📸 Gallery</span>}
                            {userItem.permissions?.hallOfFame && <span style={{ background: '#ffedd5', color: '#c2410c', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>🏆 Hall of Fame</span>}
                          </>
                        )}
                      </div>

                      {/* EDIT PERMISSIONS PANEL */}
                      {isEditingThis ? (
                        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '12px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
                            Edit Access Permissions for @{userItem.username}:
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                            <label style={{ fontSize: '12px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="checkbox"
                                checked={!!editPermissions.blogs}
                                onChange={(e) => setEditPermissions({ ...editPermissions, blogs: e.target.checked })}
                              />
                              📝 Blog Studio
                            </label>
                            <label style={{ fontSize: '12px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="checkbox"
                                checked={!!editPermissions.media}
                                onChange={(e) => setEditPermissions({ ...editPermissions, media: e.target.checked })}
                              />
                              🖼️ Media Vault
                            </label>
                            <label style={{ fontSize: '12px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="checkbox"
                                checked={!!editPermissions.certificates}
                                onChange={(e) => setEditPermissions({ ...editPermissions, certificates: e.target.checked })}
                              />
                              📜 Certificates
                            </label>
                            <label style={{ fontSize: '12px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="checkbox"
                                checked={!!editPermissions.gallery}
                                onChange={(e) => setEditPermissions({ ...editPermissions, gallery: e.target.checked })}
                              />
                              📸 Event Gallery
                            </label>
                          </div>

                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => setEditingUserId(null)}
                              style={{ padding: '6px 12px', fontSize: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditPermissions(uId)}
                              style={{ padding: '6px 14px', fontSize: '12px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              Save Permissions
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                          {!isSuper && isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(userItem)}
                              style={{ fontSize: '12px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                            >
                              ⚙️ Edit Access Permissions
                            </button>
                          )}

                          {/* DELETE USER BUTTON (SUPER ADMIN EXCLUSIVE) */}
                          {isSuperAdmin && !isSuper && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(userItem)}
                              style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500', marginLeft: 'auto' }}
                            >
                              🗑️ Delete Account
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* SUPER ADMIN CONFIRM DELETE MODAL CARD */}
      {userToDelete && (
        <div className="toast-modal-overlay">
          <div className="centered-square-card" style={{ maxWidth: '420px', padding: '28px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>
              Delete User Account?
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Are you sure you want to permanently delete <strong>@{userToDelete.username}</strong> ({userToDelete.email})? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1, background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}
                onClick={() => setUserToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1, background: '#dc2626', borderColor: '#b91c1c' }}
                onClick={handleDeleteUser}
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
