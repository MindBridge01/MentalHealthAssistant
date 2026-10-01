import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/apiClient";
import { clearStoredUser, getStoredUser, setStoredUser } from "../lib/authStorage";

const AuthContext = createContext(null);

function mergeProfile(baseUser, profile = {}) {
  if (!baseUser) return null;
  return {
    ...baseUser,
    ...profile,
    onboardingCompleted:
      profile.onboardingCompleted ??
      baseUser.onboardingCompleted ??
      Boolean(profile.guardianEmail && profile.age && profile.gender),
  };
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => getStoredUser());
  const [isHydrating, setIsHydrating] = useState(true);

  const setUser = useCallback((nextUser) => {
    if (nextUser) {
      setStoredUser(nextUser);
      setUserState(nextUser);
      return;
    }

    clearStoredUser();
    setUserState(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const stored = getStoredUser();
    if (!stored) {
      setUser(null);
      return null;
    }

    try {
      const profile = await apiRequest("/api/profile");
      const merged = mergeProfile(stored, profile);
      setUser(merged);
      return merged;
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        setUser(null);
        return null;
      }

      setUser(stored);
      return stored;
    }
  }, [setUser]);

  const login = useCallback(
    async (payload) => {
      const authenticatedUser = await apiRequest("/api/auth/login", {
        method: "POST",
        body: payload,
      });
      const merged = mergeProfile(authenticatedUser, authenticatedUser);
      setUser(merged);
      return merged;
    },
    [setUser]
  );

  const signup = useCallback(
    async (payload) => {
      const createdUser = await apiRequest("/api/auth/signup", {
        method: "POST",
        body: payload,
      });
      const merged = mergeProfile(createdUser, createdUser);
      setUser(merged);
      return merged;
    },
    [setUser]
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch (_error) {
      // Local cleanup is still the right behavior here.
    }
    setUser(null);
  }, [setUser]);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        await refreshUser();
      } finally {
        if (isMounted) {
          setIsHydrating(false);
        }
      }
    }

    hydrate();

    return () => {
      isMounted = false;
    };
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      userId: user?._id || null,
      isAuthenticated: Boolean(user),
      isHydrating,
      needsOnboarding: Boolean(user && !user.onboardingCompleted),
      setUser,
      refreshUser,
      login,
      signup,
      logout,
    }),
    [isHydrating, login, logout, refreshUser, setUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
