import React, { useEffect, useRef } from 'react';
import UnderConstruction from './UnderConstruction';
import AdminPanel from './AdminPanel';

export default function PageOverlays({ activePage, onClose, onNavigate }) {
  const pageRefs = useRef({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (activePage && pageRefs.current[activePage]) {
      pageRefs.current[activePage].scrollTop = 0;
    }
  }, [activePage]);

  const renderBgMedia = (bgFile) => {
    const isImage = /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(bgFile);
    if (isImage) {
      return <img src={`/${bgFile}`} alt="" />;
    }
    return <video src={`/${bgFile}`} muted loop autoPlay playsInline />;
  };

  const handleLink = (e, path) => {
    e.preventDefault();
    onNavigate(path);
  };

  const setPageRef = (id) => (el) => {
    pageRefs.current[id] = el;
  };

  return (
    <>
      {/* ABOUT PAGE */}
      <div
        className={`page ${activePage === 'page-about' ? 'open' : ''}`}
        id="page-about"
        ref={setPageRef('page-about')}
      >
        <button className="back" type="button" onClick={onClose}>✕ Close</button>
        <div className="page-bg">{activePage === 'page-about' && renderBgMedia('scene-01.mp4')}</div>
        <div className="page-inner">
          <div className="kicker">About YANF</div>
          <h1>We train the negotiators the future will need.</h1>
          <p className="lede">Youth As Nations' Front is an educational platform where students build a diplomatic mindset — the confidence to ask hard questions, the literacy to read geopolitics, and the leadership to act on what they learn. No prior experience needed. Curiosity is the only prerequisite.</p>
          <div className="info-grid">
            <div className="cell">
              <h3>What you build</h3>
              <ul>
                <li>Diplomatic reasoning &amp; negotiation</li>
                <li>Public speaking with substance</li>
                <li>Geopolitical &amp; economic literacy</li>
                <li>Leadership under pressure</li>
              </ul>
            </div>
            <div className="cell">
              <h3>How we teach</h3>
              <ul>
                <li>Full-scale simulations, not lectures</li>
                <li>Mentorship from experienced delegates</li>
                <li>Research sprints &amp; briefing packs</li>
                <li>Feedback after every session</li>
              </ul>
            </div>
            <div className="cell">
              <h3>Who it's for</h3>
              <p>School and university students who want to understand how the world actually runs — and who suspect they might one day help run it.</p>
            </div>
          </div>
          <div className="cta-row">
            <a className="btn solid" href="#page-mun" onClick={(e) => handleLink(e, 'page-mun')}>Explore our events</a>
          </div>
        </div>
      </div>

      {/* MUN PAGE */}
      <div
        className={`page ${activePage === 'page-mun' ? 'open' : ''}`}
        id="page-mun"
        ref={setPageRef('page-mun')}
      >
        <button className="back" type="button" onClick={onClose}>✕ Close</button>
        <div className="page-bg">{activePage === 'page-mun' && renderBgMedia('mun-hallway.mp4')}</div>
        <div className="page-inner">
          <div className="kicker">Events · 01</div>
          <h1>Model United Nations</h1>
          <div className="event-tag">Simulate · Debate · Resolve</div>
          <p className="lede">Step into the shoes of the world's diplomats. Model United Nations (MUN) is a globally recognised academic simulation of the United Nations where students represent countries, debate pressing international issues, and draft resolutions — just as real UN delegates do.</p>
          <p className="body-text" style={{ marginTop: '16px' }}>At YANF, MUN is not just an event — it is a transformative experience that challenges students to step beyond the classroom and engage with the world as it truly is.</p>

          <div className="sec-title">Why participate in MUN</div>
          <ul className="bullets">
            <li>Develop confident public speaking and articulation skills</li>
            <li>Learn to research, analyse, and present complex global issues</li>
            <li>Practice negotiation, persuasion, and consensus-building</li>
            <li>Build global awareness and cross-cultural empathy</li>
            <li>Earn recognition through awards like Best Delegate &amp; Verbal Mention</li>
          </ul>

          <div className="sec-title">Committees at YANF MUN</div>
          <div className="info-grid">
            <div className="cell"><h3>UNSC</h3><p>UN Security Council — addressing threats to international peace and security.</p></div>
            <div className="cell"><h3>UNHRC</h3><p>UN Human Rights Council — promoting and protecting human rights globally.</p></div>
            <div className="cell"><h3>WHO</h3><p>World Health Organization — tackling global public health challenges.</p></div>
            <div className="cell"><h3>UNGA</h3><p>UN General Assembly — the broadest deliberative body of the United Nations.</p></div>
            <div className="cell"><h3>ECOSOC</h3><p>Economic and Social Council — development, trade, and social progress.</p></div>
            <div className="cell"><h3>Crisis Committee</h3><p>Fast-paced simulation responding to real-time international crises.</p></div>
          </div>

          <div className="sec-title">Event highlights</div>
          <table className="hl-table">
            <tbody>
              <tr><th>Duration</th><td>2 – 3 Days</td></tr>
              <tr><th>Suitable for</th><td>Grade 7 onwards</td></tr>
              <tr><th>Formats</th><td>Beginner, Intermediate &amp; Advanced</td></tr>
              <tr><th>Awards</th><td>Best Delegate, High Commendation, Verbal Mention, Best Position Paper</td></tr>
              <tr><th>Language</th><td>English</td></tr>
            </tbody>
          </table>

          <div className="cta-band">
            <h4>Ready to represent your nation? Register for YANF MUN today.</h4>
            <a className="btn solid" href="#page-contact" onClick={(e) => handleLink(e, 'page-contact')}>Register interest</a>
          </div>

          <div className="cta-row" style={{ marginTop: '56px' }}>
            <a className="btn" href="#page-debates" onClick={(e) => handleLink(e, 'page-debates')}>Next: Parliamentary Debates</a>
          </div>
          <div className="tagline-foot">YANF — Youth as Nations' Front &nbsp;|&nbsp; Where Potential Meets Purpose.</div>
        </div>
      </div>

      {/* PARLIAMENTARY DEBATES PAGE */}
      <div
        className={`page ${activePage === 'page-debates' ? 'open' : ''}`}
        id="page-debates"
        ref={setPageRef('page-debates')}
      >
        <button className="back" type="button" onClick={onClose}>✕ Close</button>
        <div className="page-bg">{activePage === 'page-debates' && renderBgMedia('parliamentary-debates.mp4')}</div>
        <div className="page-inner">
          <div className="kicker">Events · 02</div>
          <h1>Parliamentary Debates</h1>
          <div className="event-tag">Argue · Rebut · Persuade</div>
          <p className="lede">Where the right argument, delivered at the right moment, wins. Parliamentary Debate at YANF is a structured battlefield of ideas, logic, and rhetoric where young minds learn to argue with precision and defend their stance with conviction.</p>

          <div className="sec-title">Formats we follow</div>
          <div className="info-grid">
            <div className="cell">
              <h3>Asian Parliamentary (AP)</h3>
              <p>Two teams of three — Government (proposition) vs Opposition. Structured speeches, Points of Information (POIs) and summary reply speeches.</p>
            </div>
            <div className="cell">
              <h3>British Parliamentary (BP)</h3>
              <p>Four teams of two compete simultaneously — Opening Government, Opening Opposition, Closing Government, and Closing Opposition.</p>
            </div>
          </div>

          <div className="sec-title">Event highlights</div>
          <table className="hl-table">
            <tbody>
              <tr><th>Duration</th><td>1 – 2 Days</td></tr>
              <tr><th>Suitable for</th><td>Grade 8 onwards</td></tr>
              <tr><th>Formats</th><td>Asian Parliamentary &amp; British Parliamentary</td></tr>
              <tr><th>Awards</th><td>Best Speaker, Best Team, Best Floor Speech</td></tr>
            </tbody>
          </table>

          <div className="cta-band">
            <h4>Think you can win the floor? Register for YANF Parliamentary Debates.</h4>
            <a className="btn solid" href="#page-contact" onClick={(e) => handleLink(e, 'page-contact')}>Register interest</a>
          </div>

          <div className="cta-row" style={{ marginTop: '56px' }}>
            <a className="btn" href="#page-youth-parliament" onClick={(e) => handleLink(e, 'page-youth-parliament')}>Next: Youth Parliament</a>
          </div>
          <div className="tagline-foot">YANF — Youth as Nations' Front &nbsp;|&nbsp; Where Potential Meets Purpose.</div>
        </div>
      </div>

      {/* YOUTH PARLIAMENT PAGE */}
      <div
        className={`page ${activePage === 'page-youth-parliament' ? 'open' : ''}`}
        id="page-youth-parliament"
        ref={setPageRef('page-youth-parliament')}
      >
        <button className="back" type="button" onClick={onClose}>✕ Close</button>
        <div className="page-bg">{activePage === 'page-youth-parliament' && renderBgMedia('youth-parliament.mp4')}</div>
        <div className="page-inner">
          <div className="kicker">Events · 03</div>
          <h1>Youth Parliament — युवा संसद</h1>
          <div className="event-tag">Simulate · Legislate · Lead</div>
          <p className="lede">Experience Indian democracy from the inside. Youth Parliament — युवा संसद at YANF is a simulation of India's most prestigious constitutional and policy-making bodies.</p>

          <div className="sec-title">Houses &amp; committees simulated at YANF</div>
          <div className="info-grid">
            <div className="cell"><h3>Lok Sabha</h3><p>The lower house of India's Parliament — where bills are introduced and debated.</p></div>
            <div className="cell"><h3>Rajya Sabha</h3><p>The upper house — representing states and reviewing legislation.</p></div>
            <div className="cell"><h3>Vidhan Sabha</h3><p>State Legislative Assembly — simulating state-level governance.</p></div>
            <div className="cell"><h3>AIPPM</h3><p>All India Political Parties Meet — cross-party negotiation.</p></div>
            <div className="cell"><h3>NITI Aayog</h3><p>India's premier policy think tank — crafting solutions for national development.</p></div>
            <div className="cell"><h3>Press Conference</h3><p>Simulating media interactions, policy announcements, and press briefings.</p></div>
          </div>

          <div className="cta-band">
            <h4>Step into Parliament. Your nation needs your voice. Register for Yuva Sansad.</h4>
            <a className="btn solid" href="#page-contact" onClick={(e) => handleLink(e, 'page-contact')}>Register interest</a>
          </div>

          <div className="cta-row" style={{ marginTop: '56px' }}>
            <a className="btn" href="#page-innovation" onClick={(e) => handleLink(e, 'page-innovation')}>Next: Innovation Assembly</a>
          </div>
          <div className="tagline-foot">YANF — Youth as Nations' Front &nbsp;|&nbsp; Where Potential Meets Purpose.</div>
        </div>
      </div>

      {/* INNOVATION ASSEMBLY PAGE */}
      <div
        className={`page ${activePage === 'page-innovation' ? 'open' : ''}`}
        id="page-innovation"
        ref={setPageRef('page-innovation')}
      >
        <button className="back" type="button" onClick={onClose}>✕ Close</button>
        <div className="page-bg">{activePage === 'page-innovation' && renderBgMedia('innovation-summit.mp4')}</div>
        <div className="page-inner">
          <div className="kicker">Events · 04</div>
          <h1>Innovation Assembly</h1>
          <div className="event-tag">Pitch · Invest · Disrupt</div>
          <p className="lede">Where students stop studying business — and start doing it. Every student has an idea. YANF's Innovation Assembly gives them the stage to prove it.</p>

          <div className="info-grid">
            <div className="cell"><h3>Phase 1 — The Pitch</h3><p>Innovators develop and present business ideas to student Investors.</p></div>
            <div className="cell"><h3>Phase 2 — Investment Round</h3><p>Investors evaluate pitches, ask probing questions, and allocate virtual capital.</p></div>
            <div className="cell"><h3>Phase 3 — Summit Awards</h3><p>Crowns the Best Entrepreneur and Best Investor.</p></div>
          </div>

          <div className="cta-band">
            <h4>Got an idea? Ready to invest? Join Innovation Assembly at YANF.</h4>
            <a className="btn solid" href="#page-contact" onClick={(e) => handleLink(e, 'page-contact')}>Register interest</a>
          </div>

          <div className="cta-row" style={{ marginTop: '56px' }}>
            <a className="btn" href="#page-about" onClick={(e) => handleLink(e, 'page-about')}>About YANF</a>
          </div>
          <div className="tagline-foot">YANF — Youth as Nations' Front &nbsp;|&nbsp; Where Potential Meets Purpose.</div>
        </div>
      </div>

      {/* RESOURCES PAGE */}
      <div
        className={`page ${activePage === 'page-resources' ? 'open' : ''}`}
        id="page-resources"
        ref={setPageRef('page-resources')}
      >
        <button className="back" type="button" onClick={onClose}>✕ Close</button>
        <div className="page-bg">{activePage === 'page-resources' && renderBgMedia('yanf-wall.svg')}</div>
        <div className="page-inner">
          <div className="kicker">More · Resources</div>
          <h1>Start reading like a delegate.</h1>
          <p className="lede">A short starting kit we recommend to every new member. You don't need to finish it all — you need to start anywhere.</p>
          <div className="info-grid">
            <div className="cell">
              <h3>Foundations</h3>
              <ul>
                <li>The UN Charter (skim, then revisit)</li>
                <li>How the Security Council votes</li>
                <li>A modern history of your own region</li>
              </ul>
            </div>
            <div className="cell">
              <h3>Stay current</h3>
              <ul>
                <li>One international news brief, daily</li>
                <li>One long-form analysis, weekly</li>
                <li>One position you disagree with, monthly</li>
              </ul>
            </div>
            <div className="cell">
              <h3>Practice</h3>
              <ul>
                <li>Write a one-page position paper</li>
                <li>Summarise a conflict in 100 words</li>
                <li>Explain a treaty to a friend</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* SECRET ADMIN PAGE */}
      <div
        className={`page ${activePage === 'page-admin' ? 'open' : ''}`}
        id="page-admin"
        ref={setPageRef('page-admin')}
      >
        <div className="page-bg">{activePage === 'page-admin' && renderBgMedia('yanf-wall.svg')}</div>
        <AdminPanel onNavigate={onNavigate} />
      </div>

      {/* CERTIFICATES PAGE (UNDER CONSTRUCTION) */}
      <div
        className={`page ${activePage === 'page-certificates' ? 'open' : ''}`}
        id="page-certificates"
        ref={setPageRef('page-certificates')}
      >
        <button className="back" type="button" onClick={onClose}>✕ Close</button>
        {activePage === 'page-certificates' && (
          <UnderConstruction
            kicker="More · Certificates"
            title="Digital Credential & Certificate Verifier"
            badge="Under Construction • Launching Soon"
            description="Our tamper-proof digital certification portal is currently undergoing final verification and testing. Delegates, schools, and adjudicators will soon be able to instantly verify and download official YANF certificates of achievement and participation."
            bgMedia="yanf-wall.svg"
            onNavigate={onNavigate}
            features={[
              { tag: "VERIFICATION 01", heading: "Instant ID Verification", text: "Verify delegate credentials and awards using unique Certificate Hash IDs." },
              { tag: "VERIFICATION 02", heading: "High-Res PDF Download", text: "Download official signed certificates suitable for university applications." },
              { tag: "VERIFICATION 03", heading: "LinkedIn Credential Badges", text: "Directly export verified credentials to LinkedIn profiles." }
            ]}
          />
        )}
      </div>

      {/* BLOGS PAGE (UNDER CONSTRUCTION) */}
      <div
        className={`page ${activePage === 'page-blogs' ? 'open' : ''}`}
        id="page-blogs"
        ref={setPageRef('page-blogs')}
      >
        <button className="back" type="button" onClick={onClose}>✕ Close</button>
        {activePage === 'page-blogs' && (
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
        )}
      </div>

      {/* HALL OF FAME PAGE (UNDER CONSTRUCTION) */}
      <div
        className={`page ${activePage === 'page-hall-of-fame' ? 'open' : ''}`}
        id="page-hall-of-fame"
        ref={setPageRef('page-hall-of-fame')}
      >
        <button className="back" type="button" onClick={onClose}>✕ Close</button>
        {activePage === 'page-hall-of-fame' && (
          <UnderConstruction
            kicker="More · Hall of Fame"
            title="YANF Delegate Hall of Fame"
            badge="Under Construction • Launching Soon"
            description="A digital monument celebrating our most distinguished delegates, best parliamentarians, top pitchers, and alumni who have represented YANF at national and international forums across the world."
            bgMedia="yanf-wall.svg"
            onNavigate={onNavigate}
            features={[
              { tag: "SPOTLIGHT 01", heading: "Best Delegate Honor Roll", text: "Annual showcase of top award winners from Security Council & General Assembly simulations." },
              { tag: "SPOTLIGHT 02", heading: "Parliamentary Champions", text: "Recognising victorious teams and best speakers in Asian & British Parliamentary formats." },
              { tag: "SPOTLIGHT 03", heading: "Alumni Trajectories", text: "Tracking YANF alumni making impact in international law, civil services, and policy." }
            ]}
          />
        )}
      </div>

      {/* GALLERY PAGE (UNDER CONSTRUCTION) */}
      <div
        className={`page ${activePage === 'page-gallery' ? 'open' : ''}`}
        id="page-gallery"
        ref={setPageRef('page-gallery')}
      >
        <button className="back" type="button" onClick={onClose}>✕ Close</button>
        {activePage === 'page-gallery' && (
          <UnderConstruction
            kicker="More · Media Gallery"
            title="YANF Moments & Event Gallery"
            badge="Under Construction • Launching Soon"
            description="Our high-resolution media gallery is being curated. Soon you will be able to browse photo archives, committee highlights, keynotes, and press briefings from past assemblies."
            bgMedia="yanf-wall.svg"
            onNavigate={onNavigate}
            features={[
              { tag: "GALLERY 01", heading: "Committee Photos", text: "Hi-res photography of debate sessions, unmoderated caucuses, and voting procedures." },
              { tag: "GALLERY 02", heading: "Closing Ceremonies", text: "Award announcements, gavel drops, and delegation group portraits." },
              { tag: "GALLERY 03", heading: "Behind the Scenes", text: "Mentorship sessions, briefing prep, and social night moments." }
            ]}
          />
        )}
      </div>

      {/* CONTACT PAGE */}
      <div
        className={`page ${activePage === 'page-contact' ? 'open' : ''}`}
        id="page-contact"
        ref={setPageRef('page-contact')}
      >
        <button className="back" type="button" onClick={onClose}>✕ Close</button>
        <div className="page-bg">{activePage === 'page-contact' && renderBgMedia('yanf-wall.svg')}</div>
        <div className="page-inner">
          <div className="kicker">More · Contact</div>
          <h1>Take a seat at the table.</h1>
          <p className="lede">Tell us who you are and which event you're interested in — we'll send the next briefing pack, dates and registration details.</p>
          <div className="info-grid">
            <div className="cell">
              <h3>Email</h3>
              <p><a href="mailto:aditya@yanfglobal.com">aditya@yanfglobal.com</a></p>
            </div>
            <div className="cell">
              <h3>For schools</h3>
              <p>We run on-campus workshops and inter-school assemblies. Write to <a href="mailto:hello@yanfglobal.com">hello@yanfglobal.com</a>.</p>
            </div>
            <div className="cell">
              <h3>Follow</h3>
              <p>@yanf_global — event announcements, motion drops and delegate spotlights.</p>
            </div>
          </div>
          <div className="cta-row">
            <a className="btn solid" href="mailto:aditya@yanfglobal.com">Write to us</a>
          </div>
        </div>
      </div>
    </>
  );
}
