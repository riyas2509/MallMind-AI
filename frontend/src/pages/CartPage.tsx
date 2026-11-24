import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../auth/CartContext';
import { api, HttpError } from '../api/client';
import type { FulfilmentType, OrderResponse } from '../api/types';
import { getProductImage } from '../utils/images';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Store,
  CheckCircle,
  Plus,
  Minus,
} from 'lucide-react';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, refresh } = useCart();
  const navigate = useNavigate();
  const [fulfilment, setFulfilment] = useState<FulfilmentType>('STORE_PICKUP');
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setCheckingOut(true);
    setError(null);
    try {
      const order = await api.post<OrderResponse>('/api/me/checkout', { fulfilmentType: fulfilment });
      await refresh();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Checkout failed.');
    } finally {
      setCheckingOut(false);
    }
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="stack" style={{ gap: 24, textAlign: 'center', padding: '60px 20px' }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}
        >
          <ShoppingBag size={36} />
        </div>
        <div>
          <h2>Your Shopping Bag is Empty</h2>
          <p className="muted" style={{ maxWidth: 400, margin: '8px auto 24px' }}>
            Explore our curated selection of products across 30 premier stores inside MallMind AI.
          </p>
          <Link to="/products" className="btn btn-lg">
            Explore Products <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div>
        <div className="badge badge-gold" style={{ marginBottom: 6 }}>
          <ShoppingBag size={13} /> Review & Express Checkout
        </div>
        <h1>Your Shopping Bag</h1>
        <p className="muted">
          Review your selected items and choose your pickup or in-store fulfilment method.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' }}>
        {/* Items List */}
        <div className="stack" style={{ gap: 14 }}>
          {cart.items.map((item) => {
            const imageUrl = getProductImage(item.product.id, item.product.category);
            return (
              <div
                key={item.cartItemId}
                className="card"
                style={{
                  display: 'flex',
                  gap: 18,
                  alignItems: 'center',
                  padding: 16,
                }}
              >
                <Link to={`/products/${item.product.id}`} style={{ flexShrink: 0 }}>
                  <img
                    src={imageUrl}
                    alt={item.product.name}
                    style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />
                </Link>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link
                    to={`/products/${item.product.id}`}
                    style={{ textDecoration: 'none', color: 'inherit', fontWeight: 700, fontSize: 16 }}
                  >
                    {item.product.name}
                  </Link>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    Sold by <strong>{item.product.shopName}</strong> (Floor {item.product.shopFloorNumber})
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', marginTop: 6, fontSize: 15 }}>
                    ₹{item.product.effectivePrice.toLocaleString('en-IN')} each
                  </div>
                </div>

                {/* Quantity steppers */}
                <div className="row" style={{ gap: 8 }}>
                  <div
                    className="row"
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-main)',
                      padding: '4px',
                      gap: 4,
                    }}
                  >
                    <button
                      onClick={() => void updateQuantity(item.product.id, Math.max(0, item.quantity - 1))}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        width: 26,
                        height: 26,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Decrease"
                    >
                      <Minus size={13} />
                    </button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700, fontSize: 13 }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => void updateQuantity(item.product.id, item.quantity + 1)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        width: 26,
                        height: 26,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Increase"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div style={{ minWidth: 90, textAlign: 'right', fontWeight: 800, fontSize: 16 }}>
                    ₹{item.lineTotal.toLocaleString('en-IN')}
                  </div>

                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: 6, color: 'var(--status-error)' }}
                    onClick={() => void removeFromCart(item.product.id)}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary & Checkout Card */}
        <div className="card" style={{ padding: 24, position: 'sticky', top: 90 }}>
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Order Summary</h3>

          <div className="stack" style={{ gap: 12 }}>
            <div className="row-between">
              <span className="muted">Total Items</span>
              <strong style={{ fontSize: 15 }}>{cart.totalItemCount}</strong>
            </div>

            <div className="row-between">
              <span className="muted">Estimated Taxes</span>
              <span className="badge badge-success">Included</span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />

            <div className="row-between" style={{ fontSize: 18 }}>
              <span style={{ fontWeight: 700 }}>Total Amount</span>
              <strong style={{ fontSize: 22, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
                ₹{cart.subtotal.toLocaleString('en-IN')}
              </strong>
            </div>

            <div style={{ marginTop: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                Select Fulfilment Method
              </span>

              <div className="stack" style={{ gap: 8 }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${fulfilment === 'STORE_PICKUP' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    background: fulfilment === 'STORE_PICKUP' ? 'var(--primary-light)' : 'transparent',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="radio"
                    name="fulfilment"
                    checked={fulfilment === 'STORE_PICKUP'}
                    onChange={() => setFulfilment('STORE_PICKUP')}
                  />
                  <Store size={16} style={{ color: 'var(--primary)' }} />
                  <div>
                    <span>Express In-Store Pickup</span>
                    <div className="muted" style={{ fontSize: 11, fontWeight: 400 }}>Ready at store counter in 15 mins</div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${fulfilment === 'IN_STORE_PURCHASE' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    background: fulfilment === 'IN_STORE_PURCHASE' ? 'var(--primary-light)' : 'transparent',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="radio"
                    name="fulfilment"
                    checked={fulfilment === 'IN_STORE_PURCHASE'}
                    onChange={() => setFulfilment('IN_STORE_PURCHASE')}
                  />
                  <CheckCircle size={16} style={{ color: '#10b981' }} />
                  <div>
                    <span>Instant In-Store Purchase</span>
                    <div className="muted" style={{ fontSize: 11, fontWeight: 400 }}>Reserve inventory and pay on floor</div>
                  </div>
                </label>
              </div>
            </div>

            {error && <p className="error-text" style={{ marginTop: 8 }}>{error}</p>}

            <Link
              to="/checkout"
              className="btn btn-lg btn-primary"
              style={{ width: '100%', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              Proceed to Secure Checkout <ArrowRight size={16} />
            </Link>

            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', marginTop: 8 }}
              disabled={checkingOut}
              onClick={handleCheckout}
            >
              {checkingOut ? 'Generating Order...' : 'Quick 1-Click Sandbox Order'}
            </button>

            <div
              className="row"
              style={{
                gap: 6,
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: 12,
                marginTop: 6,
              }}
            >
              <ShieldCheck size={14} style={{ color: '#10b981' }} />
              <span>100% Genuine In-Mall Inventory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
