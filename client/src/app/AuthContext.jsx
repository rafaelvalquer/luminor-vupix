import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as AuthService from "../services/auth.service.js";
import { clearStoredToken, getStoredToken, setStoredToken } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const result = await AuthService.me();
      setUser(result.user);
      return result.user;
    } catch (error) {
      logout();
      throw error;
    }
  }, [logout]);

  const login = useCallback(async ({ email, password }) => {
    const result = await AuthService.login({ email, password });
    setStoredToken(result.token);
    setUser(result.user);
    return result;
  }, []);

  useEffect(() => {
    async function bootstrap() {
      const token = getStoredToken();
      if (!token) {
        setBootstrapping(false);
        return;
      }

      try {
        await refreshMe();
      } catch (_error) {
        clearStoredToken();
      } finally {
        setBootstrapping(false);
      }
    }

    bootstrap();
  }, [refreshMe]);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      refreshMe,
      bootstrapping,
      isAuthenticated: Boolean(user),
    }),
    [user, login, logout, refreshMe, bootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
