import { useEffect, useState, type FormEvent } from 'react';
import { api, HttpError } from '../api/client';
import type {
  ImageClassificationResponse,
  OrderResponse,
  OrderStatus,
  ProductCreateRequest,
  ProductResponse,
  ProductUpdateRequest,
  ShopResponse,
  InventoryAlertResponse,
  InventoryAdjustmentResponse,
  InventoryAdjustmentReason,
} from '../api/types';
import { PackageCheck, Tag, Boxes, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface FormState {
  shopId: string;
  categoryName: string;
  name: string;
  brand: string;
  color: string;
  price: string;
  discountPrice: string;
  stockQuantity: string;
  available: boolean;
}

const EMPTY_FORM: FormState = {
  shopId: '',
  categoryName: '',
  name: '',
  brand: '',
  color: '',
  price: '',
  discountPrice: '',
  stockQuantity: '0',
  available: true,
};

export default function RetailerPage() {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'ORDERS' | 'INVENTORY'>('PRODUCTS');
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [shops, setShops] = useState<ShopResponse[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlertResponse[]>([]);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryAdjustmentResponse[]>([]);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [suggestion, setSuggestion] = useState<ImageClassificationResponse | null>(null);

  // Quick stock adjustment modal state
  const [adjustingProduct, setAdjustingProduct] = useState<ProductResponse | InventoryAlertResponse | null>(null);
  const [adjustNewStock, setAdjustNewStock] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<InventoryAdjustmentReason>('RESTOCK');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  function flashSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  }

  function load() {
    api.get<ProductResponse[]>('/api/retailer/products').then(setProducts).catch(() => []);
    api.get<ShopResponse[]>('/api/retailer/products/shops').then((list) => {
      setShops(list);
      if (!form.shopId && list.length > 0) setForm((f) => ({ ...f, shopId: String(list[0].id) }));
    }).catch(() => []);
    api.get<OrderResponse[]>('/api/retailer/orders').then(setOrders).catch(() => []);
    api.get<InventoryAlertResponse[]>('/api/retailer/inventory/alerts').then(setInventoryAlerts).catch(() => []);
    api.get<InventoryAdjustmentResponse[]>('/api/retailer/inventory/history').then(setInventoryHistory).catch(() => []);
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startEdit(p: ProductResponse) {
    setEditingId(p.id);
    setForm({
      shopId: String(p.shopId),
      categoryName: p.category,
      name: p.name,
      brand: p.brand ?? '',
      color: p.color ?? '',
      price: String(p.price),
      discountPrice: p.discountPrice != null ? String(p.discountPrice) : '',
      stockQuantity: '10',
      available: p.available,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm((f) => ({ ...EMPTY_FORM, shopId: f.shopId }));
    setSuggestion(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        const body: ProductUpdateRequest = {
          name: form.name,
          brand: form.brand || undefined,
          color: form.color || undefined,
          price: Number(form.price),
          discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
          available: form.available,
          stockQuantity: Number(form.stockQuantity),
        };
        await api.put(`/api/retailer/products/${editingId}`, body);
        flashSuccess(`Product '${form.name}' updated.`);
      } else {
        const body: ProductCreateRequest = {
          shopId: Number(form.shopId),
          categoryName: form.categoryName,
          name: form.name,
          brand: form.brand || undefined,
          color: form.color || undefined,
          price: Number(form.price),
          discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
          available: form.available,
          stockQuantity: Number(form.stockQuantity),
        };
        await api.post('/api/retailer/products', body);
        flashSuccess(`Product '${form.name}' created in store catalogue.`);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Could not save product.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this product listing?')) return;
    setBusy(true);
    setError(null);
    try {
      await api.delete(`/api/retailer/products/${id}`);
      flashSuccess('Product removed.');
      load();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Could not delete product.');
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateOrderStatus(orderId: number, status: OrderStatus) {
    setBusy(true);
    setError(null);
    try {
      await api.put<OrderResponse>(`/api/retailer/orders/${orderId}/status?status=${status}`);
      flashSuccess(`Order #${orderId} status set to ${status}.`);
      load();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Could not update order status.');
    } finally {
      setBusy(false);
    }
  }

  async function handleStockAdjustment(e: FormEvent) {
    e.preventDefault();
    if (!adjustingProduct) return;
    setBusy(true);
    try {
      const prodId = 'id' in adjustingProduct ? adjustingProduct.id : adjustingProduct.productId;
      await api.post('/api/retailer/inventory/adjust', {
        productId: prodId,
        newStock: Number(adjustNewStock),
        reason: adjustReason,
        notes: adjustNotes || undefined,
      });
      flashSuccess(`Stock adjusted successfully.`);
      setAdjustingProduct(null);
      load();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Failed to adjust stock.');
    } finally {
      setBusy(false);
    }
  }

  async function handleClassify(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setClassifying(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.postForm<ImageClassificationResponse>('/api/retailer/products/classify-image', fd);
      setSuggestion(res);
      if (res.category && !res.lowConfidence) {
        setForm((f) => ({ ...f, categoryName: res.category! }));
      }
    } catch {
      setSuggestion(null);
    } finally {
      setClassifying(false);
      e.target.value = '';
    }
  }

  return (
    <div className="stack" style={{ gap: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div className="row-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Store Operations & Retailer Portal</h1>
          <p className="muted" style={{ fontSize: 13, margin: '2px 0 0' }}>
            Store inventory, prices, stock adjustments, and customer order fulfillment for Nexus Ahmedabad One.
          </p>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <button
            className={`btn btn-sm ${activeTab === 'PRODUCTS' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('PRODUCTS')}
          >
            <Tag size={14} style={{ marginRight: 4 }} /> Catalogue ({products.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'INVENTORY' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('INVENTORY')}
          >
            <Boxes size={14} style={{ marginRight: 4 }} /> Inventory & Alerts ({inventoryAlerts.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'ORDERS' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('ORDERS')}
          >
            <PackageCheck size={14} style={{ marginRight: 4 }} /> Store Orders ({orders.length})
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #F87171', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} /> <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div style={{ background: '#D1FAE5', border: '1px solid #34D399', color: '#065F46', padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /> <span>{successMsg}</span>
        </div>
      )}

      {/* =========================================================================
          TAB 1: CATALOGUE
      ========================================================================== */}
      {activeTab === 'PRODUCTS' && (
        <div className="stack" style={{ gap: 24 }}>
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 12px' }}>{editingId ? 'Edit Product' : 'Add New Catalogue Product'}</h3>
            <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF', marginBottom: 4 }}>
                AI Category Assistant (Phase 6 Image Classifier)
              </div>
              <p className="muted" style={{ fontSize: 12, margin: '0 0 8px' }}>
                Upload a product photo for an automatic category suggestion.
              </p>
              <input type="file" accept="image/*" onChange={handleClassify} disabled={classifying} />
              {classifying && <p className="muted" style={{ fontSize: 12 }}>Analyzing photo...</p>}
              {suggestion && (
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  Suggested Category: <strong>{suggestion.category ?? 'Uncertain'}</strong>{' '}
                  {suggestion.category && !suggestion.lowConfidence && (
                    <span className="badge badge-success" style={{ fontSize: 10 }}>{Math.round(suggestion.confidence * 100)}% confidence</span>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="stack" style={{ gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Store</label>
                  <select
                    value={form.shopId}
                    onChange={(e) => setForm({ ...form, shopId: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                  >
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Floor {s.floorNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Product Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Category</label>
                  <input
                    type="text"
                    value={form.categoryName}
                    onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Discount Price (₹, optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.discountPrice}
                    onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Initial Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                {editingId && (
                  <button type="button" onClick={resetForm} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                )}
                <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
                  {editingId ? 'Update Product' : 'Add to Catalogue'}
                </button>
              </div>
            </form>
          </div>

          {/* Product List */}
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 16px' }}>Store Products ({products.length})</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: '#64748B' }}>
                  <th style={{ padding: '8px' }}>Name</th>
                  <th style={{ padding: '8px' }}>Category</th>
                  <th style={{ padding: '8px' }}>Price</th>
                  <th style={{ padding: '8px' }}>Stock</th>
                  <th style={{ padding: '8px' }}>Status</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '10px 8px', color: '#64748B' }}>{p.category}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 700 }}>₹{p.effectivePrice}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 700, color: p.available ? '#0F172A' : '#DC2626' }}>
                      {p.available ? 'In Stock' : 'Out of Stock'}
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span className={`badge ${p.available ? 'badge-primary' : 'badge-danger'}`} style={{ fontSize: 10 }}>
                        {p.available ? 'AVAILABLE' : 'UNAVAILABLE'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button onClick={() => startEdit(p)} className="btn btn-secondary btn-xs">
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setAdjustingProduct(p);
                            setAdjustNewStock(10);
                            setAdjustReason('RESTOCK');
                          }}
                          className="btn btn-primary btn-xs"
                        >
                          Stock
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="btn btn-ghost btn-xs" style={{ color: '#DC2626' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: INVENTORY & STOCK ALERTS
      ========================================================================== */}
      {activeTab === 'INVENTORY' && (
        <div className="stack" style={{ gap: 24 }}>
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 16px' }}>Store Stock Alerts & Warnings</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: '#64748B' }}>
                  <th style={{ padding: '8px' }}>Product</th>
                  <th style={{ padding: '8px' }}>Store</th>
                  <th style={{ padding: '8px' }}>Current Stock</th>
                  <th style={{ padding: '8px' }}>Alert Status</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {inventoryAlerts.map((a) => (
                  <tr key={a.productId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>{a.productName}</td>
                    <td style={{ padding: '10px 8px' }}>{a.shopName}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 800, color: a.stockQuantity === 0 ? '#DC2626' : '#D97706' }}>
                      {a.stockQuantity}
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span className={`badge ${a.alertType === 'OUT_OF_STOCK' ? 'badge-danger' : 'badge-gold'}`} style={{ fontSize: 10 }}>
                        {a.alertType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setAdjustingProduct(a);
                          setAdjustNewStock(a.stockQuantity + 15);
                          setAdjustReason('RESTOCK');
                        }}
                        className="btn btn-primary btn-xs"
                      >
                        Restock Now
                      </button>
                    </td>
                  </tr>
                ))}
                {inventoryAlerts.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#10B981', fontWeight: 600 }}>
                      ✓ All products in your store currently have healthy stock levels!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Adjustment Ledger */}
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 16px' }}>Store Adjustment Audit History</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: '#64748B' }}>
                  <th style={{ padding: '8px' }}>Timestamp</th>
                  <th style={{ padding: '8px' }}>Product</th>
                  <th style={{ padding: '8px' }}>Old &rarr; New</th>
                  <th style={{ padding: '8px' }}>Change</th>
                  <th style={{ padding: '8px' }}>Reason</th>
                  <th style={{ padding: '8px' }}>Actor</th>
                </tr>
              </thead>
              <tbody>
                {inventoryHistory.map((h) => (
                  <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 8px', color: '#64748B' }}>{new Date(h.createdAt).toLocaleTimeString()}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>{h.productName}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 700 }}>
                      {h.oldStock} &rarr; {h.newStock}
                    </td>
                    <td style={{ padding: '10px 8px', color: h.changeQuantity >= 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                      {h.changeQuantity >= 0 ? `+${h.changeQuantity}` : h.changeQuantity}
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span className="badge badge-secondary" style={{ fontSize: 10 }}>
                        {h.reason}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', fontSize: 11 }}>{h.actorEmail}</td>
                  </tr>
                ))}
                {inventoryHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#94A3B8' }}>
                      No stock adjustments on record yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: ORDERS
      ========================================================================== */}
      {activeTab === 'ORDERS' && (
        <div className="stack" style={{ gap: 16 }}>
          {orders.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <PackageCheck size={36} color="var(--brand-primary)" style={{ margin: '0 auto 12px' }} />
              <h3>No Customer Orders Placed Yet</h3>
              <p className="muted">Orders containing items from your store will appear here in real time.</p>
            </div>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="card stack" style={{ gap: 14, padding: 18 }}>
                <div className="row-between" style={{ flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>Order #{o.orderNumber}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      Placed {new Date(o.createdAt).toLocaleString()} · {o.fulfilmentType.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <span className={`badge ${o.status === 'COMPLETED' ? 'badge-primary' : o.status === 'CANCELLED' ? 'badge-danger' : 'badge-gold'}`}>
                      {o.status}
                    </span>
                    {o.status === 'PLACED' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleUpdateOrderStatus(o.id, 'READY_FOR_PICKUP')}>
                        Mark Ready for Pickup
                      </button>
                    )}
                    {o.status === 'READY_FOR_PICKUP' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleUpdateOrderStatus(o.id, 'COMPLETED')}>
                        Mark Collected
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 6, fontSize: 13 }}>
                  <div className="muted" style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                    ORDERED ITEMS:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {o.items.map((it) => (
                      <li key={it.productId}>
                        {it.productName} (Qty: {it.quantity}) · ₹{it.lineTotal.toLocaleString('en-IN')}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Quick Stock Modal */}
      {adjustingProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div className="card" style={{ maxWidth: 440, width: '100%', padding: 24, background: '#fff' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 17 }}>
              Adjust Stock: {'name' in adjustingProduct ? adjustingProduct.name : adjustingProduct.productName}
            </h3>
            <form onSubmit={handleStockAdjustment} className="stack" style={{ gap: 12, marginTop: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>New Stock Level (&ge; 0)</label>
                <input
                  type="number"
                  min={0}
                  value={adjustNewStock}
                  onChange={(e) => setAdjustNewStock(Math.max(0, Number(e.target.value)))}
                  required
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                >
                  <option value="RESTOCK">RESTOCK (Store Delivery)</option>
                  <option value="DAMAGE">DAMAGE (Damaged / Return)</option>
                  <option value="CORRECTION">CORRECTION (Inventory Discrepancy)</option>
                  <option value="CYCLE_COUNT">CYCLE_COUNT (Physical Count)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Received shipment box 4"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" onClick={() => setAdjustingProduct(null)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
                  Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
