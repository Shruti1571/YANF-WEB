import React from 'react';

export default function ArticlePreviewInspector({
  coverPreviewUrl,
  coverAltText,
  category,
  title,
  author,
  computedReadTime,
  summary,
  metaTitle,
  metaDescription,
  slug
}) {
  return (
    <div>
      {/* LIVE ARTICLE READER PREVIEW */}
      <div style={{ background: 'rgba(8,17,26,0.92)', border: '1px solid var(--line)', padding: '24px', borderRadius: '6px', marginBottom: '24px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ice)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>👁️</span> Live Article Preview
        </div>

        <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: '20px', borderRadius: '4px' }}>
          {coverPreviewUrl && (
            <img src={coverPreviewUrl} alt={coverAltText || 'Cover'} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '4px', marginBottom: '16px' }} />
          )}
          <div className="kicker" style={{ fontSize: '9px', marginBottom: '8px' }}>{category}</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 500, lineHeight: '1.2' }}>{title || 'Your Article Title Preview'}</h2>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--ink-dim)', margin: '8px 0 16px' }}>
            By {author} &bull; {computedReadTime}
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--ink-dim)', lineHeight: '1.6', borderLeft: '2px solid var(--ice)', paddingLeft: '12px' }}>
            {summary || 'Brief summary preview will render here...'}
          </p>
        </div>
      </div>

      {/* GOOGLE SERP & SOCIAL INSPECTOR */}
      <div style={{ background: 'rgba(8,17,26,0.92)', border: '1px solid var(--line)', padding: '24px', borderRadius: '6px', marginBottom: '24px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>
          🔍 Google SERP Snippet Preview
        </div>
        <div style={{ background: '#ffffff', color: '#1a0dab', padding: '16px', borderRadius: '4px', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ fontSize: '18px', lineHeight: '1.2', color: '#1a0dab', textDecoration: 'underline', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {metaTitle || title || 'Article Title — YANF'}
          </div>
          <div style={{ fontSize: '13px', color: '#006621', marginBottom: '4px' }}>
            https://yanfglobal.com/blogs/{slug || 'article-slug'}
          </div>
          <div style={{ fontSize: '13px', color: '#545454', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {metaDescription || summary || 'Google search snippet description preview...'}
          </div>
        </div>

        {/* SEO Health Checklist */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ice)', marginBottom: '10px' }}>
            ✅ SEO Health Checklist
          </div>
          <ul style={{ listStyle: 'none', fontSize: '0.82rem', color: 'var(--ink-dim)' }}>
            <li style={{ padding: '3px 0', color: coverAltText ? '#8fffa0' : '#ff8888' }}>
              {coverAltText ? '✓' : '✗'} Featured Cover Alt Text: {coverAltText ? 'Present' : 'Missing'}
            </li>
            <li style={{ padding: '3px 0', color: (metaTitle.length >= 30 && metaTitle.length <= 60) ? '#8fffa0' : 'var(--gold)' }}>
              {metaTitle.length >= 30 ? '✓' : '•'} Meta Title Length: {metaTitle.length} / 60 chars
            </li>
            <li style={{ padding: '3px 0', color: (metaDescription.length >= 100 && metaDescription.length <= 160) ? '#8fffa0' : 'var(--gold)' }}>
              {metaDescription.length >= 100 ? '✓' : '•'} Meta Description: {metaDescription.length} / 160 chars
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
