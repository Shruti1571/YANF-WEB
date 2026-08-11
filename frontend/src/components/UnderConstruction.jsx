import React from 'react';

export default function UnderConstruction({ kicker, title, badge, description, features, bgMedia = 'yanf-wall.svg', onNavigate }) {
  const renderBgMedia = (bgFile) => {
    const isImage = /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(bgFile);
    if (isImage) {
      return <img src={`/${bgFile}`} alt="" />;
    }
    return <video src={`/${bgFile}`} muted loop autoPlay playsInline />;
  };

  return (
    <>
      <div className="page-bg">{renderBgMedia(bgMedia)}</div>
      <div className="page-inner">
        <div className="kicker">{kicker}</div>
        <h1>{title}</h1>
        <div className="event-tag" style={{ color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 10px var(--gold)' }}></span>
          {badge || 'Under Construction • Launching Soon'}
        </div>

        <p className="lede">{description}</p>

        {features && features.length > 0 && (
          <>
            <div className="sec-title">What to Expect</div>
            <div className="info-grid">
              {features.map((feat, idx) => (
                <div className="cell" key={idx}>
                  <h3>{feat.tag || `Feature 0${idx + 1}`}</h3>
                  <p><strong>{feat.heading}</strong></p>
                  <p style={{ marginTop: '8px' }}>{feat.text}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="cta-band" style={{ marginTop: '48px', borderLeft: '3px solid var(--gold)' }}>
          <h4>We are crafting a state-of-the-art experience for our delegates and partner institutions.</h4>
          <p style={{ color: 'var(--ink-dim)', fontSize: '0.95rem' }}>Want early access or announcements? Subscribe to updates or get in touch with our editorial and events team.</p>
          <div className="cta-row" style={{ marginTop: '12px' }}>
            <a className="btn solid" href="#page-contact" onClick={(e) => { e.preventDefault(); onNavigate('page-contact'); }}>
              Get in touch
            </a>
            <a className="btn" href="#top" onClick={(e) => { e.preventDefault(); onNavigate('top'); }}>
              Back to Home
            </a>
          </div>
        </div>

        <div className="tagline-foot">YANF — Youth as Nations' Front &nbsp;|&nbsp; Where Potential Meets Purpose.</div>
      </div>
    </>
  );
}
