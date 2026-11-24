import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { HttpError } from '../api/client';
import { Compass, Lock, Mail, Shield, Store } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Sign-in failed. Please check credentials.');
    } finally {
      setBusy(false);
    }
  }

  const fillAdmin = () => {
    setEmail('admin@mallmind.local');
    setPassword('AdminPass123!');
  };

  const fillRetailer = () => {
    setEmail('retailer@mallmind.local');
    setPassword('RetailerPass123!');
  };

  return (
    <div style={{ maxWidth: 440, margin: '40px auto 80px' }}>
      <div className="card" style={{ padding: 36, boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="brand-icon" style={{ margin: '0 auto 12px', width: 44, height: 44 }}>
            <Compass size={24} />
          </div>
          <h2 style={{ fontSize: 24, marginBottom: 4 }}>Welcome Back</h2>
          <p className="muted">Sign in to your MallMind AI customer or store account</p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div
          style={{
            padding: 14,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--primary-light)',
            marginBottom: 20,
            fontSize: 12,
          }}
        >
          <span style={{ fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: 6 }}>
            QUICK 1-CLICK DEMO ACCOUNTS:
          </span>
          <div className="row" style={{ gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fillAdmin}
              style={{ flex: 1, fontSize: 12 }}
            >
              <Shield size={13} style={{ color: 'var(--primary)' }} /> Admin Account
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fillRetailer}
              style={{ flex: 1, fontSize: 12 }}
            >
              <Store size={13} style={{ color: '#10b981' }} /> Retailer Account
            </button>
          </div>
        </div>

        <form className="stack" onSubmit={handleSubmit} style={{ gap: 16 }}>
          <div>
            <label className="muted" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', top: 13, left: 12, color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 36 }}
                required
              />
            </div>
          </div>

          <div>
            <label className="muted" style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', top: 13, left: 12, color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: 36 }}
                required
              />
            </div>
          </div>

          {error && <div className="error-text" style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 6 }}>{error}</div>}

          <button className="btn btn-lg" type="submit" disabled={busy} style={{ width: '100%', marginTop: 8 }}>
            {busy ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="muted" style={{ marginTop: 20, textAlign: 'center', fontSize: 13 }}>
          Don't have an account? <Link to="/register" style={{ fontWeight: 600 }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
