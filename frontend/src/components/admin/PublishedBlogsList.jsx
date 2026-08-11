import React from 'react';

export default function PublishedBlogsList({ publishedBlogs, loadingBlogs, loadBlogs, handleDeletePost }) {
  return (
    <div style={{ background: 'rgba(8,17,26,0.92)', border: '1px solid var(--line)', padding: '24px', borderRadius: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ice)' }}>
          Published MongoDB Articles ({publishedBlogs.length})
        </span>
        <button type="button" onClick={loadBlogs} style={{ background: 'none', border: 'none', color: 'var(--ice)', fontSize: '0.8rem', cursor: 'pointer' }}>↻ Refresh</button>
      </div>

      {loadingBlogs ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-dim)' }}>Loading published articles...</p>
      ) : publishedBlogs.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-dim)' }}>No articles published yet.</p>
      ) : (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {publishedBlogs.map(blog => (
            <div key={blog._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div>
                <div style={{ fontSize: '0.88rem', color: 'var(--ink)', fontWeight: 500 }}>{blog.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-dim)' }}>{blog.category} &bull; {new Date(blog.createdAt).toLocaleDateString()}</div>
              </div>
              <button
                type="button"
                onClick={() => handleDeletePost(blog._id)}
                style={{ background: 'none', border: 'none', color: '#ff8888', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
