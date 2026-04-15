import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from localStorage (remember me) or sessionStorage
  useEffect(() => {
    // Check localStorage first (remember me), then sessionStorage (session only)
    let token  = localStorage.getItem('bp_token');
    let stored = localStorage.getItem('bp_user');
    let expiry = localStorage.getItem('bp_expiry');

    if (token && expiry && Date.now() > parseInt(expiry)) {
      // Token has expired — clear it
      localStorage.removeItem('bp_token');
      localStorage.removeItem('bp_user');
      localStorage.removeItem('bp_expiry');
      token = null;
    }

    if (!token) {
      // Fall back to sessionStorage (no remember me)
      token  = sessionStorage.getItem('bp_token');
      stored = sessionStorage.getItem('bp_user');
    }

    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch {
        localStorage.removeItem('bp_token');
        localStorage.removeItem('bp_user');
        localStorage.removeItem('bp_expiry');
        sessionStorage.removeItem('bp_token');
        sessionStorage.removeItem('bp_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userData, remember = false) => {
    if (remember) {
      const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      localStorage.setItem('bp_token', token);
      localStorage.setItem('bp_user', JSON.stringify(userData));
      localStorage.setItem('bp_expiry', String(expiry));
      sessionStorage.removeItem('bp_token');
      sessionStorage.removeItem('bp_user');
    } else {
      sessionStorage.setItem('bp_token', token);
      sessionStorage.setItem('bp_user', JSON.stringify(userData));
      localStorage.removeItem('bp_token');
      localStorage.removeItem('bp_user');
      localStorage.removeItem('bp_expiry');
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('bp_token');
    localStorage.removeItem('bp_user');
    localStorage.removeItem('bp_expiry');
    sessionStorage.removeItem('bp_token');
    sessionStorage.removeItem('bp_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
