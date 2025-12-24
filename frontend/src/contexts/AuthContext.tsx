// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { User } from "@/types";

interface AuthContextType {
  user: User | null | undefined; // undefined while restoring
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean; // new: true while restoring auth state
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = "http://localhost:5001/api/auth";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore auth state on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
      }
    } else {
      setUser(null);
      setToken(null);
    }

    setLoading(false); // auth state restored
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      const { token: jwtToken, user: userData } = res.data;

      localStorage.setItem("token", jwtToken);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      setToken(jwtToken);

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message || "Login failed. Please check your credentials.",
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
