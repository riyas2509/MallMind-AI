import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { WishlistResponse } from '../api/types';
import { useCart } from '../auth/CartContext';
import { getProductImage } from '../utils/images';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistResponse | null>(null);
  const { addToCart } = useCart();
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  function load() {
    api.get<WishlistResponse>('/api/me/wishlist').then(setWishlist).catch(() => null);
  }

  useEffect(load, []);

  async function remove(productId: number) {
    const res = await api.delete<WishlistResponse>(`/api/me/wishlist/items/${productId}`);
    setWishlist(res);
  }

  const handleAddToCart = async (productId: number) => {
    await addToCart(productId);
    setAddedIds((prev) => new Set(prev).add(productId));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }, 1800);
  };

  if (!wishlist || wishlist.items.length === 0) {
    return (
      <div className="stack" style={{ textAlign: 'center', padding: '60px 20px', gap: 20 }}>
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}
        >
          <Heart size={34} />
        </div>
        <div>
          <h2>Your Wishlist is Empty</h2>
          <p className="muted" style={{ maxWidth: 400, margin: '8px auto 20px' }}>
            Save products you're interested in while browsing the mall catalogue to easily find them later.
          </p>
          <Link to="/products" className="btn btn-lg">
            Explore Products <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div>
        <div className="badge badge-gold" style={{ marginBottom: 6 }}>
          <Heart size={13} fill="#ef4444" color="#ef4444" /> Saved Items
        </div>
        <h1>Your Wishlist</h1>
        <p className="muted">
          {wishlist.items.length} items saved for in-mall visit or purchase.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {wishlist.items.map((item) => {
          const imageUrl = getProductImage(item.product.id, item.product.category);
          const isAdded = addedIds.has(item.product.id);
          return (
            <div key={item.wishlistItemId} className="card" style={{ display: 'flex', gap: 16, padding: 16 }}>
              <Link to={`/products/${item.product.id}`} style={{ flexShrink: 0 }}>
                <img
                  src={imageUrl}
                  alt={item.product.name}
                  style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                />
              </Link>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: 4 }}>
                <Link
                  to={`/products/${item.product.id}`}
                  style={{ textDecoration: 'none', color: 'inherit', fontWeight: 700, fontSize: 15 }}
                >
                  {item.product.name}
                </Link>
                <div className="muted" style={{ fontSize: 12 }}>
                  {item.product.shopName}
                </div>
                <div style={{ fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                  ₹{item.product.effectivePrice.toLocaleString('en-IN')}
                </div>

                <div className="row" style={{ marginTop: 'auto', gap: 8, paddingTop: 8 }}>
                  <button
                    className="btn btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => handleAddToCart(item.product.id)}
                  >
                    <ShoppingBag size={13} /> {isAdded ? 'Added' : 'Add to Bag'}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => remove(item.product.id)}
                    title="Remove item"
                  >
                    <Trash2 size={14} style={{ color: 'var(--status-error)' }} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
