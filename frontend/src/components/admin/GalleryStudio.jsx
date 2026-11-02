import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchAllGalleryPhotos, createGalleryPhoto, updateGalleryPhoto, deleteGalleryPhoto, uploadImageToDrive
} from '../../services/api';

export const GALLERY_SECTIONS = [
  { id: 'committee', label: 'Committee Photos' },
  { id: 'ceremonies', label: 'Closing Ceremonies' },
  { id: 'behind-the-scenes', label: 'Behind the Scenes' },
];
const sectionLabel = (id) => (GALLERY_SECTIONS.find((s) => s.id === id) || {}).label || id;

const EMPTY_FORM = { url: '', driveFileId: '', section: 'committee', eventName: '', year: String(new Date().getFullYear()), caption: '', altText: '', published: true };

const field = { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 500, color: '#334155' };
const btn = (primary) => (primary
  ? { background: '#2563eb', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }
  : { background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' });

export default function GalleryStudio({ mediaGallery }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  const library = useMemo(() => (mediaGallery || []).map((item, i) => (
    typeof item === 'string'
      ? { key: `m-${i}`, url: item, title: `Asset #${i + 1}`, alt: '' }
      : { key: item.driveFileId || item.id || `m-${i}`, url: item.url || item.thumbnailUrl, driveFileId: item.driveFileId, title: item.title || item.altText || `Asset #${i + 1}`, alt: item.alt || item.altText || '' }
  )).filter((m) => m.url), [mediaGallery]);

  const eventNames = useMemo(() => [...new Set(photos.map((p) => p.eventName).filter(Boolean))], [photos]);

  const load = async () => {
    try {
      setLoading(true);
      setPhotos(await fetchAllGalleryPhotos());
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const pick = (m) => setForm((f) => ({ ...f, url: m.url, driveFileId: m.driveFileId || '', altText: f.altText || m.alt || '' }));

  const onUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      setUploading(true); setMsg({ type: '', text: '' });
      const data = await uploadImageToDrive(file);
      setForm((f) => ({ ...f, url: data.url, driveFileId: data.driveFileId || '' }));
      setMsg({ type: 'ok', text: 'Photo uploaded to Google Drive. Fill in the details and publish.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.url) { setMsg({ type: 'error', text: 'Choose a photo first, pick one from the Media Library, upload one, or paste a link.' }); return; }
    if (!form.eventName.trim()) { setMsg({ type: 'error', text: 'Add the event name so the photo lands on the right contact sheet.' }); return; }
    try {
      setSaving(true); setMsg({ type: '', text: '' });
      const created = await createGalleryPhoto({
        ...form,
        eventName: form.eventName.trim(),
        caption: form.caption.trim(),
        altText: (form.altText || form.caption || `${form.eventName} photo`).trim(),
      });
      setPhotos((p) => [created, ...p]);
      setForm((f) => ({ ...EMPTY_FORM, section: f.section, eventName: f.eventName, year: f.year }));
      setMsg({ type: 'ok', text: created.published ? 'Published to the Gallery.' : 'Saved as hidden, it won’t show on the site until you publish it.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id, updates) => {
    try {
      const updated = await updateGalleryPhoto(id, updates);
      setPhotos((p) => p.map((x) => (x._id === id ? updated : x)));
      return true;
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
      return false;
    }
  };

  const remove = async (photo) => {
    if (!window.confirm(`Remove this photo from the Gallery?\n\n${photo.caption || photo.eventName}\n\nThe file stays on Google Drive.`)) return;
    try {
      await deleteGalleryPhoto(photo._id);
      setPhotos((p) => p.filter((x) => x._id !== photo._id));
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const grouped = useMemo(() => {
    const g = {};
    photos.forEach((p) => { const k = `${p.eventName}${p.year ? ` · ${p.year}` : ''}`; (g[k] = g[k] || []).push(p); });
    return Object.entries(g);
  }, [photos]);

  return (
    <div>
      <div className="studio-card">
        <div className="studio-section-header">
          <h2>Gallery</h2>
          <p>Photos published here appear on the public Gallery page, grouped by event into contact sheets.</p>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>1 · Choose a photo</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: '8px', maxHeight: '260px', overflowY: 'auto', padding: '2px' }}>
              {library.length === 0 && (
                <p style={{ gridColumn: '1 / -1', fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Your Media Library is empty on this browser. Upload a photo below or paste a link.
                </p>
              )}
              {library.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => pick(m)}
                  title={m.title}
                  aria-pressed={form.url === m.url}
                  style={{ padding: 0, background: '#f1f5f9', border: form.url === m.url ? '3px solid #2563eb' : '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', cursor: 'pointer' }}
                >
                  <img src={m.url} alt={m.alt || m.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ ...btn(false), display: 'inline-flex', alignItems: 'center' }}>
                <input type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
                {uploading ? 'Uploading…' : 'Upload new photo'}
              </label>
              <span style={{ fontSize: '12px', color: '#64748b' }}>or paste a link:</span>
            </div>
            <input className="studio-input" type="url" placeholder="https://…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value, driveFileId: '' })} />
            {form.url && <img src={form.url} alt="Selected photo preview" style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }} />}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>2 · Describe it</div>
            <label style={field}>Section
              <select className="studio-select" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
                {GALLERY_SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '10px' }}>
              <label style={field}>Event name
                <input className="studio-input" list="gallery-events" placeholder="e.g. YANF MUN, Delhi" value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} />
                <datalist id="gallery-events">{eventNames.map((n) => <option key={n} value={n} />)}</datalist>
              </label>
              <label style={field}>Year
                <input className="studio-input" type="number" min="2000" max="2100" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </label>
            </div>
            <label style={field}>Caption (shown under the photo)
              <input className="studio-input" maxLength={140} placeholder="e.g. UNSC delegates in an unmoderated caucus" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
            </label>
            <label style={field}>Alt text (for screen readers, describe what's in the photo)
              <input className="studio-input" maxLength={200} value={form.altText} onChange={(e) => setForm({ ...form, altText: e.target.value })} />
            </label>
            <label style={{ ...field, flexDirection: 'row', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              Publish on the site now
            </label>
            {msg.text && (
              <p role={msg.type === 'error' ? 'alert' : 'status'} style={{ margin: 0, fontSize: '13px', color: msg.type === 'error' ? '#b91c1c' : '#047857' }}>{msg.text}</p>
            )}
            <button type="submit" style={btn(true)} disabled={saving}>{saving ? 'Saving…' : 'Add to Gallery'}</button>
          </div>
        </form>
      </div>

      <div className="studio-card">
        <div className="studio-section-header">
          <h2>In the Gallery ({photos.length})</h2>
          <p>Hidden photos stay here but don't show on the site.</p>
        </div>
        {loading && <p style={{ color: '#64748b' }}>Loading…</p>}
        {!loading && photos.length === 0 && <p style={{ color: '#64748b' }}>No photos yet. Add the first one above.</p>}
        {grouped.map(([eventKey, list]) => (
          <div key={eventKey} style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '15px', color: '#0f172a', margin: '0 0 12px' }}>{eventKey}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {list.map((p) => (
                <div key={p._id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', background: '#fff', opacity: p.published ? 1 : 0.55 }}>
                  <img src={p.url} alt={p.altText} style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {editingId === p._id ? (
                      <>
                        <select className="studio-select" value={editDraft.section} onChange={(e) => setEditDraft({ ...editDraft, section: e.target.value })}>
                          {GALLERY_SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                        <input className="studio-input" value={editDraft.caption} onChange={(e) => setEditDraft({ ...editDraft, caption: e.target.value })} placeholder="Caption" />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button type="button" style={btn(true)} onClick={async () => { if (await patch(p._id, editDraft)) setEditingId(null); }}>Save</button>
                          <button type="button" style={btn(false)} onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2563eb', fontWeight: 600 }}>{sectionLabel(p.section)}{p.published ? '' : ' · Hidden'}</span>
                        <span style={{ fontSize: '13px', color: '#0f172a' }}>{p.caption || <em style={{ color: '#64748b' }}>No caption</em>}</span>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button type="button" style={btn(false)} onClick={() => { setEditingId(p._id); setEditDraft({ section: p.section, caption: p.caption || '' }); }}>Edit</button>
                          <button type="button" style={btn(false)} onClick={() => patch(p._id, { published: !p.published })}>{p.published ? 'Hide' : 'Publish'}</button>
                          <button type="button" style={{ ...btn(false), color: '#b91c1c' }} onClick={() => remove(p)}>Remove</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
