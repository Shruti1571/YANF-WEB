import React, { useState, useEffect } from 'react';

export default function Navbar({ onNavigate, onOpenMobileMenu }) {
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    const handleOutsideClick = () => setOpenDropdown(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const toggleDropdown = (e, name) => {
    e.stopPropagation();
    setOpenDropdown(prev => prev === name ? null : name);
  };

  const handleLinkClick = (e, path) => {
    e.preventDefault();
    setOpenDropdown(null);
    onNavigate(path);
  };

  return (
    <nav id="topnav">
      <a className="brand" href="#top" onClick={(e) => handleLinkClick(e, 'top')}>
        <b>YANF</b><span>YOUTH AS NATIONS' FRONT</span>
      </a>
      <div className="nav-links">
        <div className="nav-item">
          <a href="#page-about" onClick={(e) => handleLinkClick(e, 'page-about')}>About</a>
        </div>
        <div className={`nav-item ${openDropdown === 'events' ? 'open' : ''}`}>
          <button type="button" onClick={(e) => toggleDropdown(e, 'events')}>
            Events <span className="caret">▼</span>
          </button>
          <div className="dropdown">
            <a href="#page-mun" onClick={(e) => handleLinkClick(e, 'page-mun')}>Model United Nations</a>
            <a href="#page-debates" onClick={(e) => handleLinkClick(e, 'page-debates')}>Parliamentary Debates</a>
            <a href="#page-youth-parliament" onClick={(e) => handleLinkClick(e, 'page-youth-parliament')}>Youth Parliament</a>
            <a href="#page-innovation" onClick={(e) => handleLinkClick(e, 'page-innovation')}>Innovation Assembly</a>
          </div>
        </div>
        <div className={`nav-item ${openDropdown === 'more' ? 'open' : ''}`}>
          <button type="button" onClick={(e) => toggleDropdown(e, 'more')}>
            More <span className="caret">▼</span>
          </button>
          <div className="dropdown">
            <a href="#page-resources" onClick={(e) => handleLinkClick(e, 'page-resources')}>Resources</a>
            <a href="#page-contact" onClick={(e) => handleLinkClick(e, 'page-contact')}>Contact</a>
          </div>
        </div>
      </div>
      <button id="hamburger" type="button" onClick={onOpenMobileMenu}>Menu</button>
    </nav>
  );
}
