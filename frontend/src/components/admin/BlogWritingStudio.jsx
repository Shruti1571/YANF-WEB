import React, { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function BlogWritingStudio({
  title, setTitle,
  slug, setSlug,
  category, setCategory,
  author, setAuthor,
  summary, setSummary,
  content, setContent,
  metaTitle, setMetaTitle,
  metaDescription, setMetaDescription,
  metaKeywords, setMetaKeywords,
  coverPreviewUrl, setCoverPreviewUrl,
  coverDriveId, setCoverDriveId,
  coverAltText, setCoverAltText,
  mediaGallery,
  handlePublishPost,
  submitLoading,
  wordCount, computedReadTime
}) {
  const [editorMode, setEditorMode] = useState('write'); // 'write' | 'preview'
  const [tagsInput, setTagsInput] = useState(metaKeywords || 'Diplomacy, Geopolitics, Model UN');

  // Quill Toolbar Modules Configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'align',
    'link', 'image'
  ];

  // Auto-generate URL Slug from Title
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (setSlug) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  };

  const insertMediaFromVault = (url, alt) => {
    const imgHtml = `<img src="${url}" alt="${alt || 'Article Image'}" style="max-width: 100%; border-radius: 8px; margin: 16px 0;" />`;
    setContent(prev => (prev || '') + '\n' + imgHtml + '\n');
  };

  return (
    <div style={{ width: '100%' }}>
      <div className="studio-card" style={{ padding: '32px' }}>
        
        {/* SECTION HEADER WITH TOP RIGHT PREVIEW TOGGLE BUTTON */}
        <div className="studio-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontSize: '22px', margin: '0 0 4px 0' }}>Blog Writing Studio</h2>
            <p style={{ margin: 0, color: '#64748b' }}>Draft authoritative policy briefs, MUN strategy guides, and geopolitical commentary.</p>
          </div>

          {/* TOP RIGHT PREVIEW TOGGLE */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => setEditorMode('write')}
              style={{
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '6px',
                background: editorMode === 'write' ? '#ffffff' : 'transparent',
                color: editorMode === 'write' ? '#2563eb' : '#64748b',
                boxShadow: editorMode === 'write' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              ✏️ Editor
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('preview')}
              style={{
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '6px',
                background: editorMode === 'preview' ? '#ffffff' : 'transparent',
                color: editorMode === 'preview' ? '#2563eb' : '#64748b',
                boxShadow: editorMode === 'preview' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              👁️ Preview Article
            </button>
          </div>
        </div>

        {editorMode === 'preview' ? (
          /* FULL ARTICLE READER PREVIEW MODE */
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '36px', maxWidth: '840px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
              <span className="badge published" style={{ fontSize: '12px', background: '#e0e7ff', color: '#4f46e5' }}>
                {category || 'Diplomacy'}
              </span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                • By <strong>{author || 'YANF Editorial'}</strong> • {computedReadTime} ({wordCount} words)
              </span>
            </div>

            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a', lineHeight: '1.3', margin: '0 0 16px 0' }}>
              {title || 'Untitled Article'}
            </h1>

            {summary && (
              <p style={{ fontSize: '17px', color: '#475569', lineHeight: '1.6', fontWeight: '400', marginBottom: '24px', fontStyle: 'italic', borderLeft: '3px solid #2563eb', paddingLeft: '14px' }}>
                {summary}
              </p>
            )}

            {coverPreviewUrl && (
              <div style={{ marginBottom: '28px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <img src={coverPreviewUrl} alt={coverAltText || title} style={{ width: '100%', maxHeight: '420px', objectFit: 'cover' }} />
                {coverAltText && <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '8px', background: '#f8fafc' }}>{coverAltText}</div>}
              </div>
            )}

            <div 
              style={{ fontSize: '16px', lineHeight: '1.8', color: '#1e293b', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}
              dangerouslySetInnerHTML={{ __html: content || '<p style="color:#94a3b8; font-style:italic;">No article content written yet. Switch to Editor mode to start drafting!</p>' }}
            />

            {tagsInput && (
              <div style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Tags:</span>
                {tagsInput.split(',').map((tag, idx) => (
                  <span key={idx} style={{ background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            )}

            <div style={{ marginTop: '36px', display: 'flex', gap: '16px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}
                onClick={() => setEditorMode('write')}
              >
                ✏️ Back to Editor
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                disabled={submitLoading}
                onClick={handlePublishPost}
              >
                {submitLoading ? 'Publishing...' : 'Publish Article Live'}
              </button>
            </div>
          </div>
        ) : (
          /* FORM & EDITOR MODE */
          <form onSubmit={(e) => {
            if (setMetaKeywords) setMetaKeywords(tagsInput);
            handlePublishPost(e);
          }}>

            {/* 1. HEADING / TITLE */}
            <div style={{ marginBottom: '24px' }}>
              <label className="studio-label" style={{ fontSize: '14px', fontWeight: '600' }}>Article Heading / Title *</label>
              <input
                type="text"
                className="studio-input"
                value={title}
                onChange={handleTitleChange}
                placeholder="Enter a compelling article title..."
                required
                style={{ fontSize: '16px', fontWeight: '500', padding: '12px 16px' }}
              />
              {slug && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: '600', color: '#475569' }}>URL Slug:</span> 
                  <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', color: '#2563eb' }}>/blog/{slug}</code>
                </div>
              )}
            </div>

            {/* 2. SUBHEADING / SUMMARY */}
            <div style={{ marginBottom: '24px' }}>
              <label className="studio-label" style={{ fontSize: '14px', fontWeight: '600' }}>Subheading / Excerpt *</label>
              <textarea
                className="studio-textarea"
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief subheading or 2-line summary overview for article preview cards and Google search results..."
                required
              />
            </div>

            {/* 3. TAGS & METADATA ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '20px', marginBottom: '28px' }}>
              <div>
                <label className="studio-label">Article Tags (Comma separated)</label>
                <input
                  type="text"
                  className="studio-input"
                  value={tagsInput}
                  onChange={(e) => {
                    setTagsInput(e.target.value);
                    if (setMetaKeywords) setMetaKeywords(e.target.value);
                  }}
                  placeholder="e.g. Model UN, Geopolitics, Diplomacy, Strategy"
                />
              </div>

              <div>
                <label className="studio-label">Category</label>
                <select
                  className="studio-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Diplomacy">Diplomacy</option>
                  <option value="Debates">Debates</option>
                  <option value="Civics">Civics</option>
                  <option value="Entrepreneurship">Entrepreneurship</option>
                  <option value="Geopolitics">Geopolitics</option>
                </select>
              </div>

              <div>
                <label className="studio-label">Author</label>
                <input
                  type="text"
                  className="studio-input"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="YANF Editorial"
                />
              </div>
            </div>

            {/* 4. FEATURED COVER IMAGE */}
            <div className="studio-media-selector" style={{ marginBottom: '32px' }}>
              <label className="studio-label" style={{ color: '#0f172a', fontSize: '14px', fontWeight: '600' }}>
                Featured Cover Image
              </label>

              {mediaGallery.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#64748b', margin: '6px 0 0 0' }}>
                  No media uploaded yet. Switch to the <strong>Media Vault</strong> tab to upload images to Google Drive.
                </p>
              ) : (
                <select
                  className="studio-select"
                  value={coverPreviewUrl || ''}
                  onChange={(e) => {
                    const selected = mediaGallery.find(item => item.url === e.target.value);
                    if (selected) {
                      setCoverPreviewUrl(selected.url);
                      setCoverDriveId(selected.driveFileId);
                      setCoverAltText(selected.altText || selected.title || title);
                    } else {
                      setCoverPreviewUrl('');
                      setCoverDriveId('');
                    }
                  }}
                >
                  <option value="">-- Choose image from Media Vault --</option>
                  {mediaGallery.map((item, idx) => (
                    <option key={idx} value={item.url}>{item.title || item.altText || `Image ${idx + 1}`}</option>
                  ))}
                </select>
              )}

              {coverPreviewUrl && (
                <div style={{ marginTop: '16px', display: 'flex', gap: '16px', alignItems: 'center', background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <img src={coverPreviewUrl} alt="Cover Preview" style={{ width: '130px', height: '75px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: '#166534', marginBottom: '6px', fontWeight: 600 }}>✓ Featured Cover Selected</div>
                    <input
                      type="text"
                      className="studio-input"
                      value={coverAltText}
                      onChange={(e) => setCoverAltText(e.target.value)}
                      placeholder="Alt text for SEO search engines..."
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 5. ARTICLE BODY CONTENT (WYSIWYG REACT-QUILL EDITOR) */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label className="studio-label" style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                  Article Body Content (WYSIWYG Rich Text Editor) *
                </label>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    {wordCount} words ({computedReadTime})
                  </span>

                  {/* Media Vault Inserter Shortcut */}
                  {mediaGallery.length > 0 && (
                    <select 
                      className="studio-select" 
                      style={{ width: 'auto', padding: '4px 10px', fontSize: '12px' }}
                      onChange={(e) => {
                        if (e.target.value) {
                          const item = mediaGallery.find(m => m.url === e.target.value);
                          insertMediaFromVault(e.target.value, item?.title || item?.alt);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">🖼️ Insert Image from Vault</option>
                      {mediaGallery.map((m, idx) => (
                        <option key={idx} value={m.url}>{m.title || `Media Asset #${idx + 1}`}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <ReactQuill 
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                placeholder="Write your article body content here with rich formatting, headings, quotes, and images..."
              />
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="btn-primary"
              disabled={submitLoading}
              style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: '600' }}
            >
              {submitLoading ? 'Publishing Article...' : 'Publish Article Live'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
