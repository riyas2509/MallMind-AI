import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../auth/CartContext';
import { useAuth } from '../auth/AuthContext';
import { api, HttpError } from '../api/client';
import type { FulfilmentType, OrderResponse, PaymentMethod } from '../api/types';
import { getProductImage } from '../utils/images';
import {
  CreditCard,
  QrCode,
  Store,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Lock,
  Phone,
  AlertTriangle,
} from 'lucide-react';

export default function CheckoutPage() {
  const { cart, refresh } = useCart();
  const { user } = useAuth();

  const [fulfilment, setFulfilment] = useState<FulfilmentType>('STORE_PICKUP');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI_SANDBOX');
  const [upiApp, setUpiApp] = useState<'GPAY' | 'PHONEPE' | 'PAYTM'>('GPAY');

  // Form fields
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [visitTime, setVisitTime] = useState('Today, within 2 hours');
  const [deliveryAddress, setDeliveryAddress] = useState('Nexus Ahmedabad One, Food Court (3F) Table 14');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [simulateFailure, setSimulateFailure] = useState(false);

  // Card fields (for display simulation only)
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('482');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<OrderResponse | null>(null);

  if (!cart || cart.items.length === 0) {
    if (completedOrder) {
      return (
        <div className="stack" style={{ gap: 24, maxWidth: 680, margin: '0 auto', padding: '40px 20px' }}>
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '40px 28px',
              border: '2px solid #10B981',
              background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#10B981',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#D1FAE5', color: '#065F46', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              ORDER CONFIRMED · {completedOrder.paymentStatus?.replace(/_/g, ' ')}
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0 8px', color: '#065F46' }}>
              Order #{completedOrder.orderNumber} Placed!
            </h1>
            <p className="muted" style={{ maxWidth: 480, margin: '0 auto 20px', fontSize: 13, lineHeight: 1.5 }}>
              This is a prototype demonstration order recorded in the local sandbox. Note: No physical order has been transmitted to real-world commercial retail stores.
            </p>

            {/* Pickup PIN & Reference */}
            <div
              style={{
                background: '#fff',
                border: '1px dashed #059669',
                borderRadius: 12,
                padding: '16px 24px',
                maxWidth: 400,
                margin: '0 auto 24px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Express Verification & Pickup PIN</div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '0.12em', color: '#0F172A', margin: '6px 0' }}>
                {completedOrder.orderNumber}
              </div>
              <div style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>
                Transaction Ref: {completedOrder.transactionReference || 'SIM-TXN-OK'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link to={`/orders/${completedOrder.id}`} className="btn btn-primary btn-sm">
                View Full Order Receipt <ArrowRight size={14} style={{ marginLeft: 4 }} />
              </Link>
              <Link to="/map" className="btn btn-secondary btn-sm">
                <MapPin size={14} style={{ marginRight: 4 }} /> Open Mall Map for Pickup Route
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="stack" style={{ gap: 24, textAlign: 'center', padding: '60px 20px' }}>
        <h2>No Items to Checkout</h2>
        <p className="muted">Your shopping bag is empty. Add products before proceeding to checkout.</p>
        <Link to="/products" className="btn btn-primary btn-sm" style={{ alignSelf: 'center' }}>
          Explore Products
        </Link>
      </div>
    );
  }

  async function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const order = await api.post<OrderResponse>('/api/me/checkout', {
        fulfilmentType: fulfilment,
        customerName: fullName,
        customerPhone: phoneNumber,
        deliveryAddress: fulfilment === 'MALL_DELIVERY' ? deliveryAddress : visitTime,
        specialInstructions: specialInstructions,
        paymentMethod: paymentMethod,
        simulatePaymentFailure: simulateFailure,
      });
      await refresh();
      setCompletedOrder(order);
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof HttpError ? err.message : 'Checkout failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const distinctShops = Array.from(new Set(cart.items.map((i) => i.product.shopName)));
  const deliveryFee = fulfilment === 'MALL_DELIVERY' ? 50 : 0;
  const grandTotal = cart.subtotal + deliveryFee;

  return (
    <div className="stack" style={{ gap: 28 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DBEAFE', color: '#1E40AF', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
          <Lock size={12} /> SECURE IN-MALL CHECKOUT (SANDBOX GATEWAY)
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Complete Your Mall Purchase</h1>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>
          Reserve your items for immediate in-store collection or in-mall desk delivery at Nexus Ahmedabad One.
        </p>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #F87171', color: '#991B1B', padding: '12px 16px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' }}>
          {/* Left Column: Options & Payment */}
          <div className="stack" style={{ gap: 20 }}>
            {/* Step 1: Collection Mode */}
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Store size={18} color="#2563EB" /> 1. Select Fulfilment Method
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div
                  onClick={() => setFulfilment('STORE_PICKUP')}
                  style={{
                    border: fulfilment === 'STORE_PICKUP' ? '2px solid #2563EB' : '1px solid var(--border)',
                    background: fulfilment === 'STORE_PICKUP' ? '#EFF6FF' : 'var(--surface)',
                    padding: 14,
                    borderRadius: 10,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>In-Store Pickup</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', background: '#D1FAE5', padding: '2px 5px', borderRadius: 4 }}>FREE</span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>
                    Pick up at store counter in 30 mins.
                  </p>
                </div>

                <div
                  onClick={() => setFulfilment('IN_STORE_PURCHASE')}
                  style={{
                    border: fulfilment === 'IN_STORE_PURCHASE' ? '2px solid #2563EB' : '1px solid var(--border)',
                    background: fulfilment === 'IN_STORE_PURCHASE' ? '#EFF6FF' : 'var(--surface)',
                    padding: 14,
                    borderRadius: 10,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>Express Hold</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#2563EB', background: '#DBEAFE', padding: '2px 5px', borderRadius: 4 }}>FREE</span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>
                    Hold items for trial and inspect before billing.
                  </p>
                </div>

                <div
                  onClick={() => setFulfilment('MALL_DELIVERY')}
                  style={{
                    border: fulfilment === 'MALL_DELIVERY' ? '2px solid #2563EB' : '1px solid var(--border)',
                    background: fulfilment === 'MALL_DELIVERY' ? '#EFF6FF' : 'var(--surface)',
                    padding: 14,
                    borderRadius: 10,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>In-Mall Delivery</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '2px 5px', borderRadius: 4 }}>₹50</span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>
                    Brought to Food Court, lounge, or cinema.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Customer Contact Info */}
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={18} color="#2563EB" /> 2. Visitor Details & Delivery Location
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Mobile Number (for SMS & PIN)</label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
                  />
                </div>

                {fulfilment === 'MALL_DELIVERY' ? (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>In-Mall Dropoff Location / Table Number</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="e.g. 3rd Floor Food Court Table #12, or Cinepolis Box Office"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
                    />
                  </div>
                ) : (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Pickup Window</label>
                    <select
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: '#fff' }}
                    >
                      <option>Today, within 2 hours</option>
                      <option>Today Evening (5:00 PM - 8:00 PM)</option>
                      <option>Tonight (8:00 PM - 10:00 PM)</option>
                      <option>Tomorrow Morning (10:00 AM - 1:00 PM)</option>
                    </select>
                  </div>
                )}

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Special Instructions / Delivery Notes (Optional)</label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Please pack in eco-friendly gift paper"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Payment Gateway Simulation */}
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={18} color="#2563EB" /> 3. Payment Method (Sandbox Gateway)
                </h3>
                <span style={{ fontSize: 11, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                  Simulated Gateway
                </span>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI_SANDBOX')}
                  className={`btn btn-sm ${paymentMethod === 'UPI_SANDBOX' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: 6, fontSize: 12 }}
                >
                  <QrCode size={13} style={{ marginRight: 4 }} /> Instant UPI / QR
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD_SANDBOX')}
                  className={`btn btn-sm ${paymentMethod === 'CARD_SANDBOX' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: 6, fontSize: 12 }}
                >
                  <CreditCard size={13} style={{ marginRight: 4 }} /> Credit / Debit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COUNTER_CASH')}
                  className={`btn btn-sm ${paymentMethod === 'COUNTER_CASH' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: 6, fontSize: 12 }}
                >
                  <Store size={13} style={{ marginRight: 4 }} /> Pay at Store Counter
                </button>
              </div>

              {paymentMethod === 'UPI_SANDBOX' && (
                <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                    {(['GPAY', 'PHONEPE', 'PAYTM'] as const).map((app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setUpiApp(app)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 6,
                          border: upiApp === app ? '2px solid #2563EB' : '1px solid #CBD5E1',
                          background: upiApp === app ? '#EFF6FF' : '#fff',
                          fontWeight: 700,
                          fontSize: 12,
                          color: upiApp === app ? '#1E40AF' : '#475569',
                          cursor: 'pointer',
                        }}
                      >
                        {app}
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
                      width: 140,
                      height: 140,
                      background: '#fff',
                      border: '2px dashed #94A3B8',
                      borderRadius: 10,
                      margin: '0 auto 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <QrCode size={64} color="#0F172A" />
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#64748B' }}>SCAN TO SIMULATE PAY</span>
                  </div>

                  <div style={{ fontSize: 12, color: '#475569' }}>
                    UPI ID: <strong>mallmind.nexus@upi</strong> · Amount: <strong>₹{grandTotal.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginTop: 4 }}>
                    ✓ Auto-verified in sandbox mode upon order submission
                  </div>
                </div>
              )}

              {paymentMethod === 'CARD_SANDBOX' && (
                <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Sandbox Test Card Details (Simulation Only)</div>
                    <button
                      type="button"
                      onClick={() => {
                        setCardNumber('4532 9012 3456 7890');
                        setCardExpiry('08/29');
                        setCardCvv('789');
                      }}
                      className="btn btn-xs btn-ghost"
                      style={{ fontSize: 11, color: '#2563EB' }}
                    >
                      Autofill Test Card
                    </button>
                  </div>

                  <div className="stack" style={{ gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#64748B', fontWeight: 600 }}>Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, background: '#fff' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: '#64748B', fontWeight: 600 }}>Expiry Date</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, background: '#fff' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: '#64748B', fontWeight: 600 }}>CVV</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, background: '#fff' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'COUNTER_CASH' && (
                <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0F172A', fontWeight: 700, fontSize: 13 }}>
                    <Store size={16} color="#10B981" /> Pay in Person upon Pickup
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                    Your items will be held at each retail counter for up to 4 hours. You can inspect the goods and pay directly via Cash, UPI, or Credit Card at the store billing desk.
                  </p>
                </div>
              )}

              {/* Simulation Sandbox Failure Checkbox */}
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="simulateFailure"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                />
                <label htmlFor="simulateFailure" style={{ fontSize: 12, color: '#64748B', cursor: 'pointer' }}>
                  Simulate Payment Gateway Failure (Sandbox QA Testing)
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Place Order CTA */}
          <div className="card" style={{ padding: 22, position: 'sticky', top: 80 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700 }}>Order Summary</h3>

            {/* Items Mini List */}
            <div className="stack" style={{ gap: 10, maxHeight: 220, overflowY: 'auto', marginBottom: 16 }}>
              {cart.items.map((item) => (
                <div key={item.cartItemId} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <img
                    src={getProductImage(item.product.id, item.product.category)}
                    alt={item.product.name}
                    style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.product.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      Qty: {item.quantity} · {item.product.shopName}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                    ₹{(item.product.effectivePrice * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />

            {/* Calculations */}
            <div className="stack" style={{ gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                <span>Subtotal ({cart.totalItemCount} items)</span>
                <span>₹{cart.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                <span>Fulfilment Fee</span>
                <span style={{ color: deliveryFee === 0 ? '#10B981' : '#0F172A', fontWeight: 600 }}>
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                <span>GST 18% (Included in MRP)</span>
                <span>₹{(cart.subtotal * 0.18).toFixed(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                <span>Total Payable</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Stores to Visit */}
            <div style={{ background: '#F1F5F9', padding: '10px 12px', borderRadius: 8, marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Stores to Visit / Source:</div>
              <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 12, color: '#1E293B' }}>
                {distinctShops.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                marginTop: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {submitting ? 'Processing Payment...' : `Confirm & Place Order (₹${grandTotal.toLocaleString('en-IN')})`}
            </button>

            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: '#94A3B8' }}>
              🔒 Simulated academic sandbox transaction · No real money charged
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
