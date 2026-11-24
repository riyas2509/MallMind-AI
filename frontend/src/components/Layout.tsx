import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../auth/CartContext';
import VoiceWidget from './VoiceWidget';
import {
  Compass,
  ShoppingBag,
  Map,
  PackageCheck,
  Store,
  User,
  Clock,
  Phone,
  HelpCircle,
  Menu,
  X,
  ShieldCheck,
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

          {/* Desktop Navigation Links - Simplified Visitor Nav */}
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
            <NavLink to="/cart" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <ShoppingBag size={14} />
              Cart
              {cart && cart.totalItemCount > 0 && (
                <span className="cart-count" style={{ marginLeft: 4 }}>{cart.totalItemCount}</span>
              )}
            </NavLink>
            {user && hasRole('ADMIN') && (
              <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <ShieldCheck size={14} />
                Mall Administration
              </NavLink>
            )}
            {user && hasRole('RETAILER') && !hasRole('ADMIN') && (
              <NavLink to="/retailer" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Store size={14} />
                Retailer Portal
              </NavLink>
            )}
          </nav>

          <div style={{ flex: 1 }} />

          {/* User Controls */}
          <div className="row" style={{ gap: 10 }}>
            {user ? (
              <div className="row" style={{ gap: 8 }}>
                <NavLink
                  to="/orders"
                  className={({ isActive }) => `btn btn-ghost btn-xs ${isActive ? 'active' : ''}`}
                  style={{ fontSize: 12, color: 'var(--text-secondary)' }}
                >
                  <PackageCheck size={13} /> Orders
                </NavLink>
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
              { to: '/directory', label: 'Mall Directory', icon: Store },
              { to: '/map', label: 'Mall Map', icon: Map },
              { to: '/products', label: 'Products', icon: ShoppingBag },
              { to: '/cart', label: `Cart${cart && cart.totalItemCount > 0 ? ` (${cart.totalItemCount})` : ''}`, icon: ShoppingBag },
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

            {user ? (
              <>
                <div style={{ height: 1, background: 'var(--border-color)', margin: '6px 0' }} />
                <NavLink
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  style={{ padding: '10px 14px', fontSize: 14 }}
                >
                  <PackageCheck size={16} /> My Orders
                </NavLink>
                {hasRole('ADMIN') && (
                  <NavLink
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    style={{ padding: '10px 14px', fontSize: 14 }}
                  >
                    <ShieldCheck size={16} /> Mall Administration
                  </NavLink>
                )}
                {hasRole('RETAILER') && (
                  <NavLink
                    to="/retailer"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    style={{ padding: '10px 14px', fontSize: 14 }}
                  >
                    <Store size={16} /> Retailer Portal
                  </NavLink>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: 14, color: 'var(--color-error)' }}
                >
                  Sign Out ({user.fullName})
                </button>
              </>
            ) : (
              <>
                <div style={{ height: 1, background: 'var(--border-color)', margin: '6px 0' }} />
                <NavLink
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'center' }}
                >
                  <User size={14} /> Sign In
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-primary btn-sm"
                  style={{ justifyContent: 'center' }}
                >
                  Register
                </NavLink>
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
              Indoor navigation and retail discovery prototype developed for Nexus Ahmedabad One (Alpha One Mall), Vastrapur. Dijkstra-based indoor route planning, 30 stores in prototype directory, and trilingual voice assistance.
            </p>
            <div className="row" style={{ gap: 8, marginTop: 4 }}>
              <span className="badge badge-success">
                <Clock size={12} /> Demo Hours · 10:00 AM – 10:00 PM
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

          {/* Column 3: Intelligence & Academic Demo */}
          <div className="stack" style={{ gap: 8 }}>
            <strong style={{ fontSize: 12, color: 'var(--text-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              ACADEMIC & RESEARCH
            </strong>
            <Link to="/map" className="muted" style={{ textDecoration: 'none' }}>Dijkstra Indoor Wayfinding</Link>
            <Link to="/academic-demo" className="muted" style={{ textDecoration: 'none', color: 'var(--brand-accent)' }}>Academic & ML Evaluation</Link>
            <Link to="/products" className="muted" style={{ textDecoration: 'none' }}>In-Mall Product Discovery</Link>
            <Link to="/compare" className="muted" style={{ textDecoration: 'none' }}>Product Comparison</Link>
            <Link to="/offers" className="muted" style={{ textDecoration: 'none' }}>Demonstration Offers</Link>
          </div>

          {/* Column 4: Concierge & Location */}
          <div className="stack" style={{ gap: 8 }}>
            <strong style={{ fontSize: 12, color: 'var(--text-primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              MALL CONCIERGE
            </strong>
            <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={13} /> +91 (079) 4019-1111 (Demo)
            </span>
            <span className="muted" style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <HelpCircle size={13} style={{ flexShrink: 0, marginTop: 3 }} />
              Information Desk at Vastrapur Grand Entrance (Floor G) · Prototype Demonstration
            </span>
            <span className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              © 2026 MallMind AI. Nexus Ahmedabad One Prototype.
            </span>
          </div>
        </div>
      </footer>

      {/* Discreet Voice Assistant Entry Point */}
      <VoiceWidget />
    </>
  );
}
