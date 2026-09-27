import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchPublishedBlogs, fetchBlogBySlug } from '../services/api';
import UnderConstruction from './UnderConstruction';

export default function PublicBlogPage({ onNavigate }) {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [copiedLink, setCopiedLink] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1); // 0.9, 1, 1.15
  const [activeHeadingId, setActiveHeadingId] = useState('');
  const readerTopRef = useRef(null);

  // Extract slug from URL hash (e.g. #page-blogs/test-article or #blog/test-article)
  const getSlugFromHash = () => {
    const hash = window.location.hash || '';
    if (hash.startsWith('#page-blogs/')) {
      return decodeURIComponent(hash.replace('#page-blogs/', '').split('?')[0].trim());
    }
    if (hash.startsWith('#blog/')) {
      return decodeURIComponent(hash.replace('#blog/', '').split('?')[0].trim());
    }
    return null;
  };

  useEffect(() => {
    loadLiveBlogs();
  }, []);

  // Sync active blog with URL hash slug on load and on hash change
  useEffect(() => {
    const syncSlugWithState = async () => {
      const activeSlug = getSlugFromHash();
      if (activeSlug) {
        // Look up in local blogs list first
        const found = blogs.find(b => b.slug === activeSlug);
        if (found) {
          setSelectedBlog(found);
          setScrollProgress(0);
        } else {
          // If direct permalink or not loaded in list yet, fetch single by slug
          try {
            const single = await fetchBlogBySlug(activeSlug);
            if (single) {
              setSelectedBlog(single);
              setScrollProgress(0);
            }
          } catch (err) {
            console.warn('Permalink article not found:', err);
          }
        }
      } else {
        setSelectedBlog(null);
      }
    };

    syncSlugWithState();

    const onHashChange = () => syncSlugWithState();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [blogs]);

  // Scroll listener for reading progress bar and active TOC heading
  useEffect(() => {
    const handleScroll = () => {
      const pageEl = document.getElementById('page-blogs');
      if (pageEl && selectedBlog) {
        const totalScroll = pageEl.scrollHeight - pageEl.clientHeight;
        if (totalScroll > 0) {
          const current = (pageEl.scrollTop / totalScroll) * 100;
          setScrollProgress(Math.min(100, Math.max(0, current)));
        }

        // Active heading detection
        const headingEls = pageEl.querySelectorAll('.editorial-body-content h1, .editorial-body-content h2, .editorial-body-content h3');
        const containerTop = pageEl.getBoundingClientRect().top;
        let currentActiveId = '';
        headingEls.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.top - containerTop <= 180) {
            currentActiveId = el.id;
          }
        });
        if (currentActiveId) {
          setActiveHeadingId(currentActiveId);
        }
      }
    };

    const pageEl = document.getElementById('page-blogs');
    if (pageEl) {
      pageEl.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (pageEl) pageEl.removeEventListener('scroll', handleScroll);
    };
  }, [selectedBlog]);

  const handleSelectArticle = (blog) => {
    setSelectedBlog(blog);
    setScrollProgress(0);
    window.location.hash = `#page-blogs/${blog.slug}`;
    const pageEl = document.getElementById('page-blogs');
    if (pageEl) pageEl.scrollTop = 0;
  };

  const handleBackToFeed = () => {
    setSelectedBlog(null);
    window.location.hash = '#page-blogs';
    const pageEl = document.getElementById('page-blogs');
    if (pageEl) pageEl.scrollTop = 0;
  };

  const loadLiveBlogs = async () => {
    setLoading(true);
    try {
      const data = await fetchPublishedBlogs();
      setBlogs(data || []);
    } catch (err) {
      console.error('Failed to load published blogs:', err);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Diplomacy', 'Debates', 'Civics', 'Entrepreneurship', 'Geopolitics'];

  const filteredBlogs = blogs.filter(b => {
    const matchesCat = categoryFilter === 'All' || b.category === categoryFilter;
    const matchesSearch = (b.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (b.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (b.author || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopyShareLink = (slug) => {
    const fullUrl = `${window.location.origin}/#page-blogs/${slug || ''}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleShareTwitter = (blog) => {
    const text = encodeURIComponent(`Read "${blog.title}" on the YANF Diplomatic Journal:`);
    const url = encodeURIComponent(`${window.location.origin}/#page-blogs/${blog.slug || ''}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareLinkedIn = (blog) => {
    const url = encodeURIComponent(`${window.location.origin}/#page-blogs/${blog.slug || ''}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handleShareWhatsApp = (blog) => {
    const text = encodeURIComponent(`*${blog.title}* - Read on YANF: ${window.location.origin}/#page-blogs/${blog.slug || ''}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Helper to inject ID anchors into HTML content for Table of Contents & normalize spaces
  const processedContent = useMemo(() => {
    if (!selectedBlog?.content) return { html: '', headings: [] };
    // Normalize non-breaking spaces (&nbsp;, \u00A0) into normal wrap-friendly spaces
    const normalizedHtml = (selectedBlog.content || '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\u00A0/g, ' ')
      .replace(/&#160;/g, ' ');

    const parser = new DOMParser();
    const doc = parser.parseFromString(normalizedHtml, 'text/html');
    const nodes = doc.querySelectorAll('h1, h2, h3');
    const headings = [];

    nodes.forEach((node, idx) => {
      const text = node.textContent.trim();
      if (text) {
        const id = `toc-heading-${idx}`;
        node.setAttribute('id', id);
        headings.push({
          id,
          text,
          level: node.tagName.toLowerCase()
        });
      }
    });

    return {
      html: doc.body.innerHTML,
      headings
    };
  }, [selectedBlog?.content]);

  const scrollToHeading = (id) => {
    const pageEl = document.getElementById('page-blogs');
    const targetEl = document.getElementById(id);
    if (pageEl && targetEl) {
      const targetOffset = targetEl.offsetTop - 120;
      pageEl.scrollTo({ top: targetOffset, behavior: 'smooth' });
      setActiveHeadingId(id);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="editorial-page-wrapper">
        <div className="editorial-ambient-bg" />
        <div className="page-inner" style={{ textAlign: 'center', padding: '140px 20px', maxWidth: '1440px' }}>
          <div className="event-tag" style={{ color: 'var(--ice)', marginBottom: '16px' }}>
            Diplomatic Journal
          </div>
          <h1 style={{ fontSize: '36px', color: '#ffffff', marginBottom: '16px' }}>Loading Publications...</h1>
          <p style={{ color: 'var(--ink-dim)', maxWidth: '480px', margin: '0 auto' }}>
            Fetching briefing packs, policy papers, and debate masterclasses.
          </p>
        </div>
      </div>
    );
  }

  // Under Construction fallback if 0 live articles
  if (blogs.length === 0) {
    return (
      <UnderConstruction
        kicker="More · Editorial & Blogs"
        title="The YANF Diplomatic Journal & Blog Feed"
        badge="Under Construction • Launching Soon"
        description="We are preparing our live publication hub where YANF mentors, guest diplomats, and delegate writers publish long-form geopolitical analysis, MUN briefing packs, policy commentary, and debate strategy."
        bgMedia="yanf-wall.svg"
        onNavigate={onNavigate}
        features={[
          { tag: "EDITORIAL 01", heading: "Geopolitical Briefings", text: "Weekly deep dives into active conflict zones, sanctions, and economic alliances." },
          { tag: "EDITORIAL 02", heading: "Debate Masterclasses", text: "Tactical guides on AP/BP motions, POI strategies, and resolution drafting." },
          { tag: "EDITORIAL 03", heading: "Delegate Spotlights", text: "Featured research papers and position pieces written by outstanding delegates." }
        ]}
      />
    );
  }

  // =========================================================================
  // 📖 REDESIGNED WORLD-CLASS EDITORIAL ARTICLE EXPERIENCE
  // =========================================================================
  if (selectedBlog) {
    const nextArticles = blogs.filter(b => b._id !== selectedBlog._id).slice(0, 3);
    const { html, headings } = processedContent;

    return (
      <div className="editorial-page-wrapper" ref={readerTopRef}>
        
        {/* 1. TOP STICKY READING PROGRESS & NAVIGATION BAR */}
        <nav className="editorial-sticky-nav">
          <div className="editorial-sticky-nav-inner">
            <button
              type="button"
              onClick={handleBackToFeed}
              className="editorial-nav-back-link"
            >
              <span>←</span> Dispatches Feed
            </button>

            <div className="editorial-nav-center-title">
              <span className="editorial-nav-category">{selectedBlog.category || 'Diplomacy'}</span>
              <span className="editorial-nav-bullet">•</span>
              <span className="editorial-nav-article-name">{selectedBlog.title}</span>
            </div>

            <div className="editorial-nav-actions">
              <button
                type="button"
                onClick={() => handleCopyShareLink(selectedBlog.slug)}
                className="editorial-nav-action-btn"
                title="Copy Article Permalink"
              >
                {copiedLink ? '✓ Copied' : '🔗 Share'}
              </button>
            </div>
          </div>

          {/* PROGRESS LINE */}
          <div className="editorial-nav-progress-track">
            <div 
              className="editorial-nav-progress-bar"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        </nav>

        {/* 2. ATMOSPHERIC AMBIENT GLOW BACKDROP */}
        <div className="editorial-ambient-bg" />

        {/* 3. MAIN CINEMATIC ARTICLE WRAPPER */}
        <div className="editorial-reader-container">
          
          {/* A. HERO SECTION */}
          <header className="editorial-hero-header">
            
            <div className="editorial-hero-meta-top">
              <span className="editorial-radiant-badge">
                <span className="radiant-dot" />
                {selectedBlog.category || 'Diplomacy & Strategy'}
              </span>
              <span className="editorial-meta-divider">•</span>
              <span className="editorial-read-time-pill">
                ⏱️ {selectedBlog.readTime || '4 min read'}
              </span>
              <span className="editorial-meta-divider">•</span>
              <span className="editorial-verified-badge">
                🛡️ Verified Diplomatic Brief
              </span>
            </div>

            <h1 className="editorial-hero-title">
              {selectedBlog.title}
            </h1>

            {selectedBlog.summary && (
              <p className="editorial-hero-lead">
                {selectedBlog.summary}
              </p>
            )}

            {/* AUTHOR BYLINE STRIP */}
            <div className="editorial-hero-byline-strip">
              <div className="editorial-hero-author-group">
                <div className="editorial-hero-avatar">
                  {selectedBlog.author ? selectedBlog.author[0].toUpperCase() : 'Y'}
                </div>
                <div>
                  <div className="editorial-hero-author-name">
                    {selectedBlog.author || 'YANF Editorial Board'}
                  </div>
                  <div className="editorial-hero-author-role">
                    Diplomatic Correspondent &bull; Published {new Date(selectedBlog.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* QUICK SOCIAL SHARE BAR */}
              <div className="editorial-hero-share-group">
                <button
                  type="button"
                  onClick={() => handleCopyShareLink(selectedBlog.slug)}
                  className="editorial-hero-share-btn"
                  title="Copy Link"
                >
                  {copiedLink ? '✓ Copied' : '🔗 Copy'}
                </button>
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(selectedBlog)}
                  className="editorial-hero-share-btn whatsapp"
                  title="Share to WhatsApp"
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => handleShareTwitter(selectedBlog)}
                  className="editorial-hero-share-btn twitter"
                  title="Share to X (Twitter)"
                >
                  𝕏 Post
                </button>
                <button
                  type="button"
                  onClick={() => handleShareLinkedIn(selectedBlog)}
                  className="editorial-hero-share-btn linkedin"
                  title="Share to LinkedIn"
                >
                  LinkedIn
                </button>
              </div>
            </div>

            {/* FEATURED HERO COVER IMAGE */}
            {selectedBlog.coverImage?.url && (
              <figure className="editorial-hero-media-card">
                <div className="editorial-media-wrapper">
                  <img 
                    src={selectedBlog.coverImage.url} 
                    alt={selectedBlog.coverImage.altText || selectedBlog.title}
                    className="editorial-media-img"
                  />
                </div>
                {selectedBlog.coverImage.altText && (
                  <figcaption className="editorial-media-caption">
                    <span className="caption-icon">📷</span>
                    <span>{selectedBlog.coverImage.altText}</span>
                  </figcaption>
                )}
              </figure>
            )}

          </header>

          {/* B. MAIN TWO-COLUMN READING ECOSYSTEM */}
          <div className="editorial-content-layout">
            
            {/* LEFT FLOATING READING COMPANION (STICKY) */}
            <aside className="editorial-companion-sidebar">
              
              {/* READING PROGRESS CARD */}
              <div className="companion-glass-card">
                <div className="companion-card-label">Reading Progress</div>
                <div className="companion-progress-readout">
                  <div className="progress-circular-indicator">
                    <svg viewBox="0 0 36 36" className="circular-chart">
                      <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path 
                        className="circle" 
                        strokeDasharray={`${Math.round(scrollProgress)}, 100`} 
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      />
                    </svg>
                    <span className="progress-percent-text">{Math.round(scrollProgress)}%</span>
                  </div>
                  <div>
                    <div className="progress-time-text">{selectedBlog.readTime || '4 min read'}</div>
                    <div className="progress-sub-text">Estimated time</div>
                  </div>
                </div>
              </div>

              {/* TABLE OF CONTENTS (IF HEADINGS EXIST) */}
              {headings.length > 0 && (
                <div className="companion-glass-card">
                  <div className="companion-card-label">Contents Outline</div>
                  <nav className="companion-toc-nav">
                    {headings.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => scrollToHeading(h.id)}
                        className={`companion-toc-link ${h.level} ${activeHeadingId === h.id ? 'active' : ''}`}
                      >
                        <span className="toc-bullet">&rsaquo;</span>
                        <span className="toc-text">{h.text}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              )}

              {/* FONT SIZE & READING COMFORT TOOLS */}
              <div className="companion-glass-card">
                <div className="companion-card-label">Typography Scale</div>
                <div className="companion-font-buttons">
                  <button
                    type="button"
                    onClick={() => setFontSizeMultiplier(0.92)}
                    className={`font-scale-btn ${fontSizeMultiplier === 0.92 ? 'active' : ''}`}
                    title="Compact Font Size"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSizeMultiplier(1)}
                    className={`font-scale-btn ${fontSizeMultiplier === 1 ? 'active' : ''}`}
                    title="Default Font Size"
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSizeMultiplier(1.14)}
                    className={`font-scale-btn ${fontSizeMultiplier === 1.14 ? 'active' : ''}`}
                    title="Large Comfortable Font Size"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* TOPICS / TAGS */}
              {selectedBlog.metaKeywords && (
                <div className="companion-glass-card">
                  <div className="companion-card-label">Indexed Topics</div>
                  <div className="companion-tags-wrap">
                    {selectedBlog.metaKeywords.split(',').map((tag, idx) => (
                      <span key={idx} className="companion-tag-chip">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </aside>

            {/* MAIN EDITORIAL READING CANVAS */}
            <main className="editorial-main-canvas">
              
              <article className="editorial-reading-glass-canvas">
                
                {/* EXECUTIVE BRIEFING SUMMARY CALLOUT */}
                {selectedBlog.summary && (
                  <div className="editorial-executive-briefing-box">
                    <div className="briefing-box-header">
                      <span className="briefing-icon">🏛️</span>
                      <span className="briefing-title">Executive Briefing & Key Premise</span>
                    </div>
                    <p className="briefing-content">
                      {selectedBlog.summary}
                    </p>
                  </div>
                )}

                {/* RICH ARTICLE BODY */}
                <div 
                  className="editorial-body-content"
                  style={{ 
                    fontSize: `${1.12 * fontSizeMultiplier}rem`,
                    wordBreak: 'normal',
                    overflowWrap: 'normal',
                    wordWrap: 'normal',
                    whiteSpace: 'normal',
                    hyphens: 'none',
                    WebkitHyphens: 'none'
                  }}
                  dangerouslySetInnerHTML={{ __html: html || '' }}
                />

                {/* ARTICLE END DECORATIVE DIVIDER */}
                <div className="editorial-end-marker">
                  <span className="marker-line" />
                  <span className="marker-symbol">✦ &nbsp; ✦ &nbsp; ✦</span>
                  <span className="marker-line" />
                </div>

                {/* AUTHOR SPOTLIGHT BIO CARD */}
                <div className="editorial-author-spotlight-card">
                  <div className="spotlight-avatar">
                    {selectedBlog.author ? selectedBlog.author[0].toUpperCase() : 'Y'}
                  </div>
                  <div className="spotlight-details">
                    <div className="spotlight-header">
                      <h4 className="spotlight-name">{selectedBlog.author || 'YANF Editorial Board'}</h4>
                      <span className="spotlight-badge">Diplomatic Correspondent</span>
                    </div>
                    <p className="spotlight-bio">
                      Authoritative research, geopolitical debate motions, and Model UN committee briefings curated for next-generation negotiators across the Youth As Nations' Front global network.
                    </p>
                    <div className="spotlight-actions">
                      <a 
                        href="#page-contact" 
                        onClick={(e) => { e.preventDefault(); onNavigate('page-contact'); }}
                        className="spotlight-contact-btn"
                      >
                        Contact Author Desk &rarr;
                      </a>
                    </div>
                  </div>
                </div>

              </article>

              {/* C. NEXT DISPATCHES / RELATED PUBLICATIONS */}
              {nextArticles.length > 0 && (
                <section className="editorial-recommendations-section">
                  <div className="recommendations-header">
                    <span className="recommendations-kicker">Continued Reading</span>
                    <h3 className="recommendations-title">More from the Diplomatic Journal</h3>
                  </div>

                  <div className="editorial-recommendations-grid">
                    {nextArticles.map((nextBlog) => (
                      <div
                        key={nextBlog._id}
                        onClick={() => handleSelectArticle(nextBlog)}
                        className="recommendation-card"
                      >
                        {nextBlog.coverImage?.url && (
                          <div className="recommendation-img-wrap">
                            <img 
                              src={nextBlog.coverImage.url} 
                              alt={nextBlog.title} 
                              className="recommendation-img"
                            />
                            <span className="recommendation-category-pill">
                              {nextBlog.category || 'Diplomacy'}
                            </span>
                          </div>
                        )}
                        <div className="recommendation-card-body">
                          <div className="recommendation-meta-row">
                            <span>⏱️ {nextBlog.readTime || '3 min'}</span>
                            <span>&bull;</span>
                            <span>{new Date(nextBlog.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                          </div>
                          <h4 className="recommendation-card-title">
                            {nextBlog.title}
                          </h4>
                          <p className="recommendation-card-excerpt">
                            {nextBlog.summary}
                          </p>
                          <div className="recommendation-card-footer">
                            <span className="author-name">{nextBlog.author || 'YANF'}</span>
                            <span className="read-link">Read Dispatch &rarr;</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* D. DELEGATE INVITATION CTA BANNER */}
              <div className="editorial-bottom-cta-banner">
                <div className="cta-banner-content">
                  <span className="cta-banner-tag">Youth As Nations' Front</span>
                  <h3 className="cta-banner-heading">Take your seat at the diplomatic table.</h3>
                  <p className="cta-banner-desc">
                    Access committee briefing packs, participate in parliamentary debates, and hone negotiation strategy with international mentors.
                  </p>
                </div>
                <div className="cta-banner-buttons">
                  <a 
                    className="btn solid" 
                    href="#page-contact" 
                    onClick={(e) => { e.preventDefault(); onNavigate('page-contact'); }}
                  >
                    Register as Delegate
                  </a>
                  <button 
                    type="button" 
                    className="btn" 
                    onClick={handleBackToFeed}
                    style={{ background: 'transparent' }}
                  >
                    View All Dispatches
                  </button>
                </div>
              </div>

            </main>

          </div>

          <footer className="editorial-footer-tagline">
            YANF — Youth as Nations' Front &nbsp;|&nbsp; Where Potential Meets Purpose.
          </footer>

        </div>
      </div>
    );
  }

  // =========================================================================
  // 📰 PUBLIC EDITORIAL FEED (FULL WIDESCREEN GRID)
  // =========================================================================
  const featuredArticle = filteredBlogs[0];
  const regularArticles = filteredBlogs.slice(1);

  return (
    <div className="editorial-page-wrapper">
      <div className="editorial-ambient-bg" />

      <div className="page-inner" style={{ maxWidth: '1440px', margin: '0 auto', position: 'relative', zIndex: 2, padding: 'calc(var(--nav-h) + 4vh) 5vw 14vh' }}>
        
        {/* HERO SECTION */}
        <div className="kicker">More · Editorial &amp; Publications</div>
        <h1 style={{ fontSize: 'clamp(2.4rem, 5.2vw, 4.4rem)', fontWeight: '700', color: '#ffffff', lineHeight: '1.15', margin: '0 0 16px 0' }}>
          The YANF Diplomatic Journal
        </h1>
        <p className="lede" style={{ maxWidth: '720px', marginBottom: '40px' }}>
          Authoritative policy briefs, Model UN strategy guides, and geopolitical commentary authored by YANF mentors, guest diplomats, and delegate scholars.
        </p>

        {/* CONTROLS: CATEGORIES & SEARCH */}
        <div style={{ margin: '0 0 44px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          
          {/* CATEGORY TABS */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`editorial-filter-pill ${categoryFilter === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* SEARCH BAR */}
          <div style={{ width: '100%', maxWidth: '380px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-dim)', fontSize: '14px' }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by topic, keyword, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="editorial-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--ink-dim)', cursor: 'pointer', fontSize: '13px' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* FEED CONTENT */}
        {filteredBlogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 20px', border: '1px dashed var(--line)', borderRadius: '20px', background: 'rgba(8, 17, 26, 0.4)', margin: '40px 0' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
            <h3 style={{ color: '#ffffff', marginBottom: '8px', fontSize: '18px' }}>No dispatches match your query</h3>
            <p style={{ color: 'var(--ink-dim)', fontSize: '14px', maxWidth: '420px', margin: '0 auto 20px auto' }}>
              Try selecting another category filter or clearing your search keywords.
            </p>
            <button
              type="button"
              className="btn"
              onClick={() => { setCategoryFilter('All'); setSearchQuery(''); }}
              style={{ cursor: 'pointer' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div>
            
            {/* FEATURED LEAD ARTICLE CARD */}
            {featuredArticle && (
              <div 
                onClick={() => handleSelectArticle(featuredArticle)}
                className="editorial-hero-lead-card"
              >
                {featuredArticle.coverImage?.url && (
                  <div className="editorial-hero-cover-wrap">
                    <img 
                      src={featuredArticle.coverImage.url} 
                      alt={featuredArticle.title}
                      className="editorial-hero-cover-img"
                    />
                  </div>
                )}

                <div style={{ padding: 'clamp(24px, 4vw, 44px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                  <div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                      <span className="editorial-category-badge">
                        {featuredArticle.category || 'Featured Dispatch'}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--ink-dim)', fontFamily: 'var(--mono)' }}>
                        • {featuredArticle.readTime || '4 min read'}
                      </span>
                    </div>

                    <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: '700', color: '#ffffff', lineHeight: '1.25', marginBottom: '14px' }}>
                      {featuredArticle.title}
                    </h2>

                    <p style={{ color: 'var(--ink-dim)', fontSize: '15.5px', lineHeight: '1.65', marginBottom: '24px' }}>
                      {featuredArticle.summary}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '18px', borderTop: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="editorial-author-avatar" style={{ width: '34px', height: '34px', fontSize: '13px' }}>
                        {featuredArticle.author ? featuredArticle.author[0].toUpperCase() : 'Y'}
                      </div>
                      <span style={{ fontSize: '14px', color: '#ffffff', fontWeight: '500' }}>
                        {featuredArticle.author || 'YANF Editorial'}
                      </span>
                    </div>
                    <span style={{ color: 'var(--ice)', fontSize: '13.5px', fontFamily: 'var(--mono)', fontWeight: '700', letterSpacing: '0.05em' }}>
                      Read Dispatch →
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* REGULAR ARTICLES GRID */}
            {regularArticles.length > 0 && (
              <>
                <div className="sec-title" style={{ marginBottom: '24px' }}>
                  Latest Publications &amp; Briefs
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px', marginBottom: '56px' }}>
                  {regularArticles.map((blog) => (
                    <div
                      key={blog._id}
                      onClick={() => handleSelectArticle(blog)}
                      className="editorial-grid-card"
                    >
                      {blog.coverImage?.url && (
                        <div style={{ height: '200px', overflow: 'hidden', background: '#02060b' }}>
                          <img 
                            src={blog.coverImage.url} 
                            alt={blog.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} 
                            className="card-hover-zoom"
                          />
                        </div>
                      )}

                      <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--ice)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                              {blog.category || 'Dispatch'}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--ink-dim)', fontFamily: 'var(--mono)' }}>
                              ⏱️ {blog.readTime || '3 min'}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '18.5px', fontWeight: '700', color: '#ffffff', lineHeight: '1.35', marginBottom: '10px' }}>
                            {blog.title}
                          </h3>

                          <p style={{ fontSize: '13.5px', color: 'var(--ink-dim)', lineHeight: '1.6', marginBottom: '18px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {blog.summary}
                          </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--line)', fontSize: '12.5px' }}>
                          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>
                            {blog.author || 'YANF'}
                          </span>
                          <span style={{ color: 'var(--ice)', fontFamily: 'var(--mono)', fontWeight: '600' }}>
                            Read →
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        )}

        <div className="tagline-foot" style={{ textAlign: 'center', marginTop: '64px' }}>
          YANF — Youth as Nations' Front &nbsp;|&nbsp; Where Potential Meets Purpose.
        </div>
      </div>
    </div>
  );
}
