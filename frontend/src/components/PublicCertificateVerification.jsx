import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function PublicCertificateVerification({ onClose }) {
  const [searchMode, setSearchMode] = useState('id'); // 'id' | 'name_email'
  const [certIdInput, setCertIdInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Result state
  const [verifiedRecord, setVerifiedRecord] = useState(null); // { certificate, event }
  const [searchResults, setSearchResults] = useState([]); // when searching by name+email

  // OTP Modal State for PDF download
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const certRenderRef = useRef(null);
  const viewerBodyRef = useRef(null);
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

  // Responsive Zoom & Fit-to-screen state
  const [zoomScale, setZoomScale] = useState(0.65);
  const [isAutoFit, setIsAutoFit] = useState(true);

  // Calculate optimum scale so the entire A4 certificate fits within viewport
  const calculateAndApplyFit = () => {
    if (!viewerBodyRef.current) return;
    const container = viewerBodyRef.current;
    // Allow padding breathing room
    const paddingX = window.innerWidth <= 640 ? 16 : 40;
    const paddingY = window.innerWidth <= 640 ? 60 : 70;
    const availWidth = Math.max(container.clientWidth - paddingX, 240);
    const availHeight = Math.max(container.clientHeight - paddingY, 280);

    const scaleX = availWidth / 794;
    const scaleY = availHeight / 1123;
    const bestScale = Math.min(scaleX, scaleY);

    // Bound between 0.2 (mobile) and 1.0 (large desktop screens)
    const fit = Math.max(0.2, Math.min(bestScale, 1.0));
    setZoomScale(Number(fit.toFixed(3)));
    setIsAutoFit(true);
  };

  useEffect(() => {
    if (verifiedRecord) {
      // Delay slightly so modal DOM is fully rendered and dimensions are accurate
      const timer = setTimeout(() => {
        calculateAndApplyFit();
      }, 60);

      window.addEventListener('resize', calculateAndApplyFit);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', calculateAndApplyFit);
      };
    }
  }, [verifiedRecord]);

  const handleZoomIn = () => {
    setIsAutoFit(false);
    setZoomScale((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 2.0));
  };

  const handleZoomOut = () => {
    setIsAutoFit(false);
    setZoomScale((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.25));
  };

  const handleFit = () => {
    calculateAndApplyFit();
  };

  const handleActualSize = () => {
    setIsAutoFit(false);
    setZoomScale(1.0);
  };

  // Check URL query on mount for direct QR scan links (e.g. #page-certificates?id=YANF-26-8K7Q)
  useEffect(() => {
    const parseUrlForId = () => {
      const hash = window.location.hash;
      let targetId = '';
      if (hash.includes('?id=')) {
        targetId = hash.split('?id=')[1]?.split('&')[0];
      } else {
        const params = new URLSearchParams(window.location.search);
        targetId = params.get('id');
      }

      if (targetId) {
        setCertIdInput(targetId);
        verifyById(targetId);
      }
    };

    parseUrlForId();
    window.addEventListener('hashchange', parseUrlForId);
    return () => window.removeEventListener('hashchange', parseUrlForId);
  }, []);

  // Cooldown timer tick
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Ensure body scroll remains locked while on certificates overlay
  useEffect(() => {
    document.body.style.overflow = 'hidden';
  }, []);

  // Lock #page-certificates scroll when certificate lightbox or OTP modal is open
  useEffect(() => {
    const pageEl = document.getElementById('page-certificates');
    if (!pageEl) return;
    if (verifiedRecord || isOtpModalOpen) {
      pageEl.style.overflowY = 'hidden';
    } else {
      pageEl.style.overflowY = 'auto';
    }
    return () => {
      if (pageEl) pageEl.style.overflowY = 'auto';
    };
  }, [verifiedRecord, isOtpModalOpen]);

  // Handle Escape key to dismiss modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isOtpModalOpen) {
          setIsOtpModalOpen(false);
        } else if (verifiedRecord) {
          setVerifiedRecord(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [verifiedRecord, isOtpModalOpen]);

  // Lookup Certificate by ID
  const verifyById = async (idToVerify) => {
    const cleanId = (idToVerify || certIdInput).trim().toUpperCase();
    if (!cleanId) return;

    try {
      setLoading(true);
      setErrorMsg('');
      setVerifiedRecord(null);
      setSearchResults([]);

      const res = await fetch(`${apiBase}/certificates/verify/${encodeURIComponent(cleanId)}`);
      const data = await res.json();

      if (res.ok && data.found) {
        setVerifiedRecord(data);
      } else {
        setErrorMsg(data.error || 'Certificate not found. Please double-check the Certificate ID or contact the Secretariat.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to verification server. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  // Search by Name + Email
  const handleSearchByNameEmail = async (e) => {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim()) {
      setErrorMsg('Please enter both your full name and registered email address.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setVerifiedRecord(null);
      setSearchResults([]);

      const res = await fetch(`${apiBase}/certificates/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim(), email: emailInput.trim() })
      });
      const data = await res.json();

      if (res.ok && data.found) {
        if (data.certificates.length === 1) {
          verifyById(data.certificates[0].certificateNumber);
        } else {
          setSearchResults(data.certificates);
        }
      } else {
        setErrorMsg(data.error || 'No active credentials found matching the provided name and email.');
      }
    } catch (err) {
      setErrorMsg('Network error while searching credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger OTP Request
  const handleRequestOtp = async () => {
    if (!verifiedRecord?.certificate?._id) return;
    try {
      setOtpLoading(true);
      setOtpError('');
      setOtpSuccessMsg('');

      const res = await fetch(`${apiBase}/certificates/${verifiedRecord.certificate._id}/request-otp`, {
        method: 'POST'
      });
      const data = await res.json();

      if (res.ok) {
        setOtpSuccessMsg(data.message || 'Passcode dispatched to your registered email.');
        setCooldown(60);
        setIsOtpModalOpen(true);
      } else {
        if (res.status === 429 && data.retryAfter) {
          setCooldown(data.retryAfter);
        }
        setErrorMsg(data.error || 'Failed to dispatch verification passcode.');
      }
    } catch (err) {
      setErrorMsg('Error requesting download passcode.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Submit OTP & Generate High-Res PDF
  const handleVerifyOtpAndDownload = async (e) => {
    e.preventDefault();
    if (!otpInput.trim()) return;

    try {
      setOtpLoading(true);
      setOtpError('');

      const res = await fetch(`${apiBase}/certificates/${verifiedRecord.certificate._id}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpInput.trim() })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsOtpModalOpen(false);
        setOtpInput('');
        await generateAndDownloadPdf();
      } else {
        setOtpError(data.error || 'Verification passcode incorrect or expired.');
      }
    } catch (err) {
      setOtpError('Network error validating passcode.');
    } finally {
      setOtpLoading(false);
    }
  };

  // High-Resolution 300 DPI PDF Generation
  const generateAndDownloadPdf = async () => {
    if (!certRenderRef.current) return;
    try {
      setDownloadingPdf(true);
      const prevScale = zoomScale;
      const prevAutoFit = isAutoFit;

      // Reset to 1:1 scale for crystal clear 300 DPI capture
      setZoomScale(1);
      await new Promise((resolve) => setTimeout(resolve, 80));

      const element = certRenderRef.current;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      const fileName = `YANF_Certificate_${verifiedRecord.certificate.certificateNumber}.pdf`;
      pdf.save(fileName);

      // Restore user zoom preference
      setZoomScale(prevScale);
      setIsAutoFit(prevAutoFit);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to generate high-resolution PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const cert = verifiedRecord?.certificate;
  const event = verifiedRecord?.event;

  const schoolLogos = event?.schoolLogos || [];
  const hasTwoSchoolLogos = schoolLogos.length >= 2 && schoolLogos[1]?.url;
  const hasOneSchoolLogo = schoolLogos.length >= 1 && schoolLogos[0]?.url;

  const schoolSigs = event?.schoolSignatories || [];
  const hasTwoSchoolSigs = schoolSigs.length >= 2 && schoolSigs[1]?.name;

  return (
    <div className="cv">
      {/* TOP BAR */}
      <header className="cv-bar">
        <div className="cv-bar-brand">
          <span className="cv-plate">YANF</span>
          <div>
            <div className="cv-bar-title">Youth As Nations' Front</div>
            <div className="cv-bar-sub">Certificate Verification Portal</div>
          </div>
        </div>
        <button type="button" className="cv-tab-btn" onClick={onClose}>
          <span aria-hidden="true">←</span> Back to Portal
        </button>
      </header>

      {/* HERO + SEARCH */}
      <section className="cv-wrap cv-hero">
        <div className="cv-hero-copy">
          <p className="cv-type cv-kicker">Records office · Official Verification</p>
          <h1 className="cv-h1">Verify Your Certificate</h1>
          <p className="cv-lede">Quickly check and download official certificates issued by YANF and partner institutions.</p>
          <ul className="cv-badges">
            <li>
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
              <span><b>100% Authentic</b>Directly matched with official YANF records</span>
            </li>
            <li>
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M2 10l10-6 10 6" /></svg>
              <span><b>Officially Signed</b>Issued together with partner schools</span>
            </li>
            <li>
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
              <span><b>Secure PDF Download</b>High-quality, print-ready certificate copy</span>
            </li>
          </ul>
        </div>

        <div className="cv-ledger-wrap">
          <div className="cv-tabs" role="tablist" aria-label="Search method">
            <button
              type="button"
              role="tab"
              aria-selected={searchMode === 'id'}
              className={`cv-tab ${searchMode === 'id' ? 'is-on' : ''}`}
              onClick={() => { setSearchMode('id'); setErrorMsg(''); }}
            >
              Certificate ID
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={searchMode === 'name_email'}
              className={`cv-tab ${searchMode === 'name_email' ? 'is-on' : ''}`}
              onClick={() => { setSearchMode('name_email'); setErrorMsg(''); }}
            >
              Name &amp; Email
            </button>
          </div>

          <div className="cv-ledger" role="tabpanel">
            {searchMode === 'id' && (
              <form
                className="cv-form"
                onSubmit={(e) => { e.preventDefault(); verifyById(); }}
              >
                <label className="cv-field">
                  <span className="cv-type">Certificate ID</span>
                  <input
                    type="text"
                    placeholder="e.g. YANF-26-8K7Q"
                    value={certIdInput}
                    onChange={(e) => setCertIdInput(e.target.value.toUpperCase())}
                    autoComplete="off"
                    spellCheck="false"
                  />
                </label>
                <p className="cv-hint">Printed at the bottom of your certificate, next to the QR code.</p>
                <button type="submit" className="cv-stamp" disabled={loading || !certIdInput.trim()}>
                  {loading ? 'Checking…' : 'Verify Certificate →'}
                </button>
              </form>
            )}

            {searchMode === 'name_email' && (
              <form className="cv-form" onSubmit={handleSearchByNameEmail}>
                <label className="cv-field">
                  <span className="cv-type">Full name</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Sharma"
                    value={nameInput}
                    autoComplete="name"
                    onChange={(e) => setNameInput(e.target.value)}
                  />
                </label>
                <label className="cv-field">
                  <span className="cv-type">Registered email</span>
                  <input
                    type="email"
                    required
                    placeholder="Registered Email Address"
                    value={emailInput}
                    autoComplete="email"
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                </label>
                <button type="submit" className="cv-stamp" disabled={loading}>
                  {loading ? 'Searching…' : 'Find Certificate →'}
                </button>
              </form>
            )}

            {errorMsg && (
              <p className="cv-error" role="alert">
                <span aria-hidden="true">✕</span> {errorMsg}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* MULTIPLE RESULTS PICKER */}
      {searchResults.length > 0 && (
        <section className="cv-wrap cv-section">
          <p className="cv-label">Found {searchResults.length} Certificates Matching Your Record</p>
          <div className="cv-results">
            {searchResults.map((item, i) => (
              <button
                key={item._id}
                type="button"
                className="cv-result"
                style={{ '--tilt': `${[-0.8, 0.6, -0.4, 0.9][i % 4]}deg` }}
                onClick={() => verifyById(item.certificateNumber)}
              >
                <span className="cv-type cv-result-no">{item.certificateNumber}</span>
                <span className="cv-result-pos">{item.position}</span>
                <span className="cv-result-meta">{item.portfolio} • {item.committee}</span>
                <span className="cv-type cv-result-event">{item.eventTitle}</span>
                <span className="cv-type cv-result-go">Open certificate →</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="cv-wrap cv-section">
        <div className="cv-section-head">
          <p className="cv-label">How Verification Works</p>
          <p className="cv-section-sub">Three simple steps to check or download your certificate.</p>
        </div>
        <ol className="cv-steps">
          <li className="cv-step" style={{ '--tilt': '-0.8deg' }}>
            <span className="cv-type cv-step-no">01</span>
            <h3>Enter Certificate ID</h3>
            <p>Find your unique certificate ID printed at the bottom of the certificate, or scan the QR code with your phone camera.</p>
          </li>
          <li className="cv-step" style={{ '--tilt': '0.6deg' }}>
            <span className="cv-type cv-step-no">02</span>
            <h3>Instant Database Check</h3>
            <p>We instantly check our records to confirm the student name, award, event, and authorized signatures.</p>
          </li>
          <li className="cv-step" style={{ '--tilt': '-0.4deg' }}>
            <span className="cv-type cv-step-no">03</span>
            <h3>View &amp; Download PDF</h3>
            <p>View your certificate on screen and download a high-resolution, print-ready PDF using a one-time email code.</p>
          </li>
        </ol>

        {/* FOR INSTITUTIONS */}
        <div className="cv-folder">
          <span className="cv-folder-tab cv-type">For Schools, Colleges &amp; Recruiters</span>
          <div className="cv-folder-copy">
            <h3>Verify for Admissions or Job Applications</h3>
            <p>Universities and employers can independently check any student's YANF certificate directly on this page at any time without needing to email the team.</p>
          </div>
          <div className="cv-folder-cta">
            <span className="cv-type cv-small">Need assistance with a certificate?</span>
            <a className="cv-btn-dark" href="mailto:secretariat@yanf.org">Contact Team →</a>
          </div>
        </div>
      </section>

      {/* VERIFIED CERTIFICATE VIEWER */}
      {verifiedRecord && (
        <div className="cv-overlay" onClick={() => setVerifiedRecord(null)}>
          <div
            className="cv-viewer"
            role="dialog"
            aria-modal="true"
            aria-label={`Certificate ${cert?.certificateNumber || ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cv-viewer-head">
              <div className="cv-viewer-id">
                <span className="cv-verified">Verified Authentic</span>
                <div>
                  <div className="cv-type cv-viewer-no">{cert?.certificateNumber}</div>
                  <div className="cv-viewer-name">{cert?.recipientName || 'Official YANF Certificate'}</div>
                </div>
              </div>
              <div className="cv-viewer-actions">
                <button
                  type="button"
                  className="cv-stamp cv-stamp-sm"
                  onClick={handleRequestOtp}
                  disabled={otpLoading || downloadingPdf}
                >
                  {downloadingPdf ? 'Exporting PDF…' : (otpLoading ? 'Sending Passcode…' : 'Download Official PDF')}
                </button>
                <button type="button" className="cv-close" onClick={() => setVerifiedRecord(null)} aria-label="Close (Esc)" title="Close (Esc)">✕</button>
              </div>
            </div>

            <div ref={viewerBodyRef} className="cv-viewer-body">
              {cert?.isPreEventBlank && (
                <div className="cv-notice">
                  <h3>Pre-Allocated Blank Certificate Notice</h3>
                  <p>
                    This is an authentic pre-allocated YANF certificate assigned to <strong>{event?.title}</strong>. Full digital delegate allocation and PDF download will become active once post-event committee winners are synchronized.
                  </p>
                </div>
              )}
              {/* SIZED WRAPPER TO CONTROL LAYOUT BOUNDARIES ACCORDING TO ZOOM SCALE */}
              <div
                style={{
                  width: `${Math.round(794 * zoomScale)}px`,
                  height: `${Math.round(1123 * zoomScale)}px`,
                  position: 'relative',
                  margin: '0 auto',
                  flexShrink: 0,
                  transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1), height 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <div
                  style={{
                    width: '794px',
                    height: '1123px',
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top left',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <div
                    ref={certRenderRef}
                    id="certificate-print-canvas"
                    style={{
                      width: '794px',
                      minHeight: '1123px',
                      margin: '0 auto',
                      background: '#ffffff',
                      color: '#0e1e2d',
                      boxSizing: 'border-box',
                      padding: '40px',
                      position: 'relative',
                      boxShadow: '0 15px 40px rgba(0, 0, 0, 0.45)',
                      fontFamily: "'Playfair Display', Georgia, serif"
                    }}
                  >
                  {/* OUTER DECORATIVE BORDER */}
                  <div style={{
                    position: 'absolute',
                    top: '16px', left: '16px', right: '16px', bottom: '16px',
                    border: '3px double #0d2238',
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '4px', left: '4px', right: '4px', bottom: '4px',
                      border: '1px solid #c8a355'
                    }}></div>
                  </div>

                  {/* INNER CONTENT WRAPPER */}
                  <div style={{
                    height: '100%',
                    minHeight: '1043px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    zIndex: 2,
                    padding: '10px 20px'
                  }}>
                    {/* 1. HEADER LOGOS ROW */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: '60px',
                      marginBottom: '30px'
                    }}>
                      {/* School Logo 1 */}
                      <div style={{ width: '140px', height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                        {hasOneSchoolLogo ? (
                          <img
                            src={schoolLogos[0].url}
                            alt={schoolLogos[0].altText || 'School Logo'}
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                            style={{ maxHeight: '50px', maxWidth: '140px', objectFit: 'contain' }}
                          />
                        ) : (
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0d2238', letterSpacing: '1px' }}>
                            {event?.schoolName || 'HOST INSTITUTION'}
                          </span>
                        )}
                      </div>

                      {/* School Logo 2 */}
                      {hasTwoSchoolLogos && (
                        <div style={{ width: '140px', height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img
                            src={schoolLogos[1].url}
                            alt={schoolLogos[1].altText || 'Partner Logo'}
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                            style={{ maxHeight: '50px', maxWidth: '140px', objectFit: 'contain' }}
                          />
                        </div>
                      )}

                      {/* YANF Logo */}
                      <div style={{ width: '140px', height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <img
                          src={event?.yanfLogo?.url || '/yanf-wall.svg'}
                          alt="YANF Official Crest"
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                          style={{ maxHeight: '50px', maxWidth: '140px', objectFit: 'contain' }}
                        />
                      </div>
                    </div>

                    {/* 2. CERTIFICATE CENTRAL TEXT */}
                    <div style={{ textAlign: 'center', margin: 'auto 0' }}>
                      <h2 style={{
                        fontSize: '30px',
                        fontWeight: '800',
                        letterSpacing: '5px',
                        color: '#0d2238',
                        margin: '0 0 16px',
                        textTransform: 'uppercase',
                        fontFamily: "'Space Grotesk', -apple-system, sans-serif"
                      }}>
                        CERTIFICATE OF ACHIEVEMENT
                      </h2>

                      <p style={{
                        fontSize: '16px',
                        fontStyle: 'italic',
                        color: '#4a5b6c',
                        margin: '0 0 20px'
                      }}>
                        This is to certify that
                      </p>

                      {/* Recipient Name */}
                      <div style={{ margin: '0 auto 16px', maxWidth: '540px' }}>
                        <span style={{
                          fontSize: '34px',
                          fontWeight: '700',
                          color: '#081726',
                          letterSpacing: '1px',
                          display: 'inline-block',
                          paddingBottom: '4px'
                        }}>
                          {cert?.recipientName || 'RECIPIENT NAME'}
                        </span>
                        <div style={{ height: '1.5px', background: '#c8a355', width: '100%', margin: '4px auto 0' }}></div>
                      </div>

                      <p style={{
                        fontSize: '15px',
                        color: '#4a5b6c',
                        margin: '0 0 16px'
                      }}>
                        has been duly recognized as
                      </p>

                      {/* Award Position */}
                      <div style={{ margin: '0 auto 20px', maxWidth: '440px' }}>
                        <span style={{
                          fontSize: '24px',
                          fontWeight: '700',
                          color: '#c8a355',
                          letterSpacing: '2px',
                          textTransform: 'uppercase'
                        }}>
                          {cert?.position || 'AWARD POSITION'}
                        </span>
                        <div style={{ height: '1px', background: '#c8a355', width: '100%', margin: '4px auto 0' }}></div>
                      </div>

                      {/* Portfolio & Committee */}
                      <p style={{
                        fontSize: '17px',
                        color: '#1a2e40',
                        margin: '0 0 14px',
                        lineHeight: '1.6'
                      }}>
                        Representing &nbsp;
                        <strong style={{ borderBottom: '1px solid #4a5b6c', paddingBottom: '2px', display: 'inline-block', minWidth: '220px', color: '#081726' }}>
                          {cert?.portfolio || 'Delegation Portfolio'}
                        </strong>
                      </p>

                      <p style={{
                        fontSize: '17px',
                        color: '#1a2e40',
                        margin: '0 0 24px',
                        lineHeight: '1.6'
                      }}>
                        In the &nbsp;
                        <strong style={{ borderBottom: '1px solid #4a5b6c', paddingBottom: '2px', display: 'inline-block', minWidth: '240px', color: '#081726' }}>
                          {cert?.committee || 'Assembly Committee'}
                        </strong>
                      </p>

                      {/* Event Recognition */}
                      <p style={{
                        fontSize: '15px',
                        color: '#4a5b6c',
                        margin: '0 0 8px'
                      }}>
                        for outstanding diplomacy and leadership during the
                      </p>

                      <div style={{ margin: '0 auto', maxWidth: '580px' }}>
                        <span style={{
                          fontSize: '20px',
                          fontWeight: '700',
                          color: '#0d2238',
                          letterSpacing: '1px',
                          textTransform: 'uppercase'
                        }}>
                          {event?.title || 'YANF ASSEMBLY'}
                        </span>
                        <div style={{ height: '1px', background: '#0d2238', width: '100%', margin: '4px auto 0' }}></div>
                      </div>
                    </div>

                    {/* 3. SIGNATORIES ROW */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      marginTop: '36px',
                      marginBottom: '24px'
                    }}>
                      {/* School Signatory 1 */}
                      <div style={{ width: '180px', textAlign: 'center' }}>
                        {schoolSigs[0]?.signatureUrl ? (
                          <img src={schoolSigs[0].signatureUrl} alt="Signature" crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ maxHeight: '45px', maxWidth: '140px', objectFit: 'contain', margin: '0 auto 6px' }} />
                        ) : (
                          <div style={{ height: '45px' }}></div>
                        )}
                        <div style={{ height: '1px', background: '#0d2238', width: '100%', marginBottom: '4px' }}></div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#081726' }}>{schoolSigs[0]?.name || 'Principal'}</div>
                        <div style={{ fontSize: '11px', color: '#666' }}>{schoolSigs[0]?.designation || event?.schoolName || 'Host Institution'}</div>
                      </div>

                      {/* School Signatory 2 */}
                      {hasTwoSchoolSigs && (
                        <div style={{ width: '180px', textAlign: 'center' }}>
                          {schoolSigs[1]?.signatureUrl ? (
                            <img src={schoolSigs[1].signatureUrl} alt="Signature" crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ maxHeight: '45px', maxWidth: '140px', objectFit: 'contain', margin: '0 auto 6px' }} />
                          ) : (
                            <div style={{ height: '45px' }}></div>
                          )}
                          <div style={{ height: '1px', background: '#0d2238', width: '100%', marginBottom: '4px' }}></div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#081726' }}>{schoolSigs[1]?.name || 'MUN Director'}</div>
                          <div style={{ fontSize: '11px', color: '#666' }}>{schoolSigs[1]?.designation || 'Co-Host Secretariat'}</div>
                        </div>
                      )}

                      {/* YANF Signatory */}
                      <div style={{ width: '180px', textAlign: 'center' }}>
                        {event?.yanfSignatory?.signatureUrl ? (
                          <img src={event.yanfSignatory.signatureUrl} alt="YANF Signature" crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ maxHeight: '45px', maxWidth: '140px', objectFit: 'contain', margin: '0 auto 6px' }} />
                        ) : (
                          <div style={{ height: '45px' }}></div>
                        )}
                        <div style={{ height: '1px', background: '#0d2238', width: '100%', marginBottom: '4px' }}></div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#081726' }}>{event?.yanfSignatory?.name || 'Secretariat General'}</div>
                        <div style={{ fontSize: '11px', color: '#666' }}>{event?.yanfSignatory?.designation || 'Secretary-General, YANF'}</div>
                      </div>
                    </div>

                    {/* 4. VERIFICATION STRIP */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid rgba(13, 34, 56, 0.15)',
                      paddingTop: '14px',
                      fontFamily: "'Space Grotesk', sans-serif"
                    }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '11px', color: '#55697d', fontWeight: '500' }}>
                          To verify this certificate, scan the given QR code.
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0d2238', fontFamily: 'monospace', marginTop: '2px' }}>
                          Certificate ID: {cert?.certificateNumber}
                        </div>
                      </div>

                      <div>
                        {cert?.qrCodeDataUrl ? (
                          <img
                            src={cert.qrCodeDataUrl}
                            alt="Verification QR"
                            style={{ width: '56px', height: '56px', display: 'block' }}
                          />
                        ) : (
                          <div style={{ width: '56px', height: '56px', border: '1px dashed #999', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                            QR
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

              {/* ZOOM CONTROLS */}
              <div className="cv-zoom" role="toolbar" aria-label="Zoom">
                <button type="button" onClick={handleZoomOut} aria-label="Zoom out" title="Zoom Out">−</button>
                <button type="button" onClick={handleFit} className={isAutoFit ? 'is-on' : ''} title="Fit certificate to screen">Fit to Screen</button>
                <span className="cv-zoom-val">{Math.round(zoomScale * 100)}%</span>
                <button type="button" onClick={handleZoomIn} aria-label="Zoom in" title="Zoom In">+</button>
                <button type="button" onClick={handleActualSize} className={zoomScale === 1.0 && !isAutoFit ? 'is-on' : ''} title="Actual Size (100%)">100%</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL PASSCODE MODAL */}
      {isOtpModalOpen && (
        <div className="cv-overlay cv-overlay-top">
          <div className="cv-otp" role="dialog" aria-modal="true" aria-labelledby="cv-otp-title">
            <span className="cv-otp-seal" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </span>
            <h3 id="cv-otp-title">Security Passcode Required</h3>
            <p className="cv-otp-text">
              To protect recipient identity, we dispatched a 6-digit one-time passcode to the registered delegate email address.
            </p>
            {otpSuccessMsg && <p className="cv-otp-ok" role="status">{otpSuccessMsg}</p>}
            {otpError && <p className="cv-error" role="alert"><span aria-hidden="true">✕</span> {otpError}</p>}
            <form onSubmit={handleVerifyOtpAndDownload}>
              <label className="cv-sr" htmlFor="cv-otp-input">6-digit passcode</label>
              <input
                id="cv-otp-input"
                className="cv-otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength="6"
                placeholder="• • • • • •"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
              <div className="cv-otp-actions">
                <button type="button" className="cv-btn-ghost" onClick={() => setIsOtpModalOpen(false)}>Cancel</button>
                <button type="submit" className="cv-stamp" disabled={otpLoading || otpInput.length < 6}>
                  {otpLoading ? 'Verifying…' : 'Verify & Export'}
                </button>
              </div>
            </form>
            <div className="cv-otp-resend">
              {cooldown > 0 ? (
                <span>Resend passcode in {cooldown}s</span>
              ) : (
                <button type="button" onClick={handleRequestOtp}>Resend Passcode</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
