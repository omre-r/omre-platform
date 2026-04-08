import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../hooks/useApi';
import styles from './OrderConfirmation.module.css';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/orders/${id}`)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className={styles.state}>Loading…</div>;
  if (!order) return <div className={styles.state}>Order not found.</div>;

  return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.card}>
          <div className={styles.icon}>✓</div>
          <h1 className={styles.title}>Order Confirmed</h1>
          <p className={styles.sub}>
            Thank you for your order. Each fragrance house will handle fulfillment of their items.
          </p>

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Order ID</span>
              <span className={styles.metaValue}>{order._id}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Date</span>
              <span className={styles.metaValue}>{formatDate(order.createdAt)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Total</span>
              <span className={styles.metaValue}>${order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Brand orders */}
          {order.brandOrders?.length > 0 && (
            <div className={styles.brandOrders}>
              <h2 className={styles.brandOrdersTitle}>Fulfillment by Brand</h2>
              {order.brandOrders.map((bo) => (
                <div key={bo._id} className={styles.brandOrder}>
                  <div className={styles.brandOrderHeader}>
                    <span className={styles.brandOrderName}>{bo.houseId?.name || 'Fragrance House'}</span>
                    <span className={`${styles.status} ${styles[`status_${bo.status}`]}`}>
                      {bo.status}
                    </span>
                  </div>
                  {bo.items?.map((item, i) => (
                    <div key={i} className={styles.orderItem}>
                      <span>{item.name} × {item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className={styles.actions}>
            <Link to="/orders" className={styles.ordersLink}>View All Orders</Link>
            <Link to="/shop" className={styles.shopLink}>Continue Shopping</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
