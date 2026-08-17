import { useState, useEffect, useRef } from 'react';
import { loginStep1, verifyOtp, uploadImageToDrive, createBlogPost, updateBlogPost, fetchPublishedBlogs, deleteBlogPost } from '../../../services/api';

export function useAdminState() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('yanf_admin_token') || '');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('yanf_admin_user') || 'null'));

  // Editing existing post ID (null = creating new post)
  const [editingPostId, setEditingPostId] = useState(null);

  // Studio Active Tab State
  const [activeTab, setActiveTabState] = useState(() => {
    const hash = window.location.hash;
    const match = hash.match(/^#page-admin\/(.+)$/);
    return match ? match[1] : 'dashboard';
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    window.location.hash = `#page-admin/${tab}`;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#page-admin\/(.+)$/);
      if (match) {
        setActiveTabState(match[1]);
      } else if (hash === '#page-admin') {
        setActiveTabState('dashboard');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Step 1 & 2 Login state
  const [loginStep, setLoginStep] = useState(1);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);

  const [maskedEmail, setMaskedEmail] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Articles & Media Gallery state
  const [publishedBlogs, setPublishedBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [mediaGallery, setMediaGallery] = useState(() => {
    try {
      const saved = localStorage.getItem('yanf_media_gallery');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('yanf_media_gallery', JSON.stringify(mediaGallery));
    } catch (e) {
      console.error(e);
    }
  }, [mediaGallery]);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Diplomacy');
  const [author, setAuthor] = useState('YANF Editorial');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');

  // Featured Cover Image state
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [coverDriveId, setCoverDriveId] = useState('');
  const [coverAltText, setCoverAltText] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  // Form Feedback
  const [statusMsg, setStatusMsg] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !slug) {
      const autoSlug = title.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(autoSlug);
    }
  }, [title, slug]);

  // Sync meta title & description
  useEffect(() => {
    if (title && !metaTitle) setMetaTitle(`${title} — YANF`);
    if (summary && !metaDescription) setMetaDescription(summary);
  }, [title, summary, metaTitle, metaDescription]);

  // Load published blogs when authenticated
  useEffect(() => {
    if (token) {
      loadBlogs();
    }
  }, [token]);

  const loadBlogs = async () => {
    setLoadingBlogs(true);
    try {
      const data = await fetchPublishedBlogs('', '', true);
      setPublishedBlogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBlogs(false);
    }
  };

  // Login Handlers
  const handleLoginStep1 = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const data = await loginStep1(usernameInput, passwordInput);
      setMaskedEmail(data.emailMasked);
      setLoginStep(2);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const nextDigits = [...otpDigits];
    nextDigits[index] = value.slice(-1);
    setOtpDigits(nextDigits);
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().slice(0, 6);
    if (/^\d+$/.test(pasteData)) {
      const newDigits = pasteData.split('');
      while (newDigits.length < 6) newDigits.push('');
      setOtpDigits(newDigits);
      otpInputRefs.current[Math.min(pasteData.length, 5)]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setAuthError('Please enter all 6 digits of the OTP passcode.');
      return;
    }
    setAuthError('');
    setAuthLoading(true);
    try {
      const data = await verifyOtp(usernameInput, fullOtp);
      setToken(data.token);
      setCurrentUser(data.user);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('yanf_admin_token');
    localStorage.removeItem('yanf_admin_user');
    setToken('');
    setCurrentUser(null);
    setLoginStep(1);
    setUsernameInput('');
    setPasswordInput('');
    setShowPassword(false);
    setOtpDigits(['', '', '', '', '', '']);
  };

  // Google Drive Media Upload Handler
  const handleUploadCover = async (eOrFile) => {
    const file = eOrFile?.target?.files?.[0] || eOrFile;
    if (!file || !(file instanceof File)) return null;
    setUploadingCover(true);
    setStatusMsg('');

    try {
      const res = await uploadImageToDrive(file);
      const newMediaItem = {
        url: res.url,
        driveFileId: res.driveFileId,
        altText: file.name.replace(/\.[^/.]+$/, "")
      };
      setMediaGallery(prev => [newMediaItem, ...prev]);
      setCoverPreviewUrl(res.url);
      setCoverDriveId(res.driveFileId);
      setStatusMsg('✅ Image uploaded to Google Drive API & saved to Media Vault!');
      return res;
    } catch (err) {
      setStatusMsg('❌ Upload failed: ' + err.message);
      throw err;
    } finally {
      setUploadingCover(false);
    }
  };

  // Publish / Save Draft Blog Post Handler
  const handlePublishPost = async (e, statusToSet = 'published') => {
    if (e && e.preventDefault) e.preventDefault();
    if (!title || !summary || !content) {
      alert('Title, Summary, and Content fields are required.');
      return;
    }

    setSubmitLoading(true);
    setStatusMsg('');

    try {
      const blogData = {
        title, slug, metaTitle, metaDescription, metaKeywords, category, author, summary, content,
        coverImage: coverPreviewUrl ? {
          url: coverPreviewUrl, driveFileId: coverDriveId, altText: coverAltText || title
        } : undefined,
        status: statusToSet
      };

      if (editingPostId) {
        await updateBlogPost(editingPostId, blogData);
        setStatusMsg(statusToSet === 'draft' ? '📝 Draft updated successfully in MongoDB Atlas!' : '🎉 Article updated and published live to MongoDB Atlas!');
      } else {
        await createBlogPost(blogData);
        setStatusMsg(statusToSet === 'draft' ? '📝 Draft saved successfully in MongoDB Atlas!' : '🎉 Article published live to MongoDB Atlas!');
      }
      
      // Reset editor
      setEditingPostId(null);
      setTitle(''); setSlug(''); setSummary(''); setContent('');
      setCoverPreviewUrl(''); setCoverDriveId(''); setCoverAltText('');
      
      loadBlogs();
      setActiveTab('posts');
    } catch (err) {
      setStatusMsg('❌ Action failed: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditPost = (blog) => {
    if (!blog) return;
    setEditingPostId(blog._id);
    setTitle(blog.title || '');
    setSlug(blog.slug || '');
    setCategory(blog.category || 'Diplomacy');
    setAuthor(blog.author || 'YANF Editorial');
    setSummary(blog.summary || '');
    setContent(blog.content || '');
    setMetaTitle(blog.metaTitle || '');
    setMetaDescription(blog.metaDescription || '');
    setMetaKeywords(blog.metaKeywords || '');
    setCoverPreviewUrl(blog.coverImage?.url || '');
    setCoverDriveId(blog.coverImage?.driveFileId || '');
    setCoverAltText(blog.coverImage?.altText || '');
    setActiveTab('editor');
  };

  const handleNewPost = () => {
    setEditingPostId(null);
    setTitle(''); setSlug(''); setSummary(''); setContent('');
    setMetaTitle(''); setMetaDescription(''); setMetaKeywords('');
    setCoverPreviewUrl(''); setCoverDriveId(''); setCoverAltText('');
    setCategory('Diplomacy'); setAuthor('YANF Editorial');
    setActiveTab('editor');
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await deleteBlogPost(id);
      loadBlogs();
    } catch (err) {
      alert('Failed to delete post: ' + err.message);
    }
  };

  const cleanText = (content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/gi, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const wordCount = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
  const computedReadTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

  return {
    token, currentUser, activeTab, setActiveTab,
    loginStep, setLoginStep, usernameInput, setUsernameInput,
    passwordInput, setPasswordInput, showPassword, setShowPassword,
    otpDigits, otpInputRefs, maskedEmail, authError, authLoading,
    publishedBlogs, loadingBlogs, mediaGallery, setMediaGallery,
    editingPostId, setEditingPostId, handleEditPost, handleNewPost,
    title, setTitle, slug, setSlug, category, setCategory,
    author, setAuthor, summary, setSummary, content, setContent,
    metaTitle, setMetaTitle, metaDescription, setMetaDescription,
    metaKeywords, setMetaKeywords, coverPreviewUrl, setCoverPreviewUrl,
    coverDriveId, setCoverDriveId, coverAltText, setCoverAltText,
    uploadingCover, statusMsg, submitLoading, wordCount, computedReadTime,
    handleLoginStep1, handleOtpDigitChange, handleOtpKeyDown, handleOtpPaste,
    handleVerifyOtp, handleLogout, handleUploadCover, handlePublishPost,
    handleDeletePost, loadBlogs
  };
}
