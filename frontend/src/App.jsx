import React, { useState, useEffect, useCallback } from 'react';
import Home from './components/assembly/Home';
import { AssemblyNav } from './components/assembly/common';
import PageOverlays from './components/PageOverlays';
import './styles/main.css';
import './styles/desk.css';
import './styles/assembly.css';
import './styles/ia.css';
import './styles/gallery.css';

const TITLES = {
  'page-about': 'About', 'page-mun': 'Model United Nations', 'page-debates': 'Parliamentary Debates', 'page-youth-parliament': 'Youth Parliament',
  'page-innovation': 'Innovation Assembly', 'page-resources': 'Resources', 'page-certificates': 'Certificates', 'page-blogs': 'Blogs',
  'page-hall-of-fame': 'Hall of Fame', 'page-gallery': 'Gallery', 'page-contact': 'Contact', 'page-admin': 'Admin',
};

export default function App() {
  const [activePage, setActivePage] = useState(null);

  // Hash & permalink routing (#page-*, #page-blogs/<slug>, /blog/<slug>)
  useEffect(() => {
    if (window.location.pathname.startsWith('/blog/')) {
      const directSlug = window.location.pathname.replace('/blog/', '').replace(/\/$/, '');
      if (directSlug) window.location.hash = `#page-blogs/${directSlug}`;
    }
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#page-')) {
        setActivePage(hash.slice(1).split('/')[0].split('?')[0]);
      } else if (hash.startsWith('#blog/')) {
        window.location.hash = `#page-blogs/${hash.replace('#blog/', '')}`;
      } else {
        setActivePage(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    document.body.style.overflow = activePage ? 'hidden' : '';
    document.documentElement.classList.toggle('as-in-page', !!activePage);
    document.title = activePage ? `${TITLES[activePage] || 'YANF'} | YANF` : "YANF | Youth As Nations' Front";
  }, [activePage]);

  const navigateTo = useCallback((path) => {
    if (path === 'top') {
      if (window.location.hash) window.history.pushState(null, '', window.location.pathname);
      setActivePage(null);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
      window.location.hash = path;
    }
  }, []);

  const closePage = useCallback(() => navigateTo('top'), [navigateTo]);
  const isAdmin = activePage === 'page-admin';

  return (
    <div className="app-container as-app">
      {!isAdmin && <AssemblyNav onNavigate={navigateTo} activePage={activePage} />}
      <Home onNavigate={navigateTo} paused={!!activePage} />
      <PageOverlays activePage={activePage} onClose={closePage} onNavigate={navigateTo} />
    </div>
  );
}
