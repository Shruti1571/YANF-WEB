import React, { useState, useEffect, useRef } from 'react';
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
  mediaGallery, setMediaGallery,
  handleUploadCover, uploadingCover,
  handlePublishPost,
  submitLoading,
  wordCount, computedReadTime,
  setActiveTab,
  currentUser,
  editingPostId,
  setEditingPostId,
  handleNewPost
}) {
  const [editorMode, setEditorMode] = useState('write'); // 'write' | 'preview' | 'mobile'
  const [tagInputText, setTagInputText] = useState('');
  const [tags, setTags] = useState(() => {
    if (metaKeywords) {
      return metaKeywords.split(',').map(t => t.trim()).filter(Boolean);
    }
    return ['Diplomacy', 'Model UN', 'Geopolitics'];
  });

  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [vaultSearch, setVaultSearch] = useState('');
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const fileInputRef = useRef(null);

  // Sync tags to metaKeywords
  useEffect(() => {
    if (setMetaKeywords) {
      setMetaKeywords(tags.join(', '));
    }
  }, [tags, setMetaKeywords]);

  // Auto-slug generation on title change (only for fresh drafts)
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (!editingPostId && !isEditingSlug && setSlug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generated);
    }
  };

  const handleGenerateSlugFromTitle = () => {
    if (title && setSlug) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generated);
    }
  };

  // Add tag handler
  const handleAddTag = (tagToAdd) => {
    const clean = tagToAdd.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInputText('');
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInputText.trim()) {
        handleAddTag(tagInputText);
      }
    } else if (e.key === 'Backspace' && !tagInputText && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Direct cover file upload
  const handleFileDrop = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (handleUploadCover) {
      try {
        const res = await handleUploadCover(file);
        if (res && res.url) {
          setCoverPreviewUrl(res.url);
          setCoverDriveId(res.driveFileId || '');
          setCoverAltText(file.name.replace(/\.[^/.]+$/, ""));
        }
      } catch (err) {
        console.error("Cover upload error:", err);
      }
    } else {
      const localUrl = URL.createObjectURL(file);
      setCoverPreviewUrl(localUrl);
      setCoverAltText(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  // Insert image directly into editor content
  const insertMediaIntoEditor = (url, alt) => {
    const imgHtml = `<p><img src="${url}" alt="${alt || 'Article Graphic'}" style="max-width:100%; border-radius:10px; margin: 20px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.06);" /></p><p></p>`;
    setContent(prev => (prev || '') + imgHtml);
    setIsVaultModalOpen(false);
  };

  // Select image as cover from vault
  const selectImageAsCover = (item) => {
    const itemUrl = typeof item === 'string' ? item : (item.url || item.thumbnailUrl);
    const driveId = item.driveFileId || item.id || '';
    const alt = item.alt || item.altText || item.title || title;
    setCoverPreviewUrl(itemUrl);
    setCoverDriveId(driveId);
    setCoverAltText(alt);
    setIsVaultModalOpen(false);
  };

  // Copy full article link helper
  const handleCopySlugLink = () => {
    const fullUrl = `${window.location.origin}/#page-blogs/${slug || 'article-preview'}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Clear / Reset draft
  const handleResetDraft = () => {
    if (window.confirm('Are you sure you want to clear this draft? All unsaved text will be erased.')) {
      setTitle('');
      setSlug('');
      setSummary('');
      setContent('');
      setCoverPreviewUrl('');
      setCoverDriveId('');
      setCoverAltText('');
    }
  };

  // Quill config
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

  // Extract clean plain text for accurate live word & char counts
  const cleanBodyText = (content || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/gi, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const activeWordCount = cleanBodyText ? cleanBodyText.split(/\s+/).filter(Boolean).length : 0;
  const activeCharCount = cleanBodyText.length;
  const activeReadTime = `${Math.max(1, Math.ceil(activeWordCount / 200))} min read`;

  const hasTitle = (title || '').trim().length >= 5;
  const hasSummary = (summary || '').trim().length >= 20;
  const hasCover = Boolean(coverPreviewUrl);
  const hasWordCount = activeWordCount >= 100;
  const seoScore = [hasTitle, hasSummary, hasCover, hasWordCount].filter(Boolean).length * 25;

  const tagSuggestions = [
    'Diplomacy', 'Geopolitics', 'Model UN', 'Policy Brief', 
    'Global Economy', 'Youth Leaders', 'Public Speaking', 'Security Council'
  ];

  const filteredVaultItems = (mediaGallery || []).filter(item => {
    const itemTitle = (item.title || item.altText || item.alt || '').toLowerCase();
    return itemTitle.includes(vaultSearch.toLowerCase());
  });

  return (
    <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 1. TOP STUDIO ACTION HEADER */}
      <div className="studio-card" style={{ padding: '18px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', margin: 0, fontWeight: '700', color: '#0f172a' }}>
              {editingPostId ? 'Edit Article' : 'Blog Writing Studio'}
            </h2>
            {editingPostId ? (
              <span style={{ fontSize: '12px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></span>
                Editing Mode
              </span>
            ) : (
              <span style={{ fontSize: '12px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span>
                New Post
              </span>
            )}
          </div>
          <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            {editingPostId ? 'You are currently updating an existing published post in MongoDB Atlas.' : 'Draft authoritative policy briefs, MUN guides, and geopolitical commentary with full SEO optimization.'}
          </p>
        </div>

        {/* TOP ACTION CONTROLS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* VIEW SWITCHER */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => setEditorMode('write')}
              style={{
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '6px',
                background: editorMode === 'write' ? '#ffffff' : 'transparent',
                color: editorMode === 'write' ? '#2563eb' : '#64748b',
                boxShadow: editorMode === 'write' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer'
              }}
            >
              ✏️ Editor
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('preview')}
              style={{
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '6px',
                background: editorMode === 'preview' ? '#ffffff' : 'transparent',
                color: editorMode === 'preview' ? '#2563eb' : '#64748b',
                boxShadow: editorMode === 'preview' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer'
              }}
            >
              💻 Reader Preview
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('mobile')}
              style={{
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '6px',
                background: editorMode === 'mobile' ? '#ffffff' : 'transparent',
                color: editorMode === 'mobile' ? '#2563eb' : '#64748b',
                boxShadow: editorMode === 'mobile' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer'
              }}
            >
              📱 Mobile
            </button>
          </div>

          {editingPostId ? (
            <button
              type="button"
              onClick={handleNewPost}
              className="btn-primary"
              style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', padding: '8px 14px', fontSize: '13px', fontWeight: '600' }}
            >
              + Create New Post
            </button>
          ) : (
            <button
              type="button"
              onClick={handleResetDraft}
              className="btn-primary"
              style={{ background: '#ffffff', color: '#64748b', border: '1px solid #cbd5e1', padding: '8px 14px', fontSize: '13px' }}
              title="Clear text"
            >
              Clear Draft
            </button>
          )}

          <button
            type="button"
            onClick={(e) => handlePublishPost(e, 'draft')}
            disabled={submitLoading}
            className="btn-primary"
            style={{
              background: '#f8fafc',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            💾 Save as Draft
          </button>

          <button
            type="button"
            onClick={(e) => handlePublishPost(e, 'published')}
            disabled={submitLoading}
            className="btn-primary"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: '600',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
          >
            {submitLoading 
              ? (editingPostId ? 'Updating...' : 'Publishing...') 
              : (editingPostId ? '🚀 Save & Publish Live' : '🚀 Publish Live')}
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE */}
      {editorMode === 'write' ? (
        /* TWO-COLUMN STUDIO WORKSPACE */
        <div className="studio-workspace-grid">
          
          {/* LEFT COLUMN: WRITING CANVAS */}
          <div className="editor-main-canvas">
            
            {/* ARTICLE TITLE */}
            <div className="headline-input-wrapper">
              <label className="studio-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>
                Article Headline *
              </label>
              <input
                type="text"
                className="headline-input"
                value={title}
                onChange={handleTitleChange}
                placeholder="Enter a compelling article title..."
                required
              />

              {/* URL SLUG PREVIEW & EDIT BAR */}
              <div style={{ marginTop: '10px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#334155' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>🔗 Article Permalink / Slug:</span>
                    <span style={{ color: '#64748b', fontFamily: 'monospace' }}>yanfglobal.com/#page-blogs/</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={handleGenerateSlugFromTitle}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 10px', fontSize: '11.5px', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
                      title="Auto-generate slug from article title"
                    >
                      🔄 Auto-Generate
                    </button>
                    <button
                      type="button"
                      onClick={handleCopySlugLink}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 10px', fontSize: '11.5px', color: '#334155', cursor: 'pointer', fontWeight: 500 }}
                    >
                      {copiedLink ? '✓ Copied' : '🔗 Copy Link'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug && setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g. model-united-nations-strategy-guide"
                    style={{
                      flex: 1,
                      padding: '7px 12px',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      color: '#0f172a',
                      background: '#ffffff',
                      border: '1px solid #94a3b8',
                      borderRadius: '6px',
                      outline: 'none',
                      fontWeight: 600
                    }}
                  />
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  You can freely edit and customize this URL slug anytime. Only lowercase letters, numbers, and hyphens are accepted.
                </div>
              </div>
            </div>

            {/* SUBHEADING / SUMMARY */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="studio-label" style={{ margin: 0 }}>Subheading / Excerpt (Lead Paragraph) *</label>
                <span style={{ fontSize: '11.5px', color: summary.length > 160 ? '#b91c1c' : '#64748b' }}>
                  {summary.length} / 160 characters recommended
                </span>
              </div>
              <textarea
                className="excerpt-textarea"
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="A compelling 2-sentence executive summary displayed in cards, hero banners, and search engines..."
                required
              />
            </div>

            {/* INTERACTIVE TAG CHIPS SYSTEM */}
            <div style={{ marginBottom: '28px' }}>
              <label className="studio-label">Article Tags & Topics</label>
              <div className="tag-chips-wrapper">
                {tags.map((t, idx) => (
                  <span key={idx} className="tag-chip">
                    #{t}
                    <button type="button" className="tag-chip-remove" onClick={() => handleRemoveTag(t)}>✕</button>
                  </span>
                ))}
                <input
                  type="text"
                  className="tag-inline-input"
                  value={tagInputText}
                  onChange={(e) => setTagInputText(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Type tag and press Enter..."
                />
              </div>

              {/* Tag Quick Suggestions */}
              <div className="tag-suggestions-row">
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Suggestions:</span>
                {tagSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="tag-suggestion-pill"
                    onClick={() => handleAddTag(s)}
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* ARTICLE CONTENT WYSIWYG EDITOR */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="studio-label" style={{ margin: 0, fontWeight: '600' }}>
                  Article Body Content *
                </label>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setIsVaultModalOpen(true)}
                    style={{
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    🖼️ Insert Media from Vault
                  </button>
                </div>
              </div>

              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                placeholder="Begin drafting your policy brief or analysis with rich headings, blockquotes, bullet points, and illustrations..."
              />

              {/* STATS BAR FOOTER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderTop: 'none', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', fontSize: '12px', color: '#64748b' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span>📊 <strong>{activeWordCount}</strong> words</span>
                  <span>🔤 <strong>{activeCharCount}</strong> characters</span>
                  <span>⏱️ <strong>{activeReadTime}</strong></span>
                </div>
                <span>⚡ Draft active in session</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: INSPECTOR & PUBLISHING SIDEBAR */}
          <div className="editor-inspector-col">
            
            {/* 1. PUBLISH STATUS & ACTIONS CARD */}
            <div className="inspector-card">
              <div className="inspector-card-header">
                <h3>🚀 Publishing Status</h3>
                <span className="badge published" style={{ fontSize: '11px' }}>Live Ready</span>
              </div>

              <div style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Author:</span>
                  <strong>@{currentUser?.username || author || 'YANF Editorial'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Category:</span>
                  <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                    {category}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Visibility:</span>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>Public Global</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={submitLoading}
                  onClick={(e) => handlePublishPost(e, 'published')}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  {submitLoading 
                    ? (editingPostId ? 'Updating...' : 'Publishing...') 
                    : (editingPostId ? '🚀 Save & Publish Live' : '🚀 Publish Article Now')}
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  disabled={submitLoading}
                  onClick={(e) => handlePublishPost(e, 'draft')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: '#f8fafc',
                    color: '#334155',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  💾 Save as Draft
                </button>
              </div>
            </div>

            {/* 2. FEATURED COVER IMAGE CARD */}
            <div className="inspector-card">
              <div className="inspector-card-header">
                <h3>🖼️ Featured Cover</h3>
                {coverPreviewUrl && (
                  <button
                    type="button"
                    onClick={() => { setCoverPreviewUrl(''); setCoverDriveId(''); }}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                )}
              </div>

              {coverPreviewUrl ? (
                <div className="cover-preview-box">
                  <img src={coverPreviewUrl} alt={coverAltText || 'Cover preview'} />
                  <div className="cover-actions-overlay">
                    <button
                      type="button"
                      className="cover-action-btn"
                      onClick={() => setIsVaultModalOpen(true)}
                    >
                      Replace
                    </button>
                  </div>
                  <div style={{ padding: '10px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      className="studio-input"
                      value={coverAltText}
                      onChange={(e) => setCoverAltText(e.target.value)}
                      placeholder="Alt text description for SEO..."
                      style={{ fontSize: '12px', padding: '6px 10px' }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div 
                    className="cover-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                      {uploadingCover ? 'Uploading to Drive...' : 'Upload Featured Image'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Click to browse from your device
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileDrop}
                  />

                  <button
                    type="button"
                    onClick={() => setIsVaultModalOpen(true)}
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      background: '#ffffff',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    📁 Browse Media Vault ({mediaGallery?.length || 0})
                  </button>
                </div>
              )}
            </div>

            {/* 3. TAXONOMY & AUTHOR CARD */}
            <div className="inspector-card">
              <div className="inspector-card-header">
                <h3>🏷️ Classification</h3>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="studio-label">Category</label>
                <select
                  className="studio-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Diplomacy">🏛️ Diplomacy</option>
                  <option value="Debates">🎙️ Debates</option>
                  <option value="Civics">⚖️ Civics</option>
                  <option value="Entrepreneurship">🚀 Entrepreneurship</option>
                  <option value="Geopolitics">🌍 Geopolitics</option>
                </select>
              </div>

              <div style={{ marginBottom: '4px' }}>
                <label className="studio-label">Author Byline</label>
                <input
                  type="text"
                  className="studio-input"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="YANF Editorial"
                />
              </div>
            </div>

            {/* 4. GOOGLE SERP SIMULATOR & SEO INSPECTOR */}
            <div className="inspector-card">
              <div className="inspector-card-header">
                <h3>🔍 Google SERP Preview</h3>
                <span style={{ fontSize: '11px', fontWeight: '700', color: seoScore === 100 ? '#16a34a' : '#d97706' }}>
                  {seoScore}% SEO
                </span>
              </div>

              {/* GOOGLE SIMULATION CARD */}
              <div className="google-serp-preview" style={{ marginBottom: '16px' }}>
                <div className="serp-site-info">
                  <div className="serp-favicon">Y</div>
                  <div>
                    <div className="serp-domain-text">YANF Global</div>
                    <div className="serp-breadcrumb">https://yanfglobal.com › blog › {slug || 'article'}</div>
                  </div>
                </div>

                <div className="serp-title-link">
                  {title ? `${title} — YANF` : 'Untitled Policy Brief — YANF Global'}
                </div>

                <p className="serp-snippet-desc">
                  {summary || 'Read authoritative analysis, youth diplomatic perspectives, and global governance commentary published by YANF Editorial.'}
                </p>
              </div>

              {/* SEO CHECKLIST */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasTitle ? '#16a34a' : '#94a3b8' }}>
                  <span>{hasTitle ? '✓' : '○'}</span>
                  <span>Headline is clear & catchy</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasSummary ? '#16a34a' : '#94a3b8' }}>
                  <span>{hasSummary ? '✓' : '○'}</span>
                  <span>Executive excerpt provided</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasCover ? '#16a34a' : '#94a3b8' }}>
                  <span>{hasCover ? '✓' : '○'}</span>
                  <span>Featured cover image selected</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasWordCount ? '#16a34a' : '#94a3b8' }}>
                  <span>{hasWordCount ? '✓' : '○'}</span>
                  <span>Substantial body content (&gt;100 words)</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* 3. MAGAZINE-GRADE READER PREVIEW (DESKTOP OR MOBILE) */
        <div style={{ width: '100%', padding: '16px 0 48px 0', display: 'flex', justifyContent: 'center' }}>
          
          <div 
            className="magazine-preview-outer" 
            style={{ 
              width: '100%',
              maxWidth: editorMode === 'mobile' ? '420px' : '880px', 
              border: editorMode === 'mobile' ? '12px solid #0f172a' : '1px solid #e2e8f0', 
              borderRadius: editorMode === 'mobile' ? '36px' : '20px',
              boxSizing: 'border-box'
            }}
          >
            
            {/* HERO HEADER */}
            <div className="magazine-preview-header" style={{ padding: editorMode === 'mobile' ? '24px 20px' : '44px 56px 24px 56px' }}>
              <span className="magazine-category-pill">
                {category || 'Diplomacy'}
              </span>

              <h1 className="magazine-title" style={{ fontSize: editorMode === 'mobile' ? '24px' : '36px' }}>
                {title || 'Untitled Article'}
              </h1>

              {summary && (
                <p className="magazine-subtitle" style={{ fontSize: editorMode === 'mobile' ? '15px' : '18px' }}>
                  {summary}
                </p>
              )}

              <div className="magazine-author-bar">
                <div className="magazine-author-avatar">
                  {author ? author[0].toUpperCase() : 'Y'}
                </div>
                <div className="magazine-author-info">
                  <span className="magazine-author-name">{author || 'YANF Editorial'}</span>
                  <span className="magazine-meta-text">Published Today • {activeReadTime} ({activeWordCount} words)</span>
                </div>
              </div>
            </div>

            {/* FEATURED COVER */}
            {coverPreviewUrl && (
              <div className="magazine-featured-media">
                <img src={coverPreviewUrl} alt={coverAltText || title} />
                {coverAltText && (
                  <div style={{ position: 'absolute', bottom: 0, inset: 'auto 0 0 0', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '12px', padding: '6px 16px', backdropFilter: 'blur(4px)' }}>
                    📷 {coverAltText}
                  </div>
                )}
              </div>
            )}

            {/* BODY CONTENT */}
            <div 
              className="magazine-body-text" 
              style={{ padding: editorMode === 'mobile' ? '24px 20px' : '44px 56px' }}
              dangerouslySetInnerHTML={{ __html: content || '<p style="color:#94a3b8; font-style:italic;">No article content written yet. Switch to Editor mode to start drafting!</p>' }}
            />

            {/* TAGS FOOTER */}
            {tags.length > 0 && (
              <div style={{ padding: editorMode === 'mobile' ? '16px 20px' : '20px 56px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {tags.map((tag, idx) => (
                  <span key={idx} style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 500 }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* FOOTER ACTIONS */}
            <div className="magazine-footer-bar" style={{ padding: editorMode === 'mobile' ? '16px 20px' : '24px 56px', display: 'flex', gap: '12px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1' }}
                onClick={() => setEditorMode('write')}
              >
                ✏️ Back to Editor
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={submitLoading}
                  onClick={(e) => handlePublishPost(e, 'draft')}
                  style={{ background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1' }}
                >
                  💾 Save as Draft
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  disabled={submitLoading}
                  onClick={(e) => handlePublishPost(e, 'published')}
                >
                  {submitLoading 
                    ? (editingPostId ? 'Updating...' : 'Publishing...') 
                    : (editingPostId ? '🚀 Save & Publish Live' : '🚀 Publish Live Now')}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. INTERACTIVE MEDIA VAULT PICKER MODAL */}
      {isVaultModalOpen && (
        <div className="vault-picker-modal" onClick={() => setIsVaultModalOpen(false)}>
          <div className="vault-picker-content" onClick={(e) => e.stopPropagation()}>
            
            {/* MODAL HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Media Vault Asset Selector</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Choose an asset to insert into your article or set as the featured cover.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsVaultModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* SEARCH & FILTER */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
              <input
                type="text"
                placeholder="Search media assets..."
                value={vaultSearch}
                onChange={(e) => setVaultSearch(e.target.value)}
                className="studio-input"
                style={{ fontSize: '13px', padding: '8px 12px' }}
              />
            </div>

            {/* GRID OF IMAGES */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: '55vh', flex: 1 }}>
              {filteredVaultItems.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                  {filteredVaultItems.map((item, idx) => {
                    const itemUrl = typeof item === 'string' ? item : (item.url || item.thumbnailUrl);
                    const itemTitle = item.title || item.altText || item.alt || `Media #${idx + 1}`;

                    return (
                      <div
                        key={idx}
                        style={{
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          overflow: 'hidden',
                          background: '#f8fafc',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <div style={{ height: '120px', backgroundImage: `url(${itemUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                        <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '8px' }}>
                            {itemTitle}
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => selectImageAsCover(item)}
                              style={{ flex: 1, padding: '4px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Set Cover
                            </button>
                            <button
                              type="button"
                              onClick={() => insertMediaIntoEditor(itemUrl, itemTitle)}
                              style={{ flex: 1, padding: '4px', background: '#f0fdf4', color: '#166534', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              + In Body
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <p style={{ margin: '0 0 12px 0' }}>No assets found matching your search.</p>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1' }}
                onClick={() => setIsVaultModalOpen(false)}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
