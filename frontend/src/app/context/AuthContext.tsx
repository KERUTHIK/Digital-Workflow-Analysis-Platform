import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { TOKEN_KEY, USER_KEY } from "../constants";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => { },
  logout: () => { },
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  function login(u: AuthUser, t: string) {
    setUser(u);
    setToken(t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    localStorage.setItem(TOKEN_KEY, t);
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// ─── Mock credentials ─────────────────────────────────────────────────────────

export function getRoleDashboardPath(role: string): string {
  const r = role.toUpperCase();
  if (r === "ADMIN" || r === "SYSTEM ADMIN") return "/";
  if (r === "MANAGER" || r === "SENIOR MANAGER") return "/manager";
  if (r === "EMPLOYEE") return "/employee";
  return "/login";
}

export function mapBackendRole(role: string): string {
  const r = role.toUpperCase();
  if (r === "ADMIN") return "System Admin";
  if (r === "MANAGER") return "Manager";
  if (r === "EMPLOYEE") return "Employee";
  return role;
}
