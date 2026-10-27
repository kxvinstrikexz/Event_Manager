import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../services/api.js';

export interface UserProfile {
  id?: string;
  full_name?: string;
  student_id?: string;
  staff_id?: string;
  department?: string;
  academic_year?: string;
  designation?: string;
  official_email?: string;
  phone?: string;
  bio?: string;
  office_location?: string;
}

export interface AuthUser {
  id: string;
  role: 'student' | 'staff' | 'admin';
  email: string | null;
  username: string | null;
  status: string;
  account_status?: string;
  approvalStatus?: string;
  profile?: UserProfile | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('campus_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('campus_token');
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      if (data?.user) {
        setUser(data.user);
      } else {
        localStorage.removeItem('campus_token');
        setToken(null);
        setUser(null);
      }
    } catch {
      localStorage.removeItem('campus_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'campus_token') {
        const updatedToken = e.newValue;
        setToken(updatedToken);
        if (updatedToken) {
          refreshUser();
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshUser]);

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem('campus_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('campus_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
