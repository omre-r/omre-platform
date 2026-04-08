import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          OMRE
        </Link>

        {/* Primary nav */}
        <nav className={styles.nav}>
          <NavLink to="/shop" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
            Shop
          </NavLink>
          <NavLink to="/brands" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
            Brands
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
            Events
          </NavLink>
        </nav>

        {/* Right side */}
        <div className={styles.actions}>
          {/* Cart */}
          <Link to="/cart" className={styles.cartBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
          </Link>

          {isAuthenticated ? (
            <div className={styles.userMenu}>
              <span className={styles.userName}>{user?.name}</span>
              {user?.role === 'admin' && (
                <Link to="/admin/applications" className={styles.roleLink}>Admin</Link>
              )}
              {user?.role === 'brand_owner' && (
                <Link to="/brand/dashboard" className={styles.roleLink}>Dashboard</Link>
              )}
              {user?.role === 'customer' && (
                <Link to="/orders" className={styles.roleLink}>Orders</Link>
              )}
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Sign Out
              </button>
            </div>
          ) : (
            <div className={styles.authLinks}>
              <Link to="/login" className={styles.link}>Sign In</Link>
              <Link to="/register" className={styles.btnPrimary}>Join</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
