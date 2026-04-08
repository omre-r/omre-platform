import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/useApi';
import styles from './EventDetail.module.css';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function EventDetail() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState('');
  const [appError, setAppError] = useState('');

  useEffect(() => {
    api.get(`/api/events/${slug}`)
      .then(setEvent)
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleApply(e) {
    e.preventDefault();
    setApplying(true);
    setAppError('');
    try {
      await api.post('/api/event-applications', { eventId: event._id, message });
      setApplied(true);
    } catch (err) {
      setAppError(err.message || 'Application failed');
    } finally {
      setApplying(false);
    }
  }

  if (loading) return <div className={styles.state}>Loading…</div>;
  if (!event) return <div className={styles.state}>Event not found.</div>;

  const isBrandOwner = user?.role === 'brand_owner' && user?.houseId;
  const isPast = new Date(event.endDate) < new Date();
  const deadlinePassed = event.applicationDeadline && new Date() > new Date(event.applicationDeadline);

  return (
    <main className={styles.page}>
      {/* Banner */}
      <div className={styles.banner}>
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} className={styles.bannerImg} />
        ) : (
          <div className={styles.bannerPlaceholder} />
        )}
        <div className={styles.bannerOverlay} />
        <div className={styles.bannerContent}>
          <p className={styles.eyebrow}>Fragrance Event</p>
          <h1 className={styles.title}>{event.title}</h1>
          <div className={styles.bannerMeta}>
            <span>{formatDate(event.startDate)}{event.endDate !== event.startDate ? ` – ${formatDate(event.endDate)}` : ''}</span>
            {event.location && <span>· {event.location}</span>}
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.layout}>
          {/* Main content */}
          <div className={styles.main}>
            {event.description && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>About This Event</h2>
                <p className={styles.description}>{event.description}</p>
              </div>
            )}

            {event.participatingHouses?.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Participating Brands</h2>
                <div className={styles.housesGrid}>
                  {event.participatingHouses.map((h) => (
                    <Link key={h._id} to={`/brands/${h.slug}`} className={styles.houseChip}>
                      {h.logoUrl && <img src={h.logoUrl} alt={h.name} className={styles.houseChipLogo} />}
                      <span>{h.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.infoCard}>
              <h3 className={styles.infoTitle}>Event Details</h3>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Date</span>
                <span>{formatDate(event.startDate)}</span>
              </div>
              {event.location && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Location</span>
                  <span>{event.location}</span>
                </div>
              )}
              {event.boothFee > 0 && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Booth Fee</span>
                  <span>${event.boothFee}</span>
                </div>
              )}
              {event.boothSize && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Booth Size</span>
                  <span>{event.boothSize}</span>
                </div>
              )}
              {event.applicationDeadline && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Apply By</span>
                  <span>{formatDate(event.applicationDeadline)}</span>
                </div>
              )}
            </div>

            {/* Brand application */}
            {isBrandOwner && !isPast && !deadlinePassed && (
              <div className={styles.applyCard}>
                {applied ? (
                  <div className={styles.appliedMsg}>
                    <span className={styles.appliedIcon}>✓</span>
                    <p>Application submitted! The organizer will review your request.</p>
                  </div>
                ) : (
                  <form onSubmit={handleApply}>
                    <h3 className={styles.applyTitle}>Apply to Participate</h3>
                    <textarea
                      className={styles.messageInput}
                      placeholder="Tell the organizer about your brand and what you'll bring…"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                    />
                    {appError && <p className={styles.appError}>{appError}</p>}
                    <button className={styles.applyBtn} disabled={applying}>
                      {applying ? 'Submitting…' : 'Submit Application'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {isBrandOwner && deadlinePassed && !isPast && (
              <div className={styles.closedNote}>Application deadline has passed.</div>
            )}

            {!isAuthenticated && (
              <Link to="/login" className={styles.loginPrompt}>
                Sign in as a brand owner to apply →
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
