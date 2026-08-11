import React, { useState, useEffect } from 'react';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import MobileMenu from './components/MobileMenu';
import VideoFilm from './components/VideoFilm';
import PageOverlays from './components/PageOverlays';
import './styles/main.css';

export default function App() {
  const [isLoaderDone, setIsLoaderDone] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaderDone(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Hash router state synchronization
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#page-')) {
        setActivePage(hash.slice(1));
        document.body.style.overflow = 'hidden';
      } else {
        setActivePage(null);
        document.body.style.overflow = '';
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // initial route check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (path) => {
    if (path === 'top') {
      window.location.hash = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.hash = path;
    }
  };

  const closePage = () => {
    window.location.hash = '';
  };

  return (
    <div className="app-container">
      <Loader isDone={isLoaderDone} />
      <Navbar
        onNavigate={navigateTo}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigate={navigateTo}
      />
      <VideoFilm onNavigate={navigateTo} />
      <PageOverlays
        activePage={activePage}
        onClose={closePage}
        onNavigate={navigateTo}
      />
    </div>
  );
}
