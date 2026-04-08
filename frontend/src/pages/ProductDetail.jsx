import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../hooks/useApi';
import styles from './ProductDetail.module.css';

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api.get(`/api/products/${id}`)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  function handleAdd() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) return <div className={styles.state}>Loading…</div>;
  if (!product) return <div className={styles.state}>Product not found.</div>;

  const house = product.houseId;

  return (
    <main className={styles.page}>
      <div className="container">
        <nav className={styles.breadcrumb}>
          <Link to="/shop">Shop</Link>
          <span>›</span>
          {house && <Link to={`/brands/${house.slug}`}>{house.name}</Link>}
          {house && <span>›</span>}
          <span>{product.name}</span>
        </nav>

        <div className={styles.layout}>
          {/* Image */}
          <div className={styles.imageWrap}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className={styles.image} />
            ) : (
              <div className={styles.imagePlaceholder}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.75">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </div>
            )}
          </div>

          {/* Details */}
          <div className={styles.details}>
            {house && (
              <Link to={`/brands/${house.slug}`} className={styles.houseName}>
                {house.name}
              </Link>
            )}
            <h1 className={styles.name}>{product.name}</h1>
            <p className={styles.meta}>
              {product.concentration} · {product.sizeML}ml
            </p>
            <p className={styles.price}>${product.price.toFixed(2)}</p>

            {product.description && (
              <p className={styles.description}>{product.description}</p>
            )}

            {/* Scent Notes */}
            {(product.notes?.top?.length > 0 || product.notes?.middle?.length > 0 || product.notes?.base?.length > 0) && (
              <div className={styles.notes}>
                <h3 className={styles.notesTitle}>Scent Notes</h3>
                {product.notes.top?.length > 0 && (
                  <div className={styles.noteRow}>
                    <span className={styles.noteLabel}>Top</span>
                    <span>{product.notes.top.join(', ')}</span>
                  </div>
                )}
                {product.notes.middle?.length > 0 && (
                  <div className={styles.noteRow}>
                    <span className={styles.noteLabel}>Heart</span>
                    <span>{product.notes.middle.join(', ')}</span>
                  </div>
                )}
                {product.notes.base?.length > 0 && (
                  <div className={styles.noteRow}>
                    <span className={styles.noteLabel}>Base</span>
                    <span>{product.notes.base.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            <div className={styles.actions}>
              <button
                className={`${styles.addBtn} ${added ? styles.addedBtn : ''}`}
                onClick={handleAdd}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? 'Out of Stock' : added ? 'Added to Cart ✓' : 'Add to Cart'}
              </button>
              <span className={styles.stock}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Sold out'}
              </span>
            </div>

            {/* House info */}
            {house && (
              <div className={styles.houseCard}>
                <div className={styles.houseCardHeader}>
                  {house.logoUrl && <img src={house.logoUrl} alt={house.name} className={styles.houseLogo} />}
                  <div>
                    <Link to={`/brands/${house.slug}`} className={styles.houseCardName}>{house.name}</Link>
                    {house.location && <p className={styles.houseLocation}>{house.location}</p>}
                  </div>
                </div>
                {house.description && <p className={styles.houseDesc}>{house.description.slice(0, 160)}…</p>}
                <Link to={`/brands/${house.slug}`} className={styles.houseLink}>
                  View full collection →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
