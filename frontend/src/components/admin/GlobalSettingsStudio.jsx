import React from 'react';

export default function GlobalSettingsStudio() {
  return (
    <div className="global-settings-studio">
      <div className="studio-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Global Settings</h2>
          <p>Manage your site-wide configuration.</p>
        </div>
        <button className="btn-primary">Save Changes</button>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        
        {/* Main Settings Form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="studio-card">
            <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 20px 0', color: '#1a1a1a', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>General</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label className="studio-label">Site Title</label>
              <input type="text" className="studio-input" defaultValue="YANF" />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="studio-label">Tagline</label>
              <input type="text" className="studio-input" defaultValue="A minimalist editorial platform" />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>In a few words, explain what this site is about.</p>
            </div>
            
            <div>
              <label className="studio-label">Site Language</label>
              <select className="studio-select" defaultValue="en-US">
                <option value="en-US">English (United States)</option>
                <option value="en-UK">English (UK)</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>

          <div className="studio-card">
            <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 20px 0', color: '#1a1a1a', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>Writing</h3>
            
            <div>
              <label className="studio-label">Default Post Category</label>
              <select className="studio-select" defaultValue="uncategorized">
                <option value="uncategorized">Uncategorized</option>
                <option value="tech">Technology</option>
                <option value="design">Design</option>
              </select>
            </div>
          </div>

          <div className="studio-card">
            <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 20px 0', color: '#1a1a1a', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>Reading</h3>
            
            <div>
              <label className="studio-label">Front Page Displays</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#334155' }}>
                  <input type="radio" name="front-page" defaultChecked />
                  Your latest posts
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#334155' }}>
                  <input type="radio" name="front-page" />
                  A static page
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="studio-card">
            <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0', color: '#1a1a1a' }}>Overview Summary & Help</h3>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', marginBottom: '16px' }}>
              Use these settings to control the global behavior of your site. Remember to click "Save Changes" after making any modifications.
            </p>
            <h4 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 8px 0', color: '#0f172a' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="#" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '13px' }}>Help & Documentation</a></li>
              <li><a href="#" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '13px' }}>Support Forums</a></li>
              <li><a href="#" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '13px' }}>Theme Customization guide</a></li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
