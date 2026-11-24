import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MallMind ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('mallmind.token');
      localStorage.removeItem('mallmind.user');
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'linear-gradient(135deg, #0A192F 0%, #172A45 100%)',
            color: '#FFFFFF',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: 540,
              width: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 16,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '36px 32px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(217, 119, 6, 0.2)',
                border: '1px solid #D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                fontSize: 26,
              }}
            >
              ⚠️
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
              Application Recovery Mode
            </h1>
            <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              MallMind AI encountered an unexpected rendering error. You can reload the page or return to the main dashboard.
            </p>

            {this.state.error && (
              <pre
                style={{
                  fontSize: 12,
                  color: '#F87171',
                  background: 'rgba(0, 0, 0, 0.35)',
                  padding: '12px 14px',
                  borderRadius: 8,
                  textAlign: 'left',
                  overflowX: 'auto',
                  maxHeight: 120,
                  margin: '0 0 24px 0',
                  border: '1px solid rgba(248, 113, 113, 0.2)',
                }}
              >
                {this.state.error.message}
              </pre>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Reset & Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
