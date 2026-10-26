import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, company_name: string) => Promise<void>;
  quickLogin: (type: 'admin' | 'vendedor') => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('texmachina_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('texmachina_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyUser() {
      const savedToken = localStorage.getItem('texmachina_token');
      if (savedToken) {
        try {
          const freshUser = await authApi.getMe();
          setUser(freshUser);
          localStorage.setItem('texmachina_user', JSON.stringify(freshUser));
        } catch (err) {
          console.warn('Session verification failed, logging out.');
          localStorage.removeItem('texmachina_token');
          localStorage.removeItem('texmachina_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    verifyUser();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const data = await authApi.login({ email, password });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('texmachina_token', data.token);
      localStorage.setItem('texmachina_user', JSON.stringify(data.user));
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao realizar login. Verifique seus dados.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (name: string, email: string, password: string, company_name: string) => {
    setError(null);
    try {
      const data = await authApi.register({ name, email, password, company_name });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('texmachina_token', data.token);
      localStorage.setItem('texmachina_user', JSON.stringify(data.user));
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao cadastrar empresa.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const quickLogin = async (type: 'admin' | 'vendedor') => {
    if (type === 'admin') {
      await login('admin@texmachina.com.br', 'admin123');
    } else {
      await login('vendedor@texmachina.com.br', 'vendedor123');
    }
  };

  const logout = () => {
    localStorage.removeItem('texmachina_token');
    localStorage.removeItem('texmachina_user');
    setToken(null);
    setUser(null);
    setError(null);
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
        quickLogin,
        logout,
        error,
        clearError: () => setError(null),
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
