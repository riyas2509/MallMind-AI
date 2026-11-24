import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setToken } from '../api/client';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../api/types';

const USER_KEY = 'mallmind.user';

interface CurrentUser {
  email: string;
  fullName: string;
  roles: string[];
}

interface AuthContextValue {
  user: CurrentUser | null;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): CurrentUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(() => loadStoredUser());

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  const applyAuth = useCallback((res: AuthResponse) => {
    setToken(res.token);
    setUser({ email: res.email, fullName: res.fullName, roles: res.roles });
  }, []);

  const login = useCallback(
    async (req: LoginRequest) => {
      const res = await api.post<AuthResponse>('/api/auth/login', req);
      applyAuth(res);
    },
    [applyAuth],
  );

  const register = useCallback(
    async (req: RegisterRequest) => {
      const res = await api.post<AuthResponse>('/api/auth/register', req);
      applyAuth(res);
    },
    [applyAuth],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback((role: string) => !!user?.roles.includes(role), [user]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, hasRole }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
