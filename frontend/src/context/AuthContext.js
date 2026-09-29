import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || localStorage.getItem('access_token') || null;
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Synchronize state across browser tabs
  useEffect(() => {
    function handleStorageChange(e) {
      if (e.key === 'token' || e.key === 'access_token' || e.key === 'user') {
        const currentToken = localStorage.getItem('token') || localStorage.getItem('access_token') || null;
        let currentUser = null;
        try {
          const storedUser = localStorage.getItem('user');
          currentUser = storedUser ? JSON.parse(storedUser) : null;
        } catch {
          currentUser = null;
        }
        setToken(currentToken);
        setUser(currentUser);
      }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    // 1. Clear all localStorage auth data
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');

    // 2. Clear all sessionStorage data
    try {
      sessionStorage.clear();
    } catch {}

    // 3. Clear component and context state
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  const isAuthenticated = Boolean(token && user);

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
