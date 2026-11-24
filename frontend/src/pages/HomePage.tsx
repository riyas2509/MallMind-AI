import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { FloorSummary, ProductResponse, ShopResponse } from '../api/types';
import ProductCard from '../components/ProductCard';
import { getShopImage } from '../utils/images';
import {
  Search,
  Compass,
  ArrowRight,
  Store,
  Layers,
  Sparkles,
  Mic,
  ShieldCheck,
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [shops, setShops] = useState<ShopResponse[]>([]);
  const [floors, setFloors] = useState<FloorSummary[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.get<ShopResponse[]>('/api/shops').then(setShops).catch(() => []);
    api.get<FloorSummary[]>('/api/floors').then(setFloors).catch(() => []);
    api.get<ProductResponse[]>('/api/products').then((items) => {
      setFeaturedProducts(items.slice(0, 8));
    }).catch(() => []);
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?name=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const categories = [
    { name: 'Fashion & Apparel', icon: '👔' },
    { name: 'Electronics & Gadgets', icon: '💻' },
    { name: 'Footwear & Sportswear', icon: '👟' },
    { name: 'Food Court & Dining', icon: '🍽️' },
    { name: 'Multiplex & Cinema', icon: '🎬' },
    { name: 'Beauty & Cosmetics', icon: '💄' },
    { name: 'Home & Living', icon: '🛋️' },
  ];

  return (
    <div className="stack" style={{ gap: 40 }}>
      {/* --- ARCHITECTURAL HERO SECTION --- */}
      <section
        style={{
          background: 'var(--brand-primary)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 40px',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 740, position: 'relative', zIndex: 2 }}>
          {/* Tagline */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              borderRadius: 'var(--radius-xs)',
              background: 'rgba(255, 255, 255, 0.12)',
              color: 'var(--brand-accent)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 16,
              border: '1px solid rgba(181, 138, 82, 0.3)',
            }}
          >
            Nexus Ahmedabad One · Vastrapur
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 4.5vw, 42px)',
              lineHeight: 1.2,
              fontWeight: 800,
              color: '#FFFFFF',
              marginBottom: 14,
            }}
          >
            Intelligent Indoor Navigation & Retail Discovery.
          </h1>

          <p
            style={{
              fontSize: 15,
              color: '#D4DDD7',
              lineHeight: 1.6,
              marginBottom: 28,
              maxWidth: 640,
            }}
          >
            Navigate all 5 physical levels, 30 verified anchor stores, and live retailer inventories using real-time Dijkstra shortest-path wayfinding and multilingual voice concierge.
          </p>

          {/* Quick Search */}
          <form
            onSubmit={handleHeroSearch}
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              padding: '6px 8px 6px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              maxWidth: 580,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
            }}
          >
            <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search stores, brands, or products (e.g. Zara, Cinepolis, Nike, shoes)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '8px 0',
                fontSize: 14,
                boxShadow: 'none',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Search
            </button>
          </form>

          {/* Trending Categories */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#BAC7BF', fontWeight: 600 }}>Explore:</span>
            {categories.map((c) => (
              <Link
                key={c.name}
                to={`/directory?category=${encodeURIComponent(c.name)}`}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: 11,
                  fontWeight: 500,
                  textDecoration: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <span>{c.icon}</span> {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --- METRIC & CAPABILITY CARDS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Physical Stores
            </span>
            <Store size={18} color="var(--brand-primary)" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-headings)' }}>
            {shops.length || 30} Verified Stores
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Zara, H&M, Shoppers Stop, Reliance Digital, Cinepolis
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Building Levels
            </span>
            <Layers size={18} color="var(--brand-primary)" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-headings)' }}>
            5 Mall Floors
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            LG, Ground, 1F, 2F, 3F connected via escalators & lifts
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Shortest Path
            </span>
            <Compass size={18} color="var(--route-blue)" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-headings)' }}>
            Dijkstra Routing
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            67 topological navigation nodes across Vastrapur gates
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Multilingual Voice
            </span>
            <Mic size={18} color="var(--color-success)" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-headings)' }}>
            AI Concierge
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Whisper ASR & RAG retrieval in Gujarati, Hindi & English
          </div>
        </div>
      </div>

      {/* --- EXPLORE MALL FLOORS --- */}
      <section className="stack" style={{ gap: 16 }}>
        <div className="row-between">
          <div>
            <h2>Explore Mall Floors</h2>
            <p className="muted">Architectural level plans with store boundaries, entrances, escalators, and amenities.</p>
          </div>
          <Link to="/map" className="btn btn-secondary btn-sm">
            Open Interactive Map <ArrowRight size={13} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
          {floors.map((f) => {
            const count = shops.filter((s) => s.floorNumber === f.floorNumber).length;
            const subtext =
              f.floorNumber === -1
                ? 'Smart Bazaar Hypermarket, Bata, Lenskart & Valet Parking'
                : f.floorNumber === 0
                ? 'Vastrapur Grand Entrance, Zara, H&M, Shoppers Stop, Starbucks'
                : f.floorNumber === 1
                ? 'Reliance Digital, Nike, Skechers, Westside, Central Escalators'
                : f.floorNumber === 2
                ? 'Hamleys Toys, Home Centre, Manyavar Mohey, Crossword'
                : 'Cinepolis 9-Screen Multiplex, Food Court Diners, Timezone';
            return (
              <Link
                key={f.id}
                to={`/map?floor=${f.floorNumber}`}
                className="card card-interactive"
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 10, padding: 18 }}
              >
                <div className="row-between">
                  <span className="badge">Floor {f.floorNumber === -1 ? 'LG' : f.floorNumber === 0 ? 'G' : f.floorNumber}</span>
                  <span className="muted" style={{ fontSize: 11, fontWeight: 600 }}>{count || 6} Stores</span>
                </div>
                <div>
                  <h3 style={{ fontSize: 16, marginBottom: 4 }}>{f.label}</h3>
                  <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{subtext}</p>
                </div>
                <div style={{ marginTop: 'auto', color: 'var(--brand-primary)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>View Floor Plan</span>
                  <ArrowRight size={12} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* --- FEATURED STORES & ANCHOR BOUTIQUES --- */}
      <section className="stack" style={{ gap: 16 }}>
        <div className="row-between">
          <div>
            <h2>Premier Stores & Boutiques</h2>
            <p className="muted">Discover flagship retailers and get turn-by-turn walking guidance to their shopfront.</p>
          </div>
          <Link to="/directory" className="btn btn-secondary btn-sm">
            View All 30 Stores <ArrowRight size={13} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {shops.slice(0, 6).map((s) => (
            <div
              key={s.id}
              className="card"
              style={{
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: 140, overflow: 'hidden', background: '#ECEAE3' }}>
                <img
                  src={getShopImage(s.name)}
                  alt={s.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <span
                    style={{
                      background: 'rgba(32, 42, 50, 0.85)',
                      color: '#fff',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    Floor {s.floorNumber === -1 ? 'LG' : s.floorNumber === 0 ? 'G' : s.floorNumber}
                  </span>
                </div>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1, gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--brand-primary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {s.category}
                </span>
                <h3 style={{ fontSize: 16, margin: 0 }}>{s.name}</h3>
                <p className="muted" style={{ fontSize: 12, lineHeight: 1.45, flex: 1 }}>
                  {s.description || 'Premier retail destination at Nexus Ahmedabad One.'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                  <Link
                    to={`/map?floor=${s.floorNumber}&toNodeId=${s.navigationNodeId}&toLabel=${encodeURIComponent(s.name)}`}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 12, padding: '7px 10px' }}
                  >
                    <Compass size={13} /> Navigate
                  </Link>
                  <Link
                    to={`/shops/${s.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: 12, padding: '7px 10px' }}
                  >
                    View Store
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- IN-MALL INVENTORY CATALOGUE --- */}
      <section className="stack" style={{ gap: 16 }}>
        <div className="row-between">
          <div>
            <h2>Verified In-Store Inventory</h2>
            <p className="muted">Products currently available across mall retailers with in-store pickup readiness.</p>
          </div>
          <Link to="/products" className="btn btn-secondary btn-sm">
            Browse All Products <ArrowRight size={13} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* --- ASSISTANT & CONCIERGE CALLOUT --- */}
      <section
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 32,
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div className="badge badge-gold" style={{ marginBottom: 10 }}>
            <Sparkles size={12} /> Multilingual Assistance
          </div>
          <h2 style={{ fontSize: 24, marginBottom: 10 }}>Hands-Free Voice Wayfinding</h2>
          <p className="muted" style={{ lineHeight: 1.6, marginBottom: 18, fontSize: 13 }}>
            Use the Voice Concierge button at the bottom right. You can speak naturally in Gujarati, Hindi, or English:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            <div style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
              🗣️ <strong>"મને શૂઝ ક્યાંથી મળશે?"</strong> <span className="muted">(Where can I find shoes? — Detected: Gujarati)</span>
            </div>
            <div style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
              🗣️ <strong>"Starbucks coffee kahan hai?"</strong> <span className="muted">(Where is Starbucks? — Detected: Hindi)</span>
            </div>
            <div style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}>
              🗣️ <strong>"Where is the nearest ATM on Ground Floor?"</strong> <span className="muted">(Detected: English)</span>
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-brand-light)',
            borderRadius: 'var(--radius-md)',
            padding: 24,
            border: '1px solid rgba(36, 88, 74, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <ShieldCheck size={18} color="var(--brand-primary)" />
            <strong style={{ fontSize: 15, color: 'var(--brand-primary)' }}>Verified Physical Mall Twin</strong>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
            Every shop coordinate, escalator node, and vertical floor connector accurately reflects the physical layout of Nexus Ahmedabad One, Vastrapur.
          </p>
          <Link to="/map" className="btn btn-primary" style={{ width: '100%', fontSize: 13 }}>
            Open 5-Level Architectural Map <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
