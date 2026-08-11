import React, { useState } from 'react';

export default function PostsListStudio({ publishedBlogs, loadingBlogs, loadBlogs, handleDeletePost, setActiveTab }) {
  const [postToDelete, setPostToDelete] = useState(null);

  const confirmDelete = () => {
    if (postToDelete && handleDeletePost) {
      handleDeletePost(postToDelete._id);
    }
    setPostToDelete(null);
  };

  return (
    <div className="posts-list-studio">
      <div className="studio-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Posts List</h2>
          <p>Manage your content inventory.</p>
        </div>
        <button className="btn-primary" onClick={() => setActiveTab('editor')}>+ Add New</button>
      </div>

      <div className="studio-card" style={{ padding: '0' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select className="studio-select" style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}>
              <option>Bulk actions</option>
              <option>Delete</option>
            </select>
            <button className="btn-primary" style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}>Apply</button>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
             <span style={{ fontSize: '13px', color: '#64748b' }}>{publishedBlogs?.length || 0} items</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px', paddingLeft: '24px' }}>
                  <input type="checkbox" />
                </th>
                <th>Title</th>
                <th>Author</th>
                <th>Categories</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ width: '60px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingBlogs ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>Loading posts...</td>
                </tr>
              ) : publishedBlogs && publishedBlogs.length > 0 ? (
                publishedBlogs.map((blog) => (
                  <tr key={blog._id}>
                    <td style={{ paddingLeft: '24px' }}>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{blog.title}</div>
                    </td>
                    <td>{blog.author}</td>
                    <td>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{blog.category || 'Uncategorized'}</span>
                    </td>
                    <td>{new Date(blog.publishedAt || Date.now()).toLocaleDateString()}</td>
                    <td>
                      <span className="badge published">Published</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => setPostToDelete(blog)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No posts found. Create your first post!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Showing {publishedBlogs?.length || 0} of {publishedBlogs?.length || 0} entries</span>
        </div>
      </div>

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
              Are you sure you want to delete "{postToDelete.title}"? This action cannot be undone.
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
