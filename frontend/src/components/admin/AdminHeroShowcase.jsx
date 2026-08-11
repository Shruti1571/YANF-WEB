import React from 'react';

export default function AdminHeroShowcase() {
  return (
    <div className="admin-left-showcase">
      <video src="/scene-01.mp4" autoPlay muted loop playsInline></video>

      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <strong style={{ letterSpacing: '0.3em', fontSize: '18px', fontWeight: 600 }}>Y A N F</strong>
          <span style={{ height: '12px', width: '1px', background: 'var(--line)' }}></span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--ice)', letterSpacing: '0.2em' }}>EDITORIAL TERMINAL</span>
        </div>

        <h1 className="admin-hero-title">
          The Diplomatic <span>Editorial</span> Command Center.
        </h1>

        <p style={{ marginTop: '20px', maxWidth: '44ch', fontSize: '1.05rem', color: 'var(--ink-dim)', lineHeight: '1.7', fontWeight: 300 }}>
          Authoritative publication platform for YANF mentors and geopolitical analysts. Managing MUN briefing packs, policy commentary, and debate strategy.
        </p>
      </div>

      <div style={{ position: 'relative', zIndex: 2, marginTop: '40px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--ice)', marginBottom: '12px' }}>
          PUBLICATION PILLARS
        </div>
        <div className="editorial-pillars-row">
          <div className="pillar-pill"><strong>01</strong> Diplomacy</div>
          <div className="pillar-pill"><strong>02</strong> Debates</div>
          <div className="pillar-pill"><strong>03</strong> Civics</div>
          <div className="pillar-pill"><strong>04</strong> Geopolitics</div>
        </div>
      </div>
    </div>
  );
}
