"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { api } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  avatar: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  googleLogin: (dataPayload: {
    idToken?: string;
    googleId?: string;
    email?: string;
    name?: string;
    avatar?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = (newToken: string, newUser: User) => {
    localStorage.setItem("resumeiq_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const refreshUser = useCallback(async () => {
    const stored = localStorage.getItem("resumeiq_token");
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored);
    try {
      const data = await api.get<{ user: User }>("/api/auth/me");
      setUser(data.user);
    } catch {
      localStorage.removeItem("resumeiq_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await api.post<{ token: string; user: User }>(
      "/api/auth/login",
      { email, password },
      false
    );
    persist(data.token, data.user);
  };

  const register = async (email: string, password: string, name?: string) => {
    const data = await api.post<{ token: string; user: User }>(
      "/api/auth/register",
      { email, password, name },
      false
    );
    persist(data.token, data.user);
  };

  const googleLogin = async (dataPayload: {
    idToken?: string;
    googleId?: string;
    email?: string;
    name?: string;
    avatar?: string;
  }) => {
    const data = await api.post<{ token: string; user: User }>(
      "/api/auth/google",
      dataPayload,
      false
    );
    persist(data.token, data.user);
  };

  const logout = () => {
    localStorage.removeItem("resumeiq_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, googleLogin, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
