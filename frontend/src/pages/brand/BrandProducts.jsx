import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../hooks/useApi';
import styles from './Brand.module.css';

const EMPTY_PRODUCT = {
  name: '', description: '', concentration: 'EDP', sizeML: '', price: '',
  stock: '', imageUrl: '', featured: false,
  notes: { top: '', middle: '', base: '' },
};

const CONCENTRATIONS = ['EDP', 'EDT', 'Parfum', 'EDC', 'Cologne', 'Other'];

export default function BrandProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  function load() {
    if (!user?.houseId) { setLoading(false); return; }
    api.get(`/api/products?houseId=${user.houseId}&limit=50`)
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [user]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('notes.')) {
      const key = name.split('.')[1];
      setForm((f) => ({ ...f, notes: { ...f.notes, [key]: value } }));
    } else {
      setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const payload = {
        ...form,
        sizeML: Number(form.sizeML),
        price: Number(form.price),
        stock: Number(form.stock),
        notes: {
          top: form.notes.top ? form.notes.top.split(',').map((s) => s.trim()).filter(Boolean) : [],
          middle: form.notes.middle ? form.notes.middle.split(',').map((s) => s.trim()).filter(Boolean) : [],
          base: form.notes.base ? form.notes.base.split(',').map((s) => s.trim()).filter(Boolean) : [],
        },
      };
      await api.post('/api/products', payload);
      setShowForm(false);
      setForm(EMPTY_PRODUCT);
      load();
    } catch (err) {
      setFormError(err.message || 'Failed to create product');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeactivate(productId) {
    if (!confirm('Deactivate this product?')) return;
    try {
      await api.del(`/api/products/${productId}`);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (!user?.houseId) {
    return (
      <main className={styles.page}>
        <div className="container">
          <div className={styles.state}>
            Your application must be approved before you can manage products.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Products</h1>
            <p className={styles.sub}>Manage your fragrance catalog.</p>
          </div>
          <button className={styles.createBtn} onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Add Fragrance'}
          </button>
        </div>

        {/* Add product form */}
        {showForm && (
          <form onSubmit={handleSubmit} className={styles.applyForm}>
            <h2 className={styles.sectionTitle}>Add Fragrance</h2>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required className={styles.input} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Concentration</label>
                <select name="concentration" value={form.concentration} onChange={handleChange} className={styles.input}>
                  {CONCENTRATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Size (ml) *</label>
                <input name="sizeML" type="number" value={form.sizeML} onChange={handleChange} required className={styles.input} placeholder="50" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Price ($) *</label>
                <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required className={styles.input} placeholder="0.00" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Stock</label>
                <input name="stock" type="number" value={form.stock} onChange={handleChange} className={styles.input} placeholder="0" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Image URL</label>
                <input name="imageUrl" value={form.imageUrl} onChange={handleChange} className={styles.input} placeholder="https://…" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Top Notes <span className={styles.hint}>(comma-separated)</span></label>
                <input name="notes.top" value={form.notes.top} onChange={handleChange} className={styles.input} placeholder="Bergamot, Lemon, Pepper" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Heart Notes</label>
                <input name="notes.middle" value={form.notes.middle} onChange={handleChange} className={styles.input} placeholder="Rose, Jasmine, Iris" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Base Notes</label>
                <input name="notes.base" value={form.notes.base} onChange={handleChange} className={styles.input} placeholder="Oud, Sandalwood, Musk" />
              </div>
              <div className={styles.field}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} />
                  Feature on homepage
                </label>
              </div>
              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label className={styles.label}>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} className={styles.textarea} rows={3} />
              </div>
            </div>
            {formError && <p className={styles.error}>{formError}</p>}
            <button className={styles.submitBtn} disabled={formLoading}>
              {formLoading ? 'Adding…' : 'Add Fragrance'}
            </button>
          </form>
        )}

        {loading ? (
          <div className={styles.state}>Loading…</div>
        ) : products.length === 0 ? (
          <div className={styles.state}>No products yet. Add your first fragrance above.</div>
        ) : (
          <div className={styles.productGrid}>
            {products.map((p) => (
              <div key={p._id} className={styles.productCard}>
                <div className={styles.productImage}>
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : <div className={styles.productImagePlaceholder} />}
                </div>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{p.name}</h3>
                  <p className={styles.productMeta}>{p.concentration} · {p.sizeML}ml</p>
                  <p className={styles.productPrice}>${p.price.toFixed(2)}</p>
                  <p className={styles.productStock}>Stock: {p.stock}</p>
                  {p.featured && <span className={styles.featuredBadge}>Featured</span>}
                </div>
                <button className={styles.deactivateBtn} onClick={() => handleDeactivate(p._id)}>
                  Deactivate
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
