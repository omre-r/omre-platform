import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import api from '../hooks/useApi';
import styles from './Shop.module.css';

const CONCENTRATIONS = ['All', 'EDP', 'EDT', 'Parfum', 'EDC', 'Cologne', 'Other'];

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [houses, setHouses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [concentration, setConcentration] = useState('All');
  const [selectedHouse, setSelectedHouse] = useState('All');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    api.get('/api/houses?limit=50').then((d) => setHouses(d.houses || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 24 });
    if (concentration !== 'All') params.set('concentration', concentration);
    if (selectedHouse !== 'All') params.set('houseId', selectedHouse);

    api.get(`/api/products?${params}`)
      .then((d) => {
        setProducts(d.products || []);
        setTotal(d.total || 0);
        setPages(d.pages || 1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [concentration, selectedHouse, page]);

  function handleFilter(type, value) {
    setPage(1);
    if (type === 'concentration') setConcentration(value);
    if (type === 'house') setSelectedHouse(value);
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Shop Fragrances</h1>
            <p className={styles.count}>{total} fragrances</p>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Sidebar filters */}
          <aside className={styles.sidebar}>
            <div className={styles.filterGroup}>
              <h3 className={styles.filterLabel}>Concentration</h3>
              {CONCENTRATIONS.map((c) => (
                <button
                  key={c}
                  className={`${styles.filterBtn} ${concentration === c ? styles.filterActive : ''}`}
                  onClick={() => handleFilter('concentration', c)}
                >
                  {c}
                </button>
              ))}
            </div>

            {houses.length > 0 && (
              <div className={styles.filterGroup}>
                <h3 className={styles.filterLabel}>Brand</h3>
                <button
                  className={`${styles.filterBtn} ${selectedHouse === 'All' ? styles.filterActive : ''}`}
                  onClick={() => handleFilter('house', 'All')}
                >
                  All Brands
                </button>
                {houses.map((h) => (
                  <button
                    key={h._id}
                    className={`${styles.filterBtn} ${selectedHouse === h._id ? styles.filterActive : ''}`}
                    onClick={() => handleFilter('house', h._id)}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            )}
          </aside>

          {/* Product grid */}
          <section className={styles.main}>
            {loading ? (
              <div className={styles.loading}>Loading…</div>
            ) : products.length === 0 ? (
              <div className={styles.empty}>No fragrances found.</div>
            ) : (
              <>
                <div className={styles.grid}>
                  {products.map((p) => <ProductCard key={p._id} product={p} />)}
                </div>
                {pages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.pageBtn}
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      ← Prev
                    </button>
                    <span className={styles.pageInfo}>Page {page} of {pages}</span>
                    <button
                      className={styles.pageBtn}
                      disabled={page === pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
