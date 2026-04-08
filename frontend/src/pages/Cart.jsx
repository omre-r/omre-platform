import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import styles from './Cart.module.css';

export default function Cart() {
  const { byHouse, items, subtotal, removeItem, updateQuantity, itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (itemCount === 0) {
    return (
      <main className={styles.page}>
        <div className="container">
          <div className={styles.empty}>
            <h1 className={styles.emptyTitle}>Your cart is empty</h1>
            <p className={styles.emptySub}>Discover fragrances from our collection.</p>
            <Link to="/shop" className={styles.shopBtn}>Browse Shop</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Your Cart</h1>
        <p className={styles.itemCount}>{itemCount} item{itemCount !== 1 ? 's' : ''}</p>

        <div className={styles.layout}>
          {/* Items grouped by brand */}
          <div className={styles.groups}>
            {byHouse.map((group) => (
              <div key={group.houseId} className={styles.group}>
                <h3 className={styles.groupName}>{group.houseName || 'Unknown Brand'}</h3>
                {group.items.map((item) => (
                  <div key={item.productId} className={styles.item}>
                    <div className={styles.itemImage}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} />
                      ) : (
                        <div className={styles.itemImagePlaceholder} />
                      )}
                    </div>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemMeta}>{item.concentration} · {item.sizeML}ml</span>
                      <span className={styles.itemPrice}>${item.price.toFixed(2)}</span>
                    </div>
                    <div className={styles.itemControls}>
                      <div className={styles.qtyControl}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className={styles.qty}>{item.quantity}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className={styles.itemTotal}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeItem(item.productId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span className={styles.free}>Calculated at checkout</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            {byHouse.length > 1 && (
              <p className={styles.multiNote}>
                Items from {byHouse.length} fragrance houses will be fulfilled separately.
              </p>
            )}

            <button
              className={styles.checkoutBtn}
              onClick={() => isAuthenticated ? navigate('/checkout') : navigate('/login?redirect=/checkout')}
            >
              {isAuthenticated ? 'Proceed to Checkout' : 'Sign In to Checkout'}
            </button>

            <Link to="/shop" className={styles.continueLink}>← Continue Shopping</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
