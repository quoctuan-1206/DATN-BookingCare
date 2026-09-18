import { createContext, useContext, useEffect, useMemo, useState } from "react";
import authService from "../services/auth.service";
import { getApiErrorMessage, tokenStorage } from "../api/axios";

const AuthContext = createContext(null);

function getRedirectPathByRole(roleName) {
  switch (roleName) {
    case "Admin":
      return "/admin";
    case "Doctor":
      return "/doctor";
    case "STAFF":
      return "/staff/clinical";
    case "Patient":
    default:
      return "/patient";
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const accessToken = tokenStorage.getAccessToken();
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authService.me();
        const currentUser = res.data?.data;
        setUser(currentUser);
        tokenStorage.setSession({ user: currentUser });
      } catch {
        tokenStorage.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  const value = useMemo(() => {
    async function login(email, password) {
      const res = await authService.login({ email, password });
      const data = res.data?.data;

      tokenStorage.setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      setUser(data.user);

      return {
        user: data.user,
        redirectTo: getRedirectPathByRole(data.user?.role?.name),
      };
    }

    async function register(payload) {
      const res = await authService.register(payload);
      const data = res.data?.data;

      tokenStorage.setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      setUser(data.user);

      return {
        user: data.user,
        redirectTo: getRedirectPathByRole(data.user?.role?.name),
      };
    }

    async function logout() {
      const refreshToken = tokenStorage.getRefreshToken();
      try {
        if (refreshToken) {
          await authService.logout(refreshToken);
        }
      } catch {
        // ignore logout API errors
      } finally {
        tokenStorage.clear();
        setUser(null);
      }
    }

    function updateCurrentUser(updatedUser) {
      setUser(updatedUser);
      tokenStorage.setSession({ user: updatedUser });
    }

    function clearSession() {
      tokenStorage.clear();
      setUser(null);
    }

    return {
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      updateCurrentUser,
      clearSession,
      getApiErrorMessage,
      getRedirectPathByRole,
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export default AuthContext;
