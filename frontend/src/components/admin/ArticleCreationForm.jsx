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
    <div style={{ background: 'rgba(8,17,26,0.85)', border: '1px solid var(--line)', padding: '32px', borderRadius: '8px' }}>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 500, marginBottom: '24px', color: 'var(--ice)' }}>Article Creation Pane</h2>

      <form onSubmit={handlePublishPost}>
        {/* Title & Slug */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ice)', marginBottom: '6px' }}>
            Article Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How to Master Geopolitical Negotiation in Model UN"
            required
            style={{ width: '100%', padding: '14px', background: 'rgba(6,13,20,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '1.05rem', borderRadius: '4px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: '6px' }}>
              URL Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="master-mun-diplomacy"
              style={{ width: '100%', padding: '10px', background: 'rgba(6,13,20,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.88rem', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: '6px' }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'rgba(6,13,20,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.88rem', borderRadius: '4px' }}
            >
              <option value="Diplomacy">Diplomacy</option>
              <option value="Debates">Debates</option>
              <option value="Civics">Civics</option>
              <option value="Entrepreneurship">Entrepreneurship</option>
              <option value="Geopolitics">Geopolitics</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: '6px' }}>
              Author Name
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="YANF Editorial"
              style={{ width: '100%', padding: '10px', background: 'rgba(6,13,20,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.88rem', borderRadius: '4px' }}
            />
          </div>
        </div>

        {/* FEATURED COVER IMAGE UPLOADER */}
        <div style={{ background: 'rgba(6,13,20,0.6)', border: '1px solid var(--line)', padding: '20px', borderRadius: '6px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)' }}>
              🖼️ Featured Cover Image (Google Drive API)
            </span>
            {uploadingCover && <span style={{ color: 'var(--ice)', fontSize: '0.8rem' }}>Uploading to GDrive...</span>}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleUploadCover}
            style={{ marginBottom: '16px', color: 'var(--ink-dim)', fontSize: '0.88rem' }}
          />

          {coverPreviewUrl && (
            <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <img src={coverPreviewUrl} alt="Cover Preview" style={{ width: '120px', height: '70px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--line)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--ice)' }}>File uploaded to Drive Folder ID: {coverDriveId}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--ink-dim)', display: 'block', marginBottom: '4px' }}>Media Title</label>
              <input type="text" value={coverTitle} onChange={(e) => setCoverTitle(e.target.value)} placeholder="e.g. UNSC Chamber Session" style={{ width: '100%', padding: '8px', background: 'rgba(8,17,26,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.82rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--gold)', display: 'block', marginBottom: '4px' }}>Alt Text (Required for SEO) *</label>
              <input type="text" value={coverAltText} onChange={(e) => setCoverAltText(e.target.value)} placeholder="e.g. Delegates seated in the UN Security Council" style={{ width: '100%', padding: '8px', background: 'rgba(8,17,26,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.82rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--ink-dim)', display: 'block', marginBottom: '4px' }}>Caption</label>
              <input type="text" value={coverCaption} onChange={(e) => setCoverCaption(e.target.value)} placeholder="e.g. Delegates during committee session" style={{ width: '100%', padding: '8px', background: 'rgba(8,17,26,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.82rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--ink-dim)', display: 'block', marginBottom: '4px' }}>Description</label>
              <input type="text" value={coverDescription} onChange={(e) => setCoverDescription(e.target.value)} placeholder="e.g. High resolution photo of assembly" style={{ width: '100%', padding: '8px', background: 'rgba(8,17,26,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.82rem' }} />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ice)', marginBottom: '6px' }}>
            Summary / Excerpt *
          </label>
          <textarea
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief 2-line overview of the article for blog cards and Google SERP snippets..."
            required
            style={{ width: '100%', padding: '12px', background: 'rgba(6,13,20,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.9rem', borderRadius: '4px', resize: 'vertical' }}
          />
        </div>

        {/* FORMATTING TOOLBAR & BODY CONTENT */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ice)' }}>
              Article Content (HTML/Markdown) *
            </label>
            <span style={{ fontSize: '0.78rem', color: 'var(--ink-dim)' }}>
              {wordCount} words ({computedReadTime})
            </span>
          </div>

          {/* Toolbar Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '8px', background: 'rgba(6,13,20,0.9)', border: '1px solid var(--line)', borderBottom: 'none', borderRadius: '4px 4px 0 0' }}>
            <button type="button" onClick={() => insertFormatting('<b>', '</b>')} style={btnTbStyle}><b>B</b></button>
            <button type="button" onClick={() => insertFormatting('<i>', '</i>')} style={btnTbStyle}><i>I</i></button>
            <button type="button" onClick={() => insertFormatting('<h2>', '</h2>')} style={btnTbStyle}>H2</button>
            <button type="button" onClick={() => insertFormatting('<h3>', '</h3>')} style={btnTbStyle}>H3</button>
            <button type="button" onClick={() => insertFormatting('<blockquote>', '</blockquote>')} style={btnTbStyle}>Quote</button>
            <button type="button" onClick={() => insertFormatting('<ul>\n  <li>', '</li>\n</ul>')} style={btnTbStyle}>List</button>
            <button type="button" onClick={() => insertFormatting('<a href="https://">', '</a>')} style={btnTbStyle}>Link</button>
            <button type="button" onClick={handleInsertMediaClick} style={{ ...btnTbStyle, background: 'rgba(143,208,255,0.15)', color: 'var(--ice)', borderColor: 'var(--ice)' }}>📷 Insert In-Body Media</button>
          </div>

          <textarea
            ref={textareaRef}
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your article body content here..."
            required
            style={{ width: '100%', padding: '14px', background: 'rgba(6,13,20,0.95)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.95rem', lineHeight: '1.7', borderRadius: '0 0 4px 4px', resize: 'vertical' }}
          />
        </div>

        {/* Meta tags for SEO */}
        <div style={{ background: 'rgba(6,13,20,0.5)', border: '1px solid var(--line)', padding: '16px', borderRadius: '4px', marginBottom: '28px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>
            🔍 SEO &amp; OpenGraph Settings
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--ink-dim)', display: 'block', marginBottom: '4px' }}>Meta Title</label>
              <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} style={{ width: '100%', padding: '8px', background: 'rgba(8,17,26,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.82rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '10px', color: 'var(--ink-dim)', display: 'block', marginBottom: '4px' }}>Focus Keywords</label>
              <input type="text" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} placeholder="MUN, Diplomacy, Debate" style={{ width: '100%', padding: '8px', background: 'rgba(8,17,26,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.82rem' }} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '10px', color: 'var(--ink-dim)', display: 'block', marginBottom: '4px' }}>Meta Description (Google Snippet)</label>
              <input type="text" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} style={{ width: '100%', padding: '8px', background: 'rgba(8,17,26,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.82rem' }} />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn solid"
          disabled={submitLoading}
          style={{ width: '100%', padding: '16px', justifyContent: 'center' }}
        >
          {submitLoading ? 'Publishing to MongoDB...' : 'Publish Article Live 🚀'}
        </button>
      </form>
    </div>
  );
}

const btnTbStyle = {
  padding: '6px 12px',
  background: 'rgba(8,17,26,0.9)',
  border: '1px solid var(--line)',
  color: 'var(--ink)',
  fontFamily: 'var(--mono)',
  fontSize: '11px',
  cursor: 'pointer',
  borderRadius: '3px'
};
