import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { OfferResponse } from '../api/types';
import { getShopImage } from '../utils/images';
import { Tag, Sparkles, Compass, Clock } from 'lucide-react';

const FALLBACK_OFFERS: OfferResponse[] = [
  {
    id: 1,
    shopId: 7,
    shopName: 'Zara',
    title: 'Mid-Season Fashion Fest: Flat 20% Off',
    description: 'Special weekend discount on all high-street jackets, denim, and winter apparel.',
    validFrom: '2026-11-20',
    validTo: '2026-12-05',
    active: true,
    sponsored: true,
  },
  {
    id: 2,
    shopId: 16,
    shopName: 'Nike Store',
    title: 'Buy 2 Get 1 Free on Dri-Fit Activewear',
    description: 'Stock up on marathon training gear, breathable tees, and gym tights at Nexus.',
    validFrom: '2026-11-20',
    validTo: '2026-12-10',
    active: true,
    sponsored: false,
  },
  {
    id: 3,
    shopId: 11,
    shopName: 'Starbucks Coffee',
    title: 'Holiday Treat: Free Frappuccino Upsize',
    description: 'Get an automatic Tall-to-Grande upsize on any seasonal holiday espresso beverage.',
    validFrom: '2026-11-20',
    validTo: '2026-11-30',
    active: true,
    sponsored: true,
  },
];

export default function OffersPage() {
  const [offers, setOffers] = useState<OfferResponse[]>(FALLBACK_OFFERS);

  useEffect(() => {
    api
      .get<OfferResponse[]>('/api/offers')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setOffers(data);
      })
      .catch(() => {
        // Keep fallback offers
      });
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
          <Sparkles size={13} /> Active Demonstration Promotions
        </div>
        <h1>Mall Demonstration Deals & Offers</h1>
        <p className="muted">
          Promotional offers simulated for prototype demonstration at Nexus Ahmedabad One. Visit store counters in-person to view current real-time sales.
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
                <span className="badge badge-gold">Demonstration Offer</span>
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
                <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 12 }}>
                  <Clock size={12} /> Valid: {o.validFrom} to {o.validTo}
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
