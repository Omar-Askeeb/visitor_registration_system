import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState({ user: null, token: null, loading: true });
  
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setSession({ user: JSON.parse(storedUser), token: storedToken, loading: false });
    } else {
      setSession({ user: null, token: null, loading: false });
    }
  }, []);

  const login = (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setSession({ user, token, loading: false });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setSession({ user: null, token: null, loading: false });
  };

  return (
    <AuthContext.Provider value={{ ...session, login, logout }}>
      {!session.loading && children}
    </AuthContext.Provider>
  );
};
