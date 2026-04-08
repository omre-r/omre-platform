import { useEffect, useState } from 'react';
import api from '../../hooks/useApi';
import styles from './Brand.module.css';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'fulfilled', 'cancelled'];

export default function BrandOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/api/orders/brand')
      .then((d) => setOrders(Array.isArray(d) ? d : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleStatus(orderId, status) {
    try {
      await api.patch(`/api/orders/brand/${orderId}/status`, { status });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Orders</h1>
          <p className={styles.sub}>Manage fulfillment for your fragrance orders.</p>
        </div>

        {loading ? (
          <div className={styles.state}>Loading…</div>
        ) : orders.length === 0 ? (
          <div className={styles.state}>No orders yet.</div>
        ) : (
          <div className={styles.list}>
            {orders.map((order) => (
              <div key={order._id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>
                      Order #{order.orderId?._id?.slice(-8).toUpperCase() || order._id.slice(-8).toUpperCase()}
                    </h3>
                    <p className={styles.cardMeta}>
                      {order.customerId?.name} · {order.customerId?.email} · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span className={`${styles.badge} ${styles[`badge_${order.status}`]}`}>
                    {order.status}
                  </span>
                </div>

                {/* Items */}
                <div className={styles.itemList}>
                  {order.items?.map((item, i) => (
                    <div key={i} className={styles.orderItem}>
                      <span>{item.name} × {item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className={`${styles.orderItem} ${styles.subtotalRow}`}>
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Shipping address */}
                {order.orderId?.shippingAddress && (
                  <div className={styles.shippingAddr}>
                    <span className={styles.shippingLabel}>Ship to: </span>
                    {order.orderId.shippingAddress.fullName} · {order.orderId.shippingAddress.line1}, {order.orderId.shippingAddress.city}
                  </div>
                )}

                {/* Status update */}
                <div className={styles.statusRow}>
                  <span className={styles.statusLabel}>Update Status:</span>
                  <select
                    className={styles.statusSelect}
                    value={order.status}
                    onChange={(e) => handleStatus(order._id, e.target.value)}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
