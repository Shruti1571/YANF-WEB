import React, { useState, useEffect, useMemo } from 'react';

export default function CertificateStudio({ currentUser, token }) {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('roster'); // 'roster', 'batch', 'event_setup'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected event details & certificates
  const [currentEvent, setCurrentEvent] = useState(null);
  const [certificates, setCertificates] = useState([]);

  // Batch Generation State
  const [batchCount, setBatchCount] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);

  // Edit / Add Participant Modal
  const [editingCert, setEditingCert] = useState(null);
  const [deletingCert, setDeletingCert] = useState(null); // Added for delete modal
  const [previewQr, setPreviewQr] = useState(null); // Added for QR lightbox
  const [certFormData, setCertFormData] = useState({
    certificateNumber: '',
    recipientName: '',
    recipientEmail: '',
    position: '',
    portfolio: '',
    committee: ''
  });
  const [savingCert, setSavingCert] = useState(false);

  // Event Form State (for creating/updating event)
  const [eventForm, setEventForm] = useState({
    title: '',
    eventDate: '',
    venue: '',
    schoolName: '',
    schoolLogos: [{ url: '', shape: 'square', altText: 'School 1' }],
    yanfLogo: { url: '/yanf-wall.svg', shape: 'square', altText: 'YANF Logo' },
    schoolSignatories: [{ name: '', designation: '', signatureUrl: '' }],
    yanfSignatory: { name: 'YANF Secretariat', designation: 'Secretary-General, YANF', signatureUrl: '' }
  });
  const [savingEvent, setSavingEvent] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileUpload = async (e, callback) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploadingImage(true);
      setErrorMsg('');
      const res = await fetch(`${apiBase}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.url) {
        callback(data.url);
      } else {
        setErrorMsg(data.error || 'Failed to upload image.');
      }
    } catch (err) {
      setErrorMsg('Network error while uploading image.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Search & Filter in roster
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

  // 1. Fetch all events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // 2. Fetch selected event details & certificates when selectedEventId changes
  useEffect(() => {
    if (selectedEventId) {
      fetchEventDetails(selectedEventId);
    } else {
      setCurrentEvent(null);
      setCertificates([]);
    }
  }, [selectedEventId]);

  // Auto-hide notifications after 4 seconds
  useEffect(() => {
    let timer;
    if (successMsg || errorMsg) {
      timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [successMsg, errorMsg]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events || []);
        if (data.events && data.events.length > 0 && !selectedEventId) {
          setSelectedEventId(data.events[0]._id);
        }
      } else {
        setErrorMsg(data.error || 'Failed to load events.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to event service.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventDetails = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentEvent(data.event);
        setCertificates(data.certificates || []);
        // Populate event form
        setEventForm({
          title: data.event.title || '',
          eventDate: data.event.eventDate ? data.event.eventDate.split('T')[0] : '',
          venue: data.event.venue || '',
          schoolName: data.event.schoolName || '',
          schoolLogos: data.event.schoolLogos?.length > 0 ? data.event.schoolLogos : [{ url: '', shape: 'square', altText: 'School 1' }],
          yanfLogo: data.event.yanfLogo || { url: '/yanf-wall.svg', shape: 'square', altText: 'YANF Logo' },
          schoolSignatories: data.event.schoolSignatories?.length > 0 ? data.event.schoolSignatories : [{ name: '', designation: '', signatureUrl: '' }],
          yanfSignatory: data.event.yanfSignatory || { name: 'YANF Secretariat', designation: 'Secretary-General, YANF', signatureUrl: '' }
        });
      } else {
        setErrorMsg(data.error || 'Failed to load event details.');
      }
    } catch (err) {
      setErrorMsg('Network error loading event data.');
    } finally {
      setLoading(false);
    }
  };

  // Generation (Single or Batch)
  const handleGenerate = async (count) => {
    if (!selectedEventId) return;
    try {
      setGeneratingBatch(true);
      setErrorMsg('');
      const res = await fetch(`${apiBase}/events/${selectedEventId}/certificates/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ count })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Generated ${data.certificates.length} blank certificate(s).`);
        await fetchEventDetails(selectedEventId);
        setActiveSubTab('roster');
        setIsAddModalOpen(false); // Close modal if open
        if (count === 1 && data.certificates.length > 0) {
          openEditModal(data.certificates[0]);
        }
      } else {
        setErrorMsg(data.error || 'Failed to generate certificates.');
      }
    } catch (err) {
      setErrorMsg('Failed to run generation.');
    } finally {
      setGeneratingBatch(false);
    }
  };

  // Download All QRs ZIP
  const handleExportZip = async () => {
    if (!selectedEventId) return;
    try {
      setExportingZip(true);
      const res = await fetch(`${apiBase}/events/${selectedEventId}/certificates/export-qrs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to export QRs.');
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const cleanEventTitle = (currentEvent?.title || 'event').replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `YANF_${cleanEventTitle}_QRs.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setSuccessMsg('QR Code ZIP archive exported successfully!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to download ZIP archive.');
    } finally {
      setExportingZip(false);
    }
  };

  // Open Edit Participant Modal
  const openEditModal = (cert) => {
    setEditingCert(cert);
    setCertFormData({
      certificateNumber: cert.certificateNumber || '',
      recipientName: cert.recipientName || '',
      recipientEmail: cert.recipientEmail || '',
      position: cert.position || '',
      portfolio: cert.portfolio || '',
      committee: cert.committee || ''
    });
  };

  // Save Participant Details
  const handleSaveParticipant = async (e) => {
    e.preventDefault();
    if (!editingCert) return;
    try {
      setSavingCert(true);
      setErrorMsg('');
      const res = await fetch(`${apiBase}/certificates/${editingCert._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(certFormData)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Updated participant details for ${data.certificate.certificateNumber}`);
        setEditingCert(null);
        await fetchEventDetails(selectedEventId);
      } else {
        setErrorMsg(data.error || 'Failed to update certificate.');
      }
    } catch (err) {
      setErrorMsg('Network error saving certificate details.');
    } finally {
      setSavingCert(false);
    }
  };

  // Delete Certificate (Execute)
  const executeDeleteCertificate = async () => {
    if (!deletingCert) return;
    try {
      setErrorMsg('');
      const res = await fetch(`${apiBase}/certificates/${deletingCert._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMsg('Certificate deleted successfully.');
        setDeletingCert(null);
        await fetchEventDetails(selectedEventId);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to delete certificate.');
      }
    } catch (err) {
      setErrorMsg('Network error deleting certificate.');
    }
  };

  // Save Event Configuration
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      setSavingEvent(true);
      setErrorMsg('');
      const url = currentEvent ? `${apiBase}/events/${currentEvent._id}` : `${apiBase}/events`;
      const method = currentEvent ? 'PUT' : 'POST';

      const payload = { ...eventForm };
      payload.schoolLogos = payload.schoolLogos.filter(logo => logo && logo.url && logo.url.trim() !== '');
      payload.schoolSignatories = payload.schoolSignatories.filter(sig => sig && sig.name && sig.name.trim() !== '' && sig.signatureUrl && sig.signatureUrl.trim() !== '');

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(currentEvent ? 'Event settings updated.' : 'New event created.');
        await fetchEvents();
        if (data.event) {
          setSelectedEventId(data.event._id);
        }
        setActiveSubTab('roster');
      } else {
        setErrorMsg(data.error || 'Failed to save event.');
      }
    } catch (err) {
      setErrorMsg('Error saving event configuration.');
    } finally {
      setSavingEvent(false);
    }
  };

  // Filtered Certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter(cert => {
      const matchSearch =
        cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cert.recipientName && cert.recipientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cert.portfolio && cert.portfolio.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cert.committee && cert.committee.toLowerCase().includes(searchTerm.toLowerCase()));

      if (statusFilter === 'all') return matchSearch;
      if (statusFilter === 'active') return matchSearch && cert.status === 'active';
      if (statusFilter === 'blank') return matchSearch && cert.status === 'pre_event_blank';
      return matchSearch;
    });
  }, [certificates, searchTerm, statusFilter]);

  return (
    <div className="certificate-studio-root" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER SECTION */}
      <div className="studio-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>🎓 Certificates & Awards Studio</h2>
          <p>
            Physical printing preparation, pre-event QR codes, and post-event winner verification.
          </p>
        </div>

        {/* EVENT PICKER / NEW BUTTON */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            className="studio-select"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {events.map(ev => (
              <option key={ev._id} value={ev._id}>
                {ev.title} ({ev.stats?.total || 0} certs)
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setCurrentEvent(null);
              setSelectedEventId('');
              setEventForm({
                title: '',
                eventDate: '',
                venue: '',
                schoolName: '',
                schoolLogos: [{ url: '', shape: 'square', altText: 'School 1' }],
                yanfLogo: { url: '/yanf-wall.svg', shape: 'square', altText: 'YANF Logo' },
                schoolSignatories: [{ name: '', designation: '', signatureUrl: '' }],
                yanfSignatory: { name: 'YANF Secretariat', designation: 'Secretary-General, YANF', signatureUrl: '' }
              });
              setActiveSubTab('event_setup');
            }}
            style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600' }}
          >
            + Create Event
          </button>
        </div>
      </div>

      {/* STATUS NOTIFICATIONS */}
      {errorMsg && (
        <div style={{ position: 'fixed', top: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ position: 'fixed', top: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#059669', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          {successMsg}
        </div>
      )}

      {/* NAVIGATION SUB-TABS */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('roster')}
          style={{
            padding: '10px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'roster' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeSubTab === 'roster' ? '#2563eb' : '#64748b',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          📋 Winner Roster & Sync ({certificates.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('event_setup')}
          style={{
            padding: '10px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'event_setup' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeSubTab === 'event_setup' ? '#2563eb' : '#64748b',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ⚙️ Event Setup & Logos
        </button>
      </div>

      {/* SUB-TAB 1: WINNER ROSTER & 5-FIELD SYNC */}
      {activeSubTab === 'roster' && (
        <div className="studio-card" style={{ padding: '0', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* Action Bar */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: '#ffffff', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', width: '260px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input
                  type="text"
                  placeholder="Search ID, Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%', color: '#0f172a' }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Certificates</option>
                <option value="active">Active Winners Only</option>
                <option value="blank">Pre-Event Blanks</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => { setBatchCount(1); setIsAddModalOpen(true); }}
                disabled={generatingBatch || !selectedEventId}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add Certificates
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleExportZip}
                disabled={exportingZip || certificates.length === 0}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '8px 14px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📦 {exportingZip ? 'Building ZIP...' : 'Download ZIP'}
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', overflowY: 'auto', background: '#ffffff', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead style={{ background: '#f8fafc', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px', position: 'sticky', top: 0, zIndex: 10, boxShadow: 'inset 0 -1px 0 #e2e8f0' }}>
                <tr>
                  <th style={{ width: '40px', padding: '14px 24px', background: '#f8fafc' }}>S.No</th>
                  <th style={{ padding: '14px 16px', background: '#f8fafc' }}>QR</th>
                  <th style={{ padding: '14px 16px', background: '#f8fafc' }}>Certificate ID</th>
                  <th style={{ padding: '14px 16px', background: '#f8fafc' }}>Recipient Name</th>
                  <th style={{ padding: '14px 16px', background: '#f8fafc' }}>Position</th>
                  <th style={{ padding: '14px 16px', background: '#f8fafc' }}>Portfolio</th>
                  <th style={{ padding: '14px 16px', background: '#f8fafc' }}>Committee</th>
                  <th style={{ padding: '14px 16px', background: '#f8fafc' }}>Status</th>
                  <th style={{ padding: '14px 24px', textAlign: 'right', background: '#f8fafc' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                      <div style={{ marginBottom: '12px' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div>
                      No certificates found. Generate pre-event blank certificates or add a single certificate.
                    </td>
                  </tr>
                ) : (
                  filteredCertificates.map((cert, index) => (
                    <tr key={cert._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 24px', color: '#94a3b8', fontWeight: '600' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {cert.qrCodeDataUrl ? (
                          <img 
                            src={cert.qrCodeDataUrl} 
                            alt="QR" 
                            onClick={() => setPreviewQr(cert.qrCodeDataUrl)}
                            title="Click to enlarge"
                            style={{ width: '40px', height: '40px', borderRadius: '6px', border: '1px solid #e2e8f0', objectFit: 'contain', background: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s' }} 
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          />
                        ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: '700', color: '#3b82f6', letterSpacing: '0.5px' }}>
                        {cert.certificateNumber}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: cert.recipientName ? '600' : 'normal', color: cert.recipientName ? '#0f172a' : '#94a3b8' }}>
                        {cert.recipientName || '— (Blank)'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#334155' }}>
                        {cert.position || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#334155' }}>
                        {cert.portfolio || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#334155' }}>
                        {cert.committee || '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          background: cert.status === 'active' ? '#dcfce7' : '#f1f5f9',
                          color: cert.status === 'active' ? '#166534' : '#64748b',
                          border: cert.status === 'active' ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                        }}>
                          {cert.status === 'active' ? 'Active Winner' : 'Pre-Event Blank'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 24px', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
                        <a
                          href={`#page-certificates?id=${cert.certificateNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View Digital Certificate"
                          style={{ background: '#ffffff', color: '#475569', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: '6px', textDecoration: 'none', display: 'flex', alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#0f172a'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </a>
                        {cert.qrCodeDataUrl && (
                          <a
                            href={cert.qrCodeDataUrl}
                            download={`YANF_QR_${cert.certificateNumber}.png`}
                            title="Download QR Code"
                            style={{ background: '#ffffff', color: '#475569', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: '6px', textDecoration: 'none', display: 'flex', alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#0f172a'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditModal(cert)}
                          title="Edit Participant"
                          style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#dbeafe'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCert(cert)}
                          title="Delete Certificate"
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* SUB-TAB 3: EVENT SETUP & LOGOS */}
      {activeSubTab === 'event_setup' && (
        <form onSubmit={handleSaveEvent} className="studio-card" style={{ padding: '28px', maxWidth: '780px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: '#0f172a' }}>
            {currentEvent ? `Edit Event: ${currentEvent.title}` : 'Create New Event'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Event Title *</label>
              <input
                type="text"
                required
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="e.g. YANF National Youth Assembly 2026"
                style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '8px 12px', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Event Date</label>
              <input
                type="date"
                value={eventForm.eventDate}
                onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '8px 12px', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Venue / Host Institution</label>
              <input
                type="text"
                value={eventForm.venue}
                onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                placeholder="e.g. New Delhi / DPS R.K. Puram"
                style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '8px 12px', borderRadius: '6px' }}
              />
            </div>
          </div>

          {/* LOGO CONFIGURATION */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0f172a' }}>Institutional Logos (1 or 2 School Logos + YANF Logo)</h4>
            
            {[0, 1].map((index) => (
              <div key={`school-logo-${index}`} style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#334155', marginBottom: '4px' }}>School Logo {index + 1} {index === 0 ? '(Left Flank)' : '(Optional Center Logo)'}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      handleFileUpload(e, (url) => {
                        const logos = [...eventForm.schoolLogos];
                        if (!logos[index]) logos[index] = { url: '', shape: 'square' };
                        logos[index] = { ...logos[index], url };
                        setEventForm({ ...eventForm, schoolLogos: logos });
                      });
                    }}
                    disabled={uploadingImage}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 12px', borderRadius: '6px' }}
                  />
                  {eventForm.schoolLogos[index]?.url && (
                    <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>✓ Image uploaded</div>
                  )}
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#334155', marginBottom: '4px' }}>Shape</label>
                  <select
                    value={eventForm.schoolLogos[index]?.shape || 'square'}
                    onChange={(e) => {
                      const logos = [...eventForm.schoolLogos];
                      if (!logos[index]) logos[index] = { url: '', shape: 'square' };
                      logos[index] = { ...logos[index], shape: e.target.value };
                      setEventForm({ ...eventForm, schoolLogos: logos });
                    }}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '8px', borderRadius: '6px' }}
                  >
                    <option value="square">Square (1:1)</option>
                    <option value="rectangle">Rectangle</option>
                  </select>
                </div>
                {/* Checkerboard Preview */}
                <div style={{ width: '50px', height: '50px', background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #cbd5e1 0% 50%) 50% / 10px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', overflow: 'hidden' }}>
                  {eventForm.schoolLogos[index]?.url ? (
                    <img src={eventForm.schoolLogos[index].url} alt={`Logo ${index + 1}`} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  ) : <span style={{ fontSize: '10px', color: '#64748b' }}>Slot {index + 1}</span>}
                </div>
              </div>
            ))}

            {/* YANF Logo */}
            <h4 style={{ margin: '16px 0 12px', fontSize: '14px', color: '#0f172a' }}>YANF Logo</h4>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#334155', marginBottom: '4px' }}>YANF Logo (Right Flank)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleFileUpload(e, (url) => {
                      setEventForm({ ...eventForm, yanfLogo: { ...eventForm.yanfLogo, url } });
                    });
                  }}
                  disabled={uploadingImage}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 12px', borderRadius: '6px' }}
                />
                {eventForm.yanfLogo?.url && eventForm.yanfLogo.url !== '/yanf-wall.svg' && (
                  <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>✓ Image uploaded</div>
                )}
              </div>
              <div style={{ width: '120px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#334155', marginBottom: '4px' }}>Shape</label>
                <select
                  value={eventForm.yanfLogo?.shape || 'square'}
                  onChange={(e) => setEventForm({ ...eventForm, yanfLogo: { ...eventForm.yanfLogo, shape: e.target.value } })}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '8px', borderRadius: '6px' }}
                >
                  <option value="square">Square (1:1)</option>
                  <option value="rectangle">Rectangle</option>
                </select>
              </div>
              {/* Checkerboard Preview */}
              <div style={{ width: '50px', height: '50px', background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #cbd5e1 0% 50%) 50% / 10px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', overflow: 'hidden' }}>
                {eventForm.yanfLogo?.url ? (
                  <img src={eventForm.yanfLogo.url} alt="YANF Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                ) : <span style={{ fontSize: '10px', color: '#64748b' }}>YANF</span>}
              </div>
            </div>
          </div>

          {/* SIGNATORIES CONFIGURATION */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#0f172a' }}>Signatories (1 or 2 School Signatures + YANF Signature)</h4>
            
            {[0, 1].map((index) => (
              <div key={`school-sig-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#334155', marginBottom: '4px' }}>Signatory {index + 1} Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={eventForm.schoolSignatories[index]?.name || ''}
                    onChange={(e) => {
                      const sigs = [...eventForm.schoolSignatories];
                      if (!sigs[index]) sigs[index] = { name: '', designation: '', signatureUrl: '' };
                      sigs[index] = { ...sigs[index], name: e.target.value };
                      setEventForm({ ...eventForm, schoolSignatories: sigs });
                    }}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 10px', borderRadius: '4px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#334155', marginBottom: '4px' }}>Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Principal"
                    value={eventForm.schoolSignatories[index]?.designation || ''}
                    onChange={(e) => {
                      const sigs = [...eventForm.schoolSignatories];
                      if (!sigs[index]) sigs[index] = { name: '', designation: '', signatureUrl: '' };
                      sigs[index] = { ...sigs[index], designation: e.target.value };
                      setEventForm({ ...eventForm, schoolSignatories: sigs });
                    }}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 10px', borderRadius: '4px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#334155', marginBottom: '4px' }}>Signature Image Upload</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      handleFileUpload(e, (url) => {
                        const sigs = [...eventForm.schoolSignatories];
                        if (!sigs[index]) sigs[index] = { name: '', designation: '', signatureUrl: '' };
                        sigs[index] = { ...sigs[index], signatureUrl: url };
                        setEventForm({ ...eventForm, schoolSignatories: sigs });
                      });
                    }}
                    disabled={uploadingImage}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '4px 10px', borderRadius: '4px', fontSize: '11px' }}
                  />
                  {eventForm.schoolSignatories[index]?.signatureUrl && (
                    <div style={{ fontSize: '10px', color: '#059669', marginTop: '2px' }}>✓ Uploaded</div>
                  )}
                </div>
              </div>
            ))}

            {/* YANF Signatory */}
            <h4 style={{ margin: '16px 0 12px', fontSize: '14px', color: '#0f172a' }}>YANF Signatory</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#334155', marginBottom: '4px' }}>YANF Signatory Name</label>
                <input
                  type="text"
                  placeholder="e.g. Secretariat"
                  value={eventForm.yanfSignatory?.name || ''}
                  onChange={(e) => setEventForm({ ...eventForm, yanfSignatory: { ...eventForm.yanfSignatory, name: e.target.value } })}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 10px', borderRadius: '4px', fontSize: '12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#334155', marginBottom: '4px' }}>Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Secretary-General, YANF"
                  value={eventForm.yanfSignatory?.designation || ''}
                  onChange={(e) => setEventForm({ ...eventForm, yanfSignatory: { ...eventForm.yanfSignatory, designation: e.target.value } })}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 10px', borderRadius: '4px', fontSize: '12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#334155', marginBottom: '4px' }}>YANF Signature Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleFileUpload(e, (url) => {
                      setEventForm({ ...eventForm, yanfSignatory: { ...eventForm.yanfSignatory, signatureUrl: url } });
                    });
                  }}
                  disabled={uploadingImage}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '4px 10px', borderRadius: '4px', fontSize: '11px' }}
                />
                {eventForm.yanfSignatory?.signatureUrl && (
                  <div style={{ fontSize: '10px', color: '#059669', marginTop: '2px' }}>✓ Uploaded</div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setActiveSubTab('roster')}
              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '10px 20px', borderRadius: '6px', fontSize: '14px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={savingEvent}
              style={{ background: '#2563eb', color: '#ffffff', padding: '10px 24px', borderRadius: '6px', fontSize: '14px' }}
            >
              {savingEvent ? 'Saving Event...' : (currentEvent ? 'Update Event Settings' : 'Create Event')}
            </button>
          </div>
        </form>
      )}

      {/* ADD CERTIFICATES MODAL */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#ffffff', width: '90%', maxWidth: '400px', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', color: '#0f172a', fontWeight: '700' }}>Add Certificates</h3>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
              Generate blank certificates that you can fill in later. If you generate just 1, you can immediately edit its details.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                Quantity to Generate
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={batchCount}
                onChange={(e) => setBatchCount(parseInt(e.target.value, 10) || 1)}
                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', color: '#0f172a', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ padding: '10px 20px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleGenerate(batchCount)}
                disabled={generatingBatch}
                style={{ padding: '10px 20px', border: 'none', background: '#2563eb', color: '#ffffff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {generatingBatch ? 'Wait...' : (batchCount === 1 ? 'Add 1 Certificate' : `Generate ${batchCount} Blanks`)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR LIGHTBOX MODAL */}
      {previewQr && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setPreviewQr(null)}>
          <div style={{ position: 'relative', background: '#ffffff', padding: '16px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewQr(null)}
              style={{ position: 'absolute', top: '-16px', right: '-16px', background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              title="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <img src={previewQr} alt="QR Code Preview" style={{ maxWidth: '100%', maxHeight: 'calc(90vh - 32px)', objectFit: 'contain', display: 'block', borderRadius: '8px' }} />
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCert && (
        <div className="toast-modal-overlay" onClick={() => setDeletingCert(null)}>
          <div 
            style={{ 
              background: '#ffffff', 
              borderRadius: '16px', 
              width: '400px', 
              padding: '32px',
              maxWidth: '90vw', 
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              position: 'relative',
              animation: 'popScale 0.25s ease',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 12px', fontSize: '20px', color: '#0f172a' }}>
              Delete Certificate?
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '24px', lineHeight: '1.5' }}>
              Are you sure you want to permanently delete certificate <strong>{deletingCert.certificateNumber}</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button" 
                onClick={() => setDeletingCert(null)}
                style={{
                  padding: '10px 20px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={executeDeleteCertificate}
                style={{
                  padding: '10px 20px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PARTICIPANT MODAL */}
      {editingCert && (
        <div className="toast-modal-overlay" onClick={() => setEditingCert(null)}>
          <div 
            style={{ 
              background: '#ffffff', 
              borderRadius: '20px', 
              width: '540px', 
              padding: '32px',
              maxWidth: '95vw', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              position: 'relative',
              animation: 'popScale 0.25s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button" 
              className="square-card-close-btn"
              onClick={() => setEditingCert(null)}
              title="Cancel"
            >
              ✕
            </button>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', color: '#0f172a' }}>
              Sync Winner Details
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              Certificate ID: <strong>{editingCert.certificateNumber}</strong>
            </p>

            <form onSubmit={handleSaveParticipant}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Sharma"
                  value={certFormData.recipientName}
                  onChange={(e) => setCertFormData({ ...certFormData, recipientName: e.target.value })}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Recipient Email (Required for 2FA OTP Download) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ananya@gmail.com"
                  value={certFormData.recipientEmail}
                  onChange={(e) => setCertFormData({ ...certFormData, recipientEmail: e.target.value })}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Award Position *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Best Delegate / High Commendation"
                  value={certFormData.position}
                  onChange={(e) => setCertFormData({ ...certFormData, position: e.target.value })}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Portfolio / Representation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. United States of America / Delegation of France"
                  value={certFormData.portfolio}
                  onChange={(e) => setCertFormData({ ...certFormData, portfolio: e.target.value })}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Committee *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. United Nations Security Council"
                  value={certFormData.committee}
                  onChange={(e) => setCertFormData({ ...certFormData, committee: e.target.value })}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setEditingCert(null)}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '10px 20px', borderRadius: '6px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingCert}
                  style={{ background: '#2563eb', color: '#ffffff', padding: '10px 24px', borderRadius: '6px', fontSize: '13px' }}
                >
                  {savingCert ? 'Saving...' : 'Save & Activate Winner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
