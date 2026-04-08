import { Link } from 'react-router-dom';
import styles from './EventCard.module.css';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function EventCard({ event }) {
  return (
    <Link to={`/events/${event.slug}`} className={styles.card}>
      <div className={styles.imageWrap}>
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{event.title}</h3>
        <div className={styles.meta}>
          <span>{formatDate(event.startDate)}</span>
          {event.location && <span>· {event.location}</span>}
        </div>
        {event.description && (
          <p className={styles.desc}>
            {event.description.slice(0, 90)}{event.description.length > 90 ? '…' : ''}
          </p>
        )}
        {event.participatingHouses?.length > 0 && (
          <p className={styles.brands}>
            {event.participatingHouses.length} brand{event.participatingHouses.length !== 1 ? 's' : ''} participating
          </p>
        )}
      </div>
    </Link>
  );
}
