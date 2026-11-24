import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { OfferResponse } from '../api/types';
import { getShopImage } from '../utils/images';
import { Tag, Sparkles, Compass, Clock } from 'lucide-react';

export default function OffersPage() {
  const [offers, setOffers] = useState<OfferResponse[] | null>(null);

  useEffect(() => {
    api.get<OfferResponse[]>('/api/offers').then(setOffers).catch(() => []);
  }, []);

  if (!offers) return <div className="card muted" style={{ padding: 40, textAlign: 'center' }}>Loading flash deals & offers...</div>;
  if (offers.length === 0) {
    return (
      <div className="card empty-state" style={{ padding: 60 }}>
        <Tag size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
        <h3>No active flash offers right now</h3>
        <p className="muted" style={{ marginTop: 6 }}>Check back soon for weekend promotional sales!</p>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div>
        <div className="badge badge-gold" style={{ marginBottom: 6 }}>
          <Sparkles size={13} /> Exclusive In-Mall Promotions
        </div>
        <h1>Today's Flash Deals & Offers</h1>
        <p className="muted">
          Exclusive discounts available at participating stores today. Visit the shop in-person to claim.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {offers.map((o) => (
          <div
            key={o.id}
            className="card card-interactive"
            style={{
              padding: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
              <img
                src={getShopImage(o.shopName)}
                alt={o.shopName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, transparent 60%)',
                }}
              />
              <div style={{ position: 'absolute', top: 12, left: 12 }}>
                {o.sponsored ? (
                  <span className="badge badge-gold">⭐ Sponsored Deal</span>
                ) : (
                  <span className="badge badge-success">🔥 In-Store Offer</span>
                )}
              </div>
              <div style={{ position: 'absolute', bottom: 12, left: 16, color: '#fff' }}>
                <span style={{ fontSize: 13, opacity: 0.85 }}>{o.shopName}</span>
                <h3 style={{ fontSize: 18, color: '#fff', margin: 0 }}>{o.title}</h3>
              </div>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, flex: 1 }}>
                {o.description || 'Visit the store counter inside MallMind AI to redeem this promotional offer.'}
              </p>

              <div className="row-between" style={{ paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  <Clock size={12} /> Valid Today
                </span>
                <Link
                  to={`/map?toLabel=${encodeURIComponent(o.shopName)}`}
                  className="btn btn-secondary btn-sm"
                >
                  <Compass size={14} /> Navigate to Shop
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
