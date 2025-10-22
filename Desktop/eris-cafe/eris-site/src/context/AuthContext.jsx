import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credential) => {
    try {
      // Decode the JWT token to get user info
      const decoded = JSON.parse(atob(credential.split('.')[1]));
      
      const userData = {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        sub: decoded.sub // Google user ID
      };

      // Optional: Send to your backend for verification and database storage
      try {
        await axios.post('http://localhost:3000/api/auth/google', {
          credential,
          user: userData
        });
      } catch (error) {
        console.log('Backend authentication pending:', error.message);
      }

      // Store user in state and localStorage
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Clear any other auth-related data
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
