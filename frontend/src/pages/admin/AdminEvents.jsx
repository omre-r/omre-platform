import { useEffect, useState } from 'react';
import api from '../../hooks/useApi';
import styles from './Admin.module.css';

const EMPTY_EVENT = {
  title: '', description: '', location: '',
  startDate: '', endDate: '', applicationDeadline: '',
  boothFee: '', boothSize: '10x10', imageUrl: '', capacity: '',
};

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_EVENT);
  const [formLoading, setFormLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('events');
  const [selectedEventId, setSelectedEventId] = useState('');

  function loadEvents() {
    api.get('/api/events/all')
      .then((d) => setEvents(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function loadApplications(eventId) {
    const q = eventId ? `?eventId=${eventId}` : '';
    api.get(`/api/event-applications${q}`)
      .then((d) => setApplications(Array.isArray(d) ? d : []))
      .catch(() => setApplications([]));
  }

  useEffect(() => { loadEvents(); }, []);
  useEffect(() => {
    if (activeTab === 'applications') loadApplications(selectedEventId);
  }, [activeTab, selectedEventId]);

  function handleFormChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post('/api/events', {
        ...form,
        boothFee: form.boothFee ? Number(form.boothFee) : 0,
        capacity: form.capacity ? Number(form.capacity) : null,
      });
      setShowForm(false);
      setForm(EMPTY_EVENT);
      loadEvents();
    } catch (err) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handlePublish(eventId, isPublished) {
    try {
      await api.patch(`/api/events/${eventId}/publish`, { isPublished });
      loadEvents();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleReviewApp(appId, status) {
    try {
      await api.patch(`/api/event-applications/${appId}/review`, { status });
      loadApplications(selectedEventId);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Events</h1>
            <p className={styles.sub}>Create and manage fragrance events.</p>
          </div>
          <button className={styles.createBtn} onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ New Event'}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate} className={styles.createForm}>
            <h2 className={styles.formTitle}>Create Event</h2>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Title *</label>
                <input name="title" value={form.title} onChange={handleFormChange} required className={styles.input} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Location</label>
                <input name="location" value={form.location} onChange={handleFormChange} className={styles.input} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Start Date *</label>
                <input name="startDate" type="date" value={form.startDate} onChange={handleFormChange} required className={styles.input} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>End Date *</label>
                <input name="endDate" type="date" value={form.endDate} onChange={handleFormChange} required className={styles.input} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Application Deadline</label>
                <input name="applicationDeadline" type="date" value={form.applicationDeadline} onChange={handleFormChange} className={styles.input} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Booth Fee ($)</label>
                <input name="boothFee" type="number" value={form.boothFee} onChange={handleFormChange} className={styles.input} placeholder="0" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Booth Size</label>
                <input name="boothSize" value={form.boothSize} onChange={handleFormChange} className={styles.input} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Capacity</label>
                <input name="capacity" type="number" value={form.capacity} onChange={handleFormChange} className={styles.input} placeholder="Leave blank for unlimited" />
              </div>
              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label className={styles.label}>Image URL</label>
                <input name="imageUrl" value={form.imageUrl} onChange={handleFormChange} className={styles.input} />
              </div>
              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label className={styles.label}>Description</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} className={styles.textarea} rows={3} />
              </div>
            </div>
            <button className={styles.approveBtn} disabled={formLoading}>
              {formLoading ? 'Creating…' : 'Create Event'}
            </button>
          </form>
        )}

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'events' ? styles.tabActive : ''}`} onClick={() => setActiveTab('events')}>Events</button>
          <button className={`${styles.tab} ${activeTab === 'applications' ? styles.tabActive : ''}`} onClick={() => setActiveTab('applications')}>Applications</button>
        </div>

        {activeTab === 'events' && (
          loading ? <div className={styles.state}>Loading…</div> :
          events.length === 0 ? <div className={styles.state}>No events yet.</div> :
          <div className={styles.list}>
            {events.map((ev) => (
              <div key={ev._id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>{ev.title}</h3>
                    <p className={styles.cardMeta}>{formatDate(ev.startDate)} · {ev.location}</p>
                  </div>
                  <div className={styles.cardRight}>
                    <span className={`${styles.badge} ${ev.isPublished ? styles.badge_fulfilled : styles.badge_pending}`}>
                      {ev.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <button
                      className={ev.isPublished ? styles.rejectBtn : styles.approveBtn}
                      onClick={() => handlePublish(ev._id, !ev.isPublished)}
                    >
                      {ev.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'applications' && (
          <div>
            <div className={styles.filterRow}>
              <label className={styles.label}>Filter by Event:</label>
              <select className={styles.statusSelect} value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
                <option value="">All Events</option>
                {events.map((ev) => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
              </select>
            </div>
            {applications.length === 0 ? (
              <div className={styles.state}>No applications found.</div>
            ) : (
              <div className={styles.list}>
                {applications.map((app) => (
                  <div key={app._id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div>
                        <h3 className={styles.cardTitle}>{app.houseId?.name}</h3>
                        <p className={styles.cardMeta}>for: {app.eventId?.title} · by {app.applicantId?.name}</p>
                      </div>
                      <span className={`${styles.badge} ${styles[`badge_${app.status}`]}`}>{app.status}</span>
                    </div>
                    {app.message && <p className={styles.cardDesc}>{app.message}</p>}
                    {app.status === 'pending' && (
                      <div className={styles.reviewActions}>
                        <button className={styles.approveBtn} onClick={() => handleReviewApp(app._id, 'accepted')}>Accept</button>
                        <button className={styles.rejectBtn} onClick={() => handleReviewApp(app._id, 'rejected')}>Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
