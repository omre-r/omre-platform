import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('omre_token');
    if (stored) {
      try {
        const decoded = jwtDecode(stored);
        // Check expiry
        if (decoded.exp * 1000 > Date.now()) {
          setToken(stored);
          setUser(decoded);
        } else {
          localStorage.removeItem('omre_token');
        }
      } catch {
        localStorage.removeItem('omre_token');
      }
    }
    setLoading(false);
  }, []);

  function login(newToken) {
    const decoded = jwtDecode(newToken);
    localStorage.setItem('omre_token', newToken);
    setToken(newToken);
    setUser(decoded);
  }

  function logout() {
    localStorage.removeItem('omre_token');
    setToken(null);
    setUser(null);
  }

  // Refresh user data from a new token (e.g. after house approval)
  function updateToken(newToken) {
    login(newToken);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        updateToken,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
