import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { CartProvider } from './auth/CartContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import OffersPage from './pages/OffersPage';
import FloorMapPage from './pages/FloorMapPage';
import RetailerPage from './pages/RetailerPage';
import MallDirectoryPage from './pages/MallDirectoryPage';
import ShopDetailPage from './pages/ShopDetailPage';
import ProductComparePage from './pages/ProductComparePage';
import CheckoutPage from './pages/CheckoutPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import type { ReactNode } from 'react';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRetailer({ children }: { children: ReactNode }) {
  const { hasRole } = useAuth();
  if (!hasRole('ADMIN') && !hasRole('RETAILER')) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/directory" element={<MallDirectoryPage />} />
              <Route path="/shops/:id" element={<ShopDetailPage />} />
              <Route path="/compare" element={<ProductComparePage />} />
              <Route path="/map" element={<FloorMapPage />} />
              <Route path="/offers" element={<OffersPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route
                path="/checkout"
                element={
                  <RequireAuth>
                    <CheckoutPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cart"
                element={
                  <RequireAuth>
                    <CartPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <RequireAuth>
                    <WishlistPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/orders"
                element={
                  <RequireAuth>
                    <OrdersPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <RequireAuth>
                    <OrderDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/retailer"
                element={
                  <RequireRetailer>
                    <RetailerPage />
                  </RequireRetailer>
                }
              />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
