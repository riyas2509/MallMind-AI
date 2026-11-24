import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ProductResponse } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../auth/CartContext';
import { api } from '../api/client';
import { getProductImage } from '../utils/images';
import { ShoppingBag, Heart, MapPin, Check, Star } from 'lucide-react';

const FLOOR_SHORT: Record<number, string> = {
  [-1]: 'LG',
  0: 'G',
  1: '1F',
  2: '2F',
  3: '3F',
};

export default function ProductCard({ product }: { product: ProductResponse }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const discounted = product.discountPrice != null && product.discountPrice < product.price;
  const discountPercent = discounted
    ? Math.round(((product.price - (product.discountPrice ?? product.price)) / product.price) * 100)
    : 0;

  const imageUrl = product.imageUrl || getProductImage(product.id, product.category);
  const rating = (4.4 + ((product.id * 7) % 6) / 10).toFixed(1);
  const reviewsCount = 18 + ((product.id * 13) % 85);
  const floorTag = FLOOR_SHORT[product.shopFloorNumber] || `F${product.shopFloorNumber}`;

  const handleAddToCart = async () => {
    if (!product.available) return;
    await addToCart(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || wishlistLoading) return;
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await api.delete(`/api/me/wishlist/items/${product.id}`);
        setInWishlist(false);
      } else {
        await api.post('/api/me/wishlist/items', { productId: product.id });
        setInWishlist(true);
      }
    } catch {
      // Ignored
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="pro-card">
      <div className="pro-card-image-wrap">
        <Link to={`/products/${product.id}`}>
          <img src={imageUrl} alt={product.name} className="pro-card-image" loading="lazy" />
        </Link>

        {discounted && (
          <div className="pro-card-badge">
            <span className="badge badge-gold">{discountPercent}% OFF</span>
          </div>
        )}

        {!product.available && (
          <div className="pro-card-badge" style={{ top: discounted ? '38px' : '10px' }}>
            <span className="badge badge-danger">Out of Stock</span>
          </div>
        )}

        {user && (
          <button
            className={`pro-card-wishlist ${inWishlist ? 'active' : ''}`}
            onClick={handleToggleWishlist}
            title={inWishlist ? 'Remove from Wishlist' : 'Save to Wishlist'}
            aria-label="Wishlist"
          >
            <Heart size={14} fill={inWishlist ? '#C74747' : 'none'} color={inWishlist ? '#C74747' : '#697580'} />
          </button>
        )}
      </div>

      <div className="pro-card-body">
        <div className="row-between">
          <Link
            to={`/map?floor=${product.shopFloorNumber}&toLabel=${encodeURIComponent(product.shopName)}`}
            className="pro-card-shop"
          >
            <MapPin size={11} style={{ color: 'var(--brand-primary)' }} />
            <span>{product.shopName} · Floor {floorTag}</span>
          </Link>
          <div className="row" style={{ gap: 3, fontSize: 11, color: 'var(--brand-accent)', fontWeight: 600 }}>
            <Star size={11} fill="var(--brand-accent)" color="var(--brand-accent)" />
            <span>{rating}</span>
            <span style={{ color: 'var(--text-muted)' }}>({reviewsCount})</span>
          </div>
        </div>

        <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className="pro-card-title" title={product.name}>
            {product.name}
          </h3>
        </Link>

        {product.brand && (
          <div className="muted" style={{ fontSize: 11 }}>
            Brand: <strong style={{ color: 'var(--text-secondary)' }}>{product.brand}</strong>
            {product.color && <span> · {product.color}</span>}
          </div>
        )}

        <div className="pro-card-price-row">
          <span className="pro-price-current">₹{product.effectivePrice.toLocaleString('en-IN')}</span>
          {discounted && (
            <span className="pro-price-old">₹{product.price.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>

      <div className="pro-card-footer">
        {user ? (
          <button
            className={`btn btn-sm ${added ? 'btn-secondary' : 'btn-primary'}`}
            style={{ width: '100%', fontSize: 12, padding: '7px 12px' }}
            disabled={!product.available}
            onClick={handleAddToCart}
          >
            {added ? (
              <>
                <Check size={13} style={{ color: 'var(--color-success)' }} /> Added to Bag
              </>
            ) : (
              <>
                <ShoppingBag size={13} /> Add to Bag
              </>
            )}
          </button>
        ) : (
          <Link
            to={`/products/${product.id}`}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', fontSize: 12, padding: '7px 12px' }}
          >
            View Details
          </Link>
        )}
      </div>
    </div>
  );
}
