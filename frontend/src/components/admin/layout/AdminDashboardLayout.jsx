import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminDashboardOverview from '../AdminDashboardOverview';
import PostsListStudio from '../PostsListStudio';
import BlogWritingStudio from '../BlogWritingStudio';
import MediaLibraryStudio from '../MediaLibraryStudio';
import UserManagementStudio from '../UserManagementStudio';
import GlobalSettingsStudio from '../GlobalSettingsStudio';

export default function AdminDashboardLayout({ state }) {
  const {
    activeTab, setActiveTab, currentUser, handleLogout, statusMsg,
    title, setTitle, slug, setSlug, category, setCategory,
    author, setAuthor, summary, setSummary, content, setContent,
    metaTitle, setMetaTitle, metaDescription, setMetaDescription,
    metaKeywords, setMetaKeywords, coverPreviewUrl, setCoverPreviewUrl,
    coverDriveId, setCoverDriveId, coverAltText, setCoverAltText,
    mediaGallery, setMediaGallery, handlePublishPost, submitLoading,
    wordCount, computedReadTime, uploadingCover, handleUploadCover,
    publishedBlogs, loadingBlogs, loadBlogs, handleDeletePost,
    editingPostId, setEditingPostId, handleEditPost, handleNewPost
  } = state;

  const [dismissedMsg, setDismissedMsg] = useState('');

  // Set default active tab to dashboard if none is set
  const currentTab = activeTab || 'dashboard';

  const isToastVisible = statusMsg && statusMsg !== dismissedMsg;

  return (
    <div className="glass-dashboard-root">
      <AdminSidebar activeTab={currentTab} setActiveTab={setActiveTab} handleLogout={handleLogout} currentUser={currentUser} />

      <main className="glass-main-wrapper">
        <AdminHeader 
          currentUser={currentUser} 
          handleLogout={handleLogout} 
        />
        
        <div className="glass-workspace">
          {currentTab === 'dashboard' && (
            <AdminDashboardOverview 
              publishedBlogs={publishedBlogs} 
              setActiveTab={setActiveTab} 
            />
          )}

          {currentTab === 'posts' && (
            <PostsListStudio
              publishedBlogs={publishedBlogs}
              loadingBlogs={loadingBlogs}
              loadBlogs={loadBlogs}
              handleDeletePost={handleDeletePost}
              handleEditPost={handleEditPost}
              handleNewPost={handleNewPost}
              setActiveTab={setActiveTab}
              currentUser={currentUser}
            />
          )}

          {currentTab === 'editor' && (
            <BlogWritingStudio
              title={title} setTitle={setTitle}
              slug={slug} setSlug={setSlug}
              category={category} setCategory={setCategory}
              author={author} setAuthor={setAuthor}
              summary={summary} setSummary={setSummary}
              content={content} setContent={setContent}
              metaTitle={metaTitle} setMetaTitle={setMetaTitle}
              metaDescription={metaDescription} setMetaDescription={setMetaDescription}
              metaKeywords={metaKeywords} setMetaKeywords={setMetaKeywords}
              coverPreviewUrl={coverPreviewUrl} setCoverPreviewUrl={setCoverPreviewUrl}
              coverDriveId={coverDriveId} setCoverDriveId={setCoverDriveId}
              coverAltText={coverAltText} setCoverAltText={setCoverAltText}
              mediaGallery={mediaGallery}
              setMediaGallery={setMediaGallery}
              uploadingCover={uploadingCover}
              handleUploadCover={handleUploadCover}
              handlePublishPost={handlePublishPost}
              submitLoading={submitLoading}
              wordCount={wordCount} computedReadTime={computedReadTime}
              setActiveTab={setActiveTab}
              currentUser={currentUser}
              editingPostId={editingPostId}
              setEditingPostId={setEditingPostId}
              handleNewPost={handleNewPost}
            />
          )}

          {currentTab === 'media' && (
            <MediaLibraryStudio
              mediaGallery={mediaGallery}
              setMediaGallery={setMediaGallery}
              uploadingCover={uploadingCover}
              handleUploadCover={handleUploadCover}
              currentUser={currentUser}
            />
          )}

          {currentTab === 'users' && (
            <UserManagementStudio currentUser={currentUser} />
          )}

          {currentTab === 'settings' && (
            <GlobalSettingsStudio />
          )}
        </div>
      </main>

      {/* CENTERED POPUP SQUARE CARD NOTIFICATION */}
      {isToastVisible && (
        <div className="toast-modal-overlay" onClick={() => setDismissedMsg(statusMsg)}>
          <div 
            className={`centered-square-card ${statusMsg.includes('❌') ? 'error' : 'success'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button" 
              className="square-card-close-btn"
              onClick={() => setDismissedMsg(statusMsg)}
              title="Dismiss"
            >
              ✕
            </button>

            <div className="square-card-icon">
              {statusMsg.includes('❌') ? '❌' : '✅'}
            </div>

            <div className="square-card-text">
              {statusMsg.replace(/^[✅❌]\s*/, '')}
            </div>

            <button 
              type="button" 
              className="btn-primary square-card-action-btn"
              onClick={() => setDismissedMsg(statusMsg)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
