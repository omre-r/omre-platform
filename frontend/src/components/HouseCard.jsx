import { Link } from 'react-router-dom';
import styles from './HouseCard.module.css';

export default function HouseCard({ house }) {
  return (
    <Link to={`/brands/${house.slug}`} className={styles.card}>
      <div className={styles.banner}>
        {house.bannerUrl ? (
          <img src={house.bannerUrl} alt={house.name} className={styles.bannerImg} />
        ) : (
          <div className={styles.bannerPlaceholder} />
        )}
        {house.logoUrl && (
          <div className={styles.logoWrap}>
            <img src={house.logoUrl} alt={`${house.name} logo`} className={styles.logo} />
          </div>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{house.name}</h3>
        {house.location && <p className={styles.location}>{house.location}</p>}
        {house.description && (
          <p className={styles.desc}>{house.description.slice(0, 100)}{house.description.length > 100 ? '…' : ''}</p>
        )}
        <span className={styles.cta}>View Collection →</span>
      </div>
    </Link>
  );
}
