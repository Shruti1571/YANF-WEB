import React from 'react';

export default function AdminDashboardOverview({ publishedBlogs, setActiveTab }) {
  // Take top 3 recent blogs for the widget
  const recentPosts = publishedBlogs ? publishedBlogs.slice(0, 3) : [];

  return (
    <div className="dashboard-overview">
      <div className="studio-section-header">
        <h2>Dashboard (Main Overview)</h2>
        <p>A snapshot of your site's performance and recent activity.</p>
      </div>

      <div className="grid-3">
        {/* Column 1 & 2: Main Activity */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Traffic Graph Placeholder */}
          <div className="studio-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0, color: '#1a1a1a' }}>Recent Traffic (Visits/Views)</h3>
              <select className="studio-select" style={{ width: 'auto', padding: '4px 10px', fontSize: '12px' }}>
                <option>Visits/Views</option>
                <option>Visitors</option>
              </select>
            </div>
            
            <div style={{ height: '240px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '20px' }}>
              {/* Fake Line Chart SVG */}
              <svg viewBox="0 0 500 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <path d="M 0 100 Q 50 120 100 80 T 200 100 T 300 40 T 400 90 T 500 50 L 500 150 L 0 150 Z" fill="rgba(59, 130, 246, 0.1)" />
                <path d="M 0 100 Q 50 120 100 80 T 200 100 T 300 40 T 400 90 T 500 50" fill="none" stroke="#2563eb" strokeWidth="3" />
                <circle cx="100" cy="80" r="4" fill="#2563eb" />
                <circle cx="200" cy="100" r="4" fill="#2563eb" />
                <circle cx="300" cy="40" r="4" fill="#2563eb" />
                <circle cx="400" cy="90" r="4" fill="#2563eb" />
                <circle cx="500" cy="50" r="4" fill="#2563eb" />
              </svg>
            </div>
          </div>

          <div className="grid-2">
            {/* Recent Posts Widget */}
            <div className="studio-card">
              <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0', color: '#1a1a1a' }}>Recent Posts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recentPosts.length > 0 ? recentPosts.map((post, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', flexShrink: 0, backgroundImage: `url(${post.coverPhotoUrl || ''})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{post.title}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{post.author} • {new Date(post.publishedAt || Date.now()).toLocaleDateString()}</div>
                    </div>
                  </div>
                )) : (
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>No recent posts found.</div>
                )}
                <button 
                  onClick={() => setActiveTab('posts')}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: '500', padding: 0, cursor: 'pointer', textAlign: 'left', marginTop: '8px' }}
                >
                  View all posts →
                </button>
              </div>
            </div>

            {/* Recent Comments Widget */}
            <div className="studio-card">
              <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0', color: '#1a1a1a' }}>Recent Comments</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#cbd5e1', flexShrink: 0 }}></div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#0f172a' }}>Liam commented: <span style={{ color: '#64748b', fontWeight: '400' }}>2m ago</span></div>
                    <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px', fontStyle: 'italic' }}>"Really loved this deep dive into design!"</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', flexShrink: 0 }}></div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#0f172a' }}>Emma commented: <span style={{ color: '#64748b', fontWeight: '400' }}>1h ago</span></div>
                    <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px', fontStyle: 'italic' }}>"This helped me set up my new blog."</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Stats & Quick Draft */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Stats */}
          <div className="studio-card">
            <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0', color: '#1a1a1a' }}>Quick Stats</h3>
            <div className="grid-2" style={{ gap: '16px' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#0f172a' }}>284</div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Posts</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#0f172a' }}>33</div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Published</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#0f172a' }}>16</div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Drafts</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#0f172a' }}>552</div>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pageviews</div>
              </div>
            </div>
          </div>

          {/* Quick Draft */}
          <div className="studio-card">
            <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0', color: '#1a1a1a' }}>Quick Draft</h3>
            <form onSubmit={(e) => { e.preventDefault(); const b = e.target.querySelector('button'); if(b){ b.textContent = 'Draft Saved! ✓'; b.style.background = '#16a34a'; setTimeout(() => { b.textContent = 'Save Draft'; b.style.background = '#2563eb'; }, 2000); } }}>
              <input type="text" className="studio-input" placeholder="Title" style={{ marginBottom: '12px' }} />
              <textarea className="studio-textarea" rows="4" placeholder="What's on your mind?" style={{ marginBottom: '16px' }}></textarea>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Save Draft</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
