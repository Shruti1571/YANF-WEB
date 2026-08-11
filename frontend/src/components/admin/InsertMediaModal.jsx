import React from 'react';

export default function InsertMediaModal({
  showMediaModal,
  setShowMediaModal,
  mediaFile,
  setMediaFile,
  mediaTitle,
  setMediaTitle,
  mediaAltText,
  setMediaAltText,
  mediaCaption,
  setMediaCaption,
  uploadingMedia,
  handleInsertMediaSubmit
}) {
  if (!showMediaModal) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#08111a', border: '1px solid var(--ice)', padding: '28px', maxWidth: '500px', width: '100%', borderRadius: '6px' }}>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--ice)', marginBottom: '16px' }}>📷 Insert In-Body Image (Google Drive API)</h3>
        <form onSubmit={handleInsertMediaSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', color: 'var(--ink-dim)', display: 'block', marginBottom: '6px' }}>Select Image File *</label>
            <input type="file" accept="image/*" onChange={(e) => setMediaFile(e.target.files[0])} required style={{ color: 'var(--ink)', fontSize: '0.88rem' }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: 'var(--gold)', display: 'block', marginBottom: '4px' }}>Alt Text (Required for SEO) *</label>
            <input type="text" value={mediaAltText} onChange={(e) => setMediaAltText(e.target.value)} placeholder="e.g. Delegates debating in Security Council" required style={{ width: '100%', padding: '10px', background: 'rgba(6,13,20,0.9)', border: '1px solid var(--gold)', color: 'var(--ink)', fontSize: '0.88rem' }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: 'var(--ink-dim)', display: 'block', marginBottom: '4px' }}>Media Title</label>
            <input type="text" value={mediaTitle} onChange={(e) => setMediaTitle(e.target.value)} placeholder="e.g. UNSC Chamber Session" style={{ width: '100%', padding: '10px', background: 'rgba(6,13,20,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.88rem' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', color: 'var(--ink-dim)', display: 'block', marginBottom: '4px' }}>Caption</label>
            <input type="text" value={mediaCaption} onChange={(e) => setMediaCaption(e.target.value)} placeholder="e.g. Delegates during unmoderated caucus" style={{ width: '100%', padding: '10px', background: 'rgba(6,13,20,0.9)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: '0.88rem' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={() => setShowMediaModal(false)}>Cancel</button>
            <button type="submit" className="btn solid" disabled={uploadingMedia}>
              {uploadingMedia ? 'Uploading to Drive...' : 'Insert Media Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
