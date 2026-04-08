import { useEffect, useState } from 'react';
import HouseCard from '../components/HouseCard';
import api from '../hooks/useApi';
import styles from './Brands.module.css';

export default function Brands() {
  const [houses, setHouses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/houses?limit=50')
      .then((d) => { setHouses(d.houses || []); setTotal(d.total || 0); })
      .catch(() => setHouses([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Fragrance Houses</h1>
            <p className={styles.sub}>
              Independent perfumers and iconic brands — discover their stories and collections.
            </p>
          </div>
          <span className={styles.count}>{total} houses</span>
        </div>

        {loading ? (
          <div className={styles.state}>Loading…</div>
        ) : houses.length === 0 ? (
          <div className={styles.state}>No fragrance houses yet.</div>
        ) : (
          <div className={styles.grid}>
            {houses.map((h) => <HouseCard key={h._id} house={h} />)}
          </div>
        )}
      </div>
    </main>
  );
}
