import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import HouseCard from '../components/HouseCard';
import EventCard from '../components/EventCard';
import api from '../hooks/useApi';
import styles from './Landing.module.css';

export default function Landing() {
  const [featured, setFeatured] = useState([]);
  const [houses, setHouses] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.get('/api/products?featured=true&limit=4').then((d) => setFeatured(d.products || [])).catch(() => {});
    api.get('/api/houses?limit=4').then((d) => setHouses(d.houses || [])).catch(() => {});
    api.get('/api/events?upcoming=true').then((d) => setEvents((d || []).slice(0, 3))).catch(() => {});
  }, []);

  return (
    <main className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>Multi-Brand Fragrance Platform</p>
          <h1 className={styles.heroHeadline}>
            Discover Rare<br />
            <em>Fragrance Houses</em>
          </h1>
          <p className={styles.heroSub}>
            Explore independent perfumers and iconic brands — all in one place.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/shop" className={styles.btnPrimary}>Shop Fragrances</Link>
            <Link to="/register?role=brand_owner" className={styles.btnSecondary}>List Your Brand</Link>
          </div>
        </div>
        <div className={styles.heroDecor} aria-hidden="true">
          <div className={styles.orb1} />
          <div className={styles.orb2} />
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Featured Fragrances</h2>
              <Link to="/shop" className={styles.seeAll}>View All →</Link>
            </div>
            <div className={styles.grid4}>
              {featured.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Brand Discovery */}
      {houses.length > 0 && (
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Fragrance Houses</h2>
              <Link to="/brands" className={styles.seeAll}>Explore All →</Link>
            </div>
            <div className={styles.grid4}>
              {houses.map((h) => <HouseCard key={h._id} house={h} />)}
            </div>
          </div>
        </section>
      )}

      {/* Events */}
      {events.length > 0 && (
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Upcoming Events</h2>
              <Link to="/events" className={styles.seeAll}>All Events →</Link>
            </div>
            <div className={styles.grid3}>
              {events.map((e) => <EventCard key={e._id} event={e} />)}
            </div>
          </div>
        </section>
      )}

      {/* Brand CTA */}
      <section className={styles.brandCta}>
        <div className="container">
          <div className={styles.brandCtaInner}>
            <div>
              <h2 className={styles.brandCtaTitle}>Are you a fragrance house?</h2>
              <p className={styles.brandCtaSub}>
                Join OMRE and reach customers who care about craft, scent, and story.
              </p>
            </div>
            <Link to="/register?role=brand_owner" className={styles.btnPrimary}>
              Apply to Join
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
