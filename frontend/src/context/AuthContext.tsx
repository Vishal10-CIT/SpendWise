import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginPayload, RegisterPayload, UserUpdatePayload } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateProfile: (payload: UserUpdatePayload) => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('spendwise_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('spendwise_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('spendwise_token');
      if (storedToken) {
        try {
          const freshUser = await authApi.getMe();
          setUser(freshUser);
          localStorage.setItem('spendwise_user', JSON.stringify(freshUser));
        } catch (err) {
          // Token expired or invalid
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(payload);
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem('spendwise_token', response.access_token);
      localStorage.setItem('spendwise_user', JSON.stringify(response.user));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(payload);
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem('spendwise_token', response.access_token);
      localStorage.setItem('spendwise_user', JSON.stringify(response.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('spendwise_token');
    localStorage.removeItem('spendwise_user');
  };

  const updateProfile = async (payload: UserUpdatePayload): Promise<User> => {
    const updated = await authApi.updateProfile(payload);
    setUser(updated);
    localStorage.setItem('spendwise_user', JSON.stringify(updated));
    return updated;
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const freshUser = await authApi.getMe();
      setUser(freshUser);
      localStorage.setItem('spendwise_user', JSON.stringify(freshUser));
    } catch {
      // Ignored
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
