import { useEffect, useState } from 'react';
import EventCard from '../components/EventCard';
import api from '../hooks/useApi';
import styles from './Events.module.css';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    const params = filter === 'upcoming' ? '?upcoming=true' : '';
    api.get(`/api/events${params}`)
      .then((d) => setEvents(Array.isArray(d) ? d : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Fragrance Events</h1>
            <p className={styles.sub}>
              Pop-ups, showcases, and scent markets from independent fragrance houses.
            </p>
          </div>
        </div>

        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === 'upcoming' ? styles.filterActive : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`}
            onClick={() => setFilter('all')}
          >
            All Events
          </button>
        </div>

        {loading ? (
          <div className={styles.state}>Loading…</div>
        ) : events.length === 0 ? (
          <div className={styles.state}>No events at this time.</div>
        ) : (
          <div className={styles.grid}>
            {events.map((e) => <EventCard key={e._id} event={e} />)}
          </div>
        )}
      </div>
    </main>
  );
}
