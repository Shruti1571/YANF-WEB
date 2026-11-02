import React, { useState } from 'react';
import { SCENES } from '../data/scenes';
import { PROGRAMS, CONTACT_EMAIL } from '../data/programs';

const HERO = SCENES.find((s) => s.hero) || SCENES[0];
const CLIPPINGS = SCENES.filter((s) => !s.hero && !s.finale);
const TILTS = [-1.4, 0.9, -0.6, 1.3, -1.0, 0.7, -0.4, 1.1, -1.2, 0.5];

export default function DeskLanding({ onNavigate }) {
  const [folderOpen, setFolderOpen] = useState(false);
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [chambers, setChambers] = useState([]);
  const [stamped, setStamped] = useState(false);
  const [slipError, setSlipError] = useState('');

  const go = (e, path) => {
    e.preventDefault();
    onNavigate(path);
  };

  const toggleChamber = (short) => {
    setStamped(false);
    setChambers((prev) => (prev.includes(short) ? prev.filter((c) => c !== short) : [...prev, short]));
  };

  const stamp = () => {
    if (!name.trim()) {
      setSlipError('Write your name on the slip first.');
      return;
    }
    setSlipError('');
    setStamped(true);
  };

  const mailto = () => {
    const subject = `Application for a seat — ${name.trim()}`;
    const body = [
      `Name: ${name.trim()}`,
      `School: ${school.trim() || '—'}`,
      `Chamber(s): ${chambers.length ? chambers.join(', ') : 'Not sure yet'}`,
      '',
      'Please send me the next briefing pack, dates and registration details.',
    ].join('\n');
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <main id="top" className="dk">
      {/* ============ HERO: the briefing folder + application slip ============ */}
      <section className="dk-wrap dk-hero">
        <div className="dk-folder-wrap">
          <span className="dk-folder-tab" aria-hidden="true" />
          <span className="dk-folder-tab-label">File no. YANF/001</span>

          {!folderOpen ? (
            <div className="dk-folder">
              <div className="dk-folder-head">
                <p className="dk-type dk-muted">Briefing for delegates · {HERO.kicker}</p>
                <h1 className="dk-h1">
                  The world is a negotiation. <i>Learn to sit at the table.</i>
                </h1>
              </div>
              <span className="dk-folder-stamp" aria-hidden="true">For students</span>
              <div className="dk-folder-actions">
                <button type="button" className="dk-btn dk-btn-dark" onClick={() => setFolderOpen(true)} aria-expanded="false">
                  Open the briefing
                </button>
                <span className="dk-type dk-muted">4 chambers inside</span>
              </div>
            </div>
          ) : (
            <div className="dk-folder dk-folder-open">
              <div className="dk-folder-left">
                <div className="dk-memo">
                  <span className="dk-clip" aria-hidden="true" />
                  <p className="dk-type dk-muted">Memo</p>
                  <h1 className="dk-memo-title">The world is a negotiation. Learn to sit at the table.</h1>
                  <p>{HERO.text}</p>
                </div>
                <button type="button" className="dk-btn dk-btn-ghost" onClick={() => setFolderOpen(false)} aria-expanded="true">
                  Close the file
                </button>
              </div>
              <div className="dk-folder-right">
                <p className="dk-type dk-muted">Contents</p>
                {PROGRAMS.map((p) => (
                  <a key={p.page} className="dk-contents-row" href={`#${p.page}`} onClick={(e) => go(e, p.page)}>
                    <span className="dk-type dk-red">{p.no} · {p.tag}</span>
                    <span className="dk-contents-name">{p.name}</span>
                    <span className="dk-type dk-small">{p.facts}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="dk-slip-col">
          <form className="dk-slip" onSubmit={(e) => { e.preventDefault(); stamp(); }} noValidate>
            <p className="dk-type dk-muted dk-slip-title">Application for a seat</p>
            <label className="dk-field">
              <span>Name:</span>
              <input
                type="text"
                value={name}
                maxLength={60}
                autoComplete="name"
                onChange={(e) => { setName(e.target.value); setStamped(false); setSlipError(''); }}
                aria-invalid={slipError ? 'true' : 'false'}
                aria-describedby={slipError ? 'dk-slip-error' : undefined}
              />
            </label>
            <label className="dk-field">
              <span>School:</span>
              <input
                type="text"
                value={school}
                maxLength={80}
                autoComplete="organization"
                onChange={(e) => { setSchool(e.target.value); setStamped(false); }}
              />
            </label>
            <fieldset className="dk-chambers">
              <legend>Chamber:</legend>
              {PROGRAMS.map((p) => (
                <label key={p.short} className="dk-check">
                  <input type="checkbox" checked={chambers.includes(p.short)} onChange={() => toggleChamber(p.short)} />
                  <span>{p.short}</span>
                </label>
              ))}
            </fieldset>
            {slipError && <p id="dk-slip-error" className="dk-error" role="alert">{slipError}</p>}
            {stamped && (
              <span className="dk-accepted" role="status">
                Accepted<small>for next session</small>
              </span>
            )}
          </form>

          {!stamped ? (
            <button type="button" className="dk-stamp-btn" onClick={stamp}>Stamp my application</button>
          ) : (
            <a className="dk-stamp-btn dk-stamp-send" href={mailto()}>Send it to the Secretariat →</a>
          )}
          <p className="dk-type dk-small dk-slip-note">
            Opens an email to {CONTACT_EMAIL} with your details filled in.
          </p>
        </div>
      </section>

      {/* ============ DOSSIERS: the four events ============ */}
      <section className="dk-wrap dk-section">
        <p className="dk-label">Dossiers — four chambers</p>
        <div className="dk-dossiers">
          {PROGRAMS.map((p, i) => (
            <a key={p.page} className="dk-dossier" href={`#${p.page}`} onClick={(e) => go(e, p.page)} style={{ '--tilt': `${TILTS[i] / 2}deg` }}>
              <span className="dk-dossier-tab dk-type">Events · {p.no}</span>
              <span className="dk-type dk-red">{p.tag}</span>
              <span className="dk-dossier-name">{p.name}</span>
              <span className="dk-dossier-text">{p.text}</span>
              <span className="dk-type dk-dossier-go">Open the dossier →</span>
            </a>
          ))}
        </div>
      </section>

      {/* ============ PRESS CLIPPINGS: the scroll-film captions ============ */}
      <section className="dk-wrap dk-section">
        <p className="dk-label">Press clippings — what you'll be arguing about</p>
        <div className="dk-clippings">
          {CLIPPINGS.map((sc, i) => (
            <article key={sc.src} className="dk-clipping" style={{ '--tilt': `${TILTS[i % TILTS.length]}deg` }}>
              <span className="dk-tape" aria-hidden="true" />
              
              <h3>{sc.title}</h3>
              {sc.text && <p>{sc.text}</p>}
            </article>
          ))}
        </div>
      </section>

      {/* ============ PEACE NOTE: a typed letter ============ */}
      <section className="dk-wrap dk-section">
        <div className="dk-letter">
          <p className="dk-type dk-muted">A peace note — from the youth</p>
          <blockquote>
            “Peace will not be inherited by the young. It will be <em>negotiated</em> by them — and we intend to be ready.”
          </blockquote>
          <p className="dk-type dk-letter-sign">— Youth As Nations' Front</p>
          <div className="dk-actions">
            <a className="dk-btn dk-btn-dark" href="#page-mun" onClick={(e) => go(e, 'page-mun')}>Explore events</a>
            <a className="dk-btn dk-btn-ghost" href="#page-about" onClick={(e) => go(e, 'page-about')}>About YANF</a>
          </div>
        </div>
      </section>

      <footer className="dk-footer">
        <div className="dk-wrap dk-footer-inner">
          <span>YANF — Youth as Nations' Front &nbsp;|&nbsp; Where Potential Meets Purpose.</span>
          <nav aria-label="Footer">
            <a href="#page-certificates" onClick={(e) => go(e, 'page-certificates')}>Certificates</a>
            <a href="#page-blogs" onClick={(e) => go(e, 'page-blogs')}>Blogs</a>
            <a href="#page-resources" onClick={(e) => go(e, 'page-resources')}>Resources</a>
            <a href="#page-hall-of-fame" onClick={(e) => go(e, 'page-hall-of-fame')}>Hall of Fame</a>
            <a href="#page-gallery" onClick={(e) => go(e, 'page-gallery')}>Gallery</a>
            <a href="#page-contact" onClick={(e) => go(e, 'page-contact')}>Contact</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
