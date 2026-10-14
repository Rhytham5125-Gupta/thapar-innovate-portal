import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

export interface UserType {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee' | 'intern';
  department: string;
  avatar: string;
}

interface AuthContextType {
  user: UserType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, name: string, role: string, department?: string) => Promise<void>;
  loginWithGoogle: (email: string, name: string, picture: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state by fetching current profile
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      // Silent catch: user is simply not logged in
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    // Event listener for global session expiries
    const handleSessionExpired = () => {
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener('auth-session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth-session-expired', handleSessionExpired);
    };
  }, []);

  const login = async (email: string, name: string, role: string, department?: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/mock-login', { email, name, role, department });
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error: any) {
      setUser(null);
      throw error.response?.data?.message || 'Login failed';
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (email: string, name: string, picture: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/google-verify', { email, name, picture });
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error: any) {
      setUser(null);
      throw error.response?.data?.message || 'Google authentication failed';
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        logout,
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
