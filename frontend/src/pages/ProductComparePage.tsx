import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { ProductResponse } from '../api/types';
import { FALLBACK_PRODUCTS } from '../data/fallbackData';
import { getProductImage } from '../utils/images';
import { useCart } from '../auth/CartContext';
import {
  Scale,
  Plus,
  Trash2,
  Check,
  ShoppingBag,
  Search,
  Sigma,
  Layers,
} from 'lucide-react';

const FLOOR_LABELS: Record<number, string> = {
  [-1]: 'Lower Ground (LG)',
  0: 'Ground Floor (G)',
  1: 'First Floor (1F)',
  2: 'Second Floor (2F)',
  3: 'Third Floor (3F)',
};

export default function ProductComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const [allProducts, setAllProducts] = useState<ProductResponse[]>(FALLBACK_PRODUCTS);
  const [selectedIds, setSelectedIds] = useState<number[]>([1, 2]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addedId, setAddedId] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const prods = await api.get<ProductResponse[]>('/api/products');
        if (Array.isArray(prods) && prods.length > 0) {
          setAllProducts(prods);

          const rawIds = searchParams.get('ids');
          if (rawIds) {
            const parsed = rawIds
              .split(',')
              .map(Number)
              .filter((id) => !isNaN(id) && prods.some((p) => p.id === id));
            if (parsed.length > 0) {
              setSelectedIds(parsed.slice(0, 4));
              return;
            }
          }

          if (prods.length >= 2) {
            setSelectedIds([prods[0].id, prods[1].id]);
          }
        }
      } catch (err) {
        // Fallback to FALLBACK_PRODUCTS
        setAllProducts(FALLBACK_PRODUCTS);
        setSelectedIds([FALLBACK_PRODUCTS[0].id, FALLBACK_PRODUCTS[1].id]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const comparedProducts = useMemo(() => {
    return selectedIds
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p): p is ProductResponse => p !== undefined);
  }, [selectedIds, allProducts]);

  function handleRemove(id: number) {
    const next = selectedIds.filter((item) => item !== id);
    setSelectedIds(next);
    setSearchParams({ ids: next.join(',') });
  }

  function handleAdd(product: ProductResponse) {
    if (selectedIds.includes(product.id) || selectedIds.length >= 4) return;
    const next = [...selectedIds, product.id];
    setSelectedIds(next);
    setSearchParams({ ids: next.join(',') });
    setSearchQuery('');
  }

  // Linear Algebra: Compute Feature Vectors and Euclidean Distance / Cosine Similarity
  const vectorAnalysis = useMemo(() => {
    if (comparedProducts.length < 2) return null;

    const pA = comparedProducts[0];
    const pB = comparedProducts[1];

    // Normalized Feature Vector 1: Price (scale 0 to 100,000)
    const normPriceA = Math.min(1, pA.effectivePrice / 80000);
    const normPriceB = Math.min(1, pB.effectivePrice / 80000);

    // Normalized Feature Vector 2: Discount ratio
    const discA = pA.discountPrice ? (pA.price - pA.discountPrice) / pA.price : 0;
    const discB = pB.discountPrice ? (pB.price - pB.discountPrice) / pB.price : 0;

    // Normalized Feature Vector 3: Floor index (LG = 0, G = 0.25, 1F = 0.5, 2F = 0.75, 3F = 1.0)
    const floorIndexA = (pA.shopFloorNumber + 1) / 4;
    const floorIndexB = (pB.shopFloorNumber + 1) / 4;

    // Euclidean distance: d(A, B) = sqrt(sum((Ai - Bi)^2))
    const euclideanDist = Math.sqrt(
      Math.pow(normPriceA - normPriceB, 2) +
      Math.pow(discA - discB, 2) +
      Math.pow(floorIndexA - floorIndexB, 2)
    );

    // Cosine similarity: (A . B) / (|A| * |B|)
    const dotProduct = normPriceA * normPriceB + discA * discB + floorIndexA * floorIndexB;
    const magA = Math.sqrt(Math.pow(normPriceA, 2) + Math.pow(discA, 2) + Math.pow(floorIndexA, 2));
    const magB = Math.sqrt(Math.pow(normPriceB, 2) + Math.pow(discB, 2) + Math.pow(floorIndexB, 2));
    const cosineSim = magA > 0 && magB > 0 ? dotProduct / (magA * magB) : 1;

    return {
      productAName: pA.name,
      productBName: pB.name,
      euclideanDistance: euclideanDist.toFixed(4),
      cosineSimilarity: (cosineSim * 100).toFixed(1),
      priceDifference: Math.abs(pA.effectivePrice - pB.effectivePrice),
    };
  }, [comparedProducts]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allProducts
      .filter((p) => !selectedIds.includes(p.id) && (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q))))
      .slice(0, 5);
  }, [allProducts, selectedIds, searchQuery]);

  async function onAddToCart(product: ProductResponse) {
    try {
      await addToCart(product.id, 1);
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 1800);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="stack" style={{ gap: 28 }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #14243B 0%, #1E3A5F 100%)',
          color: '#fff',
          padding: '32px',
          borderRadius: 16,
          boxShadow: '0 8px 30px rgba(20, 36, 59, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', padding: '4px 12px', borderRadius: 20, marginBottom: 10 }}>
              <Scale size={14} color="#E4A94C" />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: '#E4A94C', textTransform: 'uppercase' }}>
                Multi-Store Comparison
              </span>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, color: '#fff' }}>
              Product Comparison Matrix
            </h1>
            <p style={{ margin: '8px 0 0', color: '#CBD5E1', fontSize: 14, maxWidth: 640, lineHeight: 1.6 }}>
              Compare specifications, retail prices, store locations across floors, and mathematical feature vector similarities side-by-side.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#94A3B8' }}>Selected: {comparedProducts.length}/4</span>
          </div>
        </div>

        {/* Add Product Search Input */}
        {selectedIds.length < 4 && (
          <div style={{ marginTop: 24, position: 'relative', maxWidth: 540 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="text"
              placeholder="Search catalogue to add another product to compare..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                outline: 'none',
                background: '#fff',
                color: '#0F172A',
              }}
            />

            {searchResults.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 6,
                  background: '#fff',
                  borderRadius: 8,
                  boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                  zIndex: 20,
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                }}
              >
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleAdd(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'background 0.15s ease',
                      color: '#0F172A',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        {item.shopName} · {item.category} · ₹{item.effectivePrice.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <button className="btn btn-xs btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Plus size={12} /> Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Linear Algebra Mathematical Explainability Card */}
      {vectorAnalysis && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
            border: '1px solid #BFDBFE',
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Sigma size={18} color="#2563EB" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1E3A8A' }}>
              Linear Algebra Vector Analysis ({vectorAnalysis.productAName} vs {vectorAnalysis.productBName})
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#3B82F6', lineHeight: 1.5 }}>
            Each product is transformed into a 3D feature space <strong>x = [Price, Discount Ratio, Floor Index]</strong>.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginTop: 14,
            }}
          >
            <div style={{ background: '#fff', padding: '12px 16px', borderRadius: 8, border: '1px solid #DBEAFE' }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Euclidean Distance ‖xA - xB‖</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1E40AF', marginTop: 2 }}>{vectorAnalysis.euclideanDistance}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Normalized feature space separation</div>
            </div>

            <div style={{ background: '#fff', padding: '12px 16px', borderRadius: 8, border: '1px solid #DBEAFE' }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Cosine Similarity cos(θ)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#059669', marginTop: 2 }}>{vectorAnalysis.cosineSimilarity}%</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Orientation alignment in catalogue space</div>
            </div>

            <div style={{ background: '#fff', padding: '12px 16px', borderRadius: 8, border: '1px solid #DBEAFE' }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Direct Budget Gap</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#D97706', marginTop: 2 }}>₹{vectorAnalysis.priceDifference.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Absolute retail price divergence</div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Grid Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
          Loading comparison products...
        </div>
      ) : comparedProducts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Scale size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
          <h3>No products selected for comparison</h3>
          <p className="muted" style={{ margin: '4px 0 16px' }}>
            Choose products from the catalogue to compare them side-by-side.
          </p>
          <Link to="/products" className="btn btn-primary btn-sm">
            Browse Product Catalogue
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--surface)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '16px 20px', width: 200, fontSize: 13, color: '#64748B', textTransform: 'uppercase' }}>
                  Attribute
                </th>
                {comparedProducts.map((p) => (
                  <th key={p.id} style={{ padding: '16px 20px', minWidth: 240, verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 700, textTransform: 'uppercase' }}>
                        {p.category}
                      </span>
                      {comparedProducts.length > 1 && (
                        <button
                          onClick={() => handleRemove(p.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94A3B8',
                            padding: 2,
                          }}
                          title="Remove from comparison"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                      {p.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Product Photo */}
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px 20px', fontWeight: 600, fontSize: 13, color: '#475569' }}>Photo</td>
                {comparedProducts.map((p) => {
                  const img = getProductImage(p.id, p.category);
                  return (
                    <td key={p.id} style={{ padding: '16px 20px' }}>
                      <img
                        src={img}
                        alt={p.name}
                        style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Price & Effective Price */}
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px 20px', fontWeight: 600, fontSize: 13, color: '#475569' }}>Effective Price</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
                      ₹{p.effectivePrice.toLocaleString('en-IN')}
                    </div>
                    {p.discountPrice && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 13, textDecoration: 'line-through', color: '#94A3B8' }}>
                          ₹{p.price.toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '2px 6px', borderRadius: 4 }}>
                          {Math.round(((p.price - p.discountPrice) / p.price) * 100)}% OFF
                        </span>
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              {/* Store & Floor Location */}
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px 20px', fontWeight: 600, fontSize: 13, color: '#475569' }}>Retailer Store</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{p.shopName}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F1F5F9', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, color: '#475569', marginTop: 4 }}>
                      <Layers size={11} /> {FLOOR_LABELS[p.shopFloorNumber] || `Floor ${p.shopFloorNumber}`}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Brand & Color */}
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px 20px', fontWeight: 600, fontSize: 13, color: '#475569' }}>Brand / Color</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} style={{ padding: '16px 20px', fontSize: 13 }}>
                    <div><strong>Brand:</strong> {p.brand || 'Nexus Partner'}</div>
                    <div style={{ marginTop: 2 }}><strong>Color:</strong> {p.color || 'Standard'}</div>
                  </td>
                ))}
              </tr>

              {/* In-Store Availability */}
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px 20px', fontWeight: 600, fontSize: 13, color: '#475569' }}>Stock Status</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        color: p.available ? '#059669' : '#DC2626',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      <Check size={14} /> {p.available ? 'Ready for In-Store Pickup' : 'Temporarily Out of Stock'}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Action Buttons */}
              <tr>
                <td style={{ padding: '20px', fontWeight: 600, fontSize: 13, color: '#475569' }}>Actions</td>
                {comparedProducts.map((p) => (
                  <td key={p.id} style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button
                        onClick={() => onAddToCart(p)}
                        className={`btn btn-sm ${addedId === p.id ? 'btn-success' : 'btn-primary'}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        {addedId === p.id ? <Check size={14} /> : <ShoppingBag size={14} />}
                        {addedId === p.id ? 'Added to Bag' : 'Add to Shopping Bag'}
                      </button>

                      <Link
                        to={`/shops/${p.shopId}`}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        View Store Profile
                      </Link>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
