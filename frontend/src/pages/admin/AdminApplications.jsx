import { useEffect, useState } from 'react';
import api from '../../hooks/useApi';
import styles from './Admin.module.css';

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'];

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [reviewing, setReviewing] = useState(null);
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  function load() {
    setLoading(true);
    const q = filter !== 'all' ? `?status=${filter}` : '';
    api.get(`/api/applications${q}`)
      .then((d) => setApplications(Array.isArray(d) ? d : []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filter]);

  async function handleReview(appId, status) {
    setActionLoading(true);
    try {
      await api.patch(`/api/applications/${appId}/review`, { status, adminNote: note });
      setReviewing(null);
      setNote('');
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Brand Applications</h1>
          <p className={styles.sub}>Review fragrance house applications to the platform.</p>
        </div>

        <div className={styles.filters}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ''}`}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.state}>Loading…</div>
        ) : applications.length === 0 ? (
          <div className={styles.state}>No applications found.</div>
        ) : (
          <div className={styles.list}>
            {applications.map((app) => (
              <div key={app._id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>{app.proposedHouseName}</h3>
                    <p className={styles.cardMeta}>
                      by {app.applicantId?.name} · {app.applicantId?.email}
                    </p>
                  </div>
                  <span className={`${styles.badge} ${styles[`badge_${app.status}`]}`}>
                    {app.status}
                  </span>
                </div>

                <p className={styles.cardDesc}>{app.description}</p>

                <div className={styles.cardDetails}>
                  {app.location && <span>📍 {app.location}</span>}
                  {app.instagramUrl && <a href={app.instagramUrl} target="_blank" rel="noreferrer" className={styles.link}>Instagram ↗</a>}
                  {app.websiteUrl && <a href={app.websiteUrl} target="_blank" rel="noreferrer" className={styles.link}>Website ↗</a>}
                </div>

                {app.adminNote && (
                  <p className={styles.adminNote}>Note: {app.adminNote}</p>
                )}

                {app.status === 'pending' && (
                  reviewing === app._id ? (
                    <div className={styles.reviewPanel}>
                      <textarea
                        className={styles.noteInput}
                        placeholder="Admin note (optional, shown on rejection)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                      />
                      <div className={styles.reviewActions}>
                        <button
                          className={styles.approveBtn}
                          onClick={() => handleReview(app._id, 'approved')}
                          disabled={actionLoading}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className={styles.rejectBtn}
                          onClick={() => handleReview(app._id, 'rejected')}
                          disabled={actionLoading}
                        >
                          ✕ Reject
                        </button>
                        <button className={styles.cancelBtn} onClick={() => { setReviewing(null); setNote(''); }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className={styles.reviewBtn} onClick={() => setReviewing(app._id)}>
                      Review Application
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
