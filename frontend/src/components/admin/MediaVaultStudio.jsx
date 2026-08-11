import React, { useState } from 'react';

export default function MediaVaultStudio({
  mediaGallery,
  setMediaGallery,
  uploadingCover,
  handleUploadCover
}) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div>
      {/* DRAG & DROP MEDIA UPLOADER */}
      <div className="studio-card">
        <div className="studio-section-header">
          <h2>🖼️ Media Vault &amp; Google Drive Storage</h2>
          <p>Upload images directly to your official Google Drive storage folder for fast global CDN delivery.</p>
        </div>

        <div className="media-dropzone" onClick={() => document.getElementById('gdrive-file-input').click()}>
          <input
            id="gdrive-file-input"
            type="file"
            accept="image/*"
            onChange={handleUploadCover}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>☁️</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '6px' }}>
            {uploadingCover ? 'Uploading Image to Google Drive...' : 'Click to Upload Image to Google Drive'}
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--ink-dim)' }}>
            Supports PNG, JPG, WEBP &bull; Auto-indexed to your Media Gallery
          </p>
        </div>
      </div>

      {/* MEDIA GALLERY GRID */}
      <div className="studio-card">
        <div className="studio-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Uploaded Media Gallery ({mediaGallery.length})</h2>
            <p>Select any image to copy its Google Drive CDN URL or HTML figure tag.</p>
          </div>
        </div>

        {mediaGallery.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(6,13,20,0.5)', borderRadius: '16px', border: '1px dashed var(--line)' }}>
            <p style={{ color: 'var(--ink-dim)', fontSize: '0.92rem' }}>No media uploaded yet. Use the uploader box above to add images.</p>
          </div>
        ) : (
          <div className="media-grid">
            {mediaGallery.map((item, idx) => {
              const htmlSnippet = `<figure class="blog-media"><img src="${item.url}" alt="${item.altText || 'YANF Media'}" /></figure>`;
              return (
                <div key={idx} className="media-card">
                  <img src={item.url} alt={item.altText || 'Uploaded Media'} />
                  <div className="media-card-body">
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.altText || `Drive Image ${idx + 1}`}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ice)', fontFamily: 'var(--mono)', marginBottom: '12px' }}>
                      Drive ID: {item.driveFileId || 'GDrive-Ref'}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.url, `url-${idx}`)}
                        style={miniBtnStyle}
                      >
                        {copiedIndex === `url-${idx}` ? '✓ URL Copied' : '🔗 Copy URL'}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(htmlSnippet, `html-${idx}`)}
                        style={miniBtnStyle}
                      >
                        {copiedIndex === `html-${idx}` ? '✓ HTML Copied' : '📋 Copy HTML'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const miniBtnStyle = {
  flex: 1,
  padding: '8px',
  background: 'rgba(143,208,255,0.08)',
  border: '1px solid rgba(143,208,255,0.2)',
  color: 'var(--ice)',
  fontFamily: 'var(--mono)',
  fontSize: '10px',
  borderRadius: '8px',
  cursor: 'pointer'
};
