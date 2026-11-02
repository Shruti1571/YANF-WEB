import React, { useEffect, useRef, useState } from 'react';
import { Painter, AssemblyFooter } from './common';
import { useReveal, go, CONTACT_EMAIL } from './utils';
import { CHAMBERS } from './objects';

const PAGES = ['page-mun', 'page-debates', 'page-youth-parliament', 'page-innovation'];

function PageHero({ eyebrow, title, em, paint, label, children }) {
  return (
    <section className="ip-hero">
      <Painter kind={paint} label={label} />
      <div className="ip-hero-shade" />
      <div className="ip-hero-copy">
        <p className="as-eyebrow">{eyebrow}</p>
        <h1>{title}{em && <> <em>{em}</em></>}</h1>
        {children}
      </div>
    </section>
  );
}

/* ---------------- ABOUT ---------------- */
export function AboutPage({ onNavigate }) {
  const root = useRef(null); useReveal(root);
  const cols = [
    ['What you build', ['Diplomatic reasoning & negotiation', 'Public speaking with substance', 'Geopolitical & economic literacy', 'Leadership under pressure']],
    ['How we teach', ['Full-scale simulations, not lectures', 'Mentorship from experienced delegates', 'Research sprints & briefing packs', 'Feedback after every session']],
  ];
  return (
    <div className="as-info" ref={root}>
      <PageHero eyebrow="About YANF" title="We train the negotiators" em="the future will need." paint="dotglobe" label="A dotted golden globe turning on deep blue" />
      <section className="ip-lede">
        <p className="rv">Youth As Nations' Front is an educational platform where students build a diplomatic mindset: the confidence to ask hard questions, the literacy to read geopolitics, and the leadership to act on what they learn. No prior experience needed. <em>Curiosity is the only prerequisite.</em></p>
      </section>
      <section className="ip-pillars">
        {cols.map(([h, items], i) => (
          <article key={h} className="ip-pillar rv" style={{ '--d': `${i * 100}ms` }}>
            <span className="pg-num">0{i + 1}</span><h3>{h}</h3>
            <ul>{items.map(x => <li key={x}>{x}</li>)}</ul>
          </article>
        ))}
        <article className="ip-pillar ip-pillar-dark rv" style={{ '--d': '200ms' }}>
          <span className="pg-num">03</span><h3>Who it's for</h3>
          <p>School and university students who want to understand how the world actually runs, and who suspect they might one day help run it.</p>
        </article>
      </section>
      <section className="ip-programs">
        <header className="rv"><p className="as-eyebrow">Four chambers</p><h2>One habit of mind.</h2></header>
        <div className="ip-prog-grid">
          {CHAMBERS.map((c, i) => (
            <a key={c.word} href={`#${PAGES[i]}`} onClick={go(onNavigate, PAGES[i])} className="ip-prog rv" style={{ '--c': c.col, '--d': `${i * 80}ms` }}>
              <span className="ip-prog-no">0{i + 1}</span><b>{c.word}</b><span>{c.name}</span><small>{c.tag}</small>
            </a>
          ))}
        </div>
        <div className="ip-actions rv"><a className="as-btn" href="#page-mun" onClick={go(onNavigate, 'page-mun')}>Explore our events</a></div>
      </section>
      <AssemblyFooter onNavigate={onNavigate} />
    </div>
  );
}

/* ---------------- RESOURCES ---------------- */
export function ResourcesPage({ onNavigate }) {
  const root = useRef(null); useReveal(root);
  const cols = [
    ['Foundations', ['The UN Charter (skim, then revisit)', 'How the Security Council votes', 'A modern history of your own region'], 'roundtable'],
    ['Stay current', ['One international news brief, daily', 'One long-form analysis, weekly', 'One position you disagree with, monthly'], 'network'],
    ['Practice', ['Write a one-page position paper', 'Summarise a conflict in 100 words', 'Explain a treaty to a friend'], 'sapling'],
  ];
  return (
    <div className="as-info" ref={root}>
      <PageHero eyebrow="More · Resources" title="Start reading" em="like a delegate." paint="network" label="A glowing network of ideas" />
      <section className="ip-lede"><p className="rv">A short starting kit we recommend to every new member. You don't need to finish it all. <em>You need to start anywhere.</em></p></section>
      <section className="ip-kit">
        {cols.map(([h, items, paint], i) => (
          <article key={h} className="ip-kit-card rv" style={{ '--d': `${i * 100}ms` }}>
            <div className="ip-kit-art"><Painter kind={paint} className="" /></div>
            <div className="ip-kit-body"><span className="pg-num">0{i + 1}</span><h3>{h}</h3><ol>{items.map(x => <li key={x}>{x}</li>)}</ol></div>
          </article>
        ))}
      </section>
      <section className="ip-band rv">
        <p>Ready to put it into practice?</p>
        <a className="as-btn light" href="#page-contact" onClick={go(onNavigate, 'page-contact')}>Join the next session</a>
      </section>
      <AssemblyFooter onNavigate={onNavigate} />
    </div>
  );
}

/* ---------------- CONTACT ---------------- */
const PROGRAM_NAMES = { 'page-mun': 'Model United Nations', 'page-debates': 'Parliamentary Debates', 'page-youth-parliament': 'Youth Parliament (युवा संसद)', 'page-innovation': 'Innovation Assembly' };
const readProgram = () => { const q = (window.location.hash.split('?')[1] || ''); const p = new URLSearchParams(q).get('program'); return PROGRAM_NAMES[p] || ''; };

export function ContactPage({ onNavigate }) {
  const root = useRef(null); useReveal(root);
  const [f, setF] = useState({ name: '', email: '', school: '', role: 'Student', program: readProgram() || 'Model United Nations', message: '' });
  const [sent, setSent] = useState(false);
  useEffect(() => { const h = () => { const p = readProgram(); if (p) setF(s => ({ ...s, program: p })); }; window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h); }, []);
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    const subject = `Registration interest: ${f.program}`;
    const body = `Name: ${f.name}\nEmail: ${f.email}\nSchool / college: ${f.school}\nI am a: ${f.role}\nProgram: ${f.program}\n\n${f.message}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };
  return (
    <div className="as-info as-contact" ref={root}>
      <PageHero eyebrow="More · Contact" title="Take a seat" em="at the table." paint="sparks" label="Sparks rising over a dawn horizon">
        <p className="ip-hero-sub">Tell us who you are and which event you're interested in, and we'll send the next briefing pack, dates and registration details.</p>
      </PageHero>
      <section className="ct-grid">
        <form className="ct-form rv" onSubmit={submit}>
          <p className="as-eyebrow">Register interest</p>
          <label><span>Your name</span><input required value={f.name} onChange={set('name')} autoComplete="name" /></label>
          <label><span>Email</span><input required type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
          <label><span>School or college</span><input value={f.school} onChange={set('school')} autoComplete="organization" /></label>
          <div className="ct-row">
            <label><span>I am a</span><select value={f.role} onChange={set('role')}><option>Student</option><option>Teacher</option><option>Parent</option><option>School / institution</option></select></label>
            <label><span>Program</span><select value={f.program} onChange={set('program')}>{Object.values(PROGRAM_NAMES).map(p => <option key={p}>{p}</option>)}<option>On-campus workshop</option></select></label>
          </div>
          <label><span>Anything we should know?</span><textarea rows={4} value={f.message} onChange={set('message')} /></label>
          <button type="submit" className="as-btn">Send via email</button>
          <p className="ct-note" aria-live="polite">{sent ? 'Your email app should have opened with the details filled in. Just press send.' : `This opens your email app with a message to ${CONTACT_EMAIL}.`}</p>
        </form>
        <aside className="ct-side">
          <div className="ct-card rv"><p className="as-eyebrow">Email</p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></div>
          <div className="ct-card rv"><p className="as-eyebrow">For schools</p><p>We run on-campus workshops and inter-school assemblies. Write to <a href="mailto:hello@yanfglobal.com">hello@yanfglobal.com</a>.</p></div>
          <div className="ct-card rv"><p className="as-eyebrow">Follow</p><p>@yanf_global: event announcements, motion drops and delegate spotlights.</p></div>
          <div className="ct-card ct-card-dark rv"><p className="as-eyebrow">Not sure which program?</p><p>Start with <a href="#page-mun" onClick={go(onNavigate, 'page-mun')}>Model United Nations</a>, no prior experience needed.</p></div>
        </aside>
      </section>
      <AssemblyFooter onNavigate={onNavigate} />
    </div>
  );
}
