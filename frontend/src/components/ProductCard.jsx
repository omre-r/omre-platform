import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import styles from './ProductCard.module.css';

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  const house = product.houseId;

  return (
    <div className={styles.card}>
      <Link to={`/shop/${product._id}`} className={styles.imageWrap}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </div>
        )}
      </Link>

      <div className={styles.body}>
        {house && (
          <Link to={`/brands/${house.slug}`} className={styles.houseName}>
            {house.name}
          </Link>
        )}
        <Link to={`/shop/${product._id}`}>
          <h3 className={styles.name}>{product.name}</h3>
        </Link>
        <p className={styles.meta}>
          {product.concentration} · {product.sizeML}ml
        </p>

        <div className={styles.footer}>
          <span className={styles.price}>${product.price.toFixed(2)}</span>
          <button
            className={styles.addBtn}
            onClick={() => addItem(product)}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? 'Sold Out' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
