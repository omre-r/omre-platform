import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../hooks/useApi';
import styles from './CustomerOrders.module.css';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/orders/mine')
      .then((d) => setOrders(Array.isArray(d) ? d : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>My Orders</h1>

        {loading ? (
          <div className={styles.state}>Loading…</div>
        ) : orders.length === 0 ? (
          <div className={styles.empty}>
            <p>You haven't placed any orders yet.</p>
            <Link to="/shop" className={styles.shopBtn}>Browse Shop</Link>
          </div>
        ) : (
          <div className={styles.list}>
            {orders.map((order) => (
              <div key={order._id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div>
                    <span className={styles.orderId}>#{order._id.slice(-8).toUpperCase()}</span>
                    <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                  </div>
                  <div className={styles.orderRight}>
                    <span className={`${styles.status} ${styles[`status_${order.status}`]}`}>
                      {order.status}
                    </span>
                    <span className={styles.orderTotal}>${order.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Brand sub-orders */}
                {order.brandOrders?.map((bo) => (
                  <div key={bo._id} className={styles.brandOrder}>
                    <div className={styles.brandOrderHeader}>
                      <span className={styles.brandName}>{bo.houseId?.name || 'Fragrance House'}</span>
                      <span className={`${styles.status} ${styles[`status_${bo.status}`]}`}>
                        {bo.status}
                      </span>
                    </div>
                    {bo.items?.map((item, i) => (
                      <div key={i} className={styles.item}>
                        <span>{item.name} · {item.quantity}×</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ))}

                <div className={styles.orderFooter}>
                  <Link to={`/orders/confirmation/${order._id}`} className={styles.detailLink}>
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
