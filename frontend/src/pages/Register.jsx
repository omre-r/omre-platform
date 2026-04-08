import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../hooks/useApi';
import styles from './AuthForm.module.css';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const defaultRole = params.get('role') === 'brand_owner' ? 'brand_owner' : 'customer';

  const [form, setForm] = useState({ name: '', email: '', password: '', role: defaultRole });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api.post('/api/auth/register', form);
      login(token);
      navigate(form.role === 'brand_owner' ? '/brand/dashboard' : '/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link to="/" className={styles.logo}>OMRE</Link>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.sub}>Join the fragrance platform.</p>
        </div>

        {/* Role selector */}
        <div className={styles.roleSelector}>
          <button
            type="button"
            className={`${styles.roleBtn} ${form.role === 'customer' ? styles.roleActive : ''}`}
            onClick={() => setForm((f) => ({ ...f, role: 'customer' }))}
          >
            <span className={styles.roleIcon}>🛍</span>
            <span className={styles.roleLabel}>Customer</span>
            <span className={styles.roleHint}>Shop fragrances</span>
          </button>
          <button
            type="button"
            className={`${styles.roleBtn} ${form.role === 'brand_owner' ? styles.roleActive : ''}`}
            onClick={() => setForm((f) => ({ ...f, role: 'brand_owner' }))}
          >
            <span className={styles.roleIcon}>🏛</span>
            <span className={styles.roleLabel}>Brand Owner</span>
            <span className={styles.roleHint}>List your house</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Full Name</label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              className={styles.input}
              placeholder="Your name"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className={styles.input}
              placeholder="you@example.com"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
              className={styles.input}
              placeholder="Min. 8 characters"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className={styles.switch}>
          Already have an account?{' '}
          <Link to="/login" className={styles.switchLink}>Sign in</Link>
        </p>
      </div>
    </main>
  );
}
