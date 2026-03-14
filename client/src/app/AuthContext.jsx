import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as AuthService from "../services/auth.service.js";
import {
  clearStoredToken,
  extractApiError,
  getStoredToken,
  setStoredToken,
} from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [authError, setAuthError] = useState("");

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    setAuthError("");
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const result = await AuthService.me();
      setUser(result.user);
      setAuthError("");
      return result.user;
    } catch (error) {
      logout();
      throw error;
    }
  }, [logout]);

  const login = useCallback(async ({ email, password }) => {
    try {
      const result = await AuthService.login({ email, password });
      setStoredToken(result.token);
      setUser(result.user);
      setAuthError("");
      return result;
    } catch (error) {
      const message = extractApiError(error, "Falha ao entrar.");
      setAuthError(message);
      throw error;
    }
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
      authError,
    }),
    [user, login, logout, refreshMe, bootstrapping, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
