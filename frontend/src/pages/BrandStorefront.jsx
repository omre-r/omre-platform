import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import api from '../hooks/useApi';
import styles from './BrandStorefront.module.css';

export default function BrandStorefront() {
  const { slug } = useParams();
  const [house, setHouse] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/houses/${slug}`)
      .then((h) => {
        setHouse(h);
        return api.get(`/api/products?houseId=${h._id}&limit=50`);
      })
      .then((d) => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className={styles.state}>Loading…</div>;
  if (!house) return <div className={styles.state}>Brand not found.</div>;

  return (
    <main className={styles.page}>
      {/* Banner */}
      <div className={styles.banner}>
        {house.bannerUrl ? (
          <img src={house.bannerUrl} alt={house.name} className={styles.bannerImg} />
        ) : (
          <div className={styles.bannerPlaceholder} />
        )}
        <div className={styles.bannerOverlay} />
      </div>

      <div className="container">
        {/* House info */}
        <div className={styles.identity}>
          {house.logoUrl && (
            <div className={styles.logoWrap}>
              <img src={house.logoUrl} alt={house.name} className={styles.logo} />
            </div>
          )}
          <div className={styles.info}>
            <h1 className={styles.name}>{house.name}</h1>
            <div className={styles.meta}>
              {house.location && <span>{house.location}</span>}
              {house.websiteUrl && (
                <a href={house.websiteUrl} target="_blank" rel="noreferrer" className={styles.metaLink}>
                  Website ↗
                </a>
              )}
              {house.instagramUrl && (
                <a href={house.instagramUrl} target="_blank" rel="noreferrer" className={styles.metaLink}>
                  Instagram ↗
                </a>
              )}
            </div>
            {house.description && <p className={styles.description}>{house.description}</p>}
          </div>
        </div>

        {/* Products */}
        <div className={styles.productsSection}>
          <h2 className={styles.productsTitle}>
            Collection <span className={styles.productsCount}>{products.length} fragrances</span>
          </h2>
          {products.length === 0 ? (
            <div className={styles.empty}>No fragrances listed yet.</div>
          ) : (
            <div className={styles.grid}>
              {products.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
