import { useEffect, useState } from 'react';
import api from '../../hooks/useApi';
import styles from './Admin.module.css';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'fulfilled', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  function load() {
    setLoading(true);
    api.get(`/api/orders?page=${page}&limit=20`)
      .then((d) => { setOrders(d.orders || []); setPages(d.pages || 1); })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page]);

  async function handleStatus(orderId, status) {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>All Orders</h1>
          <p className={styles.sub}>Platform-wide order visibility.</p>
        </div>

        {loading ? (
          <div className={styles.state}>Loading…</div>
        ) : orders.length === 0 ? (
          <div className={styles.state}>No orders yet.</div>
        ) : (
          <>
            <div className={styles.list}>
              {orders.map((order) => (
                <div key={order._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h3 className={styles.cardTitle}>#{order._id.slice(-8).toUpperCase()}</h3>
                      <p className={styles.cardMeta}>
                        {order.customerId?.name} · {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className={styles.cardRight}>
                      <span className={`${styles.badge} ${styles[`badge_${order.status}`]}`}>
                        {order.status}
                      </span>
                      <span className={styles.orderTotal}>${order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Brand sub-orders */}
                  {order.brandOrders?.map((bo) => (
                    <div key={bo._id} className={styles.subOrder}>
                      <span className={styles.subOrderBrand}>{bo.houseId?.name}</span>
                      <span className={`${styles.badge} ${styles[`badge_${bo.status}`]}`}>{bo.status}</span>
                    </div>
                  ))}

                  {/* Status update */}
                  <div className={styles.statusUpdate}>
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
            {pages > 1 && (
              <div className={styles.pagination}>
                <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                <span className={styles.pageInfo}>Page {page} of {pages}</span>
                <button className={styles.pageBtn} disabled={page === pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
