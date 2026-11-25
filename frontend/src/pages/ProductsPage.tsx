import { useCallback, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { ProductResponse, RecommendationResponse } from '../api/types';
import { FALLBACK_PRODUCTS, FALLBACK_SHOPS } from '../data/fallbackData';
import {
  MALL_CATEGORIES,
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
  Flame,
  Award,
  Sparkle,
  SlidersHorizontal,
} from 'lucide-react';

export type CollectionTab = 'all' | 'featured' | 'popular' | 'new' | 'offers';

interface Filters {
  name: string;
  category: string;
  shopId: string;
  brand: string;
  color: string;
  maxPrice: string;
  availableOnly: boolean;
  collection: CollectionTab;
}

const EMPTY_FILTERS: Filters = {
  name: '',
  category: '',
  shopId: '',
  brand: '',
  color: '',
  maxPrice: '',
  availableOnly: false,
  collection: 'all',
};


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
    // Search query matches name, brand, or store name
    if (f.name) {
      const q = f.name.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchBrand = p.brand ? p.brand.toLowerCase().includes(q) : false;
      const matchShop = p.shopName.toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchShop) return false;
    }

    // Category match
    if (f.category && f.category !== 'All Categories' && !matchCategory(p.category, f.category)) {
      return false;
    }

    // Store match
    if (f.shopId && String(p.shopId) !== f.shopId) {
      return false;
    }

    // Brand match
    if (f.brand && (!p.brand || !p.brand.toLowerCase().includes(f.brand.toLowerCase().trim()))) {
      return false;
    }

    // Color match
    if (f.color && (!p.color || !p.color.toLowerCase().includes(f.color.toLowerCase().trim()))) {
      return false;
    }

    // Max Price match
    if (f.maxPrice && (p.effectivePrice ?? p.price) > Number(f.maxPrice)) {
      return false;
    }

    // Availability match
    if (f.availableOnly && !p.available) {
      return false;
    }

    // Curated Demonstration Collections
    if (f.collection === 'offers') {
      if (!p.discountPrice || p.discountPrice >= p.price) return false;
    } else if (f.collection === 'featured') {
      // Handpicked flagship anchors and top highlights
      const isTopBrand = ['Zara', 'H&M', 'Nike', 'Sephora', 'Apple', 'Titan', 'Starbucks', 'Hamleys'].includes(p.brand || '');
      if (!isTopBrand && p.id % 4 !== 0) return false;
    } else if (f.collection === 'popular') {
      // Popular items based on demand
      if (p.id % 3 !== 0 && (p.effectivePrice < 1000 || p.effectivePrice > 12000)) return false;
    } else if (f.collection === 'new') {
      // New arrivals
      if (p.id % 5 !== 1 && p.id % 7 !== 2) return false;
    }

    return true;
  });
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse initial filters from URL
  const initialCategory = normalizeCategoryName(searchParams.get('category'));
  const initialName = searchParams.get('name') || '';
  const initialBrand = searchParams.get('brand') || '';
  const initialShopId = searchParams.get('shopId') || searchParams.get('store') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';
  const initialCollection = (searchParams.get('collection') as CollectionTab) || 'all';
  const initialAvailable = searchParams.get('available') === 'true';

  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    category: initialCategory,
    name: initialName,
    brand: initialBrand,
    shopId: initialShopId,
    maxPrice: initialMaxPrice,
    availableOnly: initialAvailable,
    collection: initialCollection,
  });

  const [results, setResults] = useState<ProductResponse[] | null>(() =>
    filterFallbackProducts({
      ...EMPTY_FILTERS,
      category: initialCategory,
      name: initialName,
      brand: initialBrand,
      shopId: initialShopId,
      maxPrice: initialMaxPrice,
      availableOnly: initialAvailable,
      collection: initialCollection,
    }),
  );

  const [recommended, setRecommended] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'name-asc'>('relevance');
  const [comparedIds, setComparedIds] = useState<number[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Dynamic category product counts for visitor catalogue
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All Categories': FALLBACK_PRODUCTS.length };
    MALL_CATEGORIES.forEach((c) => {
      counts[c.name] = FALLBACK_PRODUCTS.filter((p) => matchCategory(p.category, c.name)).length;
    });
    return counts;
  }, []);

  // Unique brands list for filter dropdown
  const uniqueBrands = useMemo(() => {
    const set = new Set<string>();
    FALLBACK_PRODUCTS.forEach((p) => {
      if (p.brand && p.brand.trim()) set.add(p.brand.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, []);

  // Sorted list of 30 mall stores for store filter dropdown
  const mallShops = useMemo(() => {
    return [...FALLBACK_SHOPS].sort((a, b) => a.name.localeCompare(b.name));
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
              shopId: f.shopId,
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
          // If live API returned, apply client-side collection filters if set
          let list = searchRes;
          if (f.collection === 'offers') {
            list = list.filter((p) => p.discountPrice != null && p.discountPrice < p.price);
          }
          setResults(list);
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

  // Synchronize when URL search parameters change
  useEffect(() => {
    const rawCategory = searchParams.get('category') || '';
    const categoryParam = normalizeCategoryName(rawCategory);
    const nameParam = searchParams.get('name') || '';
    const brandParam = searchParams.get('brand') || '';
    const shopIdParam = searchParams.get('shopId') || searchParams.get('store') || '';
    const maxPriceParam = searchParams.get('maxPrice') || '';
    const collectionParam = (searchParams.get('collection') as CollectionTab) || 'all';
    const availableParam = searchParams.get('available') === 'true';

    const newFilters: Filters = {
      ...EMPTY_FILTERS,
      category: categoryParam,
      name: nameParam,
      brand: brandParam,
      shopId: shopIdParam,
      maxPrice: maxPriceParam,
      availableOnly: availableParam,
      collection: collectionParam,
    };
    setFilters(newFilters);
    void runSearch(newFilters);
  }, [searchParams, runSearch]);

  const updateUrlFilters = (updated: Partial<Filters>) => {
    const merged = { ...filters, ...updated };
    const next = new URLSearchParams();
    if (merged.name.trim()) next.set('name', merged.name.trim());
    if (merged.category && merged.category !== 'All Categories') next.set('category', merged.category);
    if (merged.shopId) next.set('shopId', merged.shopId);
    if (merged.brand.trim()) next.set('brand', merged.brand.trim());
    if (merged.maxPrice) next.set('maxPrice', merged.maxPrice);
    if (merged.availableOnly) next.set('available', 'true');
    if (merged.collection && merged.collection !== 'all') next.set('collection', merged.collection);
    setSearchParams(next);
  };

  const handleCategorySelect = (catName: string) => {
    if (catName === 'All Categories' || (filters.category && matchCategory(filters.category, catName))) {
      updateUrlFilters({ category: '' });
    } else {
      updateUrlFilters({ category: catName });
    }
  };

  const handleCollectionTabSelect = (tab: CollectionTab) => {
    updateUrlFilters({ collection: tab });
  };

  const handleClearSearch = () => {
    updateUrlFilters({ name: '' });
  };

  const handleResetAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const removeSingleFilter = (key: keyof Filters) => {
    if (key === 'category') updateUrlFilters({ category: '' });
    else if (key === 'shopId') updateUrlFilters({ shopId: '' });
    else if (key === 'brand') updateUrlFilters({ brand: '' });
    else if (key === 'maxPrice') updateUrlFilters({ maxPrice: '' });
    else if (key === 'name') updateUrlFilters({ name: '' });
    else if (key === 'availableOnly') updateUrlFilters({ availableOnly: false });
    else if (key === 'collection') updateUrlFilters({ collection: 'all' });
  };

  const sortedResults = useMemo(() => {
    if (!results) return [];
    let list = [...results];
    if (sortBy === 'price-asc') {
      return list.sort((a, b) => a.effectivePrice - b.effectivePrice);
    } else if (sortBy === 'price-desc') {
      return list.sort((a, b) => b.effectivePrice - a.effectivePrice);
    } else if (sortBy === 'name-asc') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [results, sortBy]);

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    filters.category ||
    filters.shopId ||
    filters.brand ||
    filters.maxPrice ||
    filters.name ||
    filters.availableOnly ||
    filters.collection !== 'all',
  );

  const activeStoreName = useMemo(() => {
    if (!filters.shopId) return null;
    const s = FALLBACK_SHOPS.find((sh) => String(sh.id) === filters.shopId);
    return s ? s.name : `Store #${filters.shopId}`;
  }, [filters.shopId]);

  return (
    <div className="stack" style={{ gap: 24 }}>
      {/* =========================================================================
          A. CATALOGUE HEADER
          ========================================================================= */}
      <div
        className="card"
        style={{
          padding: '28px 32px',
          background: 'linear-gradient(135deg, #F5F3EE 0%, #FFFFFF 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center' }}>
          <div
            className="badge badge-gold"
            style={{
              marginBottom: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              padding: '4px 12px',
            }}
          >
            <Tag size={13} /> Nexus Ahmedabad One · Vastrapur
          </div>
          <h1
            style={{
              fontSize: 'clamp(26px, 4vw, 36px)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 10px 0',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
            }}
          >
            Discover the Mall
          </h1>
          <p
            className="muted"
            style={{
              fontSize: 'clamp(14px, 2vw, 16px)',
              lineHeight: 1.6,
              margin: '0 auto 24px',
              maxWidth: 680,
            }}
          >
            Explore in-store retail collections, real-time inventory, and special promotions across 30 premier brands and outlets in Ahmedabad.
          </p>

          {/* Prominent Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateUrlFilters({ name: filters.name });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#FFFFFF',
              border: '2px solid var(--brand-primary)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 8px 6px 18px',
              boxShadow: 'var(--shadow-md)',
              maxWidth: 640,
              margin: '0 auto',
            }}
          >
            <Search size={20} style={{ color: 'var(--brand-primary)', marginRight: 10, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search products by name, brand (e.g. Nike, Zara), or store..."
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                fontSize: 15,
                color: 'var(--text-primary)',
                padding: '6px 0',
              }}
            />
            {filters.name && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 6,
                  display: 'flex',
                  alignItems: 'center',
                  marginRight: 4,
                }}
                title="Clear search"
              >
                <X size={18} />
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '8px 22px',
                fontSize: 14,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Offline / Demonstration Mode Banner */}
      {isFallbackMode && (
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            color: '#475569',
            padding: '10px 18px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Info size={16} color="#64748B" style={{ flexShrink: 0 }} />
          <span>
            <strong>Prototype Curated Demonstration Mode:</strong> Displaying all 211 authoritative products mapped to stores across Nexus Ahmedabad One. Backend inventory service is operating locally or in offline mode.
          </span>
        </div>
      )}

      {/* =========================================================================
          B. CATEGORY NAVIGATION RIBBON
          ========================================================================= */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Explore Categories
            </span>
            <span className="badge badge-sm" style={{ fontSize: 11 }}>
              16 Departments
            </span>
          </div>
          {filters.category && filters.category !== 'All Categories' && (
            <button
              onClick={() => handleCategorySelect('All Categories')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brand-primary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>Clear category ({normalizeCategoryName(filters.category)})</span>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="category-ribbon-scroll">
          <button
            type="button"
            onClick={() => handleCategorySelect('All Categories')}
            style={{
              borderRadius: 24,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: !filters.category || filters.category === 'All Categories'
                ? '1px solid var(--brand-primary)'
                : '1px solid var(--border-color)',
              background: !filters.category || filters.category === 'All Categories'
                ? 'var(--brand-primary)'
                : 'var(--bg-surface)',
              color: !filters.category || filters.category === 'All Categories'
                ? '#FFFFFF'
                : 'var(--text-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            <span>🛍️</span>
            <span>All Categories</span>
            <span style={{ opacity: 0.85, fontSize: 11, fontWeight: 700 }}>
              ({FALLBACK_PRODUCTS.length})
            </span>
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
                  borderRadius: 24,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  whiteSpace: 'nowrap',
                  border: isSelected
                    ? '1px solid var(--brand-primary)'
                    : '1px solid var(--border-color)',
                  background: isSelected
                    ? 'var(--brand-primary)'
                    : 'var(--bg-surface)',
                  color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? 'var(--shadow-xs)' : 'none',
                  flexShrink: 0,
                }}
              >
                <span>{c.icon}</span>
                <span>{c.name}</span>
                <span
                  style={{
                    opacity: isSelected ? 0.95 : 0.65,
                    fontSize: 11,
                    fontWeight: 600,
                    background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--bg-main)',
                    padding: '2px 6px',
                    borderRadius: 10,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          C. FEATURED SHOPPING SECTIONS (CURATED DEMONSTRATION COLLECTIONS)
          ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 16px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginRight: 4 }}>
            Collections:
          </span>

          <button
            type="button"
            className={`btn btn-xs ${filters.collection === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleCollectionTabSelect('all')}
            style={{ borderRadius: 16, padding: '5px 12px' }}
          >
            All Items ({FALLBACK_PRODUCTS.length})
          </button>

          <button
            type="button"
            className={`btn btn-xs ${filters.collection === 'featured' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleCollectionTabSelect('featured')}
            style={{ borderRadius: 16, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Sparkle size={12} />
            Featured Picks
          </button>

          <button
            type="button"
            className={`btn btn-xs ${filters.collection === 'popular' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleCollectionTabSelect('popular')}
            style={{ borderRadius: 16, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Flame size={12} color={filters.collection === 'popular' ? '#fff' : '#f97316'} />
            Popular & Bestsellers
          </button>

          <button
            type="button"
            className={`btn btn-xs ${filters.collection === 'new' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleCollectionTabSelect('new')}
            style={{ borderRadius: 16, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Award size={12} />
            New Arrivals
          </button>

          <button
            type="button"
            className={`btn btn-xs ${filters.collection === 'offers' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => handleCollectionTabSelect('offers')}
            style={{ borderRadius: 16, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Tag size={12} />
            Special Offers & Deals
          </button>
        </div>

        <div className="row" style={{ gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <SlidersHorizontal size={13} />
            <span>{showAdvancedFilters ? 'Hide Filters' : 'Filter & Refine'}</span>
          </button>

          <div className="row" style={{ gap: 6 }}>
            <span className="muted" style={{ fontSize: 12, fontWeight: 500 }}>
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'relevance' | 'price-asc' | 'price-desc' | 'name-asc')}
              style={{
                width: 'auto',
                padding: '4px 10px',
                fontSize: 12,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface)',
              }}
            >
              <option value="relevance">Featured & Relevant</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Product Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MULTI-ATTRIBUTE FILTER PANEL (Store, Brand, Price, In-Stock)
          ========================================================================= */}
      {showAdvancedFilters && (
        <div
          className="card"
          style={{
            padding: '20px 24px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={16} color="var(--brand-primary)" />
              <strong style={{ fontSize: 14 }}>Refine Catalogue Inventory</strong>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={handleResetAllFilters}
                style={{ fontSize: 12 }}
              >
                <RotateCcw size={12} /> Reset All
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 14,
              alignItems: 'flex-end',
            }}
          >
            {/* Store / Retailer Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                Filter by Store (30 Outlets)
              </label>
              <select
                value={filters.shopId}
                onChange={(e) => updateUrlFilters({ shopId: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
              >
                <option value="">All Mall Stores (30)</option>
                {mallShops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Floor {s.floorNumber === -1 ? 'LG' : s.floorNumber === 0 ? 'G' : `${s.floorNumber}F`})
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                Filter by Brand
              </label>
              <select
                value={filters.brand}
                onChange={(e) => updateUrlFilters({ brand: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
              >
                <option value="">All Brands</option>
                {uniqueBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Budget / Price Filter */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                Max Price (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={filters.maxPrice}
                onChange={(e) => updateUrlFilters({ maxPrice: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
              />
            </div>

            {/* Availability Checkbox */}
            <div style={{ paddingBottom: 8 }}>
              <label className="row" style={{ gap: 8, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={filters.availableOnly}
                  onChange={(e) => updateUrlFilters({ availableOnly: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: 'var(--brand-primary)' }}
                />
                <span style={{ fontWeight: 600 }}>In-Stock Items Only</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ACTIVE FILTER REMOVAL CHIPS BAR
          ========================================================================= */}
      {hasActiveFilters && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            padding: '10px 16px',
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Active Filters:
          </span>

          {filters.category && (
            <span className="filter-chip">
              <span>Category: <strong>{normalizeCategoryName(filters.category)}</strong></span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => removeSingleFilter('category')}
                title="Remove category filter"
              >
                <X size={13} />
              </button>
            </span>
          )}

          {activeStoreName && (
            <span className="filter-chip">
              <span>Store: <strong>{activeStoreName}</strong></span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => removeSingleFilter('shopId')}
                title="Remove store filter"
              >
                <X size={13} />
              </button>
            </span>
          )}

          {filters.brand && (
            <span className="filter-chip">
              <span>Brand: <strong>{filters.brand}</strong></span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => removeSingleFilter('brand')}
                title="Remove brand filter"
              >
                <X size={13} />
              </button>
            </span>
          )}

          {filters.collection !== 'all' && (
            <span className="filter-chip">
              <span>Collection: <strong>{filters.collection}</strong></span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => removeSingleFilter('collection')}
                title="Remove collection filter"
              >
                <X size={13} />
              </button>
            </span>
          )}

          {filters.name && (
            <span className="filter-chip">
              <span>Search: "<strong>{filters.name}</strong>"</span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => removeSingleFilter('name')}
                title="Clear search"
              >
                <X size={13} />
              </button>
            </span>
          )}

          {filters.maxPrice && (
            <span className="filter-chip">
              <span>Max Price: <strong>₹{Number(filters.maxPrice).toLocaleString('en-IN')}</strong></span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => removeSingleFilter('maxPrice')}
                title="Remove price limit"
              >
                <X size={13} />
              </button>
            </span>
          )}

          {filters.availableOnly && (
            <span className="filter-chip">
              <span><strong>In Stock Only</strong></span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => removeSingleFilter('availableOnly')}
                title="Remove in-stock filter"
              >
                <X size={13} />
              </button>
            </span>
          )}

          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={handleResetAllFilters}
            style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)' }}
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* =========================================================================
          MACHINE LEARNING RECOMMENDATIONS (if category or brand is active)
          ========================================================================= */}
      {recommended && recommended.products && recommended.products.length > 0 && (
        <div
          style={{
            background: 'var(--bg-brand-light)',
            border: '1px solid rgba(36, 88, 74, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '20px 24px',
          }}
        >
          <div className="row-between" style={{ marginBottom: 14 }}>
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
            <span className="badge badge-gold" style={{ fontSize: 11 }}>Source: {recommended.source}</span>
          </div>

          <div className="grid-cards">
            {recommended.products.slice(0, 4).map((p) => (
              <ProductCard key={`rec-${p.id}`} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          RESULTS COUNT & HEADER
          ========================================================================= */}
      <div className="row-between" style={{ padding: '0 4px' }}>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          {loading ? (
            <span>Updating catalogue...</span>
          ) : (
            <span>
              Showing <strong style={{ color: 'var(--text-primary)', fontSize: 15 }}>{sortedResults.length}</strong>{' '}
              {sortedResults.length === 1 ? 'product' : 'products'}
              {filters.category && filters.category !== 'All Categories' && (
                <span>
                  {' '}in <strong style={{ color: 'var(--brand-primary)' }}>{normalizeCategoryName(filters.category)}</strong>
                </span>
              )}
              {activeStoreName && <span> at <strong>{activeStoreName}</strong></span>}
              {filters.brand && <span> by <strong>{filters.brand}</strong></span>}
              {filters.name && <span> matching "<strong>{filters.name}</strong>"</span>}
            </span>
          )}
        </div>
      </div>

      {/* =========================================================================
          D. PRODUCT GRID & EMPTY STATES
          ========================================================================= */}
      {error && <div className="card error-text">{error}</div>}

      {!loading && sortedResults.length === 0 && (
        <div className="card empty-state" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-surface)' }}>
          <Search size={44} style={{ margin: '0 auto 16px', opacity: 0.35, color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: 19, marginBottom: 8, color: 'var(--text-primary)' }}>
            No products match your exact criteria
          </h3>
          <p className="muted" style={{ marginTop: 0, marginBottom: 24, maxWidth: 520, margin: '0 auto 24px', lineHeight: 1.5 }}>
            {filters.category && filters.category !== 'All Categories' ? (
              <span>
                No items found in category <strong>"{normalizeCategoryName(filters.category)}"</strong> with the current filters.
                Try adjusting the price range or resetting store and brand filters.
              </span>
            ) : (
              <span>No products found matching your search. Try resetting filters to explore the full 211-product mall inventory.</span>
            )}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {filters.category && filters.category !== 'All Categories' && (
              <button
                className="btn btn-secondary"
                onClick={() => handleCategorySelect('All Categories')}
              >
                Clear Category Filter
              </button>
            )}
            <button className="btn btn-primary" onClick={handleResetAllFilters}>
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

      {/* =========================================================================
          COMPARISON FLOATING BAR & MODAL
          ========================================================================= */}
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
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
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
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, background: '#F8FAFC' }}>Store</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} style={{ padding: '10px 12px' }}>
                        {p.shopName} (Floor {p.shopFloorNumber === -1 ? 'LG' : p.shopFloorNumber === 0 ? 'G' : `${p.shopFloorNumber}F`})
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, background: '#F8FAFC' }}>Category</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} style={{ padding: '10px 12px' }}>
                        {p.category}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, background: '#F8FAFC' }}>Brand</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} style={{ padding: '10px 12px' }}>
                        {p.brand || '—'}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, background: '#F8FAFC' }}>Color</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} style={{ padding: '10px 12px' }}>
                        {p.color || '—'}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, background: '#F8FAFC' }}>Availability</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} style={{ padding: '10px 12px' }}>
                        {p.available ? (
                          <span style={{ color: '#16A34A', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={14} /> In Stock ({p.stockQuantity ?? 15} units)
                          </span>
                        ) : (
                          <span style={{ color: '#DC2626' }}>Out of Stock</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  {comparedProducts.some((p) => p.specifications) && (
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, background: '#F8FAFC' }}>Specifications</td>
                      {comparedProducts.map((p) => {
                        let parsed: Record<string, string> | null = null;
                        if (p.specifications) {
                          try {
                            parsed = JSON.parse(p.specifications);
                          } catch {
                            parsed = null;
                          }
                        }
                        return (
                          <td key={p.id} style={{ padding: '10px 12px', fontSize: 11 }}>
                            {parsed ? (
                              <ul style={{ margin: 0, paddingLeft: 14 }}>
                                {Object.entries(parsed).map(([k, v]) => (
                                  <li key={k}>
                                    <strong>{k}:</strong> {v}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              '—'
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )}
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
