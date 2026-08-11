import React, { useRef } from 'react';

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
  const textareaRef = useRef(null);

  const insertFormatting = (syntaxStart, syntaxEnd = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = syntaxStart + selectedText + syntaxEnd;
    setContent(content.substring(0, start) + replacement + content.substring(end));
    textarea.focus();
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', width: '100%' }}>
      {/* ARTICLE EDITOR CARD */}
      <div className="studio-card">
        <div className="studio-section-header">
          <h2>✍️ Blog Writing Studio</h2>
          <p>Draft authoritative policy briefs, MUN strategy guides, and geopolitical commentary.</p>
        </div>

        <form onSubmit={handlePublishPost}>
          {/* Article Title */}
          <div style={{ marginBottom: '24px' }}>
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

          {/* Metadata Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '28px' }}>
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

          {/* SELECT FEATURED IMAGE FROM MEDIA VAULT */}
          <div className="studio-media-selector">
            <label className="studio-label" style={{ color: 'var(--gold)' }}>
              🖼️ Select Featured Cover Image
            </label>

            {mediaGallery.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--ink-dim)' }}>
                No media uploaded yet. Switch to the <strong>Media Vault</strong> tab to upload images to Google Drive.
              </p>
            ) : (
              <select
                className="studio-select"
                onChange={(e) => {
                  const selected = mediaGallery.find(item => item.url === e.target.value);
                  if (selected) {
                    setCoverPreviewUrl(selected.url);
                    setCoverDriveId(selected.driveFileId);
                    setCoverAltText(selected.altText || title);
                  } else {
                    setCoverPreviewUrl('');
                    setCoverDriveId('');
                  }
                }}
              >
                <option value="">-- Choose image from Media Vault --</option>
                {mediaGallery.map((item, idx) => (
                  <option key={idx} value={item.url}>{item.altText || `Drive Image ${idx + 1}`}</option>
                ))}
              </select>
            )}

            {coverPreviewUrl && (
              <div style={{ marginTop: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <img src={coverPreviewUrl} alt="Cover Preview" style={{ width: '140px', height: '80px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--line)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--ice)', marginBottom: '8px', fontWeight: 500 }}>✓ Cover image selected</div>
                  <input
                    type="text"
                    className="studio-input"
                    value={coverAltText}
                    onChange={(e) => setCoverAltText(e.target.value)}
                    placeholder="Alt text for SEO..."
                    style={{ padding: '10px 16px', fontSize: '13px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Excerpt Summary */}
          <div style={{ marginBottom: '28px' }}>
            <label className="studio-label">Summary Excerpt *</label>
            <textarea
              className="studio-textarea"
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief 2-line summary overview for article preview cards and Google search snippets..."
              required
            />
          </div>

          {/* Body Content Editor */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label className="studio-label" style={{ margin: 0 }}>
                Article Body Content *
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-dim)', fontFamily: 'var(--mono)' }}>
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
            </div>

            <textarea
              ref={textareaRef}
              className="studio-textarea rich-text"
              rows={16}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article body content here..."
              required
            />
          </div>

          <button
            type="submit"
            className="liquid-btn"
            disabled={submitLoading}
            style={{ width: '100%', padding: '20px', fontSize: '15px' }}
          >
            {submitLoading ? 'Publishing Post...' : 'Publish Article Live 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
