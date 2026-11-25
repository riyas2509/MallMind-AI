import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, HttpError } from '../api/client';
import type { ProductResponse, ShopResponse } from '../api/types';
import { FALLBACK_PRODUCTS, FALLBACK_SHOPS } from '../data/fallbackData';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../auth/CartContext';
import { getProductImage, getShopImage } from '../utils/images';
import {
  ArrowLeft,
  ShoppingBag,
  Heart,
  Compass,
  Check,
  Star,
  Store,
} from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<ProductResponse | null>(() => {
    return FALLBACK_PRODUCTS.find((p) => String(p.id) === id) || null;
  });
  const [shop, setShop] = useState<ShopResponse | null>(() => {
    const prod = FALLBACK_PRODUCTS.find((p) => String(p.id) === id);
    return prod ? FALLBACK_SHOPS.find((s) => s.id === prod.shopId) || null : null;
  });
  const [similar, setSimilar] = useState<ProductResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setError(null);
    api
      .get<ProductResponse>(`/api/products/${id}`)
      .then((p) => {
        setProduct(p);
        return api.get<ShopResponse>(`/api/shops/${p.shopId}`);
      })
      .then(setShop)
      .catch((e) => {
        // Check fallback products
        const fallbackProd = FALLBACK_PRODUCTS.find((p) => String(p.id) === id);
        if (fallbackProd) {
          setProduct(fallbackProd);
          const fallbackShop = FALLBACK_SHOPS.find((s) => s.id === fallbackProd.shopId) || null;
          setShop(fallbackShop);
        } else {
          setError(e instanceof HttpError ? e.message : 'Product not found.');
        }
      });

    api
      .get<ProductResponse[]>(`/api/products/${id}/similar`)
      .then((data) => {
        if (Array.isArray(data)) setSimilar(data);
      })
      .catch(() => {
        // Similar fallback products in same category
        const currentProd = FALLBACK_PRODUCTS.find((p) => String(p.id) === id);
        if (currentProd) {
          setSimilar(FALLBACK_PRODUCTS.filter((p) => p.category === currentProd.category && p.id !== currentProd.id).slice(0, 4));
        } else {
          setSimilar([]);
        }
      });
  }, [id]);

  async function handleWishlist() {
    if (!product) return;
    try {
      await api.post('/api/me/wishlist/items', { productId: product.id });
      setWishlisted(true);
    } catch {
      setError('Could not add to wishlist.');
    }
  }

  const handleAddToCart = async () => {
    if (!product || !product.available) return;
    await addToCart(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (error) return <div className="card error-text" style={{ padding: 24 }}>{error}</div>;
  if (!product) return <div className="card muted" style={{ padding: 40, textAlign: 'center' }}>Loading product details...</div>;

  const discounted = product.discountPrice != null && product.discountPrice < product.price;
  const discountPercent = discounted
    ? Math.round(((product.price - (product.discountPrice ?? product.price)) / product.price) * 100)
    : 0;

  const imageUrl = product.imageUrl || getProductImage(product.id, product.category);
  const rating = (4.5 + ((product.id * 5) % 5) / 10).toFixed(1);

  return (
    <div className="stack" style={{ gap: 32 }}>
      {/* Breadcrumb / Back button */}
      <div className="row-between">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(-1)}
          style={{ width: 'fit-content' }}
        >
          <ArrowLeft size={16} /> Back to Products
        </button>
        <span className="muted" style={{ fontSize: 13 }}>
          Home / {product.category} / <strong style={{ color: 'var(--text-main)' }}>{product.name}</strong>
        </span>
      </div>

      {/* Product Hero Details Grid */}
      <div
        className="card"
        style={{
          padding: 32,
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 460px) 1fr',
          gap: 40,
        }}
      >
        {/* Left: Product Image Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              height: 420,
            }}
          >
            <img
              src={imageUrl}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {discounted && (
              <div style={{ position: 'absolute', top: 14, left: 14 }}>
                <span className="badge badge-gold" style={{ fontSize: 13, padding: '4px 12px' }}>
                  {discountPercent}% OFF
                </span>
              </div>
            )}
            {!product.available && (
              <div style={{ position: 'absolute', top: 14, right: 14 }}>
                <span className="badge badge-warn" style={{ fontSize: 13, padding: '4px 12px' }}>
                  Out of Stock
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Attributes & CTAs */}
        <div className="stack" style={{ gap: 20 }}>
          <div>
            <div className="row" style={{ gap: 8, marginBottom: 8 }}>
              <Link to={`/products?category=${encodeURIComponent(product.category)}`} style={{ textDecoration: 'none' }}>
                <span className="badge">{product.category}</span>
              </Link>
              {product.brand && (
                <span className="badge" style={{ background: 'var(--bg-main)', color: 'var(--text-secondary)' }}>
                  {product.brand}
                </span>
              )}
              <div className="row" style={{ gap: 4, marginLeft: 'auto', color: '#f59e0b', fontSize: 13, fontWeight: 700 }}>
                <Star size={14} fill="#f59e0b" />
                <span>{rating} Rating</span>
              </div>
            </div>

            <h1 style={{ fontSize: 28, lineHeight: 1.25, marginBottom: 12 }}>{product.name}</h1>

            {/* Shop location indicator */}
            <div
              className="row"
              style={{
                gap: 8,
                padding: '8px 14px',
                background: 'var(--primary-light)',
                borderRadius: 'var(--radius-sm)',
                width: 'fit-content',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--primary)',
              }}
            >
              <Store size={15} />
              <span>Available at {product.shopName} · Floor {product.shopFloorNumber}</span>
            </div>
          </div>

          {/* Pricing */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="row" style={{ gap: 12, alignItems: 'baseline' }}>
              <span style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>
                ₹{product.effectivePrice.toLocaleString('en-IN')}
              </span>
              {discounted && (
                <>
                  <span style={{ fontSize: 18, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  <span className="badge badge-success">
                    Save ₹{(product.price - product.effectivePrice).toLocaleString('en-IN')}
                  </span>
                </>
              )}
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              Includes all local taxes · In-store pickup available today
            </div>
          </div>

          {/* Actions */}
          <div className="stack" style={{ gap: 12 }}>
            <div className="row" style={{ gap: 12 }}>
              {user ? (
                <button
                  className="btn btn-lg"
                  style={{ flex: 1 }}
                  disabled={!product.available}
                  onClick={handleAddToCart}
                >
                  {added ? (
                    <>
                      <Check size={18} /> Added to Shopping Bag
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} /> Add to Bag
                    </>
                  )}
                </button>
              ) : (
                <Link to="/login" className="btn btn-lg" style={{ flex: 1 }}>
                  Sign in to Buy
                </Link>
              )}

              {user && (
                <button
                  className={`btn btn-secondary btn-lg ${wishlisted ? 'btn-ghost' : ''}`}
                  onClick={handleWishlist}
                  title="Save to Wishlist"
                >
                  <Heart size={18} fill={wishlisted ? '#ef4444' : 'none'} color={wishlisted ? '#ef4444' : 'currentColor'} />
                  <span>{wishlisted ? 'Saved' : 'Wishlist'}</span>
                </button>
              )}
            </div>

            {shop && (
              <Link
                to={`/map?floor=${shop.floorNumber}&toNodeId=${shop.navigationNodeId}&toLabel=${encodeURIComponent(shop.name)}`}
                className="btn btn-secondary btn-lg"
                style={{ width: '100%' }}
              >
                <Compass size={18} />
                Get Real-Time Walking Directions to {shop.name} (Floor {shop.floorNumber})
              </Link>
            )}
          </div>

          {/* Store highlight */}
          {shop && (
            <div
              className="row-between"
              style={{
                padding: '14px 18px',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-main)',
              }}
            >
              <div className="row" style={{ gap: 12 }}>
                <img
                  src={getShopImage(shop.name)}
                  alt={shop.name}
                  style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
                />
                <div>
                  <strong style={{ fontSize: 14 }}>{shop.name}</strong>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Floor {shop.floorNumber} · {shop.category}
                  </div>
                </div>
              </div>
              <Link
                to={`/map?floor=${shop.floorNumber}&toNodeId=${shop.navigationNodeId}&toLabel=${encodeURIComponent(shop.name)}`}
                className="btn btn-ghost btn-sm"
              >
                View on Map
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Similar & Recommended Products */}
      {similar.length > 0 && (
        <section className="stack" style={{ gap: 16 }}>
          <div className="row-between">
            <div>
              <h2>You Might Also Like</h2>
              <p className="muted">Similar styles and complementary picks from the same category.</p>
            </div>
            <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="btn btn-ghost btn-sm">
              See more in {product.category}
            </Link>
          </div>

          <div className="grid-cards">
            {similar.slice(0, 4).map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
