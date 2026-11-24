import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { ShopResponse } from '../api/types';
import { FALLBACK_SHOPS } from '../data/fallbackData';
import { getShopImage } from '../utils/images';
import {
  Store,
  MapPin,
  Search,
  Navigation,
  Clock,
  ShoppingBag,
  SlidersHorizontal,
  Layers,
  Sparkles,
} from 'lucide-react';

const FLOOR_LABELS: Record<number, string> = {
  [-1]: 'Lower Ground (LG)',
  0: 'Ground Floor (G)',
  1: 'First Floor (1F)',
  2: 'Second Floor (2F)',
  3: 'Third Floor (3F)',
};

export default function MallDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shops, setShops] = useState<ShopResponse[]>(FALLBACK_SHOPS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const selectedFloor = searchParams.get('floor') !== null ? Number(searchParams.get('floor')) : null;
  const selectedCategory = searchParams.get('category') || 'ALL';

  useEffect(() => {
    async function loadShops() {
      setLoading(true);
      try {
        const data = await api.get<ShopResponse[]>('/api/shops');
        if (Array.isArray(data) && data.length > 0) {
          setShops(data);
        }
      } catch (err) {
        console.warn('Using offline fallback shop directory:', err);
      } finally {
        setLoading(false);
      }
    }
    loadShops();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    shops.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [shops]);

  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const matchesFloor = selectedFloor === null || shop.floorNumber === selectedFloor;
      const matchesCat = selectedCategory === 'ALL' || shop.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        shop.name.toLowerCase().includes(q) ||
        (shop.description && shop.description.toLowerCase().includes(q)) ||
        (shop.category && shop.category.toLowerCase().includes(q));
      return matchesFloor && matchesCat && matchesQuery;
    });
  }, [shops, selectedFloor, selectedCategory, searchQuery]);

  function handleFloorSelect(floor: number | null) {
    const next = new URLSearchParams(searchParams);
    if (floor === null) {
      next.delete('floor');
    } else {
      next.set('floor', String(floor));
    }
    setSearchParams(next);
  }

  function handleCategorySelect(cat: string) {
    const next = new URLSearchParams(searchParams);
    if (cat === 'ALL') {
      next.delete('category');
    } else {
      next.set('category', cat);
    }
    setSearchParams(next);
  }

  return (
    <div className="stack" style={{ gap: 28 }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #14243B 0%, #1E3A5F 100%)',
          color: '#fff',
          padding: '36px 32px',
          borderRadius: 16,
          boxShadow: '0 12px 32px rgba(20, 36, 59, 0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div className="stack" style={{ gap: 10, maxWidth: 640 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', padding: '4px 12px', borderRadius: 20, width: 'fit-content' }}>
              <Sparkles size={14} color="#E4A94C" />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: '#E4A94C', textTransform: 'uppercase' }}>
                Nexus Ahmedabad One (Alpha One)
              </span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: '#fff' }}>
              Mall Directory & Store Guide
            </h1>
            <p style={{ margin: 0, color: '#CBD5E1', fontSize: 15, lineHeight: 1.6 }}>
              Explore 30 verified anchor stores, luxury boutiques, food court diners, and multiplex entertainment spread across all 5 physical levels.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 16,
              background: 'rgba(255,255,255,0.08)',
              padding: '16px 20px',
              borderRadius: 12,
              backdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>5</div>
              <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Levels</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#E4A94C' }}>30</div>
              <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Stores</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#34D399' }}>11</div>
              <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Facilities</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginTop: 28, position: 'relative', maxWidth: 600 }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            placeholder="Search stores by brand, category, or keywords (e.g. Zara, Cinepolis, Nike)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px 14px 46px',
              borderRadius: 10,
              border: 'none',
              fontSize: 14,
              outline: 'none',
              background: '#fff',
              color: '#0F172A',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          />
        </div>
      </div>

      {/* Filter Controls */}
      <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Floor Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#475569', minWidth: 90 }}>
            <Layers size={15} /> Floor Level:
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => handleFloorSelect(null)}
              className={`btn btn-sm ${selectedFloor === null ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 20 }}
            >
              All Levels (5)
            </button>
            {[-1, 0, 1, 2, 3].map((f) => (
              <button
                key={f}
                onClick={() => handleFloorSelect(f)}
                className={`btn btn-sm ${selectedFloor === f ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 20 }}
              >
                {FLOOR_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)' }} />

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#475569', minWidth: 90 }}>
            <SlidersHorizontal size={15} /> Category:
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`btn btn-xs ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  borderRadius: 16,
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: selectedCategory === cat ? 700 : 500,
                }}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, color: '#64748B' }}>
          Showing <strong style={{ color: '#0F172A' }}>{filteredShops.length}</strong> stores
          {selectedFloor !== null && ` on ${FLOOR_LABELS[selectedFloor]}`}
          {selectedCategory !== 'ALL' && ` in ${selectedCategory}`}
        </div>
        <Link to="/map" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={14} /> Open Full 2D Vector Mall Map
        </Link>
      </div>

      {/* Shops Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
          Loading Alpha One Mall directory...
        </div>
      ) : filteredShops.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Store size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
          <h3>No stores found</h3>
          <p className="muted" style={{ margin: '4px 0 16px' }}>
            No stores match your current search and filter criteria.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              handleFloorSelect(null);
              handleCategorySelect('ALL');
            }}
            className="btn btn-secondary btn-sm"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {filteredShops.map((shop) => {
            const imageUrl = getShopImage(shop.name);
            const floorName = FLOOR_LABELS[shop.floorNumber] || `Floor ${shop.floorNumber}`;
            return (
              <div
                key={shop.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  padding: 0,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  border: '1px solid var(--border)',
                }}
              >
                {/* Storefront Image */}
                <div style={{ height: 160, position: 'relative', overflow: 'hidden', background: '#F1F5F9' }}>
                  <img
                    src={imageUrl}
                    alt={shop.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      background: 'rgba(20, 36, 59, 0.85)',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: 14,
                      fontSize: 11,
                      fontWeight: 700,
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Layers size={11} /> {floorName}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      right: 10,
                      background: 'rgba(255, 255, 255, 0.95)',
                      color: '#0F172A',
                      padding: '3px 8px',
                      borderRadius: 10,
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    Node #{shop.navigationNodeId}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1, gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#2563EB',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {shop.category}
                      </span>
                      <h3 style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 700, color: '#0F172A' }}>
                        {shop.name}
                      </h3>
                    </div>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: '#64748B',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1,
                    }}
                  >
                    {shop.description || 'Verified premier retailer at Nexus Ahmedabad One, Vastrapur.'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#64748B', marginTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} color="#10B981" /> 10:00 AM - 10:00 PM
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                    <Link
                      to={`/map?destNodeId=${shop.navigationNodeId}&floor=${shop.floorNumber}`}
                      className="btn btn-secondary btn-sm"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontSize: 12,
                      }}
                    >
                      <Navigation size={13} color="#2563EB" /> Navigate
                    </Link>
                    <Link
                      to={`/shops/${shop.id}`}
                      className="btn btn-primary btn-sm"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontSize: 12,
                      }}
                    >
                      <ShoppingBag size={13} /> View Store
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
