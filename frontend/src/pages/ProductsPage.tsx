import { useCallback, useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { ProductResponse, RecommendationResponse } from '../api/types';
import { FALLBACK_PRODUCTS } from '../data/fallbackData';
import ProductCard from '../components/ProductCard';
import {
  Search,
  Filter,
  Sparkles,
  RotateCcw,
  Tag,
  Scale,
  X,
  Compass,
  Info,
} from 'lucide-react';

interface Filters {
  name: string;
  category: string;
  brand: string;
  color: string;
  maxPrice: string;
  availableOnly: boolean;
}

const EMPTY_FILTERS: Filters = { name: '', category: '', brand: '', color: '', maxPrice: '', availableOnly: false };

const CATEGORIES = [
  'All Categories',
  'Footwear',
  'Apparel',
  'Mobile & Gadgets',
  'Beauty & Cosmetics',
  'Watches & Accessories',
  'Jewelry',
  'Sportswear',
  'Home Decor',
  'Opticals',
  'Electronics',
  'Toys & Games',
  'Books & Stationery',
  'Bags & Accessories',
  'Gifts & Novelty',
  'Confectionery',
  'Pharmacy & Health',
];

function buildQuery(params: Record<string, string>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && value.trim() && value !== 'All Categories') q.set(key, value.trim());
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

function filterFallbackProducts(f: Filters): ProductResponse[] {
  return FALLBACK_PRODUCTS.filter((p) => {
    if (f.name && !p.name.toLowerCase().includes(f.name.toLowerCase())) return false;
    if (f.category && f.category !== 'All Categories' && p.category !== f.category) return false;
    if (f.brand && p.brand && !p.brand.toLowerCase().includes(f.brand.toLowerCase())) return false;
    if (f.color && p.color && !p.color.toLowerCase().includes(f.color.toLowerCase())) return false;
    if (f.maxPrice && p.effectivePrice > Number(f.maxPrice)) return false;
    if (f.availableOnly && !p.available) return false;
    return true;
  });
}

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialName = searchParams.get('name') || '';

  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    category: initialCategory,
    name: initialName,
  });
  const [results, setResults] = useState<ProductResponse[] | null>(() => filterFallbackProducts({
    ...EMPTY_FILTERS,
    category: initialCategory,
    name: initialName,
  }));
  const [recommended, setRecommended] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc'>('relevance');
  const [comparedIds, setComparedIds] = useState<number[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  const toggleCompare = (prod: ProductResponse) => {
    setComparedIds((prev) => {
      if (prev.includes(prod.id)) {
        return prev.filter((id) => id !== prod.id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, prod.id];
    });
  };

  const comparedProducts = useMemo(() => {
    return comparedIds
      .map((id) => (results ?? FALLBACK_PRODUCTS).find((p) => p.id === id))
      .filter((p): p is ProductResponse => p !== undefined);
  }, [comparedIds, results]);

  const runSearch = useCallback(async (f: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const [searchRes, recRes] = await Promise.all([
        api.get<ProductResponse[]>(
          `/api/products${buildQuery({
            name: f.name,
            category: f.category,
            brand: f.brand,
            color: f.color,
            maxPrice: f.maxPrice,
            available: f.availableOnly ? 'true' : '',
            sortBy: sortBy,
          })}`,
        ),
        api
          .get<RecommendationResponse>(
            `/api/products/recommendations${buildQuery({ category: f.category, brand: f.brand, color: f.color, maxBudget: f.maxPrice, maxResults: '6' })}`,
          )
          .catch(() => null),
      ]);
      if (Array.isArray(searchRes) && searchRes.length > 0) {
        setResults(searchRes);
        setIsFallbackMode(false);
      } else {
        setResults(filterFallbackProducts(f));
        setIsFallbackMode(true);
      }
      setRecommended(recRes);
    } catch {
      // Fallback to offline catalog
      setResults(filterFallbackProducts(f));
      setIsFallbackMode(true);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    void runSearch(filters);
  }, []);

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    void runSearch(EMPTY_FILTERS);
  };

  const sortedResults = useMemo(() => {
    if (!results) return [];
    let list = [...results];
    if (onlyDiscounted) {
      list = list.filter((p) => p.discountPrice != null && p.discountPrice < p.price);
    }
    if (sortBy === 'price-asc') {
      return list.sort((a, b) => a.effectivePrice - b.effectivePrice);
    } else if (sortBy === 'price-desc') {
      return list.sort((a, b) => b.effectivePrice - a.effectivePrice);
    }
    return list;
  }, [results, sortBy, onlyDiscounted]);

  return (
    <div className="stack" style={{ gap: 28 }}>
      {/* Title & Filter bar */}
      <div className="row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <div className="badge badge-gold" style={{ marginBottom: 6 }}>
            <Tag size={13} /> Demo Catalogue
          </div>
          <h1>Explore Store Products</h1>
          <p className="muted">
            Browse demonstration products across 30 stores in the Nexus Ahmedabad One prototype directory.
          </p>
        </div>

        <div className="row" style={{ gap: 10 }}>
          <span className="muted" style={{ fontSize: 13 }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
          >
            <option value="relevance">Featured & Relevant</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Offline / Fallback Indicator */}
      {isFallbackMode && (
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            color: '#475569',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Info size={16} color="#64748B" style={{ flexShrink: 0 }} />
          <span>
            <strong>Prototype Offline Demonstration Mode:</strong> Operating on the curated 20-product seed catalogue. Live backend inventory service is currently offline or unreachable.
          </span>
        </div>
      )}

      {/* Demonstration Promotional Offers Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #24584A 0%, #1A4036 100%)',
          color: '#fff',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div className="row" style={{ gap: 10 }}>
          <Tag size={18} style={{ color: 'var(--brand-accent)' }} />
          <div>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Active Demonstration Offers:</span>{' '}
            <span style={{ fontSize: 13, color: '#D4DDD7' }}>
              Special discounts active on Zara blazers (20% off), Nike shoes, H&M hoodies, and more.
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOnlyDiscounted(!onlyDiscounted)}
          className={`btn btn-sm ${onlyDiscounted ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: 12, padding: '6px 12px' }}
        >
          {onlyDiscounted ? 'Show All Products' : 'Filter Discounted Items Only'}
        </button>
      </div>

      {/* Filter controls */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch(filters);
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr)) 120px 100px',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', top: 12, left: 10, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search product name..."
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              style={{ paddingLeft: 32 }}
            />
          </div>

          <select
            value={filters.category || 'All Categories'}
            onChange={(e) => setFilters({ ...filters, category: e.target.value === 'All Categories' ? '' : e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Brand (e.g. Nike, Apple)"
            value={filters.brand}
            onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
          />

          <input
            type="text"
            placeholder="Color (e.g. Black, Blue)"
            value={filters.color}
            onChange={(e) => setFilters({ ...filters, color: e.target.value })}
          />

          <input
            type="number"
            placeholder="Max Price (₹)"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
          />

          <label className="row" style={{ gap: 6, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={filters.availableOnly}
              onChange={(e) => setFilters({ ...filters, availableOnly: e.target.checked })}
            />
            <span>In Stock Only</span>
          </label>

          <button type="submit" className="btn" disabled={loading} style={{ width: '100%' }}>
            <Filter size={15} /> Apply
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleReset}
            style={{ width: '100%' }}
            title="Reset Filters"
          >
            <RotateCcw size={15} /> Reset
          </button>
        </form>
      </div>

      {/* AI Recommendations panel (if query or category provided) */}
      {recommended && recommended.products && recommended.products.length > 0 && (
        <div
          style={{
            background: 'var(--bg-brand-light)',
            border: '1px solid rgba(36, 88, 74, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
          }}
        >
          <div className="row-between" style={{ marginBottom: 16 }}>
            <div className="row" style={{ gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--brand-primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={14} />
              </div>
              <strong style={{ fontSize: 15, color: 'var(--brand-primary)' }}>
                Machine Learning Recommendations
              </strong>
            </div>
            <span className="badge badge-gold">
              Source: {recommended.source}
            </span>
          </div>

          <div className="grid-cards">
            {recommended.products.map((p) => (
              <ProductCard key={`rec-${p.id}`} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="row-between">
        <div className="muted" style={{ fontWeight: 600 }}>
          {loading ? 'Searching catalogue...' : `${sortedResults.length} Products Found`}
        </div>
      </div>

      {/* Products Grid */}
      {error && <div className="card error-text">{error}</div>}

      {!loading && sortedResults.length === 0 && (
        <div className="card empty-state" style={{ padding: '60px 20px' }}>
          <Search size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3>No products match your exact criteria</h3>
          <p className="muted" style={{ marginTop: 6, marginBottom: 16 }}>
            Try removing some filters or searching for broader categories.
          </p>
          <button className="btn btn-secondary" onClick={handleReset}>
            Reset All Filters
          </button>
        </div>
      )}

      <div className="grid-cards">
        {sortedResults.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onToggleCompare={toggleCompare}
            isCompared={comparedIds.includes(p.id)}
          />
        ))}
      </div>

      {/* Floating Bottom Comparison Drawer */}
      {comparedIds.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--text-primary)',
            color: '#fff',
            borderRadius: 50,
            padding: '10px 20px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
            zIndex: 90,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            maxWidth: '90vw',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Scale size={16} color="var(--brand-accent)" />
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              {comparedIds.length} {comparedIds.length === 1 ? 'Product' : 'Products'} Selected
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {comparedProducts.map((p) => (
              <span
                key={p.id}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name}
                <X
                  size={12}
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleCompare(p)}
                />
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowCompareModal(true)}
              style={{ fontSize: 12, padding: '5px 14px' }}
            >
              Compare Attributes
            </button>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => setComparedIds([])}
              style={{ color: '#CBD5E1', fontSize: 11 }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Integrated Side-by-Side Product Comparison Modal */}
      {showCompareModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowCompareModal(false)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 960,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fff',
              padding: 24,
              borderRadius: 16,
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row-between" style={{ marginBottom: 20 }}>
              <div>
                <div className="badge badge-gold" style={{ marginBottom: 4 }}>
                  <Scale size={12} /> Product Attribute Comparison
                </div>
                <h2 style={{ margin: 0, fontSize: 22 }}>Compare Selected Products</h2>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowCompareModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {comparedProducts.length === 0 ? (
              <p className="muted">No products selected. Click "Compare" on product cards to add items.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '10px 12px', width: 140 }}>Attribute</th>
                      {comparedProducts.map((p) => (
                        <th key={p.id} style={{ padding: '10px 12px', minWidth: 180 }}>
                          <img
                            src={p.imageUrl || undefined}
                            alt={p.name}
                            style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                          />
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Price</td>
                      {comparedProducts.map((p) => (
                        <td key={p.id} style={{ padding: '10px 12px' }}>
                          <strong style={{ fontSize: 16, color: 'var(--brand-primary)' }}>₹{p.effectivePrice.toLocaleString('en-IN')}</strong>
                          {p.discountPrice && (
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'line-through', marginLeft: 6 }}>
                              ₹{p.price.toLocaleString('en-IN')}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Store & Floor</td>
                      {comparedProducts.map((p) => (
                        <td key={p.id} style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600 }}>{p.shopName}</div>
                          <div className="muted" style={{ fontSize: 11 }}>
                            Floor {p.shopFloorNumber === -1 ? 'LG' : p.shopFloorNumber === 0 ? 'G' : p.shopFloorNumber}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Category</td>
                      {comparedProducts.map((p) => (
                        <td key={p.id} style={{ padding: '10px 12px' }}>{p.category}</td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Brand</td>
                      {comparedProducts.map((p) => (
                        <td key={p.id} style={{ padding: '10px 12px' }}>{p.brand || '—'}</td>
                      ))}
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</td>
                      {comparedProducts.map((p) => (
                        <td key={p.id} style={{ padding: '10px 12px' }}>
                          <span className={`badge ${p.available ? 'badge-success' : 'badge-danger'}`}>
                            {p.available ? 'In Stock (Demo)' : 'Out of Stock'}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Actions</td>
                      {comparedProducts.map((p) => (
                        <td key={p.id} style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <Link
                              to={`/products/${p.id}`}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: 11, textAlign: 'center' }}
                            >
                              View Product
                            </Link>
                            <Link
                              to={`/map?floor=${p.shopFloorNumber}&toLabel=${encodeURIComponent(p.shopName)}`}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: 11, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                            >
                              <Compass size={12} /> Map Route
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
        </div>
      )}
    </div>
  );
}
