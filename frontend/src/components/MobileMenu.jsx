import React from 'react';

export default function MobileMenu({ isOpen, onClose, onNavigate }) {
  const handleLink = (e, path) => {
    e.preventDefault();
    onClose();
    onNavigate(path);
  };

  return (
    <div id="mobile-menu" className={isOpen ? 'open' : ''}>
      <button className="close-mm" type="button" onClick={onClose}>Close</button>
      <a href="#page-about" onClick={(e) => handleLink(e, 'page-about')}>About</a>
      <a href="#page-mun" className="sub" onClick={(e) => handleLink(e, 'page-mun')}>Events · Model United Nations</a>
      <a href="#page-debates" className="sub" onClick={(e) => handleLink(e, 'page-debates')}>Events · Parliamentary Debates</a>
      <a href="#page-youth-parliament" className="sub" onClick={(e) => handleLink(e, 'page-youth-parliament')}>Events · Youth Parliament</a>
      <a href="#page-innovation" className="sub" onClick={(e) => handleLink(e, 'page-innovation')}>Events · Innovation Assembly</a>
      <a href="#page-resources" onClick={(e) => handleLink(e, 'page-resources')}>Resources</a>
      <a href="#page-contact" onClick={(e) => handleLink(e, 'page-contact')}>Contact</a>
    </div>
  );
}
