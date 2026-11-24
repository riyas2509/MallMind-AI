import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api, HttpError } from '../api/client';
import type { OrderResponse } from '../api/types';
import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = () => {
    if (id) {
      api.get<OrderResponse>(`/api/me/orders/${id}`).then(setOrder).catch(() => null);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function handleCancelOrder() {
    if (!order) return;
    if (!window.confirm(`Are you sure you want to cancel order #${order.orderNumber}? Reserved stock will be restored immediately.`)) {
      return;
    }

    setCancelling(true);
    setError(null);
    try {
      const updated = await api.post<OrderResponse>(`/api/me/orders/${order.id}/cancel`);
      setOrder(updated);
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Could not cancel order.');
    } finally {
      setCancelling(false);
    }
  }

  if (!order) return <div className="card muted" style={{ padding: 40, textAlign: 'center' }}>Loading order details...</div>;

  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="stack" style={{ gap: 28, maxWidth: 840, margin: '0 auto' }}>
      <button
        className="btn btn-ghost btn-sm"
        style={{ width: 'fit-content' }}
        onClick={() => navigate('/orders')}
      >
        <ArrowLeft size={16} /> Back to All Orders
      </button>

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #F87171', color: '#991B1B', padding: '12px 16px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Success / Status Banner */}
      <div
        style={{
          background: isCancelled
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(185, 28, 28, 0.06) 100%)'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.06) 100%)',
          border: isCancelled ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: isCancelled ? '#ef4444' : '#10b981',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isCancelled ? <XCircle size={28} /> : <CheckCircle2 size={28} />}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, marginBottom: 2 }}>
            {isCancelled ? 'Order Cancelled' : 'Order Confirmed & Logged'}
          </h2>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            Order ID: <strong>{order.orderNumber}</strong> · {isCancelled ? 'Stock restored to retailer inventory' : 'Ready for in-store collection'}
          </p>
        </div>
        {order.status === 'PLACED' && (
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="btn btn-outline-danger btn-sm"
            style={{
              borderColor: '#ef4444',
              color: '#ef4444',
              padding: '8px 14px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>

      {/* Order Details Card */}
      <div className="card" style={{ padding: 28 }}>
        <div className="row-between" style={{ marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>ORDER NUMBER</span>
            <h3 style={{ fontSize: 20 }}>{order.orderNumber}</h3>
          </div>
          <span
            className={`badge ${isCancelled ? 'badge-warn' : 'badge-success'}`}
            style={{ fontSize: 13, padding: '6px 14px' }}
          >
            {order.status}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            padding: '16px',
            background: 'var(--bg-main)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 24,
            fontSize: 13,
          }}
        >
          <div>
            <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>DATE & TIME</div>
            <div style={{ fontWeight: 600 }}>{new Date(order.createdAt).toLocaleString()}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>FULFILMENT METHOD</div>
            <div style={{ fontWeight: 600 }}>{order.fulfilmentType.replace(/_/g, ' ')}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>PAYMENT STATUS</div>
            <div style={{ fontWeight: 600, color: isCancelled ? '#ef4444' : '#10b981' }}>
              {order.paymentStatus?.replace(/_/g, ' ') || 'PAID SANDBOX'}
            </div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>TRANSACTION REFERENCE</div>
            <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>
              {order.transactionReference || 'SIM-TXN-OK'}
            </div>
          </div>
          {order.customerName && (
            <div>
              <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>CUSTOMER</div>
              <div style={{ fontWeight: 600 }}>{order.customerName} ({order.customerPhone})</div>
            </div>
          )}
          {order.deliveryAddress && (
            <div>
              <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>LOCATION / DROPOFF</div>
              <div style={{ fontWeight: 600 }}>{order.deliveryAddress}</div>
            </div>
          )}
        </div>

        <h4 style={{ fontSize: 15, marginBottom: 12 }}>Items in this Order</h4>

        <div className="stack" style={{ gap: 10, marginBottom: 24 }}>
          {order.items.map((item) => (
            <div
              key={item.productId}
              className="row-between"
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <Link
                  to={`/products/${item.productId}`}
                  style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}
                >
                  {item.productName}
                </Link>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  Sold by {item.shopName} · Qty: {item.quantity}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: 15 }}>₹{item.lineTotal.toLocaleString('en-IN')}</strong>
                <div>
                  <Link
                    to={`/map?toLabel=${encodeURIComponent(item.shopName)}`}
                    className="muted"
                    style={{ fontSize: 11, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 2 }}
                  >
                    <Compass size={11} /> Find Shop
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Breakdown */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
          {order.subtotalAmount && (
            <div className="row-between" style={{ fontSize: 13, marginBottom: 6, color: '#64748B' }}>
              <span>Subtotal</span>
              <span>₹{order.subtotalAmount.toLocaleString('en-IN')}</span>
            </div>
          )}
          {order.deliveryFee !== undefined && (
            <div className="row-between" style={{ fontSize: 13, marginBottom: 6, color: '#64748B' }}>
              <span>Fulfilment Fee</span>
              <span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
            </div>
          )}
          {order.taxAmount && (
            <div className="row-between" style={{ fontSize: 13, marginBottom: 10, color: '#64748B' }}>
              <span>GST 18% (Included in MRP)</span>
              <span>₹{order.taxAmount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div
            className="row-between"
            style={{
              paddingTop: 10,
              borderTop: '1px dashed var(--border-subtle)',
              fontSize: 18,
            }}
          >
            <strong style={{ fontSize: 18 }}>Total Paid / Reserved</strong>
            <strong style={{ fontSize: 24, color: isCancelled ? '#ef4444' : 'var(--primary)', fontFamily: 'var(--font-display)' }}>
              ₹{order.totalAmount.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
