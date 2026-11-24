import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { OrderResponse } from '../api/types';
import { PackageCheck, ArrowRight, Clock, ChevronRight } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[] | null>(null);

  useEffect(() => {
    api.get<OrderResponse[]>('/api/me/orders').then(setOrders).catch(() => []);
  }, []);

  if (!orders) return <div className="card muted" style={{ padding: 40, textAlign: 'center' }}>Loading your order history...</div>;
  if (orders.length === 0) {
    return (
      <div className="stack" style={{ textAlign: 'center', padding: '60px 20px', gap: 20 }}>
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}
        >
          <PackageCheck size={34} />
        </div>
        <div>
          <h2>No Past Orders Found</h2>
          <p className="muted" style={{ maxWidth: 400, margin: '8px auto 20px' }}>
            When you place in-store pickup orders or reservations, they will appear here.
          </p>
          <Link to="/products" className="btn btn-lg">
            Start Shopping <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div>
        <div className="badge badge-gold" style={{ marginBottom: 6 }}>
          <PackageCheck size={13} /> Order History
        </div>
        <h1>Your Orders & Reservations</h1>
        <p className="muted">
          Track in-store pickup and checkout history across MallMind AI.
        </p>
      </div>

      <div className="stack" style={{ gap: 14 }}>
        {orders.map((o) => (
          <Link
            key={o.id}
            to={`/orders/${o.id}`}
            className="card card-interactive"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 20,
            }}
          >
            <div className="stack" style={{ gap: 6 }}>
              <div className="row" style={{ gap: 10 }}>
                <strong style={{ fontSize: 16 }}>{o.orderNumber}</strong>
                <span className="badge badge-success">{o.status}</span>
              </div>
              <div className="muted" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} />
                <span>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span>•</span>
                <span>{o.items.length} item(s)</span>
                <span>•</span>
                <span>{o.fulfilmentType.replace(/_/g, ' ')}</span>
              </div>
            </div>

            <div className="row" style={{ gap: 16 }}>
              <strong style={{ fontSize: 18, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
                ₹{o.totalAmount.toLocaleString('en-IN')}
              </strong>
              <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
