import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role?: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const UserContext = createContext<AuthContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session on load
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        // verify token with backend
        const { data } = await api.get('/auth/me');
        if (active) setUser(data.user || data.data?.user || null);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const token = data?.token || data?.data?.token;
    const u = data?.user || data?.data?.user;
    if (!token) throw new Error('No token returned from server');
    localStorage.setItem('token', token);
    setUser(u);
    navigate('/dashboard', { replace: true });
  };

  const register = async (name: string, email: string, password: string) => {
    // NOTE: backend expects passwordConfirm
    const { data } = await api.post('/auth/register', { name, email, password, passwordConfirm: password });
    const token = data?.token || data?.data?.token;
    const u = data?.user || data?.data?.user;
    if (!token) throw new Error('No token returned from server');
    localStorage.setItem('token', token);
    setUser(u);
    navigate('/dashboard', { replace: true });
  };

  const logout = async () => {
    // Your route is GET /auth/logout – use GET to match it
    await api.get('/auth/logout').catch(() => {});
    localStorage.removeItem('token');
    setUser(null);
    navigate('/', { replace: true });
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {!loading && children}
    </UserContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(UserContext);
  if (context === undefined) throw new Error('useAuth must be used within a UserProvider');
  return context;
};

export default UserContext;
