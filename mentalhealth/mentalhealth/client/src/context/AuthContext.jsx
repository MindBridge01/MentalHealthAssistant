import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/apiClient";
import { clearStoredUser, getStoredUser, setStoredUser } from "../lib/authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => getStoredUser());
  const [isHydrating, setIsHydrating] = useState(true);

  const setUser = useCallback((nextUser) => {
    if (nextUser) {
      setStoredUser(nextUser);
    } else {
      clearStoredUser();
    }
    setUserState(nextUser || null);
  }, []);

  const refreshUser = useCallback(async () => {
    const sessionUser = getStoredUser();
    if (!sessionUser) {
      setUser(null);
      return null;
    }

    // Patient and pending-doctor can read /api/profile under permission policy.
    if (sessionUser.role === "patient" || sessionUser.role === "pending-doctor") {
      try {
        const profile = await apiRequest("/api/profile", { method: "GET" });
        setUser({ ...sessionUser, ...profile });
        return { ...sessionUser, ...profile };
      } catch (_err) {
        setUser(sessionUser);
        return sessionUser;
      }
    }

    setUser(sessionUser);
    return sessionUser;
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch (_err) {
      // Clear local state even if backend logout fails.
    }
    setUser(null);
  }, [setUser]);

  useEffect(() => {
    async function hydrate() {
      await refreshUser();
      setIsHydrating(false);
    }
    hydrate();
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      user,
      userId: user?._id || null,
      role: user?.role || null,
      isAuthenticated: Boolean(user),
      isHydrating,
      setUser,
      refreshUser,
      logout,
    }),
    [isHydrating, logout, refreshUser, setUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
