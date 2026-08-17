import React, { useState, useEffect, useRef } from 'react';
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

  // Scroll listener for reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const pageEl = document.getElementById('page-blogs');
      if (pageEl && selectedBlog) {
        const totalScroll = pageEl.scrollHeight - pageEl.clientHeight;
        if (totalScroll > 0) {
          const current = (pageEl.scrollTop / totalScroll) * 100;
          setScrollProgress(Math.min(100, Math.max(0, current)));
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
    const url = encodeURIComponent(`https://yanfglobal.com/blog/${blog.slug || ''}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareLinkedIn = (blog) => {
    const url = encodeURIComponent(`https://yanfglobal.com/blog/${blog.slug || ''}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handleShareWhatsApp = (blog) => {
    const text = encodeURIComponent(`*${blog.title}* - Read on YANF: https://yanfglobal.com/blog/${blog.slug || ''}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Helper to extract headings from content for Table of Contents
  const extractHeadings = (htmlContent) => {
    if (!htmlContent) return [];
    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    const nodes = div.querySelectorAll('h1, h2, h3');
    const list = [];
    nodes.forEach((node, i) => {
      const text = node.textContent.trim();
      if (text) {
        list.push({ id: `heading-${i}`, text: text, level: node.tagName.toLowerCase() });
      }
    });
    return list;
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

  // ==========================================
  // 📖 LUXURY ARTICLE READER EXPERIENCE (3-COLUMN WIDESCREEN)
  // ==========================================
  if (selectedBlog) {
    const nextArticles = blogs.filter(b => b._id !== selectedBlog._id).slice(0, 3);
    const headings = extractHeadings(selectedBlog.content);

    return (
      <div className="editorial-page-wrapper" ref={readerTopRef}>
        
        {/* READING PROGRESS BAR (FIXED AT TOP) */}
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '3px',
            width: `${scrollProgress}%`,
            background: 'linear-gradient(90deg, #2563eb, #8fd0ff, #fbbf24)',
            zIndex: 9999,
            transition: 'width 0.1s ease',
            boxShadow: '0 0 12px rgba(143, 208, 255, 0.9)'
          }} 
        />

        {/* LUXURY AMBIENT BACKGROUND */}
        <div className="editorial-ambient-bg" />

        <div className="editorial-widescreen-container">
          
          {/* ================= LEFT SIDEBAR (STICKY CONTROLS & TOC) ================= */}
          <aside className="editorial-sidebar-left">
            
            {/* BACK BUTTON */}
            <button
              type="button"
              onClick={handleBackToFeed}
              className="editorial-back-btn"
              style={{ width: '100%', justifyContent: 'center', marginBottom: '24px' }}
            >
              <span>←</span> All Dispatches
            </button>

            {/* READING METRICS CARD */}
            <div className="editorial-sidebar-card">
              <div style={{ fontSize: '11px', color: 'var(--ink-dim)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '10px' }}>
                Reading Progress
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--ice)', fontFamily: 'var(--display)' }}>
                  {Math.round(scrollProgress)}%
                </span>
                <span style={{ fontSize: '12px', color: 'var(--ink-dim)' }}>completed</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(238, 244, 248, 0.08)', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ height: '100%', width: `${scrollProgress}%`, background: 'var(--ice)', transition: 'width 0.15s ease' }} />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⏱️</span> {selectedBlog.readTime || '4 min read'}
              </div>
            </div>

            {/* QUICK SOCIAL SHARE BAR */}
            <div className="editorial-sidebar-card">
              <div style={{ fontSize: '11px', color: 'var(--ink-dim)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '12px' }}>
                Share Article
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleCopyShareLink(selectedBlog.slug)}
                  className="editorial-share-icon-btn"
                  style={{ width: '100%', justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>🔗</span> {copiedLink ? '✓ Link Copied' : 'Copy Permalink'}
                </button>
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(selectedBlog)}
                  className="editorial-share-icon-btn"
                  style={{ width: '100%', justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>💬</span> WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => handleShareTwitter(selectedBlog)}
                  className="editorial-share-icon-btn"
                  style={{ width: '100%', justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>𝕏</span> Share on X
                </button>
                <button
                  type="button"
                  onClick={() => handleShareLinkedIn(selectedBlog)}
                  className="editorial-share-icon-btn"
                  style={{ width: '100%', justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>💼</span> LinkedIn
                </button>
              </div>
            </div>

            {/* TOPICS / TAGS */}
            {selectedBlog.metaKeywords && (
              <div className="editorial-sidebar-card">
                <div style={{ fontSize: '11px', color: 'var(--ink-dim)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '10px' }}>
                  Topics
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {selectedBlog.metaKeywords.split(',').map((tag, idx) => (
                    <span key={idx} className="editorial-topic-tag" style={{ fontSize: '11px', padding: '3px 10px' }}>
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </aside>

          {/* ================= CENTER COLUMN (MAIN EDITORIAL CANVAS) ================= */}
          <main className="editorial-main-content">
            
            <article className="editorial-article-card">
              
              {/* ARTICLE HERO HEADER */}
              <header style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <span className="editorial-category-badge">
                    {selectedBlog.category || 'Diplomacy'}
                  </span>
                  <span style={{ color: 'var(--line)', fontSize: '14px' }}>•</span>
                  <span style={{ fontSize: '12.5px', color: 'var(--ice)', fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
                    ⏱️ {selectedBlog.readTime || '4 min read'}
                  </span>
                </div>

                <h1 className="editorial-article-headline">
                  {selectedBlog.title}
                </h1>

                {selectedBlog.summary && (
                  <p className="editorial-article-lead">
                    {selectedBlog.summary}
                  </p>
                )}

                {/* AUTHOR & DATE BYLINE BAR */}
                <div className="editorial-byline-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className="editorial-author-avatar">
                      {selectedBlog.author ? selectedBlog.author[0].toUpperCase() : 'Y'}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '15px', letterSpacing: '-0.01em' }}>
                        {selectedBlog.author || 'YANF Editorial Board'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-dim)', fontFamily: 'var(--mono)', marginTop: '2px' }}>
                        Published {new Date(selectedBlog.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <span className="editorial-verified-pill">
                    ✓ Verified Dispatch
                  </span>
                </div>
              </header>

              {/* FEATURED COVER IMAGE */}
              {selectedBlog.coverImage?.url && (
                <figure className="editorial-cover-container">
                  <img 
                    src={selectedBlog.coverImage.url} 
                    alt={selectedBlog.coverImage.altText || selectedBlog.title}
                    className="editorial-cover-img"
                  />
                  {selectedBlog.coverImage.altText && (
                    <figcaption className="editorial-cover-caption">
                      📷 {selectedBlog.coverImage.altText}
                    </figcaption>
                  )}
                </figure>
              )}

              {/* RICH ARTICLE BODY CONTENT */}
              <div 
                className="editorial-body-content"
                dangerouslySetInnerHTML={{ __html: selectedBlog.content || '' }}
              />

              {/* AUTHOR BIO CARD */}
              <div className="editorial-author-bio-card">
                <div className="editorial-author-avatar" style={{ width: '52px', height: '52px', fontSize: '20px' }}>
                  {selectedBlog.author ? selectedBlog.author[0].toUpperCase() : 'Y'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, color: '#ffffff', fontSize: '16px', fontWeight: '700' }}>
                      {selectedBlog.author || 'YANF Editorial Board'}
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--gold)', fontFamily: 'var(--mono)', border: '1px solid rgba(200, 160, 80, 0.4)', padding: '1px 7px', borderRadius: '10px' }}>
                      Author
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                    Diplomatic policy analysis, debate methodology, and MUN briefing research published for the Youth As Nations' Front global delegation network.
                  </p>
                </div>
              </div>

            </article>

            {/* BOTTOM CALL TO ACTION */}
            <div className="cta-band" style={{ marginTop: '48px', borderLeft: '3px solid var(--ice)', background: 'rgba(8, 17, 26, 0.85)', borderRadius: '20px', padding: '36px 32px' }}>
              <div>
                <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700' }}>
                  Join the Diplomatic Assembly
                </h3>
                <p style={{ color: 'var(--ink-dim)', margin: 0, fontSize: '14px', maxWidth: '500px', lineHeight: '1.6' }}>
                  Receive full committee briefing packs, policy motions, and delegate invitations directly in your inbox.
                </p>
              </div>
              <div className="cta-row" style={{ marginTop: '12px' }}>
                <a className="btn solid" href="#page-contact" onClick={(e) => { e.preventDefault(); onNavigate('page-contact'); }}>
                  Write to Us
                </a>
                <button 
                  type="button" 
                  className="btn" 
                  onClick={handleBackToFeed}
                  style={{ cursor: 'pointer', background: 'transparent' }}
                >
                  All Articles
                </button>
              </div>
            </div>

          </main>

          {/* ================= RIGHT SIDEBAR (CORRESPONDENT & MORE DISPATCHES) ================= */}
          <aside className="editorial-sidebar-right">
            
            {/* CORRESPONDENT BADGE */}
            <div className="editorial-sidebar-card" style={{ textAlign: 'center', padding: '24px 20px' }}>
              <div className="editorial-author-avatar" style={{ margin: '0 auto 12px auto', width: '52px', height: '52px', fontSize: '18px' }}>
                {selectedBlog.author ? selectedBlog.author[0].toUpperCase() : 'Y'}
              </div>
              <h4 style={{ color: '#ffffff', fontSize: '15px', margin: '0 0 4px 0', fontWeight: '700' }}>
                {selectedBlog.author || 'YANF Editorial'}
              </h4>
              <p style={{ color: 'var(--ice)', fontSize: '11.5px', fontFamily: 'var(--mono)', margin: '0 0 14px 0' }}>
                Diplomatic Correspondent
              </p>
              <a 
                href="#page-contact" 
                onClick={(e) => { e.preventDefault(); onNavigate('page-contact'); }}
                className="btn"
                style={{ fontSize: '11px', padding: '7px 14px', width: '100%', justifyContent: 'center', display: 'inline-flex' }}
              >
                Contact Desk
              </a>
            </div>

            {/* MORE IN CATEGORY */}
            {nextArticles.length > 0 && (
              <div className="editorial-sidebar-card">
                <div style={{ fontSize: '11px', color: 'var(--ink-dim)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '14px' }}>
                  Related Dispatches
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {nextArticles.map((item) => (
                    <div 
                      key={item._id}
                      onClick={() => handleSelectArticle(item)}
                      style={{
                        padding: '12px',
                        background: 'rgba(6, 13, 20, 0.6)',
                        border: '1px solid var(--line)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ice)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.transform = 'none'; }}
                    >
                      {item.coverImage?.url && (
                        <div style={{ height: '90px', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px', background: '#02060b' }}>
                          <img src={item.coverImage.url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ fontSize: '10.5px', color: 'var(--ice)', fontFamily: 'var(--mono)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        {item.category || 'Article'} • {item.readTime || '3 min'}
                      </div>
                      <h5 style={{ color: '#ffffff', fontSize: '13px', margin: '0 0 4px 0', lineHeight: '1.35', fontWeight: '600' }}>
                        {item.title}
                      </h5>
                      <span style={{ fontSize: '11px', color: 'var(--ice)', fontFamily: 'var(--mono)' }}>
                        Read Brief →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* YANF FORUM WIDGET */}
            <div className="editorial-sidebar-card" style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(143, 208, 255, 0.05))', border: '1px solid rgba(143, 208, 255, 0.25)' }}>
              <div style={{ fontSize: '11px', color: 'var(--gold)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '6px' }}>
                YANF Simulation Hub
              </div>
              <h4 style={{ color: '#ffffff', fontSize: '14px', margin: '0 0 6px 0', fontWeight: '700' }}>
                Next-Gen Diplomacy
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--ink-dim)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                Register for upcoming MUN assemblies, debate masterclasses, and position paper workshops.
              </p>
              <a
                href="#page-contact"
                onClick={(e) => { e.preventDefault(); onNavigate('page-contact'); }}
                className="btn solid"
                style={{ fontSize: '11px', padding: '8px 14px', width: '100%', justifyContent: 'center', display: 'inline-flex' }}
              >
                Register as Delegate
              </a>
            </div>

          </aside>

        </div>
      </div>
    );
  }

  // ==========================================
  // 📰 PUBLIC EDITORIAL FEED (FULL WIDESCREEN GRID)
  // ==========================================
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
