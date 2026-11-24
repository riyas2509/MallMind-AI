import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { ShopResponse, ProductResponse } from '../api/types';
import { getShopImage } from '../utils/images';
import ProductCard from '../components/ProductCard';
import {
  MapPin,
  Navigation,
  Clock,
  Phone,
  ShieldCheck,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  ArrowLeft,
  Layers,
} from 'lucide-react';

const FLOOR_LABELS: Record<number, string> = {
  [-1]: 'Lower Ground (LG)',
  0: 'Ground Floor (G)',
  1: 'First Floor (1F)',
  2: 'Second Floor (2F)',
  3: 'Third Floor (3F)',
};

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<ShopResponse | null>(null);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadShopAndProducts() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const shopData = await api.get<ShopResponse>(`/api/shops/${id}`);
        setShop(shopData);

        // Fetch products for this shop
        try {
          const prods = await api.get<ProductResponse[]>(`/api/products/shop/${id}`);
          setProducts(prods);
        } catch {
          // Fallback: fetch all and filter by shopId
          const allProds = await api.get<ProductResponse[]>('/api/products');
          setProducts(allProds.filter((p) => p.shopId === Number(id)));
        }
      } catch (err) {
        console.error('Failed to load shop details:', err);
        setError('Failed to load store profile.');
      } finally {
        setLoading(false);
      }
    }
    loadShopAndProducts();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
        Loading store details and catalogue...
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Store Not Found</h2>
        <p className="muted" style={{ margin: '8px 0 20px' }}>
          {error || 'The requested shop does not exist in the mall directory.'}
        </p>
        <Link to="/directory" className="btn btn-primary btn-sm">
          <ArrowLeft size={14} style={{ marginRight: 6 }} /> Back to Mall Directory
        </Link>
      </div>
    );
  }

  const storefrontImage = getShopImage(shop.name);
  const floorName = FLOOR_LABELS[shop.floorNumber] || `Floor ${shop.floorNumber}`;

  return (
    <div className="stack" style={{ gap: 28 }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748B' }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
        <ChevronRight size={14} />
        <Link to="/directory" style={{ color: 'inherit', textDecoration: 'none' }}>Mall Directory</Link>
        <ChevronRight size={14} />
        <span style={{ color: '#0F172A', fontWeight: 600 }}>{shop.name}</span>
      </div>

      {/* Store Hero Banner */}
      <div
        className="card"
        style={{
          padding: 0,
          overflow: 'hidden',
          borderRadius: 16,
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ position: 'relative', height: 260, background: '#1E293B' }}>
          <img
            src={storefrontImage}
            alt={shop.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.85,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.4) 60%, transparent 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: 28,
              right: 28,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    background: '#2563EB',
                    color: '#fff',
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {shop.category}
                </span>
                <span
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Layers size={12} /> {floorName}
                </span>
              </div>
              <h1 style={{ color: '#fff', margin: 0, fontSize: 32, fontWeight: 800 }}>
                {shop.name}
              </h1>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Link
                to={`/map?toNodeId=${shop.navigationNodeId}&toLabel=${encodeURIComponent(shop.name)}&floor=${shop.floorNumber}&autoStart=true`}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
                }}
              >
                <Navigation size={16} /> Get Turn-by-Turn Directions
              </Link>
            </div>
          </div>
        </div>

        {/* Store Quick Info Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            padding: '20px 28px',
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Operating Hours</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>10:00 AM - 10:00 PM (All Days)</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={18} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Mall Location</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{floorName} · Node #{shop.navigationNodeId}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={18} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Concierge Desk</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>+91 (079) 4019-1111</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Verification</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Nexus Ahmedabad One Official Tenant</div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Description */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700 }}>About {shop.name}</h3>
        <p style={{ margin: 0, color: '#475569', lineHeight: 1.7, fontSize: 14 }}>
          {shop.description || 'Welcome to our store at Nexus Ahmedabad One, Vastrapur. Browse our verified in-mall inventory below or visit us directly on the floor.'}
        </p>
      </div>

      {/* Store Inventory Section */}
      <div className="stack" style={{ gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                In-Store Products & Inventory
              </h2>
              <span style={{ fontSize: 13, color: '#64748B' }}>
                Showing {products.length} live products currently in stock at this location
              </span>
            </div>
          </div>

          <Link to={`/compare`} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color="#D97706" /> Product Comparison Matrix
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <ShoppingBag size={36} color="#94A3B8" style={{ margin: '0 auto 10px' }} />
            <h3>No products listed currently</h3>
            <p className="muted" style={{ margin: '4px 0 16px' }}>
              Products for {shop.name} are being stocked. Please visit the store directly on {floorName}.
            </p>
            <Link
              to={`/map?destNodeId=${shop.navigationNodeId}&floor=${shop.floorNumber}`}
              className="btn btn-primary btn-sm"
            >
              <Navigation size={14} style={{ marginRight: 6 }} /> View Store Location on Map
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 20,
            }}
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
