"use client";

import * as React from "react";

import {
  clearSession,
  fetchMe,
  getLoginPath,
  loginWithPassword,
  logoutRemote,
  persistSession,
  readStoredToken,
  readStoredUser,
  type FactoryAuthUser
} from "@/lib/auth/factory-auth-api";

type FactoryAuthContextValue = {
  user: FactoryAuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  /** صلاحية Spatie من Laravel (مثل workforce.manage_employees) */
  can: (permission: string) => boolean;
  isAuthenticated: boolean;
};

const FactoryAuthContext = React.createContext<FactoryAuthContextValue | null>(null);

export function FactoryAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<FactoryAuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    const token = readStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const cached = readStoredUser();
    if (cached) setUser(cached);
    void refresh();
  }, [refresh]);

  const login = React.useCallback(async (email: string, password: string) => {
    const data = await loginWithPassword(email, password);
    persistSession(data);
    setUser(data.user);
    await refresh();
  }, [refresh]);

  const logout = React.useCallback(async () => {
    const token = readStoredToken();
    clearSession();
    setUser(null);
    if (token) {
      void logoutRemote().catch(() => {});
    }
    if (typeof window !== "undefined") {
      window.location.href = getLoginPath();
    }
  }, []);

  const can = React.useCallback(
    (permission: string) => Boolean(user?.permissions?.includes(permission)),
    [user]
  );

  const value = React.useMemo<FactoryAuthContextValue>(
    () => ({
      user,
      loading,
      login,
      logout,
      refresh,
      can,
      isAuthenticated: Boolean(user)
    }),
    [user, loading, login, logout, refresh, can]
  );

  return <FactoryAuthContext.Provider value={value}>{children}</FactoryAuthContext.Provider>;
}

export function useFactoryAuth(): FactoryAuthContextValue {
  const ctx = React.useContext(FactoryAuthContext);
  if (!ctx) throw new Error("useFactoryAuth requires FactoryAuthProvider");
  return ctx;
}
