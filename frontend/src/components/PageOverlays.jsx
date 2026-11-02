import React, { useEffect, useRef } from 'react';
import HallOfFame from './HallOfFame';
import GalleryPage from './assembly/GalleryPage';
import AdminPanel from './AdminPanel';
import PublicBlogPage from './PublicBlogPage';
import PublicCertificateVerification from './PublicCertificateVerification';
import ProgramPage from './assembly/ProgramPage';
import IAPage from './assembly/IAPage';
import { AboutPage, ResourcesPage, ContactPage } from './assembly/InfoPages';
import { AssemblyFooter } from './assembly/common';

// Every inner page is a full-screen scroll container (kept for deep links such as
// #page-blogs/<slug> and #page-certificates?id=…). Only the open page is mounted.
const PAGES = [
  'page-about', 'page-mun', 'page-debates', 'page-youth-parliament', 'page-innovation', 'page-resources',
  'page-certificates', 'page-blogs', 'page-hall-of-fame', 'page-gallery', 'page-contact', 'page-admin',
];

export default function PageOverlays({ activePage, onClose, onNavigate }) {
  const refs = useRef({});

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !e.defaultPrevented && activePage && activePage !== 'page-admin' && !document.documentElement.classList.contains('as-menu-open')) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePage, onClose]);

  useEffect(() => {
    if (activePage && refs.current[activePage]) refs.current[activePage].scrollTop = 0;
  }, [activePage]);

  const render = (id) => {
    switch (id) {
      case 'page-about': return <AboutPage onNavigate={onNavigate} />;
      case 'page-mun':
      case 'page-debates':
      case 'page-youth-parliament': return <ProgramPage id={id} onNavigate={onNavigate} />;
      case 'page-innovation': return <IAPage onNavigate={onNavigate} />;
      case 'page-resources': return <ResourcesPage onNavigate={onNavigate} />;
      case 'page-certificates': return <div className="as-skin as-skin-cv"><PublicCertificateVerification onClose={onClose} /><AssemblyFooter onNavigate={onNavigate} /></div>;
      case 'page-blogs': return <div className="as-skin as-skin-blog"><PublicBlogPage onNavigate={onNavigate} /><AssemblyFooter onNavigate={onNavigate} /></div>;
      case 'page-hall-of-fame': return <div className="as-skin as-skin-hof"><HallOfFame onClose={onClose} onNavigate={onNavigate} /></div>;
      case 'page-gallery': return <GalleryPage onNavigate={onNavigate} />;
      case 'page-contact': return <ContactPage onNavigate={onNavigate} />;
      case 'page-admin': return <AdminPanel onNavigate={onNavigate} />;
      default: return null;
    }
  };

  return (
    <>
      {PAGES.map((id) => (
        <div key={id} id={id} data-lenis-prevent className={`page as-page ${activePage === id ? 'open' : ''}`} ref={(el) => { refs.current[id] = el; }} aria-hidden={activePage !== id}>
          {activePage === id && render(id)}
        </div>
      ))}
    </>
  );
}
