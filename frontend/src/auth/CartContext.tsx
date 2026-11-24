import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { CartResponse } from '../api/types';
import { useAuth } from './AuthContext';

interface CartContextValue {
  cart: CartResponse | null;
  refresh: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartResponse | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    try {
      const res = await api.get<CartResponse>('/api/me/cart');
      setCart(res);
    } catch {
      setCart(null);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addToCart = useCallback(
    async (productId: number, quantity = 1) => {
      const res = await api.post<CartResponse>('/api/me/cart/items', { productId, quantity });
      setCart(res);
    },
    [],
  );

  const updateQuantity = useCallback(async (productId: number, quantity: number) => {
    const res = await api.put<CartResponse>(`/api/me/cart/items/${productId}`, { quantity });
    setCart(res);
  }, []);

  const removeFromCart = useCallback(async (productId: number) => {
    const res = await api.delete<CartResponse>(`/api/me/cart/items/${productId}`);
    setCart(res);
  }, []);

  const clearCart = useCallback(async () => {
    await api.delete('/api/me/cart');
    setCart(null);
    await refresh();
  }, [refresh]);

  return (
    <CartContext.Provider value={{ cart, refresh, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
