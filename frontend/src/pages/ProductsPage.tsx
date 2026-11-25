import { useCallback, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { ProductResponse, RecommendationResponse } from '../api/types';
import { FALLBACK_PRODUCTS } from '../data/fallbackData';
import {
  MALL_CATEGORIES,
  CATEGORY_NAMES,
  matchCategory,
  normalizeCategoryName,
} from '../utils/categories';
import ProductCard from '../components/ProductCard';
import {
  Search,
  Filter,
  Sparkles,
  RotateCcw,
  Tag,
  Scale,
  X,
  Info,
  Check,
} from 'lucide-react';

interface Filters {
  name: string;
  category: string;
  brand: string;
  color: string;
  maxPrice: string;
  availableOnly: boolean;
}

const EMPTY_FILTERS: Filters = {
  name: '',
  category: '',
  brand: '',
  color: '',
  maxPrice: '',
  availableOnly: false,
};

const CATEGORIES = ['All Categories', ...CATEGORY_NAMES];

function buildQuery(params: Record<string, string>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && value.trim() && value !== 'All Categories') {
      q.set(key, value.trim());
    }
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

function filterFallbackProducts(f: Filters): ProductResponse[] {
  return FALLBACK_PRODUCTS.filter((p) => {
    if (f.name && !p.name.toLowerCase().includes(f.name.toLowerCase().trim())) return false;
    if (f.category && f.category !== 'All Categories' && !matchCategory(p.category, f.category)) return false;
    if (f.brand && (!p.brand || !p.brand.toLowerCase().includes(f.brand.toLowerCase().trim()))) return false;
    if (f.color && (!p.color || !p.color.toLowerCase().includes(f.color.toLowerCase().trim()))) return false;
    if (f.maxPrice && (p.effectivePrice ?? p.price) > Number(f.maxPrice)) return false;
    if (f.availableOnly && !p.available) return false;
    return true;
  });
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse initial filters from URL
  const initialCategory = normalizeCategoryName(searchParams.get('category'));
  const initialName = searchParams.get('name') || '';
  const initialBrand = searchParams.get('brand') || '';

  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    category: initialCategory,
    name: initialName,
    brand: initialBrand,
  });

  const [results, setResults] = useState<ProductResponse[] | null>(() =>
    filterFallbackProducts({
      ...EMPTY_FILTERS,
      category: initialCategory,
      name: initialName,
      brand: initialBrand,
    }),
  );

  const [recommended, setRecommended] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc'>('relevance');
  const [comparedIds, setComparedIds] = useState<number[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  // Dynamic category product counts for visitor catalogue
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All Categories': FALLBACK_PRODUCTS.length };
    MALL_CATEGORIES.forEach((c) => {
      counts[c.name] = FALLBACK_PRODUCTS.filter((p) => matchCategory(p.category, c.name)).length;
    });
    return counts;
  }, []);

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

  const runSearch = useCallback(
    async (f: Filters) => {
      setLoading(true);
      setError(null);
      try {
        const queryCategory = normalizeCategoryName(f.category);
        const [searchRes, recRes] = await Promise.all([
          api.get<ProductResponse[]>(
            `/api/products${buildQuery({
              name: f.name,
              category: queryCategory,
              brand: f.brand,
              color: f.color,
              maxPrice: f.maxPrice,
              available: f.availableOnly ? 'true' : '',
              sortBy: sortBy,
            })}`,
          ),
          api
            .get<RecommendationResponse>(
              `/api/products/recommendations${buildQuery({
                category: queryCategory,
                brand: f.brand,
                color: f.color,
                maxBudget: f.maxPrice,
                maxResults: '6',
              })}`,
            )
            .catch(() => null),
        ]);

        if (Array.isArray(searchRes)) {
          // If live API returns an array, use it directly (even if length is 0 for specific criteria)
          setResults(searchRes);
          setIsFallbackMode(false);
        } else {
          setResults(filterFallbackProducts(f));
          setIsFallbackMode(true);
        }
        setRecommended(recRes);
      } catch {
        // Fallback to offline demonstration catalogue
        setResults(filterFallbackProducts(f));
        setIsFallbackMode(true);
      } finally {
        setLoading(false);
      }
    },
    [sortBy],
  );

  // Synchronize when URL search parameters change (from Navigation, Home, Product Details, or Category Pills)
  useEffect(() => {
    const rawCategory = searchParams.get('category') || '';
    const categoryParam = normalizeCategoryName(rawCategory);
    const nameParam = searchParams.get('name') || '';
    const brandParam = searchParams.get('brand') || '';

    const newFilters: Filters = {
      ...EMPTY_FILTERS,
      category: categoryParam,
      name: nameParam,
      brand: brandParam,
    };
    setFilters(newFilters);
    void runSearch(newFilters);
  }, [searchParams, runSearch]);

  const handleCategorySelect = (catName: string) => {
    const next = new URLSearchParams(searchParams);
    if (catName === 'All Categories' || (filters.category && matchCategory(filters.category, catName))) {
      next.delete('category');
    } else {
      next.set('category', catName);
    }
    setSearchParams(next);
  };

  const handleDropdownChange = (val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val === 'All Categories' || !val) {
      next.delete('category');
    } else {
      next.set('category', val);
    }
    setSearchParams(next);
  };

  const handleReset = () => {
    setSearchParams(new URLSearchParams());
  };

  const handleClearCategory = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('category');
    setSearchParams(next);
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
    <div className="stack" style={{ gap: 24 }}>
      {/* Title & Sort Bar */}
      <div className="row-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="badge badge-gold" style={{ marginBottom: 6 }}>
            <Tag size={13} /> Demo Catalogue & Inventory
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', margin: '0 0 6px 0' }}>
            Explore Store Products
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Browse curated demonstration products across 30 stores at Nexus Ahmedabad One, Vastrapur.
          </p>
        </div>

        <div className="row" style={{ gap: 10 }}>
          <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>
            Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'relevance' | 'price-asc' | 'price-desc')}
            style={{ width: 'auto', padding: '6px 12px', fontSize: 13, borderRadius: 6 }}
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
            <strong>Prototype Offline Demonstration Mode:</strong> Operating on the curated 24-product showcase catalogue. Live backend inventory service is currently offline or unreachable.
          </span>
        </div>
      )}

      {/* QUICK CATEGORY PILLS BAR */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Merchandise Categories
          </span>
          {filters.category && filters.category !== 'All Categories' && (
            <button
              onClick={handleClearCategory}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brand-primary)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>Clear category filter</span>
              <X size={12} />
            </button>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => handleCategorySelect('All Categories')}
            style={{
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: !filters.category || filters.category === 'All Categories'
                ? '1px solid var(--brand-primary)'
                : '1px solid var(--border-color)',
              background: !filters.category || filters.category === 'All Categories'
                ? 'var(--brand-primary)'
                : 'var(--bg-primary)',
              color: !filters.category || filters.category === 'All Categories'
                ? '#FFFFFF'
                : 'var(--text-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <span>All Categories</span>
            <span style={{ opacity: 0.8, fontSize: 11 }}>({FALLBACK_PRODUCTS.length})</span>
          </button>

          {MALL_CATEGORIES.map((c) => {
            const isSelected =
              filters.category !== '' &&
              filters.category !== 'All Categories' &&
              matchCategory(filters.category, c.name);
            const count = categoryCounts[c.name] ?? 0;

            return (
              <button
                key={c.name}
                type="button"
                onClick={() => handleCategorySelect(c.name)}
                style={{
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: isSelected ? 700 : 500,
                  whiteSpace: 'nowrap',
                  border: isSelected
                    ? '1px solid var(--brand-primary)'
                    : '1px solid var(--border-color)',
                  background: isSelected
                    ? 'var(--brand-primary)'
                    : 'var(--bg-primary)',
                  color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? 'var(--shadow-xs)' : 'none',
                }}
              >
                <span>{c.icon}</span>
                <span>{c.name}</span>
                <span style={{ opacity: isSelected ? 0.9 : 0.6, fontSize: 11 }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Promotional Offer Banner */}
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

      {/* Comprehensive Filter Controls */}
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
            const next = new URLSearchParams(searchParams);
            if (filters.name.trim()) next.set('name', filters.name.trim());
            else next.delete('name');
            if (filters.category && filters.category !== 'All Categories') next.set('category', filters.category);
            else next.delete('category');
            if (filters.brand.trim()) next.set('brand', filters.brand.trim());
            else next.delete('brand');
            setSearchParams(next);
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
            value={normalizeCategoryName(filters.category) || 'All Categories'}
            onChange={(e) => handleDropdownChange(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
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
            <span className="badge badge-gold">Source: {recommended.source}</span>
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
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          {loading ? (
            <span>Searching catalogue...</span>
          ) : (
            <span>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{sortedResults.length}</strong>{' '}
              {sortedResults.length === 1 ? 'product' : 'products'}
              {filters.category && filters.category !== 'All Categories' && (
                <span>
                  {' '}in <strong style={{ color: 'var(--brand-primary)' }}>{normalizeCategoryName(filters.category)}</strong>
                </span>
              )}
              {filters.brand && <span> by <strong>{filters.brand}</strong></span>}
              {filters.name && <span> matching "<strong>{filters.name}</strong>"</span>}
            </span>
          )}
        </div>
      </div>

      {/* Products Grid / Empty States */}
      {error && <div className="card error-text">{error}</div>}

      {!loading && sortedResults.length === 0 && (
        <div className="card empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Search size={40} style={{ margin: '0 auto 12px', opacity: 0.35, color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: 18, marginBottom: 8, color: 'var(--text-primary)' }}>
            No products match your exact criteria
          </h3>
          <p className="muted" style={{ marginTop: 0, marginBottom: 20, maxWidth: 480, margin: '0 auto 20px' }}>
            {filters.category && filters.category !== 'All Categories' ? (
              <span>
                No demonstration products found in category <strong>"{filters.category}"</strong> with the active search and price filters.
              </span>
            ) : (
              <span>No products matched your search. Try resetting filters to view all products.</span>
            )}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {filters.category && filters.category !== 'All Categories' && (
              <button className="btn btn-secondary" onClick={handleClearCategory}>
                Clear Category Filter
              </button>
            )}
            <button className="btn btn-primary" onClick={handleReset}>
              Reset All Filters
            </button>
          </div>
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
                  fontSize: 11,
                  background: 'rgba(255,255,255,0.15)',
                  padding: '4px 8px',
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {p.name.split(' ')[0]}
                <button
                  onClick={() => toggleCompare(p)}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowCompareModal(true)}
              style={{ fontSize: 12, padding: '4px 12px' }}
            >
              Compare Side-by-Side
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setComparedIds([])}
              style={{ fontSize: 12, padding: '4px 8px', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {showCompareModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setShowCompareModal(false)}
        >
          <div
            className="card"
            style={{
              background: '#fff',
              maxWidth: 900,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              borderRadius: 12,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row-between" style={{ marginBottom: 16 }}>
              <div className="row" style={{ gap: 8 }}>
                <Scale size={20} color="var(--brand-primary)" />
                <h3 style={{ margin: 0, fontSize: 18 }}>Product Specification Comparison</h3>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowCompareModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', background: '#F8FAFC' }}>Attribute</th>
                    {comparedProducts.map((p) => (
                      <th key={p.id} style={{ padding: '10px 12px', textAlign: 'left', minWidth: 160 }}>
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        <div style={{ color: 'var(--brand-primary)', fontSize: 14 }}>
                          ₹{p.effectivePrice.toLocaleString('en-IN')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, background: '#F8FAFC' }}>Store</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} style={{ padding: '10px 12px' }}>
                        {p.shopName} (Floor {p.shopFloorNumber === -1 ? 'LG' : p.shopFloorNumber === 0 ? 'G' : p.shopFloorNumber})
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, background: '#F8FAFC' }}>Category</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} style={{ padding: '10px 12px' }}>
                        {p.category}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, background: '#F8FAFC' }}>Brand</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} style={{ padding: '10px 12px' }}>
                        {p.brand || '—'}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, background: '#F8FAFC' }}>Color</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} style={{ padding: '10px 12px' }}>
                        {p.color || '—'}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, background: '#F8FAFC' }}>Availability</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} style={{ padding: '10px 12px' }}>
                        {p.available ? (
                          <span style={{ color: '#16A34A', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={14} /> In Stock
                          </span>
                        ) : (
                          <span style={{ color: '#DC2626' }}>Out of Stock</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCompareModal(false)}>
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
