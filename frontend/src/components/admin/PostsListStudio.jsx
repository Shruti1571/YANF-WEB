import React, { useState } from 'react';

export default function PostsListStudio({ 
  publishedBlogs, 
  loadingBlogs, 
  loadBlogs, 
  handleDeletePost, 
  handleEditPost,
  handleNewPost,
  setActiveTab, 
  currentUser 
}) {
  const [postToDelete, setPostToDelete] = useState(null);
  const [viewingPost, setViewingPost] = useState(null);
  const [copiedSlugId, setCopiedSlugId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const isSuperAdmin = currentUser?.role === 'superadmin';

  const confirmDelete = () => {
    if (postToDelete && handleDeletePost) {
      handleDeletePost(postToDelete._id);
    }
    setPostToDelete(null);
  };

  const handleCopyLink = (slug, id) => {
    const url = `${window.location.origin}/#page-blogs/${slug || ''}`;
    navigator.clipboard.writeText(url);
    setCopiedSlugId(id);
    setTimeout(() => setCopiedSlugId(null), 2000);
  };

  const filteredBlogs = (publishedBlogs || []).filter(blog => {
    const titleMatch = (blog.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const authorMatch = (blog.author || '').toLowerCase().includes(searchQuery.toLowerCase());
    const categoryMatch = categoryFilter === 'All' || blog.category === categoryFilter;
    return (titleMatch || authorMatch) && categoryMatch;
  });

  return (
    <div className="posts-list-studio">
      
      {/* SECTION HEADER */}
      <div className="studio-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>Posts List</h2>
          <p>Manage, inspect, edit, and organize all your published editorial articles.</p>
        </div>
        
        <button 
          className="btn-primary" 
          onClick={handleNewPost ? handleNewPost : () => setActiveTab('editor')}
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', padding: '10px 20px', fontWeight: '600', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}
        >
          + Write New Post
        </button>
      </div>

      {/* FILTER & DATA TABLE CARD */}
      <div className="studio-card" style={{ padding: '0', overflow: 'hidden' }}>
        
        {/* CONTROLS & SEARCH BAR */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: '#f8fafc' }}>
          
          {/* SEARCH INPUT */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, maxWidth: '400px' }}>
            <div className="sidebar-search" style={{ margin: 0, padding: '7px 12px', background: '#ffffff', border: '1px solid #cbd5e1', width: '100%' }}>
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Search articles by title or author..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* CATEGORY FILTER */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select 
              className="studio-select" 
              style={{ width: 'auto', padding: '7px 14px', fontSize: '13px', background: '#ffffff' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Diplomacy">Diplomacy</option>
              <option value="Debates">Debates</option>
              <option value="Civics">Civics</option>
              <option value="Entrepreneurship">Entrepreneurship</option>
              <option value="Geopolitics">Geopolitics</option>
            </select>

            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
              {filteredBlogs.length} articles
            </span>
          </div>
        </div>

        {/* DATA TABLE */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px', paddingLeft: '24px' }}>
                  <input type="checkbox" />
                </th>
                <th>Title & Actions</th>
                <th>Author & Attribution</th>
                <th>Category</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'center', minWidth: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingBlogs ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    Loading articles...
                  </td>
                </tr>
              ) : filteredBlogs.length > 0 ? (
                filteredBlogs.map((blog) => (
                  <tr key={blog._id} style={{ transition: 'background 0.15s ease' }}>
                    <td style={{ paddingLeft: '24px' }}>
                      <input type="checkbox" />
                    </td>
                    
                    {/* TITLE + QUICK HOVER ACTIONS */}
                    <td style={{ maxWidth: '380px' }}>
                      <div 
                        onClick={() => handleEditPost ? handleEditPost(blog) : setViewingPost(blog)}
                        style={{ fontWeight: '600', color: '#0f172a', fontSize: '14.5px', marginBottom: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        title="Click to edit article"
                      >
                        {blog.title}
                      </div>

                      {/* QUICK ACTION ROW */}
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px' }}>
                        <button
                          type="button"
                          onClick={() => handleEditPost && handleEditPost(blog)}
                          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                        >
                          ✏️ Edit
                        </button>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <button
                          type="button"
                          onClick={() => setViewingPost(blog)}
                          style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                        >
                          👁️ View Preview
                        </button>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(blog.slug, blog._id)}
                          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                        >
                          {copiedSlugId === blog._id ? '✓ Link Copied' : '🔗 Copy Link'}
                        </button>
                      </div>
                    </td>

                    {/* AUTHOR & ATTRIBUTION */}
                    <td>
                      <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '13px' }}>{blog.author || 'YANF Editorial'}</div>
                      <div style={{ fontSize: '11.5px', color: '#2563eb', marginTop: '2px', fontWeight: '500' }}>
                        @{blog.authoredBy || blog.author || 'admin'}
                      </div>
                    </td>

                    {/* CATEGORY */}
                    <td>
                      <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '11px' }}>
                        {blog.category || 'Diplomacy'}
                      </span>
                    </td>

                    {/* DATE */}
                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                      {new Date(blog.createdAt || blog.publishedAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>

                    {/* STATUS */}
                    <td>
                      <span className="badge published">
                        {blog.status === 'draft' ? 'Draft' : 'Published'}
                      </span>
                    </td>

                    {/* ACTIONS BUTTONS */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                        
                        {/* VIEW BUTTON */}
                        <button
                          type="button"
                          onClick={() => setViewingPost(blog)}
                          className="btn-primary"
                          style={{ padding: '5px 10px', fontSize: '12px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1' }}
                          title="Quick View Article"
                        >
                          👁️ View
                        </button>

                        {/* EDIT BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleEditPost && handleEditPost(blog)}
                          className="btn-primary"
                          style={{ padding: '5px 10px', fontSize: '12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
                          title="Edit Article Content"
                        >
                          ✏️ Edit
                        </button>

                        {/* DELETE BUTTON */}
                        {isSuperAdmin ? (
                          <button 
                            type="button"
                            onClick={() => setPostToDelete(blog)}
                            style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', cursor: 'pointer', padding: '5px 8px', borderRadius: '6px', fontSize: '12px' }}
                            title="Delete Post (Super Admin)"
                          >
                            🗑️
                          </button>
                        ) : (
                          <span title="Deletion restricted to Super Admin" style={{ fontSize: '13px', opacity: 0.35, cursor: 'not-allowed', padding: '5px' }}>
                            🔒
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>No articles found</div>
                    <p style={{ fontSize: '13px', margin: '0 0 16px 0' }}>Get started by drafting your first publication.</p>
                    <button 
                      className="btn-primary" 
                      onClick={handleNewPost ? handleNewPost : () => setActiveTab('editor')}
                    >
                      + Create New Post
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* FOOTER PAGINATION INFO */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <span style={{ fontSize: '12.5px', color: '#64748b' }}>
            Showing {filteredBlogs.length} of {publishedBlogs?.length || 0} entries
          </span>
        </div>
      </div>

      {/* QUICK VIEW MODAL POPUP */}
      {viewingPost && (
        <div className="toast-modal-overlay" onClick={() => setViewingPost(null)}>
          <div 
            style={{ 
              background: '#ffffff', 
              borderRadius: '20px', 
              width: '880px', 
              maxWidth: '95vw', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              position: 'relative',
              animation: 'popScale 0.25s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 28px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge published">Article Preview</span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Permalink: <code>/blog/{viewingPost.slug}</code></span>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '6px 14px', fontSize: '12.5px' }}
                  onClick={() => {
                    const post = viewingPost;
                    setViewingPost(null);
                    if (handleEditPost) handleEditPost(post);
                  }}
                >
                  ✏️ Open in Editor
                </button>
                
                <button 
                  type="button" 
                  onClick={() => setViewingPost(null)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* MODAL BODY */}
            <div style={{ padding: '36px 44px' }}>
              <div style={{ marginBottom: '12px' }}>
                <span className="magazine-category-pill">{viewingPost.category || 'Diplomacy'}</span>
              </div>

              <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', lineHeight: '1.3', margin: '0 0 16px 0' }}>
                {viewingPost.title}
              </h1>

              {viewingPost.summary && (
                <p style={{ fontSize: '16.5px', color: '#475569', lineHeight: '1.6', marginBottom: '24px', fontStyle: 'italic', borderLeft: '3px solid #2563eb', paddingLeft: '14px' }}>
                  {viewingPost.summary}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', marginBottom: '28px', fontSize: '13px', color: '#64748b' }}>
                <span>✍️ Author: <strong>{viewingPost.author || 'YANF Editorial'}</strong></span>
                <span>•</span>
                <span>📅 Published: {new Date(viewingPost.createdAt || Date.now()).toLocaleDateString()}</span>
                <span>•</span>
                <span>⏱️ {viewingPost.readTime || '4 min read'}</span>
              </div>

              {viewingPost.coverImage?.url && (
                <div style={{ marginBottom: '28px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#0f172a', textAlign: 'center' }}>
                  <img 
                    src={viewingPost.coverImage.url} 
                    alt={viewingPost.coverImage.altText || viewingPost.title} 
                    style={{ width: '100%', maxHeight: '420px', objectFit: 'contain' }}
                  />
                  {viewingPost.coverImage.altText && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', padding: '6px', background: '#0f172a' }}>
                      {viewingPost.coverImage.altText}
                    </div>
                  )}
                </div>
              )}

              <div 
                className="magazine-body-text"
                style={{ padding: 0 }}
                dangerouslySetInnerHTML={{ __html: viewingPost.content || '' }}
              />

              {viewingPost.metaKeywords && (
                <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {viewingPost.metaKeywords.split(',').map((t, idx) => (
                    <span key={idx} style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>
                      #{t.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CENTERED DELETE CONFIRMATION MODAL CARD */}
      {postToDelete && (
        <div className="toast-modal-overlay" onClick={() => setPostToDelete(null)}>
          <div 
            className="centered-square-card" 
            style={{ width: '380px', height: 'auto', padding: '32px 28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button" 
              className="square-card-close-btn"
              onClick={() => setPostToDelete(null)}
              title="Cancel"
            >
              ✕
            </button>

            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }}>
              🗑️
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 8px 0' }}>
              Delete Post?
            </h3>

            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px 0', lineHeight: '1.5' }}>
              Are you sure you want to permanently delete "{postToDelete.title}"? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ flex: 1, background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}
                onClick={() => setPostToDelete(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ flex: 1, background: '#ef4444', color: '#ffffff' }}
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
