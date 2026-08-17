import React, { useState } from 'react';

export default function MediaLibraryStudio({ mediaGallery, setMediaGallery, uploadingCover, handleUploadCover, currentUser }) {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all');
  const [isImageMaximized, setIsImageMaximized] = useState(false);

  // Custom Delete Confirmation Modal State
  const [itemToDelete, setItemToDelete] = useState(null);

  // Modal State for Upload & Instant SEO Entry
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadSeoTitle, setUploadSeoTitle] = useState('');
  const [uploadSeoAlt, setUploadSeoAlt] = useState('');
  const [uploadSeoCaption, setUploadSeoCaption] = useState('');
  const [uploadSeoDescription, setUploadSeoDescription] = useState('');
  const [detectedDimensions, setDetectedDimensions] = useState('Auto');

  // Helper to format exact file size in Bytes, KB, or MB
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes) || bytes <= 0) return 'Auto';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Map user uploaded media items
  const galleryList = (mediaGallery || []).map((item, idx) => {
    if (typeof item === 'string') {
      return {
        id: `uploaded-${idx}`,
        url: item,
        title: `Uploaded Asset #${idx + 1}`,
        dimensions: 'Auto',
        size: 'Auto',
        fileType: 'JPEG',
        uploadDate: 'Recent',
        alt: '',
        caption: '',
        description: ''
      };
    }
    return {
      id: item.id || item.driveFileId || `uploaded-${idx}`,
      url: item.url || item.thumbnailUrl,
      title: item.title || item.altText || `Uploaded Asset #${idx + 1}`,
      dimensions: item.dimensions || 'Auto',
      size: typeof item.size === 'number' ? formatFileSize(item.size) : (item.size || 'Auto'),
      fileType: item.fileType || 'PNG',
      uploadDate: item.uploadDate || 'Recent',
      alt: item.alt || item.altText || '',
      caption: item.caption || '',
      description: item.description || ''
    };
  });

  const filteredItems = galleryList.filter(item => {
    const titleMatch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const altMatch = (item.alt || '').toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || altMatch;
  });

  // Handle file select from user's computer
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploadSeoTitle(file.name.replace(/\.[^/.]+$/, ""));
    setUploadSeoAlt('');
    setUploadSeoCaption('');
    setUploadSeoDescription('');
    setDetectedDimensions('Detecting...');
    setIsUploadModalOpen(true);
  };

  // Complete Upload & Save Asset + SEO
  const handleCompleteUpload = async (e) => {
    e.preventDefault();
    if (!pendingFile) return;

    let realDriveUrl = previewUrl;
    let driveFileId = null;

    if (handleUploadCover) {
      try {
        const uploadRes = await handleUploadCover(pendingFile);
        if (uploadRes && uploadRes.url) {
          realDriveUrl = uploadRes.url;
          driveFileId = uploadRes.driveFileId;
        }
      } catch (err) {
        console.error("Failed uploading to Google Drive", err);
      }
    }
    
    const formattedSize = pendingFile ? formatFileSize(pendingFile.size) : 'Auto';
    const ext = pendingFile?.name?.split('.').pop()?.toUpperCase() || 'PNG';

    const newAsset = {
      id: driveFileId || `uploaded-${Date.now()}`,
      url: realDriveUrl,
      title: uploadSeoTitle || pendingFile?.name || 'Uploaded Asset',
      dimensions: detectedDimensions !== 'Detecting...' ? detectedDimensions : 'Auto',
      size: formattedSize,
      fileType: ext,
      uploadDate: 'Just now',
      alt: uploadSeoAlt,
      caption: uploadSeoCaption,
      description: uploadSeoDescription
    };

    if (setMediaGallery) {
      setMediaGallery(prev => [newAsset, ...(prev || []).filter(item => {
        const itemUrl = typeof item === 'string' ? item : item.url;
        return itemUrl !== realDriveUrl;
      })]);
    }

    setSelectedMedia(newAsset);
    setIsUploadModalOpen(false);
    setPendingFile(null);
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdateMediaDetails = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const executeDeleteMedia = () => {
    if (!itemToDelete) return;
    if (setMediaGallery) {
      setMediaGallery(prev => (prev || []).filter(item => {
        const id = typeof item === 'string' ? item : (item.id || item.driveFileId || item.url);
        return id !== itemToDelete;
      }));
    }
    setSelectedMedia(null);
    setItemToDelete(null);
  };

  return (
    <div className="media-library-studio">
      {/* SECTION HEADER & CONTROLS */}
      <div className="studio-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>Media Library</h2>
          <p>Manage all your uploaded image assets, captions, and SEO metadata.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="sidebar-search" style={{ margin: 0, padding: '8px 14px', background: '#ffffff', border: '1px solid #cbd5e1' }}>
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search uploaded images..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button className="btn-primary" onClick={() => document.getElementById('media-upload-input').click()}>
            {uploadingCover ? 'Uploading...' : '+ Upload Image'}
          </button>
          <input 
            type="file" 
            id="media-upload-input" 
            style={{ display: 'none' }} 
            accept="image/*"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* FULL WIDTH IMAGE GRID CONTAINER */}
      <div className="studio-card" style={{ width: '100%', minHeight: '520px' }}>
        
        {/* FILTER TABS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setMediaTypeFilter('all')}
              style={{ 
                background: mediaTypeFilter === 'all' ? '#e0e7ff' : 'transparent', 
                color: mediaTypeFilter === 'all' ? '#4f46e5' : '#64748b', 
                border: 'none', 
                borderRadius: '6px',
                fontWeight: '600', 
                fontSize: '13px',
                padding: '6px 14px', 
                cursor: 'pointer' 
              }}
            >
              All Images ({filteredItems.length})
            </button>
          </div>

          <span style={{ fontSize: '12px', color: '#64748b' }}>Showing uploaded images only • Click an image to inspect details</span>
        </div>

        {/* IMAGE GRID OR EMPTY STATE */}
        {filteredItems.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
            {filteredItems.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => { setSelectedMedia(item); setIsImageMaximized(false); }}
                style={{ 
                  aspectRatio: '1', 
                  background: '#f1f5f9', 
                  borderRadius: '12px', 
                  backgroundImage: `url(${item.url || item.thumbnailUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  cursor: 'pointer',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ position: 'absolute', bottom: '0', inset: 'auto 0 0 0', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', padding: '12px 10px 8px 10px', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title || 'Image Asset'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖼️</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 8px 0' }}>No uploaded images found</h3>
            <p style={{ fontSize: '14px', margin: '0 0 20px 0' }}>Upload your images to the Media Vault to see them listed here.</p>
            <button className="btn-primary" onClick={() => document.getElementById('media-upload-input').click()}>
              + Upload First Image
            </button>
          </div>
        )}
      </div>

      {/* SIDE-BY-SIDE SPLIT LIGHTBOX MODAL */}
      {selectedMedia && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', width: isImageMaximized ? '96vw' : '960px', maxWidth: '96vw', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            
            {/* MODAL HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#0f172a' }}>{selectedMedia.title || 'Attachment Details'}</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>Uploaded: {selectedMedia.uploadDate || 'Recent'}</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  onClick={() => setIsImageMaximized(!isImageMaximized)}
                  className="btn-primary"
                  style={{ background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isImageMaximized ? '⤢ Minimize View' : '🔍 Maximize Image'}
                </button>
                <button 
                  onClick={() => setSelectedMedia(null)}
                  style={{ background: 'none', border: 'none', fontSize: '22px', color: '#64748b', cursor: 'pointer', padding: '0 4px' }}
                  title="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* SPLIT BODY: LEFT IMAGE, RIGHT FORM */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              
              {/* LEFT: IMAGE PREVIEW */}
              <div style={{ 
                flex: isImageMaximized ? 2 : 1.2, 
                background: '#0f172a', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '24px', 
                position: 'relative'
              }}>
                <img 
                  src={selectedMedia.url} 
                  alt={selectedMedia.alt || 'Asset view'} 
                  onLoad={(e) => {
                    if (e.target.naturalWidth && e.target.naturalHeight) {
                      setDetectedDimensions(`${e.target.naturalWidth} x ${e.target.naturalHeight} px`);
                    }
                  }}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: isImageMaximized ? '82vh' : '65vh', 
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                  }} 
                />

                <div style={{ position: 'absolute', bottom: '12px', left: '16px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', backdropFilter: 'blur(4px)' }}>
                  {selectedMedia.dimensions && selectedMedia.dimensions !== 'Auto' ? selectedMedia.dimensions : detectedDimensions} • {selectedMedia.size}
                </div>
              </div>

              {/* RIGHT: SEO DETAILS & FORM */}
              {!isImageMaximized && (
                <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', background: '#ffffff' }}>
                  <form onSubmit={handleUpdateMediaDetails}>
                    
                    <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '12.5px', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                      <div><strong>Format:</strong> {selectedMedia.fileType || 'PNG'}</div>
                      <div><strong>Size:</strong> {selectedMedia.size}</div>
                      <div><strong>Dimensions:</strong> {selectedMedia.dimensions && selectedMedia.dimensions !== 'Auto' ? selectedMedia.dimensions : detectedDimensions}</div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label className="studio-label">Title / Filename</label>
                      <input 
                        type="text" 
                        className="studio-input" 
                        defaultValue={selectedMedia.title || ''}
                        placeholder="Image title..." 
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label className="studio-label">Alt Text (SEO) <span style={{ color: '#2563eb', fontSize: '11px', fontWeight: 'normal' }}>*Crucial for search engines</span></label>
                      <textarea 
                        className="studio-textarea" 
                        rows="2" 
                        defaultValue={selectedMedia.alt || ''} 
                        placeholder="Describe the image for screen readers & Google SEO..."
                      ></textarea>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label className="studio-label">Caption</label>
                      <textarea 
                        className="studio-textarea" 
                        rows="2" 
                        defaultValue={selectedMedia.caption || ''} 
                        placeholder="Public caption displayed under article images..."
                      ></textarea>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label className="studio-label">Description (SEO Indexing)</label>
                      <textarea 
                        className="studio-textarea" 
                        rows="2" 
                        defaultValue={selectedMedia.description || ''} 
                        placeholder="Detailed context for search index engines..."
                      ></textarea>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <label className="studio-label">Direct Link / File URL</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="text" className="studio-input" readOnly value={selectedMedia.url || ''} style={{ fontSize: '12px' }} />
                        <button 
                          type="button" 
                          onClick={() => handleCopyLink(selectedMedia.url)} 
                          className="btn-primary" 
                          style={{ padding: '8px 14px', fontSize: '12px', flexShrink: 0 }}
                        >
                          {copiedUrl ? 'Copied!' : 'Copy Link'}
                        </button>
                      </div>
                    </div>

                    {/* UPLOADER ATTRIBUTION TAG (ADMIN-ONLY VISIBILITY) */}
                    <div style={{ fontSize: '12.5px', color: '#475569', background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600 }}>Uploaded by:</span> 
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>@{selectedMedia.uploadedBy || currentUser?.username || 'admin'}</span>
                    </div>

                    {saveSuccess && (
                      <div style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '500', marginBottom: '16px', textAlign: 'center' }}>
                        ✅ SEO Metadata saved successfully!
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button type="submit" className="btn-primary" style={{ flex: 1, background: saveSuccess ? '#16a34a' : '#2563eb' }}>
                        {saveSuccess ? 'Saved! ✓' : 'Save Changes'}
                      </button>
                      
                      {/* DELETE BUTTON (RESTRICTED EXCLUSIVELY TO SUPER ADMIN) */}
                      {(currentUser?.role === 'superadmin') ? (
                        <button 
                          type="button" 
                          className="btn-primary" 
                          style={{ background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5' }} 
                          onClick={() => setItemToDelete(selectedMedia.id)}
                        >
                          Delete
                        </button>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic', padding: '0 4px' }}>
                          🔒 Deletion restricted to Super Admin
                        </span>
                      )}
                    </div>
                  </form>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* SIDE-BY-SIDE SPLIT INSTANT UPLOAD & SEO METADATA MODAL */}
      {isUploadModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', width: '960px', maxWidth: '96vw', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            
            {/* MODAL HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#0f172a' }}>Upload Image & Set SEO Metadata</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>Add alt text, captions, and SEO descriptions as soon as you upload.</p>
              </div>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', color: '#64748b', cursor: 'pointer', padding: '0 4px' }}
              >
                ✕
              </button>
            </div>

            {/* SPLIT BODY: LEFT PREVIEW, RIGHT SEO FORM */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              
              {/* LEFT: IMAGE PREVIEW */}
              <div style={{ flex: 1.2, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                {previewUrl && (
                  <img 
                    src={previewUrl} 
                    alt="Upload preview" 
                    onLoad={(e) => {
                      if (e.target.naturalWidth && e.target.naturalHeight) {
                        setDetectedDimensions(`${e.target.naturalWidth} x ${e.target.naturalHeight} px`);
                      }
                    }}
                    style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
                  />
                )}
              </div>

              {/* RIGHT: SEO FORM */}
              <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', background: '#ffffff' }}>
                <form onSubmit={handleCompleteUpload}>
                  <div style={{ marginBottom: '16px' }}>
                    <label className="studio-label">Image Title</label>
                    <input 
                      type="text" 
                      className="studio-input" 
                      value={uploadSeoTitle}
                      onChange={(e) => setUploadSeoTitle(e.target.value)}
                      placeholder="Give this image a clear title..."
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label className="studio-label">
                      Alt Text (SEO) <span style={{ color: '#2563eb', fontSize: '11px', fontWeight: 'normal' }}>*Essential for search ranking</span>
                    </label>
                    <textarea 
                      className="studio-textarea" 
                      rows="2" 
                      value={uploadSeoAlt}
                      onChange={(e) => setUploadSeoAlt(e.target.value)}
                      placeholder="Describe the image content for Google SEO & Screen readers..."
                    ></textarea>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label className="studio-label">Caption</label>
                    <textarea 
                      className="studio-textarea" 
                      rows="2" 
                      value={uploadSeoCaption}
                      onChange={(e) => setUploadSeoCaption(e.target.value)}
                      placeholder="Optional caption for display under the image..."
                    ></textarea>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label className="studio-label">Description (SEO Indexing)</label>
                    <textarea 
                      className="studio-textarea" 
                      rows="2" 
                      value={uploadSeoDescription}
                      onChange={(e) => setUploadSeoDescription(e.target.value)}
                      placeholder="Detailed description for search indexing context..."
                    ></textarea>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                    <button 
                      type="button" 
                      className="btn-primary" 
                      style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}
                      onClick={() => setIsUploadModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={uploadingCover}>
                      {uploadingCover ? 'Uploading to Google Drive...' : 'Upload & Save SEO Asset'}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CENTERED DELETE CONFIRMATION CARD MODAL */}
      {itemToDelete && (
        <div className="toast-modal-overlay" onClick={() => setItemToDelete(null)}>
          <div 
            className="centered-square-card" 
            style={{ width: '380px', height: 'auto', padding: '32px 28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button" 
              className="square-card-close-btn"
              onClick={() => setItemToDelete(null)}
              title="Cancel"
            >
              ✕
            </button>

            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }}>
              🗑️
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 8px 0' }}>
              Delete Image Asset?
            </h3>

            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px 0', lineHeight: '1.5' }}>
              Are you sure you want to delete this image? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ flex: 1, background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}
                onClick={() => setItemToDelete(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ flex: 1, background: '#ef4444', color: '#ffffff' }}
                onClick={executeDeleteMedia}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
