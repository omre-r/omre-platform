import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../hooks/useApi';
import styles from './Checkout.module.css';

const EMPTY_ADDR = {
  fullName: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: '',
};

export default function Checkout() {
  const { items, byHouse, subtotal, clearCart, itemCount } = useCart();
  const navigate = useNavigate();
  const [addr, setAddr] = useState(EMPTY_ADDR);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (itemCount === 0) {
    navigate('/cart');
    return null;
  }

  function handleChange(e) {
    setAddr((a) => ({ ...a, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: addr,
      };

      const { orderId } = await api.post('/api/orders/checkout', payload);
      clearCart();
      navigate(`/orders/confirmation/${orderId}`);
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Checkout</h1>

        <div className={styles.layout}>
          {/* Address form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.sectionTitle}>Shipping Address</h2>

            <div className={styles.field}>
              <label className={styles.label}>Full Name</label>
              <input name="fullName" value={addr.fullName} onChange={handleChange} required className={styles.input} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Address Line 1</label>
              <input name="line1" value={addr.line1} onChange={handleChange} required className={styles.input} placeholder="Street address" />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Address Line 2 <span className={styles.optional}>(optional)</span></label>
              <input name="line2" value={addr.line2} onChange={handleChange} className={styles.input} placeholder="Apt, suite, etc." />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>City</label>
                <input name="city" value={addr.city} onChange={handleChange} required className={styles.input} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>State / Province</label>
                <input name="state" value={addr.state} onChange={handleChange} className={styles.input} />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Postal Code</label>
                <input name="postalCode" value={addr.postalCode} onChange={handleChange} required className={styles.input} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Country</label>
                <input name="country" value={addr.country} onChange={handleChange} required className={styles.input} />
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.submitBtn} disabled={loading}>
              {loading ? 'Placing Order…' : `Place Order · $${subtotal.toFixed(2)}`}
            </button>

            <p className={styles.note}>
              This is a prototype — no real payment is charged.
            </p>
          </form>

          {/* Order summary */}
          <div className={styles.summary}>
            <h2 className={styles.sectionTitle}>Order Summary</h2>
            {byHouse.map((group) => (
              <div key={group.houseId} className={styles.houseGroup}>
                <h3 className={styles.houseName}>{group.houseName}</h3>
                {group.items.map((item) => (
                  <div key={item.productId} className={styles.summaryItem}>
                    <span className={styles.summaryItemName}>
                      {item.name} × {item.quantity}
                    </span>
                    <span className={styles.summaryItemPrice}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            <div className={styles.total}>
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
