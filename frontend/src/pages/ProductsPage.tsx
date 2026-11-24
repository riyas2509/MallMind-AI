import { useCallback, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { ProductResponse, RecommendationResponse } from '../api/types';
import ProductCard from '../components/ProductCard';
import {
  Search,
  Filter,
  Sparkles,
  RotateCcw,
  Tag,
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

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialName = searchParams.get('name') || '';

  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    category: initialCategory,
    name: initialName,
  });
  const [results, setResults] = useState<ProductResponse[] | null>(null);
  const [recommended, setRecommended] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc'>('relevance');

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
      setResults(searchRes);
      setRecommended(recRes);
    } catch {
      setError('Could not load products right now.');
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
    const list = [...results];
    if (sortBy === 'price-asc') {
      return list.sort((a, b) => a.effectivePrice - b.effectivePrice);
    } else if (sortBy === 'price-desc') {
      return list.sort((a, b) => b.effectivePrice - a.effectivePrice);
    }
    return list;
  }, [results, sortBy]);

  return (
    <div className="stack" style={{ gap: 28 }}>
      {/* Title & Filter bar */}
      <div className="row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <div className="badge badge-gold" style={{ marginBottom: 6 }}>
            <Tag size={13} /> Real-Time Catalogue
          </div>
          <h1>Explore Store Products</h1>
          <p className="muted">
            Browse live in-store stock across 30 verified retailers at Nexus Ahmedabad One.
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
          {loading ? 'Searching live inventory...' : `${sortedResults.length} Products Found`}
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
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
