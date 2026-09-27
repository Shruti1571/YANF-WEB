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

  // Lock background scroll when certificate modal or OTP modal is open
  useEffect(() => {
    if (verifiedRecord || isOtpModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
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
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: '#090e17',
      color: '#f8fafc',
      fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      position: 'relative',
      overflowX: 'hidden'
    }}>

      {/* TOP INSTITUTIONAL NAVIGATION BAR */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        background: 'rgba(9, 14, 23, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src="/yanf-wall.svg"
            alt="YANF Crest"
            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div>
            <div style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '1px', color: '#ffffff', textTransform: 'uppercase' }}>
              Youth As Nations' Front
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', letterSpacing: '0.5px' }}>
              Certificate Verification Portal
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#e2e8f0',
            padding: '10px 20px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Portal
        </button>
      </header>

      {/* HERO SECTION */}
      <section style={{
        position: 'relative',
        padding: '70px 24px 60px',
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% -20%, #1e3a5f 0%, #0d1726 50%, #090e17 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        {/* Ambient Light Orbs */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '250px',
          background: 'radial-gradient(ellipse, rgba(59, 130, 246, 0.18) 0%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none'
        }}></div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '820px', margin: '0 auto' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 18px',
            borderRadius: '9999px',
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#60a5fa',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '20px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }}></span>
            Official Verification
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: '900',
            letterSpacing: '-1px',
            lineHeight: '1.2',
            color: '#ffffff',
            textAlign: 'center',
            margin: '0 auto 16px',
            width: '100%'
          }}>
            Verify Your Certificate
          </h1>

          <p style={{
            fontSize: '17px',
            color: '#94a3b8',
            maxWidth: '600px',
            margin: '0 auto 40px',
            lineHeight: '1.6',
            textAlign: 'center'
          }}>
            Quickly check and download official certificates issued by YANF and partner institutions.
          </p>

          {/* SEARCH CONSOLE CARD */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
            textAlign: 'left'
          }}>
            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '5px',
              borderRadius: '12px',
              width: 'fit-content',
              marginBottom: '24px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <button
                type="button"
                onClick={() => { setSearchMode('id'); setErrorMsg(''); }}
                style={{
                  background: searchMode === 'id' ? '#2563eb' : 'transparent',
                  color: searchMode === 'id' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                Certificate ID
              </button>
              <button
                type="button"
                onClick={() => { setSearchMode('name_email'); setErrorMsg(''); }}
                style={{
                  background: searchMode === 'name_email' ? '#2563eb' : 'transparent',
                  color: searchMode === 'name_email' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Name & Email
              </button>
            </div>

            {/* Tab 1: By ID */}
            {searchMode === 'id' && (
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 340px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '18px', transform: 'translateY(-50%)', color: '#64748b' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                      <line x1="7" y1="8" x2="17" y2="8"></line>
                      <line x1="7" y1="12" x2="17" y2="12"></line>
                      <line x1="7" y1="16" x2="12" y2="16"></line>
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. YANF-26-8K7Q"
                    value={certIdInput}
                    onChange={(e) => setCertIdInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && verifyById()}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontFamily: 'monospace',
                      fontSize: '16px',
                      fontWeight: '700',
                      letterSpacing: '1px',
                      padding: '16px 18px 16px 48px',
                      borderRadius: '12px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'; e.target.style.background = 'rgba(255, 255, 255, 0.04)'; }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => verifyById()}
                  disabled={loading || !certIdInput.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0 32px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: loading || !certIdInput.trim() ? 'not-allowed' : 'pointer',
                    opacity: loading || !certIdInput.trim() ? 0.6 : 1,
                    boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.4)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    height: '54px'
                  }}
                  onMouseEnter={(e) => { if (!loading && certIdInput.trim()) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {loading ? 'Checking...' : 'Verify Certificate'}
                  {!loading && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"></path>
                      <path d="M12 5l7 7-7 7"></path>
                    </svg>
                  )}
                </button>
              </div>
            )}

            {/* Tab 2: By Name + Email */}
            {searchMode === 'name_email' && (
              <form onSubmit={handleSearchByNameEmail} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 220px' }}>
                  <input
                    type="text"
                    required
                    placeholder="Full Name (e.g. Ananya Sharma)"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '14px',
                      padding: '16px 18px',
                      borderRadius: '12px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ flex: '1 1 240px' }}>
                  <input
                    type="email"
                    required
                    placeholder="Registered Email Address"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '14px',
                      padding: '16px 18px',
                      borderRadius: '12px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0 28px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '54px'
                  }}
                >
                  {loading ? 'Searching...' : 'Find Certificate'}
                </button>
              </form>
            )}

            {/* Error Notification */}
            {errorMsg && (
              <div style={{
                marginTop: '20px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '14px 18px',
                borderRadius: '12px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {errorMsg}
              </div>
            )}
          </div>

          {/* TRUST BADGES ROW */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginTop: '32px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '14px 18px', borderRadius: '14px' }}>
              <span style={{ fontSize: '20px' }}>🛡️</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>100% Authentic</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Directly matched with official YANF records</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '14px 18px', borderRadius: '14px' }}>
              <span style={{ fontSize: '20px' }}>🏛️</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>Officially Signed</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Issued together with partner schools</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '14px 18px', borderRadius: '14px' }}>
              <span style={{ fontSize: '20px' }}>🔒</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>Secure PDF Download</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>High-quality, print-ready certificate copy</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* MULTIPLE RESULTS PICKER */}
      {searchResults.length > 0 && (
        <section style={{ maxWidth: '960px', margin: '40px auto', padding: '0 24px' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '32px'
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', color: '#ffffff', fontWeight: '800' }}>
              Found {searchResults.length} Certificates Matching Your Record:
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {searchResults.map((item) => (
                <div
                  key={item._id}
                  onClick={() => verifyById(item.certificateNumber)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontFamily: 'monospace', color: '#60a5fa', fontWeight: '700', fontSize: '15px' }}>{item.certificateNumber}</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', marginTop: '6px' }}>{item.position}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{item.portfolio} • {item.committee}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>{item.eventTitle}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS & INSTITUTIONAL GUIDE (ALWAYS VISIBLE ON PAGE) */}
      <section style={{ maxWidth: '1040px', margin: '0 auto', padding: '60px 24px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px', margin: '0 0 12px' }}>
            How Verification Works
          </h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', margin: 0 }}>
            Three simple steps to check or download your certificate.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '24px',
          marginBottom: '60px'
        }}>
          {/* Step 1 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '20px',
            padding: '32px 28px',
            position: 'relative'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#3b82f6', marginBottom: '16px', fontFamily: 'monospace' }}>
              01
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: '0 0 10px' }}>
              Enter Certificate ID
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
              Find your unique certificate ID printed at the bottom of the certificate, or scan the QR code with your phone camera.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '20px',
            padding: '32px 28px',
            position: 'relative'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#10b981', marginBottom: '16px', fontFamily: 'monospace' }}>
              02
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: '0 0 10px' }}>
              Instant Database Check
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
              We instantly check our records to confirm the student name, award, event, and authorized signatures.
            </p>
          </div>

          {/* Step 3 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '20px',
            padding: '32px 28px',
            position: 'relative'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#f59e0b', marginBottom: '16px', fontFamily: 'monospace' }}>
              03
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: '0 0 10px' }}>
              View & Download PDF
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
              View your certificate on screen and download a high-resolution, print-ready PDF using a one-time email code.
            </p>
          </div>
        </div>

        {/* ADVISORY CARD FOR INSTITUTIONS */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.3) 0%, rgba(15, 23, 42, 0.4) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '20px',
          padding: '36px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px'
        }}>
          <div style={{ maxWidth: '640px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              For Schools, Colleges & Recruiters
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', margin: '0 0 10px' }}>
              Verify for Admissions or Job Applications
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
              Universities and employers can independently check any student's YANF certificate directly on this page at any time without needing to email the team.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Need assistance with a certificate?</div>
            <a
              href="mailto:secretariat@yanf.org"
              style={{
                color: '#60a5fa',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Contact Team &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* VERIFIED CERTIFICATE MODAL / OVERLAY LIGHTBOX */}
      {verifiedRecord && (
        <div
          onClick={() => setVerifiedRecord(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99990,
            padding: '24px 16px'
          }}
        >
          {/* FLOATING INSPECTION FRAME */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '960px',
              height: '92vh',
              maxHeight: '92vh',
              background: '#0d1522',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px',
              boxShadow: '0 30px 100px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* FRAME HEADER BAR */}
            <div style={{
              padding: '16px 28px',
              background: 'rgba(15, 23, 42, 0.95)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                  flexShrink: 0
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                      Verified Authentic
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>
                      {cert?.certificateNumber}
                    </span>
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#ffffff', marginTop: '2px' }}>
                    {cert?.recipientName || 'Official YANF Certificate'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={otpLoading || downloadingPdf}
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.4)',
                    transition: 'all 0.2s ease',
                    opacity: otpLoading || downloadingPdf ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  {downloadingPdf ? 'Exporting PDF...' : (otpLoading ? 'Sending Passcode...' : 'Download Official PDF')}
                </button>

                <button
                  type="button"
                  onClick={() => setVerifiedRecord(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#e2e8f0',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                  title="Close (Esc)"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* FRAME SCROLLABLE BODY WITH RESPONSIVE SIZING */}
            <div
              ref={viewerBodyRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'auto',
                padding: '24px 16px 80px',
                background: '#070d17',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative'
              }}
            >
              {/* PRE-EVENT NOTICE IF APPLICABLE */}
              {cert?.isPreEventBlank && (
                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '14px',
                  padding: '16px 24px',
                  textAlign: 'center',
                  marginBottom: '20px',
                  color: '#92400e',
                  maxWidth: '794px',
                  width: '100%'
                }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 4px' }}>
                    Pre-Allocated Blank Certificate Notice
                  </h3>
                  <p style={{ fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
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

              {/* FLOATING RESPONSIVE ZOOM CONTROLS TOOLBAR */}
              <div
                style={{
                  position: 'sticky',
                  bottom: '16px',
                  zIndex: 40,
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(15, 23, 42, 0.92)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
                  width: 'fit-content'
                }}
              >
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleFit}
                  title="Fit certificate to screen"
                  style={{
                    background: isAutoFit ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '700',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => { if (!isAutoFit) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
                  onMouseLeave={(e) => { if (!isAutoFit) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                  </svg>
                  Fit to Screen
                </button>

                <span style={{ fontSize: '12px', color: '#94a3b8', minWidth: '44px', textAlign: 'center', fontFamily: 'monospace', fontWeight: '700' }}>
                  {Math.round(zoomScale * 100)}%
                </span>

                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleActualSize}
                  title="Actual Size (100%)"
                  style={{
                    background: zoomScale === 1.0 && !isAutoFit ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '700',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { if (zoomScale !== 1.0 || isAutoFit) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
                  onMouseLeave={(e) => { if (zoomScale !== 1.0 || isAutoFit) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                >
                  100%
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 2FA EMAIL OTP VERIFICATION MODAL */}
      {isOtpModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(4, 9, 14, 0.88)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            background: '#0d1726',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '20px',
            padding: '36px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '20px', color: '#ffffff', fontWeight: '800' }}>
              Security Passcode Required
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#94a3b8', lineHeight: '1.5' }}>
              To protect recipient identity, we dispatched a 6-digit one-time passcode to the registered delegate email address.
            </p>

            {otpSuccessMsg && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '18px' }}>
                {otpSuccessMsg}
              </div>
            )}

            {otpError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '18px' }}>
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndDownload}>
              <input
                type="text"
                maxLength="6"
                placeholder="&bull; &bull; &bull; &bull; &bull; &bull;"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                autoFocus
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '24px',
                  letterSpacing: '12px',
                  textAlign: 'center',
                  padding: '14px',
                  marginBottom: '24px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'monospace'
                }}
              />

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#e2e8f0',
                    padding: '12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpLoading || otpInput.length < 6}
                  style={{
                    flex: 1,
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: otpLoading || otpInput.length < 6 ? 'not-allowed' : 'pointer',
                    opacity: otpLoading || otpInput.length < 6 ? 0.6 : 1,
                    fontSize: '14px',
                    boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.5)'
                  }}
                >
                  {otpLoading ? 'Verifying...' : 'Verify & Export'}
                </button>
              </div>
            </form>

            <div style={{ marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
              {cooldown > 0 ? (
                <span>Resend passcode in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}
                >
                  Resend Passcode
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
