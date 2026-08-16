import React from 'react';

export default function ArticleCreationForm({
  title, setTitle,
  slug, setSlug,
  category, setCategory,
  author, setAuthor,
  summary, setSummary,
  content, setContent,
  metaTitle, setMetaTitle,
  metaDescription, setMetaDescription,
  metaKeywords, setMetaKeywords,
  coverPreviewUrl, coverDriveId,
  coverTitle, setCoverTitle,
  coverAltText, setCoverAltText,
  coverCaption, setCoverCaption,
  coverDescription, setCoverDescription,
  uploadingCover, handleUploadCover,
  handleInsertMediaClick,
  insertFormatting,
  textareaRef,
  handlePublishPost,
  submitLoading,
  wordCount, computedReadTime
}) {
  return (
    <div className="studio-card">
      <div className="studio-section-header">
        <h2>Article Creation Pane</h2>
        <p>Compose and publish articles directly to MongoDB.</p>
      </div>

      <form onSubmit={handlePublishPost}>
        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          <label className="studio-label">Article Title *</label>
          <input
            type="text"
            className="studio-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How to Master Geopolitical Negotiation in Model UN"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label className="studio-label">URL Slug</label>
            <input
              type="text"
              className="studio-input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="master-mun-diplomacy"
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
            <label className="studio-label">Author Name</label>
            <input
              type="text"
              className="studio-input"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="YANF Editorial"
            />
          </div>
        </div>

        {/* FEATURED COVER IMAGE UPLOADER */}
        <div className="studio-media-selector">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label className="studio-label" style={{ margin: 0 }}>Featured Cover Image (Google Drive API)</label>
            {uploadingCover && <span style={{ color: '#2563eb', fontSize: '12px' }}>Uploading to GDrive...</span>}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleUploadCover}
            style={{ marginBottom: '16px', fontSize: '13px' }}
          />

          {coverPreviewUrl && (
            <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <img src={coverPreviewUrl} alt="Cover Preview" style={{ width: '120px', height: '70px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <span style={{ fontSize: '12px', color: '#166534' }}>✓ Uploaded to Drive Folder ID: {coverDriveId}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="studio-label" style={{ fontSize: '11px' }}>Media Title</label>
              <input type="text" className="studio-input" value={coverTitle} onChange={(e) => setCoverTitle(e.target.value)} placeholder="e.g. UNSC Chamber Session" style={{ padding: '8px 12px', fontSize: '13px' }} />
            </div>
            <div>
              <label className="studio-label" style={{ fontSize: '11px' }}>Alt Text (Required for SEO) *</label>
              <input type="text" className="studio-input" value={coverAltText} onChange={(e) => setCoverAltText(e.target.value)} placeholder="e.g. Delegates seated in UN" style={{ padding: '8px 12px', fontSize: '13px' }} />
            </div>
            <div>
              <label className="studio-label" style={{ fontSize: '11px' }}>Caption</label>
              <input type="text" className="studio-input" value={coverCaption} onChange={(e) => setCoverCaption(e.target.value)} placeholder="e.g. Delegates during session" style={{ padding: '8px 12px', fontSize: '13px' }} />
            </div>
            <div>
              <label className="studio-label" style={{ fontSize: '11px' }}>Description</label>
              <input type="text" className="studio-input" value={coverDescription} onChange={(e) => setCoverDescription(e.target.value)} placeholder="e.g. High resolution photo" style={{ padding: '8px 12px', fontSize: '13px' }} />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div style={{ marginBottom: '20px' }}>
          <label className="studio-label">Summary / Excerpt *</label>
          <textarea
            rows={2}
            className="studio-textarea"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief 2-line overview of the article for blog cards and Google SERP snippets..."
            required
          />
        </div>

        {/* FORMATTING TOOLBAR & BODY CONTENT */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="studio-label" style={{ margin: 0 }}>Article Content *</label>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {wordCount} words ({computedReadTime})
            </span>
          </div>

          {/* Toolbar Buttons */}
          <div className="studio-toolbar">
            <button type="button" onClick={() => insertFormatting('<b>', '</b>')} className="studio-toolbar-btn"><b>B</b></button>
            <button type="button" onClick={() => insertFormatting('<i>', '</i>')} className="studio-toolbar-btn"><i>I</i></button>
            <button type="button" onClick={() => insertFormatting('<h2>', '</h2>')} className="studio-toolbar-btn">H2</button>
            <button type="button" onClick={() => insertFormatting('<h3>', '</h3>')} className="studio-toolbar-btn">H3</button>
            <button type="button" onClick={() => insertFormatting('<blockquote>', '</blockquote>')} className="studio-toolbar-btn">Quote</button>
            <button type="button" onClick={() => insertFormatting('<ul>\n  <li>', '</li>\n</ul>')} className="studio-toolbar-btn">List</button>
            <button type="button" onClick={() => insertFormatting('<a href="https://">', '</a>')} className="studio-toolbar-btn">Link</button>
            <button type="button" onClick={handleInsertMediaClick} className="studio-toolbar-btn" style={{ background: '#e0e7ff', color: '#4f46e5', borderColor: '#c7d2fe' }}>📷 Insert In-Body Media</button>
          </div>

          <textarea
            ref={textareaRef}
            rows={12}
            className="studio-textarea rich-text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your article body content here..."
            required
          />
        </div>

        {/* Meta tags for SEO */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          <div className="studio-label" style={{ marginBottom: '12px', color: '#0f172a' }}>
            SEO &amp; OpenGraph Settings
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="studio-label" style={{ fontSize: '11px' }}>Meta Title</label>
              <input type="text" className="studio-input" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} style={{ padding: '8px 12px', fontSize: '13px' }} />
            </div>
            <div>
              <label className="studio-label" style={{ fontSize: '11px' }}>Focus Keywords</label>
              <input type="text" className="studio-input" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} placeholder="MUN, Diplomacy, Debate" style={{ padding: '8px 12px', fontSize: '13px' }} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="studio-label" style={{ fontSize: '11px' }}>Meta Description (Google Snippet)</label>
              <input type="text" className="studio-input" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} style={{ padding: '8px 12px', fontSize: '13px' }} />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={submitLoading}
          style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '600' }}
        >
          {submitLoading ? 'Publishing to MongoDB...' : 'Publish Article Live'}
        </button>
      </form>
    </div>
  );
}
