import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../auth/CartContext';
import VoiceWidget from './VoiceWidget';
import {
  Compass,
  ShoppingBag,
  Map,
  Tag,
  Heart,
  PackageCheck,
  Store,
  User,
  Clock,
  Phone,
  HelpCircle,
  Scale,
  Brain,
  Menu,
  X,
} from 'lucide-react';

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const { cart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="topnav">
        <div className="topnav-inner">
          {/* Brand Identity */}
          <NavLink to="/" className="brand-link" onClick={() => setMobileMenuOpen(false)}>
            <div className="brand-icon">
              <Compass size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="brand-name">MallMind</span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    background: 'var(--brand-accent-light)',
                    color: 'var(--brand-accent)',
                    padding: '1px 5px',
                    borderRadius: 3,
                    border: '1px solid rgba(181, 138, 82, 0.25)',
                  }}
                >
                  AI
                </span>
              </div>
              <span className="brand-sub">NEXUS AHMEDABAD ONE</span>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <nav className="nav-links desktop-nav">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
              Home
            </NavLink>
            <NavLink to="/directory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Store size={14} />
              Directory
            </NavLink>
            <NavLink to="/map" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Map size={14} />
              Mall Map
            </NavLink>
            <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <ShoppingBag size={14} />
              Products
            </NavLink>
            <NavLink to="/compare" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Scale size={14} />
              Compare
            </NavLink>
            <NavLink to="/offers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Tag size={14} />
              Offers
            </NavLink>
            <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Brain size={14} />
              ML Studio
            </NavLink>
            {user && (
              <NavLink to="/wishlist" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Heart size={14} />
                Wishlist
              </NavLink>
            )}
            {user && (
              <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <PackageCheck size={14} />
                Orders
              </NavLink>
            )}
            {(hasRole('ADMIN') || hasRole('RETAILER')) && (
              <NavLink to="/retailer" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Store size={14} />
                Retailer
              </NavLink>
            )}
          </nav>

          <div style={{ flex: 1 }} />

          {/* User & Bag Controls */}
          <div className="row" style={{ gap: 10 }}>
            {user && (
              <NavLink to="/cart" className="cart-button" aria-label="Shopping Bag">
                <ShoppingBag size={16} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Bag</span>
                {cart && cart.totalItemCount > 0 && (
                  <span className="cart-count">{cart.totalItemCount}</span>
                )}
              </NavLink>
            )}

            {user ? (
              <div className="row" style={{ gap: 8 }}>
                <div
                  className="row"
                  style={{
                    gap: 6,
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-brand-light)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--brand-primary)',
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: 'var(--brand-primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.fullName}</span>
                </div>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={logout}
                  style={{ fontSize: 12, color: 'var(--text-secondary)' }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="row" style={{ gap: 6 }}>
                <NavLink to="/login" className="btn btn-secondary btn-sm" style={{ padding: '6px 12px' }}>
                  <User size={13} /> Sign in
                </NavLink>
                <NavLink to="/register" className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>
                  Register
                </NavLink>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-ghost btn-sm mobile-toggle"
              aria-label="Toggle navigation menu"
              style={{ padding: '6px 8px', color: 'var(--text-primary)' }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-color)',
              padding: '16px 20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {[
              { to: '/', label: 'Home', icon: Compass },
              { to: '/directory', label: 'Mall Directory (30 Stores)', icon: Store },
              { to: '/map', label: 'Interactive Mall Map (5 Levels)', icon: Map },
              { to: '/products', label: 'In-Mall Catalogue', icon: ShoppingBag },
              { to: '/compare', label: 'Product Compare Matrix', icon: Scale },
              { to: '/offers', label: 'Promotions & Deals', icon: Tag },
              { to: '/admin', label: 'ML Studio & Telemetry', icon: Brain },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  style={{ padding: '10px 14px', fontSize: 14 }}
                  end={item.to === '/'}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            {user && (
              <>
                <div style={{ height: 1, background: 'var(--border-color)', margin: '6px 0' }} />
                <NavLink
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  style={{ padding: '10px 14px', fontSize: 14 }}
                >
                  <Heart size={16} /> Wishlist
                </NavLink>
                <NavLink
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  style={{ padding: '10px 14px', fontSize: 14 }}
                >
                  <PackageCheck size={16} /> Orders History
                </NavLink>
                {(hasRole('ADMIN') || hasRole('RETAILER')) && (
                  <NavLink
                    to="/retailer"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    style={{ padding: '10px 14px', fontSize: 14 }}
                  >
                    <Store size={16} /> Retailer Inventory Portal
                  </NavLink>
                )}
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="page">
        <Outlet />
      </main>

      {/* Professional Architectural Footer */}
      <footer className="pro-footer">
        <div className="pro-footer-inner">
          {/* Column 1: Mall Identity */}
          <div className="stack" style={{ gap: 12 }}>
            <div className="brand-link">
              <div className="brand-icon">
                <Compass size={18} />
              </div>
              <div>
                <span className="brand-name" style={{ fontSize: 17 }}>MallMind AI</span>
                <span className="brand-sub" style={{ fontSize: 9 }}>NEXUS AHMEDABAD ONE</span>
              </div>
            </div>
            <p className="muted" style={{ maxWidth: 360, lineHeight: 1.6, fontSize: 13 }}>
              Commercial indoor navigation and retail discovery system engineered for Nexus Ahmedabad One (Alpha One Mall), Vastrapur. Real-time Dijkstra graph wayfinding, 30 verified anchor stores, and trilingual voice assistance.
            </p>
            <div className="row" style={{ gap: 8, marginTop: 4 }}>
              <span className="badge badge-success">
                <Clock size={12} /> Open Today · 10:00 AM – 10:00 PM
              </span>
            </div>
          </div>

          {/* Column 2: Floor Directory */}
          <div className="stack" style={{ gap: 8 }}>
            <strong style={{ fontSize: 12, color: 'var(--text-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              FLOOR DIRECTORY
            </strong>
            <NavLink to="/directory?floor=-1" className="muted" style={{ textDecoration: 'none' }}>Lower Ground (LG)</NavLink>
            <NavLink to="/directory?floor=0" className="muted" style={{ textDecoration: 'none' }}>Ground Floor (Level 0)</NavLink>
            <NavLink to="/directory?floor=1" className="muted" style={{ textDecoration: 'none' }}>First Floor (Level 1)</NavLink>
            <NavLink to="/directory?floor=2" className="muted" style={{ textDecoration: 'none' }}>Second Floor (Level 2)</NavLink>
            <NavLink to="/directory?floor=3" className="muted" style={{ textDecoration: 'none' }}>Third Floor (Level 3)</NavLink>
          </div>

          {/* Column 3: Intelligence Modules */}
          <div className="stack" style={{ gap: 8 }}>
            <strong style={{ fontSize: 12, color: 'var(--text-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              INTELLIGENCE
            </strong>
            <Link to="/map" className="muted" style={{ textDecoration: 'none' }}>Dijkstra Graph Routing</Link>
            <Link to="/compare" className="muted" style={{ textDecoration: 'none' }}>Linear Algebra Vector Analysis</Link>
            <Link to="/admin" className="muted" style={{ textDecoration: 'none' }}>PyTorch TextCNN Intent Engine</Link>
            <Link to="/admin" className="muted" style={{ textDecoration: 'none' }}>RandomForest Demand Forecaster</Link>
            <Link to="/admin" className="muted" style={{ textDecoration: 'none' }}>Gujarat SSIP 2.0 Policy Matrix</Link>
          </div>

          {/* Column 4: Concierge & Location */}
          <div className="stack" style={{ gap: 8 }}>
            <strong style={{ fontSize: 12, color: 'var(--text-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              MALL CONCIERGE
            </strong>
            <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={13} /> +91 (079) 4019-1111
            </span>
            <span className="muted" style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <HelpCircle size={13} style={{ flexShrink: 0, marginTop: 3 }} />
              Information Desk at Vastrapur Grand Entrance (Floor G)
            </span>
            <span className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              © 2026 MallMind AI. Alpha One Mall Digital Twin.
            </span>
          </div>
        </div>
      </footer>

      {/* Discreet Voice Assistant Entry Point */}
      <VoiceWidget />
    </>
  );
}
