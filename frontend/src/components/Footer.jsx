import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <span className={styles.logo}>OMRE</span>
          <p className={styles.tagline}>A destination for fragrance discovery.</p>
        </div>

        <div className={styles.links}>
          <div className={styles.col}>
            <span className={styles.colTitle}>Explore</span>
            <Link to="/shop">Shop</Link>
            <Link to="/brands">Brands</Link>
            <Link to="/events">Events</Link>
          </div>
          <div className={styles.col}>
            <span className={styles.colTitle}>Platform</span>
            <Link to="/register?role=brand_owner">List Your Brand</Link>
            <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <span>© {new Date().getFullYear()} OMRE Platform. All rights reserved.</span>
      </div>
    </footer>
  );
}
