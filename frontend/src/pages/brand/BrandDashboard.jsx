import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../hooks/useApi';
import styles from './Brand.module.css';

export default function BrandDashboard() {
  const { user } = useAuth();
  const [house, setHouse] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appForm, setAppForm] = useState({
    proposedHouseName: '', description: '', location: '', logoUrl: '', bannerUrl: '', instagramUrl: '', websiteUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user?.houseId) {
      // Fetch house by finding from houses list — simplified: brand owner has houseId in token
      // We'll just show a link to storefront
      setLoading(false);
    } else {
      // Check if they have an existing application
      api.get('/api/applications/mine')
        .then((apps) => {
          if (apps.length > 0) setApplication(apps[0]);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  async function handleSubmitApp(e) {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await api.post('/api/applications', appForm);
      setSubmitted(true);
      const apps = await api.get('/api/applications/mine');
      if (apps.length > 0) setApplication(apps[0]);
    } catch (err) {
      setSubmitError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  function handleFormChange(e) {
    setAppForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  if (loading) return <div className={styles.state}>Loading…</div>;

  return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Brand Dashboard</h1>
          <p className={styles.sub}>Welcome, {user?.name}</p>
        </div>

        {user?.houseId ? (
          /* Approved — show quick links */
          <div className={styles.approvedPanel}>
            <div className={styles.approvedBadge}>✓ Your fragrance house is live</div>
            <p className={styles.approvedNote}>
              Manage your storefront, products, and orders from the links below.
            </p>
            <div className={styles.quickLinks}>
              <Link to="/brand/products" className={styles.quickLink}>
                <span className={styles.qlIcon}>📦</span>
                <span>Manage Products</span>
              </Link>
              <Link to="/brand/orders" className={styles.quickLink}>
                <span className={styles.qlIcon}>📋</span>
                <span>View Orders</span>
              </Link>
              <Link to="/events" className={styles.quickLink}>
                <span className={styles.qlIcon}>🎪</span>
                <span>Browse Events</span>
              </Link>
            </div>
          </div>
        ) : application ? (
          /* Application submitted */
          <div className={styles.applicationStatus}>
            <h2 className={styles.sectionTitle}>Your Application</h2>
            <div className={styles.appCard}>
              <div className={styles.appCardHeader}>
                <h3 className={styles.appName}>{application.proposedHouseName}</h3>
                <span className={`${styles.badge} ${styles[`badge_${application.status}`]}`}>
                  {application.status}
                </span>
              </div>
              <p className={styles.appDesc}>{application.description}</p>
              {application.status === 'pending' && (
                <p className={styles.pendingNote}>
                  Your application is under review. You'll be able to manage your storefront once approved.
                </p>
              )}
              {application.status === 'rejected' && application.adminNote && (
                <p className={styles.rejectedNote}>Admin note: {application.adminNote}</p>
              )}
              {application.status === 'rejected' && (
                <p className={styles.rejectedNote}>You may submit a new application with updated details.</p>
              )}
            </div>
          </div>
        ) : (
          /* No application yet */
          <div className={styles.applySection}>
            <div className={styles.applyIntro}>
              <h2 className={styles.sectionTitle}>Apply to Join OMRE</h2>
              <p className={styles.applyDesc}>
                Submit your fragrance house application. Our team reviews each brand carefully.
                Once approved, your storefront will be live on the platform.
              </p>
            </div>

            <form onSubmit={handleSubmitApp} className={styles.applyForm}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Brand Name *</label>
                  <input name="proposedHouseName" value={appForm.proposedHouseName} onChange={handleFormChange} required className={styles.input} placeholder="Your Fragrance House" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Location</label>
                  <input name="location" value={appForm.location} onChange={handleFormChange} className={styles.input} placeholder="City, Country" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Logo URL</label>
                  <input name="logoUrl" value={appForm.logoUrl} onChange={handleFormChange} className={styles.input} placeholder="https://…" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Banner URL</label>
                  <input name="bannerUrl" value={appForm.bannerUrl} onChange={handleFormChange} className={styles.input} placeholder="https://…" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Instagram</label>
                  <input name="instagramUrl" value={appForm.instagramUrl} onChange={handleFormChange} className={styles.input} placeholder="https://instagram.com/…" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Website</label>
                  <input name="websiteUrl" value={appForm.websiteUrl} onChange={handleFormChange} className={styles.input} placeholder="https://…" />
                </div>
                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label className={styles.label}>Brand Description *</label>
                  <textarea name="description" value={appForm.description} onChange={handleFormChange} required className={styles.textarea} rows={4} placeholder="Tell us about your fragrance house, your craft, your story…" />
                </div>
              </div>

              {submitError && <p className={styles.error}>{submitError}</p>}

              <button className={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
