import React, { useState } from 'react';

export default function ArticleLibraryStudio({
  publishedBlogs,
  loadingBlogs,
  loadBlogs,
  handleDeletePost
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredBlogs = publishedBlogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          blog.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || blog.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="studio-card">
        <div className="studio-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2>📚 Article Library ({publishedBlogs.length})</h2>
            <p>Manage all published articles saved in MongoDB Atlas.</p>
          </div>
          <button
            type="button"
            className="btn"
            onClick={loadBlogs}
            style={{ padding: '8px 16px', fontSize: '11px' }}
          >
            ↻ Refresh Library
          </button>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search articles by title or keyword..."
            style={{ flex: 1, minWidth: '240px', padding: '12px 18px', background: 'rgba(6,13,20,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.9rem', borderRadius: '12px' }}
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '12px 18px', background: 'rgba(6,13,20,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.9rem', borderRadius: '12px' }}
          >
            <option value="All">All Categories</option>
            <option value="Diplomacy">Diplomacy</option>
            <option value="Debates">Debates</option>
            <option value="Civics">Civics</option>
            <option value="Entrepreneurship">Entrepreneurship</option>
            <option value="Geopolitics">Geopolitics</option>
          </select>
        </div>

        {/* ARTICLES TABLE GRID */}
        {loadingBlogs ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-dim)' }}>Loading published articles...</div>
        ) : filteredBlogs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(6,13,20,0.5)', borderRadius: '16px', border: '1px dashed var(--line)' }}>
            <p style={{ color: 'var(--ink-dim)' }}>No published articles match your criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredBlogs.map(blog => (
              <div key={blog._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', background: 'rgba(6,13,20,0.85)', border: '1px solid var(--line)', borderRadius: '14px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--ice)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    {blog.category}
                  </span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--ink)', margin: '4px 0' }}>
                    {blog.title}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-dim)' }}>
                    Published on {new Date(blog.createdAt).toLocaleDateString()} &bull; Author: {blog.author || 'YANF Editorial'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleDeletePost(blog._id)}
                    style={{ padding: '8px 16px', background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', color: '#ff8888', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem' }}
                  >
                    Delete Article
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
